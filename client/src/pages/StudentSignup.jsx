import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentSignup = () => {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [userOtp, setUserOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  
  const navigate = useNavigate();

  const sendOTP = () => {
    if (!email) {
      alert('Enter email first!');
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    alert('OTP sent (demo): ' + otp);
    setOtpSent(true);
  };

  const verifyOTP = (e) => {
    e.preventDefault();
    if (!userOtp) {
      alert('Enter OTP first!');
      return;
    }
    if (userOtp === generatedOtp) {
      alert('OTP Verified ✅');
      localStorage.setItem('userEmail', email);
      navigate('/create-account');
    } else {
      alert('Wrong OTP ❌');
    }
  };

  return (
    <div className="container">
      <h2>Email Verification</h2>

      <form onSubmit={verifyOTP}>
        <div className="input-group">
          <label>Email</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={otpSent}
          />
        </div>

        {!otpSent && (
          <button type="button" onClick={sendOTP}>Send OTP</button>
        )}

        {otpSent && (
          <>
            <div className="input-group">
              <label>Enter OTP</label>
              <input 
                type="text" 
                placeholder="Enter OTP" 
                value={userOtp}
                onChange={(e) => setUserOtp(e.target.value)}
              />
            </div>
            <button type="submit">Verify OTP</button>
          </>
        )}
      </form>

      <div className="footer">
        Already have an account? <Link to="/student-login">Login</Link>
      </div>
    </div>
  );
};

export default StudentSignup;
