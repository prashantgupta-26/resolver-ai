import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
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
        alert("Verification successful!");
        navigate('/portal');
      } else {
        alert(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying OTP");
    }
  };

  return (
    <div className="container">
      <h2>Welcome to Resolve Ai</h2>
      <p style={{ color: '#4a5568', marginBottom: '20px', fontSize: '16px', fontWeight: '500' }}>Authentication Gateway</p>

      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <button type="submit">Send OTP</button>
        </form>
      ) : (
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
    </div>
  );
};

export default Landing;
