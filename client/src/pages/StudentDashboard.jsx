import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [studentData, setStudentData] = useState({ name: 'Student', email: '', course: '', rollNo: '' });
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const quickMessages = [
    "When are my exams? 📅",
    "How do I pay fees? 💳",
    "What's my class schedule? 🕒",
    "I'm feeling very overwhelmed. 😔"
  ];

  useEffect(() => {
    // Load student data from localStorage
    const data = localStorage.getItem('studentData');
    if (data) {
      const parsedData = JSON.parse(data);
      setStudentData(parsedData);
      fetchQueries(parsedData.rollNo);
      
      // Poll for new messages every 1 second
      const interval = setInterval(() => fetchQueries(parsedData.rollNo), 1000);
      return () => clearInterval(interval);
    } else {
      setMessages([{ text: "Hi Student! Please login first.", type: "bot" }]);
    }
  }, []);

  const fetchQueries = async (rollNo) => {
    try {
      const res = await fetch(`/api/student/queries/${rollNo}`);
      const data = await res.json();
      if (data.success) {
        const loadedMessages = [];
        data.queries.forEach(q => {
          loadedMessages.push({ text: q.message, type: "user" });
          if (q.reply) {
            loadedMessages.push({ text: q.reply, type: "bot" });
          } else if (q.status === 'Pending') {
            loadedMessages.push({ text: "I have forwarded this query to your counselor. They will assist you shortly.", type: "bot" });
          }
        });
        if (loadedMessages.length === 0) {
          loadedMessages.push({ text: `Hi! Ask the counselor about schedule, fees, or anything 😊`, type: "bot" });
        }
        setMessages(loadedMessages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !studentData.rollNo) return;

    const newMsg = inputValue;
    setInputValue('');
    // Optimistic UI update
    setMessages(msgs => [...msgs, { text: newMsg, type: "user" }]);

    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentRollNo: studentData.rollNo,
          studentName: studentData.name,
          message: newMsg
        })
      });
      const data = await res.json();
      if (data.success && data.query) {
        if (data.query.reply) {
          setMessages(msgs => [...msgs, { text: data.query.reply, type: "bot" }]);
        } else if (data.query.status === 'Pending') {
          setMessages(msgs => [...msgs, { text: "I have forwarded this query to your counselor. They will assist you shortly.", type: "bot" }]);
        }
      }
    } catch (error) {
      console.error("Failed to send query", error);
      alert("Failed to send query to counselor");
    }
  };

  const sendQuickMessage = async (msg) => {
    if (!studentData.rollNo) return;
    setMessages(msgs => [...msgs, { text: msg, type: "user" }]);

    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentRollNo: studentData.rollNo,
          studentName: studentData.name,
          message: msg
        })
      });
      const data = await res.json();
      if (data.success && data.query) {
        if (data.query.reply) {
          setMessages(msgs => [...msgs, { text: data.query.reply, type: "bot" }]);
        } else if (data.query.status === 'Pending') {
          setMessages(msgs => [...msgs, { text: "I have forwarded this query to your counselor. They will assist you shortly.", type: "bot" }]);
        }
      }
    } catch (error) {
      console.error("Failed to send query", error);
      alert("Failed to send query to counselor");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="dashboard-root">
      
      {activeTab === 'chat' && (
        <div className="screen active">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', position: 'relative' }}>
            <span>Hi {studentData.name} 👋</span>
            <button 
              onClick={() => setShowProfile(!showProfile)}
              style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
            >
              👤
            </button>
            {showProfile && (
              <div style={{ position: 'absolute', top: '60px', right: '20px', background: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '15px', zIndex: 100, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#333' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Student Profile</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Registration Number:</strong> REG12345</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Student ID:</strong> {studentData.rollNo}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Student Name:</strong> {studentData.name}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Course:</strong> {studentData.course}</p>
              </div>
            )}
          </header>
          <main>
            <div className="chat-container">
              <div className="chat-header">Counselor HelpDesk 🤖</div>
              <div className="chat-box">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.type}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
              
              <div className="quick-chips-wrapper">
                {quickMessages.map((msg, i) => (
                  <button 
                    key={i} 
                    className="quick-chip"
                    onClick={() => sendQuickMessage(msg)}
                  >
                    {msg}
                  </button>
                ))}
              </div>

              <div className="chat-input">
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button onClick={handleSend} title="Send Message">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </main>
        </div>
      )}

      <div className="navbar">
        <div 
          className="nav-item active" 
          onClick={() => setActiveTab('chat')}
          style={{ width: '100%', textAlign: 'center' }}
        >
          💬 Chat
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
