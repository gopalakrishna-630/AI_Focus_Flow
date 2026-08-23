import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookText, MessageSquare, ScanFace, LogOut, AlertTriangle, Send, CheckCircle2 } from "lucide-react";
import "../styles/study.css";
import { showToast } from "../components/Toast";

export const StudySession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config || { concept: "Unknown Concept", estimatedTime: 30 };
  const resumeTime = location.state?.resumeTime;
  
  const [activeTab, setActiveTab] = useState("content");
  const [timeLeft, setTimeLeft] = useState(resumeTime !== undefined ? resumeTime : config.estimatedTime * 60);
  const [exitWarning, setExitWarning] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  
  const [doubts, setDoubts] = useState([{ sender: "ai", text: `I am your AI tutor. I notice you are focusing on ${config.concept}. Do you have any doubts before we continue? Stay focused!` }]);
  const [doubtInput, setDoubtInput] = useState("");
  
  const containerRef = useRef(null);

  const fetchQuiz = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/ai/generate-doubts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: config.concept })
      });
      const data = await res.json();
      // data is an array of questions from AIQuestion model
      setQuizData(data);
    } catch (e) {
      console.error(e);
      setQuizData([]);
    }
  };

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0 && !showQuiz) {
      // Session finished naturally, trigger quiz
      setShowQuiz(true);
      fetchQuiz();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      return;
    }
    
    if (timeLeft <= 0 || showQuiz) return;
    
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showQuiz]);

  // Fullscreen logic
  useEffect(() => {
    const elem = document.documentElement;
    const requestFS = async () => {
      try {
        if (elem.requestFullscreen && !showQuiz) {
          await elem.requestFullscreen();
        }
      } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
      }
    };
    
    requestFS();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !showQuiz) {
        setExitWarning(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [showQuiz]);

  const handleDiscontinue = () => {
    localStorage.setItem("incompleteSession", JSON.stringify({ config, timeLeft }));
    showToast("Session discontinued. Position saved for next time.", "info");
    navigate("/setup");
  };

  const handleReturnToSession = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setExitWarning(false);
    } catch (err) {
      showToast("Could not re-enter fullscreen.", "error");
    }
  };

  const handleSendDoubt = async (e) => {
    e.preventDefault();
    if (!doubtInput.trim()) return;
    
    setDoubts(prev => [...prev, { sender: "user", text: doubtInput }]);
    const currentDoubt = doubtInput;
    setDoubtInput("");
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/ai/doubt`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: config.concept, doubt: currentDoubt })
      });
      const data = await res.json();
      setDoubts(prev => [...prev, { sender: "ai", text: data.answer }]);
    } catch (err) {
      setDoubts(prev => [...prev, { sender: "ai", text: "Sorry, I couldn't connect to my brain. Please stay focused!" }]);
    }
  };

  const finishQuiz = () => {
    localStorage.removeItem("incompleteSession"); // clear just in case
    showToast("Session successfully completed.", "success");
    navigate("/history");
  };

  const handleQuizChange = (qIndex, val) => {
    setQuizAnswers(prev => ({ ...prev, [qIndex]: val }));
  };

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState({});

  const submitQuiz = async () => {
    if (!quizData) return;
    setIsEvaluating(true);
    let score = 0;
    const evals = {};
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    for (let idx = 0; idx < quizData.length; idx++) {
      const q = quizData[idx];
      const ans = quizAnswers[idx] || "";
      try {
        const res = await fetch(`${API_URL}/api/ai/evaluate-answer`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q.question,
            student_answer: ans,
            topic: config.concept,
            expected_answer: q.expected_answer
          })
        });
        const data = await res.json();
        evals[idx] = data;
        if (data.is_correct) score++;
      } catch (e) {
        evals[idx] = { is_correct: false, feedback: "Error evaluating." };
      }
    }
    
    setEvaluations(evals);
    setQuizScore(score);
    if (score === quizData.length) {
      setQuizResult("passed");
    } else {
      setQuizResult("failed");
    }
    setIsEvaluating(false);
  };

  const retakeQuiz = () => {
    setQuizAnswers({});
    setQuizResult(null);
    setEvaluations({});
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (showQuiz) {
    if (quizResult) {
      return (
        <div className="study-setup-container" style={{ minHeight: "100vh" }}>
          <div className="setup-card" style={{ maxWidth: "800px", textAlign: "center" }}>
            <h2 style={{ color: quizResult === "passed" ? "var(--status-green)" : "var(--status-red)", marginBottom: "1rem" }}>
              {quizResult === "passed" ? "Excellent Work! 🎉" : "Keep Trying 😕"}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
              You scored {quizScore}/{quizData?.length || 5} on the knowledge check.
            </p>
            
            <div style={{ textAlign: "left", marginBottom: "2rem" }}>
              {quizData.map((q, idx) => (
                <div key={idx} className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem", borderLeft: evaluations[idx]?.is_correct ? "4px solid var(--status-green)" : "4px solid var(--status-red)" }}>
                  <h4>{idx + 1}. {q.question}</h4>
                  <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}><strong>Your Answer:</strong> {quizAnswers[idx] || "No answer provided"}</p>
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                    <strong>AI Feedback:</strong> {evaluations[idx]?.feedback}
                  </div>
                </div>
              ))}
            </div>

            {quizResult === "passed" ? (
              <button className="btn btn-primary" onClick={finishQuiz} style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}>
                <CheckCircle2 size={20} style={{ marginRight: "8px" }} /> Complete Session
              </button>
            ) : (
              <div style={{ display: "flex", gap: "1rem" }}>
                <button className="btn btn-outline" onClick={() => { setShowQuiz(false); retakeQuiz(); }} style={{ flex: 1, padding: "1rem" }}>
                  <BookText size={20} style={{ marginRight: "8px" }} /> Review Material
                </button>
                <button className="btn btn-primary" onClick={retakeQuiz} style={{ flex: 1, padding: "1rem", background: "var(--status-yellow)", color: "#000", border: "none" }}>
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="study-setup-container" style={{ minHeight: "100vh" }}>
        <div className="setup-card" style={{ maxWidth: "800px" }}>
          <h2 style={{ color: "var(--accent-cyan)", marginBottom: "1rem" }}>Session Complete! Knowledge Check 🧠</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            You've successfully completed your focus session on <strong>{config.concept}</strong>. Answer these questions to prove your understanding.
          </p>
          
          <div style={{ textAlign: "left", marginBottom: "2rem" }}>
            {!quizData ? (
              <p>Loading your personalized questions...</p>
            ) : (
              quizData.map((q, idx) => (
                <div key={idx} className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                  <h4>{idx + 1}. {q.question}</h4>
                  <div style={{ marginTop: "1rem" }}>
                    <textarea 
                      style={{ width: "100%", minHeight: "80px", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff" }}
                      placeholder="Type your answer here..."
                      value={quizAnswers[idx] || ""}
                      onChange={(e) => handleQuizChange(idx, e.target.value)} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={submitQuiz} 
            disabled={!quizData || isEvaluating} 
            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
          >
            {isEvaluating ? "Evaluating with AI..." : <><CheckCircle2 size={20} style={{ marginRight: "8px" }} /> Submit Answers</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-session-container" ref={containerRef}>
      <header className="session-header">
        <div className="session-tabs">
          <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
            <BookText size={18} /> Course Content
          </button>
          <button className={`tab-btn ${activeTab === 'doubts' ? 'active' : ''}`} onClick={() => setActiveTab('doubts')}>
            <MessageSquare size={18} /> Clear Doubts
          </button>
          <button className={`tab-btn ${activeTab === 'face' ? 'active' : ''}`} onClick={() => setActiveTab('face')}>
            <ScanFace size={18} /> Face Detection
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="session-timer">
            {formatTime(timeLeft)}
          </div>
          <button 
            className="btn btn-outline" 
            style={{ color: "var(--status-red)", borderColor: "var(--status-red)" }}
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                setExitWarning(true);
              }
            }}
          >
            <LogOut size={16} style={{ marginRight: '8px' }} />
            Exit Session
          </button>
        </div>
      </header>

      <div className="session-content">
        {activeTab === 'content' && (
          <div className="content-pane">
            <h2>{config.concept}: Comprehensive Guide</h2>
            <div className="ai-content glass-card" style={{ padding: "2rem" }}>
              <h3>Module 1: Introduction</h3>
              <p>
                Welcome to your generated study material for {config.concept}. 
                This content is dynamically tailored to maximize your understanding while our AI tracks your focus.
                Please read through the paragraphs carefully.
              </p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <h3>Module 2: Advanced Concepts</h3>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              <div style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(6, 182, 212, 0.1)", borderRadius: "8px", borderLeft: "4px solid var(--accent-cyan)" }}>
                <strong>AI Instructor Note:</strong> Please clear any doubts in the 'Clear Doubts' tab if you are struggling to maintain focus. We noticed a slight drop in attention 5 minutes ago.
              </div>
            </div>
            {/* Quick jump to test timer logic without waiting full time */}
            <button 
              className="btn btn-outline" 
              style={{ marginTop: "2rem", fontSize: "0.8rem", padding: "0.5rem" }}
              onClick={() => setTimeLeft(3)}
            >
              [Dev Tool] Skip Timer to 3s
            </button>
          </div>
        )}

        {activeTab === 'doubts' && (
          <div className="content-pane doubts-chat">
            <div className="chat-history">
              {doubts.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.sender === 'ai' ? 'msg-ai' : 'msg-user'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendDoubt} className="chat-input-wrapper">
              <input 
                type="text" 
                className="chat-input"
                placeholder="Type your doubt here to stay focused..." 
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "0 1.5rem" }}>
                <Send size={20} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'face' && (
          <div className="content-pane">
            <div className="glass-card" style={{ textAlign: "center", padding: "3rem" }}>
              <ScanFace size={64} color="var(--accent-cyan)" style={{ marginBottom: "1rem" }} />
              <h2>Active Distraction Monitoring</h2>
              <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto 2rem auto" }}>
                The AI is continuously analyzing your eye movements and face orientation to ensure you are fully engaged with the {config.concept} material.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "2rem" }}>
                <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)", minWidth: "150px" }}>
                  <div style={{ fontSize: "2rem", color: "var(--status-green)", fontWeight: "bold" }}>95%</div>
                  <div style={{ color: "var(--text-secondary)" }}>Current Focus</div>
                </div>
                <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)", minWidth: "150px" }}>
                  <div style={{ fontSize: "2rem", color: "var(--text-primary)", fontWeight: "bold" }}>0</div>
                  <div style={{ color: "var(--text-secondary)" }}>Distractions</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {exitWarning && (
        <div className="exit-warning">
          <div className="warning-box">
            <AlertTriangle size={48} color="var(--status-red)" style={{ marginBottom: "1rem" }} />
            <h2 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Session Interrupted!</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
              You are not allowed to exit the session until the recommended time is complete. If you discontinue now, your session will end and you can resume later from this position.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={handleReturnToSession}>
                Resume Focus (Fullscreen)
              </button>
              <button className="btn btn-outline" style={{ color: "var(--status-red)", borderColor: "var(--status-red)" }} onClick={handleDiscontinue}>
                Discontinue Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySession;
