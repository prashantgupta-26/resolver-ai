import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CounselorLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [facultyNo, setFacultyNo] = useState('');
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
    if (!regNo.trim() || !name.trim() || !facultyNo.trim()) {
      alert('Please enter all three fields.');
      return;
    }

    try {
      const response = await fetch('/api/counselor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            regNo: regNo.trim(),
            name: name.trim(),
            facultyNo: facultyNo.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Login Successful 🚀');
        localStorage.setItem("counselorData", JSON.stringify(data.counselor));
        navigate('/counselor-dashboard');
      } else {
        alert(data.message || 'Login failed. Invalid credentials.');
      }
    } catch (error) {
      console.error("Login error:", error);
      alert('Server error. Please try again.');
    }
  };

  return (
    <div className="container">
      <h2>Faculty Login</h2>

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your faculty email"
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
            <label>Reg No</label>
            <input 
              type="text" 
              required 
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              placeholder="Enter Registration No"
            />
          </div>
          <div className="input-group">
            <label>Faculty Name</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Faculty Name"
            />
          </div>
          <div className="input-group">
            <label>Faculty No.</label>
            <input 
              type="text" 
              required 
              value={facultyNo}
              onChange={(e) => setFacultyNo(e.target.value)}
              placeholder="Enter Faculty No"
            />
          </div>

          <button type="submit">Login</button>
        </form>
      )}

      <div className="footer" style={{ marginTop: '20px' }}>
        <Link to="/">Back to Portal</Link>
      </div>
    </div>
  );
};

export default CounselorLogin;
