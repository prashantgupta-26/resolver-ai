import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      alert("Please enter an email");
      return;
    }
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'OTP Sent! (Mock: any 6 digits)');
        setStep(2);
      } else {
        alert("Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      alert("OTP must be 6 digits");
      return;
    }
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (data.success) {
        alert("Email verified successfully!");
        setStep(3);
      } else {
        alert(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying OTP");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!rollNo.trim() || !studentName.trim()) {
      alert('Please enter your Student ID and Name.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo: rollNo.trim(), name: studentName.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Login Successful 🚀');
        localStorage.setItem("studentData", JSON.stringify(data.student));
        navigate('/student-dashboard');
      } else {
        alert(data.message || 'Login failed. Student not found.');
      }
    } catch (error) {
      console.error("Login error:", error);
      alert('Server error. Please try again.');
    }
  };

  return (
    <div className="container">
      <h2>Student Login</h2>

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your student email"
            />
          </div>
          <button type="submit">Send OTP</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp}>
          <div className="input-group">
            <label>OTP Verification</label>
            <input 
              type="text" 
              required 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
            />
          </div>
          <button type="submit">Verify OTP</button>
          <button type="button" onClick={() => setStep(1)} style={{ background: 'transparent', color: '#4facfe', marginTop: '10px' }}>
            Back to Email
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Student ID</label>
            <input 
              type="text" 
              required 
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Enter Student ID"
            />
          </div>
          <div className="input-group">
            <label>Student Name</label>
            <input 
              type="text" 
              required 
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter Student Name"
            />
          </div>

          <button type="submit">Login</button>
          
          <div className="options" style={{ marginTop: '15px' }}>
            <a href="#">Forgot Student ID ?</a>
          </div>
        </form>
      )}

      <div className="footer" style={{ marginTop: '20px' }}>
        <Link to="/">Back to Portal</Link>
      </div>
    </div>
  );
};

export default StudentLogin;
