import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { processQuery } from './services/aiEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resolverai';

// Student Schema & Model
const studentSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  status: { type: String, enum: ['Safe', 'At-Risk'], default: 'Safe' }
}, { timestamps: true });
const Student = mongoose.model('Student', studentSchema);

// Counselor Schema & Model
const counselorSchema = new mongoose.Schema({
  regNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  facultyNo: { type: String, required: true }
}, { timestamps: true });
const Counselor = mongoose.model('Counselor', counselorSchema);

// Query Schema & Model
const querySchema = new mongoose.Schema({
  studentRollNo: { type: String, required: true },
  studentName: { type: String, required: true },
  message: { type: String, required: true },
  reply: { type: String, default: "" },
  status: { type: String, enum: ['Pending', 'Solved'], default: 'Pending' },
  category: { type: String, enum: ['FAQ', 'Important', 'Emotional'], default: 'Important' },
  isAtRisk: { type: Boolean, default: false }
}, { timestamps: true });
const Query = mongoose.model('Query', querySchema);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      await Counselor.deleteMany({});
      const defaultCounselor = { regNo: '123456', name: 'Prashant Gupta', facultyNo: '1001' };
      await Counselor.create(defaultCounselor);
      console.log('Seeded default counselor: Prashant Gupta.');
      
      const studentCount = await Student.countDocuments({ rollNo: '1331' });
      if (studentCount === 0) {
        await Student.create({ email: 'ayush@example.com', name: 'Ayush Singh', rollNo: '1331', course: 'B.Tech' });
        console.log('Seeded demo student.');
      }
    } catch (e) {
      console.error('Error seeding data:', e);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.post('/api/send-otp', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    
    // In a real app, send email here
    res.json({ message: "OTP sent successfully" });
});

app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    // Mock verification
    if (otp && otp.length === 6) {
        res.json({ success: true, message: "OTP verified" });
    } else {
        res.status(400).json({ success: false, message: "Invalid OTP" });
    }
});

// Create Student Account
app.post('/api/students', async (req, res) => {
    try {
        const { email, name, rollNo, course } = req.body;
        
        // Check if student already exists
        const existingStudent = await Student.findOne({ rollNo });
        if (existingStudent) {
            return res.status(400).json({ success: false, message: "Student with this Roll No already exists" });
        }

        const newStudent = new Student({ email, name, rollNo, course });
        await newStudent.save();
        
        res.status(201).json({ success: true, student: newStudent });
    } catch (error) {
        console.error("Error creating student:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Fetch Student (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { rollNo, name } = req.body;
        
        if (!rollNo || !name) {
            return res.status(400).json({ success: false, message: "Student ID and Name are required" });
        }

        const student = await Student.findOne({ 
            rollNo: rollNo,
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        
        if (student) {
            res.json({ success: true, student });
        } else {
            res.status(404).json({ success: false, message: "Invalid Student ID or Name" });
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// --- Counselor Auth ---
app.post('/api/counselor/login', async (req, res) => {
    try {
        const { regNo, name, facultyNo } = req.body;
        if (!regNo || !name || !facultyNo) {
            return res.status(400).json({ success: false, message: "Reg No, Faculty Name, and Faculty No are required" });
        }
        
        const counselor = await Counselor.findOne({ 
            regNo, 
            facultyNo,
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        
        if (counselor) {
            res.json({ success: true, counselor });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Counselor login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// --- Query Routes ---
// Submit a query (Student)
app.post('/api/queries', async (req, res) => {
    try {
        const { studentRollNo, studentName, message } = req.body;
        
        // 1. Process query via AI Engine
        const { category, aiReply, isAtRisk } = await processQuery(message);
        
        let status = 'Pending';
        let finalReply = "";

        // 2. Decision Engine Logic
        if (category === 'FAQ') {
            status = 'Solved';
            finalReply = aiReply;
        } else if (category === 'Emotional') {
            finalReply = aiReply;
            // Mark student as At-Risk
            await Student.findOneAndUpdate({ rollNo: studentRollNo }, { status: 'At-Risk' });
        }
        
        const newQuery = new Query({ 
            studentRollNo, 
            studentName, 
            message, 
            category, 
            isAtRisk,
            status,
            reply: finalReply
        });
        await newQuery.save();
        res.status(201).json({ success: true, query: newQuery });
    } catch (error) {
        console.error("Error submitting query:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Fetch all queries (Counselor)
app.get('/api/queries', async (req, res) => {
    try {
        const queries = await Query.find().sort({ createdAt: -1 });
        res.json({ success: true, queries });
    } catch (error) {
        console.error("Error fetching queries:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Reply to a query (Counselor)
app.post('/api/queries/:id/reply', async (req, res) => {
    try {
        const { reply } = req.body;
        const query = await Query.findByIdAndUpdate(
            req.params.id, 
            { reply, status: 'Solved' }, 
            { new: true }
        );
        if (query) {
            res.json({ success: true, query });
        } else {
            res.status(404).json({ success: false, message: "Query not found" });
        }
    } catch (error) {
        console.error("Error replying to query:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Fetch queries by a specific student (Student)
app.get('/api/student/queries/:rollNo', async (req, res) => {
    try {
        const queries = await Query.find({ studentRollNo: req.params.rollNo }).sort({ createdAt: 1 });
        res.json({ success: true, queries });
    } catch (error) {
        console.error("Error fetching student queries:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Learning Loop: Analyze repeated important queries to suggest FAQs
app.get('/api/analytics/faqs', async (req, res) => {
    try {
        const recentImportant = await Query.find({ category: 'Important' })
                                          .sort({ createdAt: -1 })
                                          .limit(50);
        res.json({ success: true, potentialFaqs: recentImportant });
    } catch(err) {
        res.status(500).json({ success: false });
    }
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
