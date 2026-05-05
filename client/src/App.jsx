import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Portal from './pages/Portal';
import StudentLogin from './pages/StudentLogin';
import CounselorLogin from './pages/CounselorLogin';
import StudentDashboard from './pages/StudentDashboard';
import CounselorDashboard from './pages/CounselorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/counselor-login" element={<CounselorLogin />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
