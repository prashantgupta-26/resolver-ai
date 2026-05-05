import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentAccountCreate = () => {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [course, setCourse] = useState('');
  
  const navigate = useNavigate();

  const createAccount = async (e) => {
    e.preventDefault();

    if (!name.trim() || !rollNo.trim() || !course.trim()) {
      alert("Please fill all fields!");
      return;
    }

    const email = localStorage.getItem("userEmail") || "demo@student.com"; // Fallback if lost

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, name, rollNo, course })
      });

      const data = await response.json();

      if (data.success) {
        alert("Account Created Successfully 🎉");
        // Store student data locally to pass to dashboard
        localStorage.setItem("studentData", JSON.stringify(data.student));
        navigate('/student-dashboard');
      } else {
        alert(data.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      alert("Server error. Please try again later.");
    }
  };

  return (
    <div className="container">
      <h2>Create Account</h2>

      <form onSubmit={createAccount}>
        <div className="input-group">
          <label>Student Name</label>
          <input 
            type="text" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Institute Roll No</label>
          <input 
            type="text" 
            required 
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Course</label>
          <input 
            type="text" 
            placeholder="e.g. Science, Commerce" 
            required 
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
        </div>

        <button type="submit">Create Account</button>
      </form>
    </div>
  );
};

export default StudentAccountCreate;
