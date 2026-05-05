import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CounselorDashboard = () => {
  const [activeTab, setActiveTab] = useState('chatList');
  const [isDark, setIsDark] = useState(false);
  
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]); // For at-risk queries
  const [currentChatIndex, setCurrentChatIndex] = useState(null);
  const [msgInput, setMsgInput] = useState('');
  const [counselorData, setCounselorData] = useState({ name: 'Counselor', secretCode: '' });
  const [analytics, setAnalytics] = useState({ faq: 0, important: 0, emotional: 0 });
  const [potentialFaqs, setPotentialFaqs] = useState([]);
  
  const [newStudent, setNewStudent] = useState({ name: '', email: '', rollNo: '', course: '' });
  
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      const data = await res.json();
      if (data.success) {
        alert('Student created successfully!');
        setNewStudent({ name: '', email: '', rollNo: '', course: '' });
      } else {
        alert(data.message || 'Failed to create student');
      }
    } catch(err) {
      console.error(err);
      alert('Error creating student');
    }
  };

  useEffect(() => {
    const data = localStorage.getItem('counselorData');
    if (data) {
      setCounselorData(JSON.parse(data));
      fetchQueries();
      fetchLearningLoop();
      const interval = setInterval(fetchQueries, 1000);
      return () => clearInterval(interval);
    } else {
      navigate('/counselor-login');
    }
  }, [navigate]);

  const fetchQueries = async () => {
    try {
      const res = await fetch('/api/queries');
      const data = await res.json();
      if (data.success) {
        groupQueriesByStudent(data.queries);
        calculateAnalytics(data.queries);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLearningLoop = async () => {
      try {
          const res = await fetch('/api/analytics/faqs');
          const data = await res.json();
          if (data.success) {
              setPotentialFaqs(data.potentialFaqs);
          }
      } catch (e) {
          console.error(e);
      }
  };

  const calculateAnalytics = (queries) => {
      let faq = 0, important = 0, emotional = 0;
      queries.forEach(q => {
          if (q.category === 'FAQ') faq++;
          if (q.category === 'Important') important++;
          if (q.category === 'Emotional') emotional++;
      });
      setAnalytics({ faq, important, emotional });
  };

  const groupQueriesByStudent = (queries) => {
    const map = {};
    const atRisk = [];
    const sortedQueries = [...queries].reverse(); // Oldest first
    
    sortedQueries.forEach(q => {
        if (!map[q.studentRollNo]) {
            map[q.studentRollNo] = {
                rollNo: q.studentRollNo,
                name: q.studentName,
                priority: false,
                messages: [],
                activeQueryId: null
            };
        }
        
        map[q.studentRollNo].messages.push({ text: q.message, type: 'student' });
        if (q.status === 'Solved') {
            map[q.studentRollNo].messages.push({ text: q.reply, type: 'counsellor' });
            map[q.studentRollNo].activeQueryId = null;
        } else {
            if (q.reply) {
                map[q.studentRollNo].messages.push({ text: q.reply, type: 'counsellor' });
            }
            map[q.studentRollNo].activeQueryId = q._id;
        }
        
        if (q.isAtRisk) {
             map[q.studentRollNo].priority = true;
             // Push to alerts if not solved
             if (q.status === 'Pending') {
                if (!atRisk.some(a => a._id === q._id)) atRisk.push(q);
             }
        }
    });
    setStudents(Object.values(map));
    setAlerts(atRisk);
  };

  const toggleDark = () => {
    setIsDark(!isDark);
  };

  const openChat = (index) => {
    setCurrentChatIndex(index);
    setActiveTab('chatScreen');
  };

  const sendMessage = async () => {
    if (currentChatIndex === null || msgInput.trim() === '') return;
    const student = students[currentChatIndex];
    
    if (!student.activeQueryId) {
        alert("This student has no pending queries to reply to.");
        return;
    }

    try {
        await fetch(`/api/queries/${student.activeQueryId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply: msgInput })
        });
        
        const updatedStudents = [...students];
        updatedStudents[currentChatIndex].messages.push({
          text: msgInput,
          type: 'counsellor'
        });
        updatedStudents[currentChatIndex].activeQueryId = null;
        
        setStudents(updatedStudents);
        setMsgInput('');
        fetchQueries(); // refresh alerts
    } catch(e) {
        console.error(e);
        alert('Failed to send reply');
    }
  };

  const currentStudent = currentChatIndex !== null ? students[currentChatIndex] : null;

  const pendingQueriesCount = students.filter(s => s.activeQueryId !== null).length;
  const solvedCount = students.filter(s => s.activeQueryId === null && s.messages.length > 0).length;

  return (
    <div className="dashboard-root" style={{ background: 'transparent', color: isDark ? '#f1f1f1' : '#2d3748', padding: '20px' }}>
      
      {activeTab === 'chatList' && (
        <div className="screen active glass-panel">
          <div className="header" style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
            Hi, {counselorData.name}
            <button className="dark-toggle" onClick={toggleDark} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>🌙</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {students.length === 0 && <div style={{ padding: '20px', textAlign: 'center' }}>No queries yet.</div>}
            {students.map((student, idx) => (
              <div 
                key={idx} 
                className={`student ${student.priority ? 'priority' : ''}`}
                onClick={() => openChat(idx)}
                style={{
                  padding: '20px',
                  borderBottom: `1px solid ${isDark ? '#444' : '#eee'}`,
                  cursor: 'pointer',
                  color: student.priority ? '#e53e3e' : 'inherit',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <strong>{student.name} ({student.rollNo})</strong> {student.priority && ' (At-Risk ⚠️)'}
                  <div style={{ fontSize: '13px', color: '#718096', marginTop: '5px' }}>
                    {student.messages[student.messages.length - 1]?.text}
                  </div>
                </div>
                <div>
                    {student.activeQueryId ? <span style={{ background: '#4facfe', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>Pending</span> : <span style={{ color: '#48bb78', fontSize: '12px' }}>Solved</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'chatScreen' && currentStudent && (
        <div className="screen active glass-panel">
          <div className="header" style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
            <span style={{ cursor: 'pointer', marginRight: '15px', fontSize: '20px' }} onClick={() => setActiveTab('chatList')}>⬅</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{currentStudent.name}</span>
            <button className="dark-toggle" onClick={toggleDark} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>🌙</button>
          </div>

          <div className="chat-box" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {currentStudent.messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{
                  margin: '8px 0',
                  padding: '12px 18px',
                  borderRadius: '18px',
                  maxWidth: '75%',
                  background: msg.type === 'counsellor' ? '#4facfe' : (isDark ? '#3a3a5a' : '#f0f4f8'),
                  color: msg.type === 'counsellor' || isDark ? 'white' : '#333',
                  marginLeft: msg.type === 'counsellor' ? 'auto' : '0',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="chat-input" style={{ display: 'flex', padding: '15px', borderTop: '1px solid #eee', background: isDark ? '#1e1e2f' : 'white', gap: '10px' }}>
            <input 
              placeholder={currentStudent.activeQueryId ? "Type reply..." : "Query already solved."}
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!currentStudent.activeQueryId}
              style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', outline: 'none', borderRadius: '24px', background: isDark ? '#2c2c3c' : '#f8fafc', color: isDark ? 'white' : 'black' }}
            />
            <button onClick={sendMessage} disabled={!currentStudent.activeQueryId} style={{ padding: '0 25px', background: currentStudent.activeQueryId ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : '#ccc', color: 'white', border: 'none', borderRadius: '24px', cursor: currentStudent.activeQueryId ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Send</button>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
          <div className="screen active glass-panel">
              <div className="header" style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold', background: '#e53e3e', color: 'white' }}>
                  🚨 At-Risk Student Alerts
              </div>
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                  {alerts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No active alerts. All students are safe.</div>
                  ) : (
                      alerts.map((a, idx) => (
                          <div key={idx} style={{ background: isDark ? '#3a3a5a' : '#fff5f5', border: '1px solid #fc8181', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                              <h4 style={{ color: '#c53030', margin: '0 0 10px 0' }}>{a.studentName} ({a.studentRollNo})</h4>
                              <p style={{ margin: '0 0 10px 0' }}>"{a.message}"</p>
                              <div style={{ fontSize: '12px', color: '#718096' }}>The AI has sent an initial supportive reply. Immediate human followup is required.</div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="screen active glass-panel">
          <div className="header" style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold' }}>
            Decision Engine Analytics
            <button className="dark-toggle" onClick={toggleDark} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>🌙</button>
          </div>
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, background: isDark ? '#2c2c3c' : '#f8fafc', padding: '20px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <h2 style={{ color: '#4facfe', fontSize: '32px' }}>{analytics.faq}</h2><p style={{ color: '#718096', marginTop: '5px' }}>Instant FAQs Solved by AI</p>
              </div>
              <div style={{ flex: 1, background: isDark ? '#2c2c3c' : '#f8fafc', padding: '20px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <h2 style={{ color: '#e53e3e', fontSize: '32px' }}>{analytics.emotional}</h2><p style={{ color: '#718096', marginTop: '5px' }}>Emotional / At-Risk</p>
              </div>
              <div style={{ flex: 1, background: isDark ? '#2c2c3c' : '#f8fafc', padding: '20px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <h2 style={{ color: '#ecc94b', fontSize: '32px' }}>{analytics.important}</h2><p style={{ color: '#718096', marginTop: '5px' }}>Important (Requires You)</p>
              </div>
            </div>
            
            <h3 style={{ marginTop: '30px', marginBottom: '15px', color: isDark ? '#f1f1f1' : '#2d3748' }}>Learning Loop - Potential New FAQs</h3>
            <div style={{ background: isDark ? '#2c2c3c' : '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '13px', color: '#718096', marginBottom: '15px' }}>The AI engine analyzes "Important" queries that it couldn't auto-resolve. You can add these to the FAQ rules to improve the AI over time.</p>
                {potentialFaqs.slice(0, 5).map((q, idx) => (
                    <div key={idx} style={{ padding: '10px', borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none', fontSize: '14px' }}>
                        "{q.message}"
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'createStudent' && (
        <div className="screen active glass-panel">
          <div className="header" style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold' }}>
            Create Student Account
            <button className="dark-toggle" onClick={toggleDark} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>🌙</button>
          </div>
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Student Name</label>
                <input required type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Student ID</label>
                <input required type="text" value={newStudent.rollNo} onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                <input required type="email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Course</label>
                <input required type="text" value={newStudent.course} onChange={e => setNewStudent({...newStudent, course: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <button type="submit" style={{ padding: '12px', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Create Account</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="screen active glass-panel">
          <div className="header" style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold' }}>
            Profile
            <button className="dark-toggle" onClick={toggleDark} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>🌙</button>
          </div>
          <div style={{ padding: '20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100px', height: '100px', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '40px', marginBottom: '20px' }}>
              {counselorData.name.charAt(0)}
            </div>
            <h3 style={{ fontSize: '28px', color: '#1a365d', marginBottom: '10px' }}>{counselorData.name}</h3>
            <p style={{ color: '#4a5568', background: '#f8fafc', padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>Faculty No: <strong>{counselorData.facultyNo}</strong></p>
          </div>
        </div>
      )}

      {activeTab !== 'chatScreen' && (
        <div className="floating-navbar">
          <div className={`nav-item ${activeTab === 'chatList' ? 'active' : ''}`} onClick={() => setActiveTab('chatList')} style={{ color: isDark && activeTab !== 'chatList' ? '#f1f1f1' : '#718096' }}>💬 Query Solving</div>
          <div className={`nav-item ${activeTab === 'createStudent' ? 'active' : ''}`} onClick={() => setActiveTab('createStudent')} style={{ color: isDark && activeTab !== 'createStudent' ? '#f1f1f1' : '#718096' }}>➕ Add Student</div>
          <div className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')} style={{ color: isDark && activeTab !== 'alerts' ? '#f1f1f1' : (alerts.length > 0 ? '#e53e3e' : '#718096') }}>🚨 Alerts {alerts.length > 0 && `(${alerts.length})`}</div>
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} style={{ color: isDark && activeTab !== 'dashboard' ? '#f1f1f1' : '#718096' }}>📊 Analytic Board</div>
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')} style={{ color: isDark && activeTab !== 'profile' ? '#f1f1f1' : '#718096' }}>👤 Profile</div>
        </div>
      )}
    </div>
  );
};

export default CounselorDashboard;
