import React from 'react';
import { Link } from 'react-router-dom';

const Portal = () => {
  return (
    <div className="container">
      <h2>Resolve Ai Portal</h2>
      <p style={{ color: '#4a5568', marginBottom: '20px', fontSize: '16px', fontWeight: '500' }}>Select your role to continue</p>

      <div className="login">
        <Link to="/student-login">
          <button className="landing-btn" style={{ marginBottom: '10px' }}>Login as Student</button>
        </Link>
        <Link to="/counselor-login">
          <button className="landing-btn">Login as Faculty</button>
        </Link>
      </div>
    </div>
  );
};

export default Portal;
