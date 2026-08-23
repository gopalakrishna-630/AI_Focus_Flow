import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookText, MessageSquare, ScanFace, LogOut, AlertTriangle, Send, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import "../styles/study.css";
import { showToast } from "../components/Toast";
import { useCamera } from "../hooks/useCamera";
import { CameraMonitor } from "../components/CameraMonitor";

export const StudySession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config || { concept: "Unknown Concept", estimatedTime: 30 };
  const resumeTime = location.state?.resumeTime;
  
  const [activeTab, setActiveTab] = useState("content");
  const [timeSpent, setTimeSpent] = useState(resumeTime !== undefined ? resumeTime : 0);
  const [exitWarning, setExitWarning] = useState(false);
  
  const [showFinalQuiz, setShowFinalQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  const [studyPages, setStudyPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loadingContent, setLoadingContent] = useState(true);
  
  const [showPageQuiz, setShowPageQuiz] = useState(false);
  const [pageQuizData, setPageQuizData] = useState(null);
  const [pageQuizAnswers, setPageQuizAnswers] = useState({});
  const [pageQuizResult, setPageQuizResult] = useState(null);
  const [pageQuizScore, setPageQuizScore] = useState(0);
  const [pageQuizEvaluations, setPageQuizEvaluations] = useState({});
  const [prefetchedNextPage, setPrefetchedNextPage] = useState(null);
  
  const [doubts, setDoubts] = useState([{ sender: "ai", text: `I am your AI tutor. I notice you are focusing on ${config.concept}. Do you have any doubts before we continue? Stay focused!` }]);
  const [doubtInput, setDoubtInput] = useState("");
  
  const containerRef = useRef(null);
  const camera = useCamera();

  const fetchSinglePage = async (pageNumber) => {
    setLoadingContent(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/ai/generate-single-page`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: config.concept, page_number: pageNumber })
      });
      const data = await res.json();
      if (data.content) {
        setStudyPages(prev => [...prev, data.content]);
      } else {
        setStudyPages(prev => [...prev, { page_number: pageNumber, title: "Content Unavailable", content: "Could not generate content." }]);
      }
    } catch (e) {
      console.error(e);
      setStudyPages(prev => [...prev, { page_number: pageNumber, title: "Error", content: "Error fetching AI content." }]);
    }
    setLoadingContent(false);
  };

  const fetchPageQuiz = async (pageIndex) => {
    setPageQuizData(null);
    const currentPageContent = studyPages[pageIndex]?.content || "";
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/ai/generate-page-quiz`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: config.concept, page_content: currentPageContent })
      });
      const data = await res.json();
      setPageQuizData(data.quiz || []);
    } catch (e) {
      console.error(e);
      setPageQuizData([]);
    }
  };

  const fetchQuiz = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/ai/quiz`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: config.concept })
      });
      const data = await res.json();
      setQuizData(data.quiz || []);
    } catch (e) {
      console.error(e);
      setQuizData([]);
    }
  };

  const fetchPrefetchNextPage = async (pageNumber) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/ai/generate-single-page`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: config.concept, page_number: pageNumber })
      });
      const data = await res.json();
      if (data.content) {
        setPrefetchedNextPage(data.content);
      }
    } catch (e) {
      console.error("Prefetch error", e);
    }
  };

  // Prefetch quiz when a page loads
  useEffect(() => {
    if (studyPages.length > 0) {
      fetchPageQuiz(studyPages.length - 1);
    }
  }, [studyPages.length]);

  // Prefetch next page when user opens the quiz
  useEffect(() => {
    if (showPageQuiz && studyPages.length < 4) {
      fetchPrefetchNextPage(studyPages.length + 1);
    }
  }, [showPageQuiz]);

  useEffect(() => {
    fetchSinglePage(1);
    camera.startCamera();
    return () => {
      camera.stopCamera();
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (showFinalQuiz) return;
    const timer = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [showFinalQuiz]);

  // Fullscreen logic (Enforced for the entire session, including quiz)
  useEffect(() => {
    const elem = document.documentElement;
    const requestFS = async () => {
      try {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        }
      } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
      }
    };
    
    requestFS();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
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
  }, []);

  const handleDiscontinue = () => {
    localStorage.setItem("incompleteSession", JSON.stringify({ config, timeLeft: timeSpent }));
    showToast("Session discontinued. Position saved for next time.", "info");
    camera.stopCamera();
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

  const finishQuizAndSession = () => {
    localStorage.removeItem("incompleteSession");
    showToast("Session successfully completed & recorded.", "success");
    camera.stopCamera();
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
    
    // Simplistic mock evaluation for multiple choice or short answers
    for (let idx = 0; idx < quizData.length; idx++) {
      const q = quizData[idx];
      const ans = (quizAnswers[idx] || "").trim().toLowerCase();
      
      // If it's the multiple choice JSON structure from Gemini
      let isCorrect = false;
      if (q.correctOption && ans === q.correctOption.toLowerCase()) {
        isCorrect = true;
      } else if (q.correctOption && q.options && q.options[q.correctOption]) {
        // Also allow typing the exact text
        if (ans === q.options[q.correctOption].toLowerCase()) {
          isCorrect = true;
        }
      } else if (ans.length > 5) {
        // Fallback for mock if expected_answer was used
        isCorrect = true;
      }
      
      evals[idx] = { 
        is_correct: isCorrect, 
        feedback: isCorrect ? "Correct answer!" : `Incorrect. The expected answer was ${q.correctOption?.toUpperCase()}.` 
      };
      if (isCorrect) score++;
    }
    
    setEvaluations(evals);
    setQuizScore(score);
    
    // Passing criteria: At least 3 out of 5, or 60%
    const requiredScore = Math.ceil(quizData.length * 0.6);
    if (score >= requiredScore) {
      setQuizResult("passed");
    } else {
      setQuizResult("failed");
    }
    setIsEvaluating(false);
  };

    const submitPageQuiz = async () => {
    if (!pageQuizData) return;
    setIsEvaluating(true);
    let score = 0;
    const evals = {};
    for (let idx = 0; idx < pageQuizData.length; idx++) {
      const q = pageQuizData[idx];
      const ans = (pageQuizAnswers[idx] || "").trim().toLowerCase();
      let isCorrect = false;
      if (q.correctOption && ans === q.correctOption.toLowerCase()) {
        isCorrect = true;
      } else if (q.correctOption && q.options && q.options[q.correctOption]) {
        if (ans === q.options[q.correctOption].toLowerCase()) {
          isCorrect = true;
        }
      }
      evals[idx] = { 
        is_correct: isCorrect, 
        feedback: isCorrect ? "Correct answer!" : `Incorrect. The expected answer was ${q.correctOption?.toUpperCase()}.` 
      };
      if (isCorrect) score++;
    }
    setPageQuizEvaluations(evals);
    setPageQuizScore(score);
    const requiredScore = Math.ceil(pageQuizData.length * 0.5);
    if (score >= requiredScore) {
      setPageQuizResult("passed");
    } else {
      setPageQuizResult("failed");
    }
    setIsEvaluating(false);
  };

  const retakePageQuiz = () => {
    setPageQuizAnswers({});
    setPageQuizResult(null);
    setPageQuizEvaluations({});
  };

  const handlePageQuizSuccess = () => {
    setShowPageQuiz(false);
    setPageQuizData(null); // Clear for the next page's prefetch
    setPageQuizAnswers({});
    setPageQuizResult(null);
    if (prefetchedNextPage) {
      setStudyPages(prev => [...prev, prefetchedNextPage]);
      setPrefetchedNextPage(null);
    } else {
      fetchSinglePage(studyPages.length + 1);
    }
    setCurrentPageIndex(prev => prev + 1);
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

  if (showFinalQuiz) {
    if (quizResult) {
      return (
        <div className="study-setup-container" style={{ minHeight: "100vh" }}>
          <div className="setup-card" style={{ maxWidth: "800px", textAlign: "center" }}>
            <h2 style={{ color: quizResult === "passed" ? "var(--status-green)" : "var(--status-red)", marginBottom: "1rem" }}>
              {quizResult === "passed" ? "Excellent Work! 🎉" : "Keep Trying 😕"}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
              You scored {quizScore}/{quizData?.length || 5}.
            </p>
            
            <div style={{ textAlign: "left", marginBottom: "2rem" }}>
              {quizData.map((q, idx) => (
                <div key={idx} className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem", borderLeft: evaluations[idx]?.is_correct ? "4px solid var(--status-green)" : "4px solid var(--status-red)" }}>
                  <h4>{idx + 1}. {q.question}</h4>
                  <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                    <strong>Your Answer:</strong> {quizAnswers[idx] ? (quizAnswers[idx].toUpperCase()) : "No answer"}
                  </p>
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                    <strong>AI Feedback:</strong> {evaluations[idx]?.feedback}
                  </div>
                </div>
              ))}
            </div>

            {quizResult === "passed" ? (
              <button className="btn btn-primary" onClick={finishQuizAndSession} style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}>
                <CheckCircle2 size={20} style={{ marginRight: "8px" }} /> Complete Session & Save
              </button>
            ) : (
              <div>
                <p style={{ color: "var(--status-yellow)", marginBottom: "1rem" }}>You did not score enough to pass. You must retake the quiz to complete this session.</p>
                <button className="btn btn-primary" onClick={retakeQuiz} style={{ width: "100%", padding: "1rem", background: "var(--status-yellow)", color: "#000", border: "none" }}>
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
          
          {/* Fullscreen enforcement warnings during quiz */}
          {exitWarning && (
            <div className="exit-warning">
              <div className="warning-box">
                <AlertTriangle size={48} color="var(--status-red)" style={{ marginBottom: "1rem" }} />
                <h2 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Session Interrupted!</h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                  Focus detection is running. You must remain in fullscreen to complete the quiz.
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <button className="btn btn-primary" onClick={handleReturnToSession}>Resume Fullscreen</button>
                  <button className="btn btn-outline" style={{ color: "var(--status-red)", borderColor: "var(--status-red)" }} onClick={handleDiscontinue}>Discontinue Session</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="study-setup-container" style={{ minHeight: "100vh" }}>
        <div className="setup-card" style={{ maxWidth: "800px" }}>
          <h2 style={{ color: "var(--accent-cyan)", marginBottom: "1rem" }}>Session Complete! Knowledge Check 🧠</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            You've successfully completed your focus session on <strong>{config.concept}</strong>. Focus tracking is still active. Please answer these questions.
          </p>
          
          <div style={{ textAlign: "left", marginBottom: "2rem" }}>
            {!quizData ? (
              <p>Loading your personalized questions...</p>
            ) : (
              quizData.map((q, idx) => (
                <div key={idx} className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                  <h4>{idx + 1}. {q.question}</h4>
                  
                  {q.options ? (
                    <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {Object.keys(q.options).map(optKey => (
                        <label key={optKey} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", cursor: "pointer" }}>
                          <input 
                            type="radio" 
                            name={`question-${idx}`}
                            value={optKey}
                            checked={quizAnswers[idx] === optKey}
                            onChange={(e) => handleQuizChange(idx, e.target.value)}
                          />
                          {optKey.toUpperCase()}: {q.options[optKey]}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginTop: "1rem" }}>
                      <textarea 
                        style={{ width: "100%", minHeight: "80px", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff" }}
                        placeholder="Type your answer here..."
                        value={quizAnswers[idx] || ""}
                        onChange={(e) => handleQuizChange(idx, e.target.value)} 
                      />
                    </div>
                  )}
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

        {/* Fullscreen enforcement warnings during quiz */}
        {exitWarning && (
          <div className="exit-warning">
            <div className="warning-box">
              <AlertTriangle size={48} color="var(--status-red)" style={{ marginBottom: "1rem" }} />
              <h2 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Session Interrupted!</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                Focus detection is running. You must remain in fullscreen to complete the quiz.
              </p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <button className="btn btn-primary" onClick={handleReturnToSession}>Resume Fullscreen</button>
                <button className="btn btn-outline" style={{ color: "var(--status-red)", borderColor: "var(--status-red)" }} onClick={handleDiscontinue}>Discontinue Session</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showPageQuiz) {
    if (pageQuizResult) {
      return (
        <div className="study-setup-container" style={{ minHeight: "100vh" }}>
          <div className="setup-card" style={{ maxWidth: "800px", textAlign: "center" }}>
            <h2 style={{ color: pageQuizResult === "passed" ? "var(--status-green)" : "var(--status-red)", marginBottom: "1rem" }}>
              {pageQuizResult === "passed" ? "Good Job! 🎉" : "Keep Trying 😕"}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
              You scored {pageQuizScore}/{pageQuizData?.length || 2}.
            </p>
            <div style={{ textAlign: "left", marginBottom: "2rem" }}>
              {pageQuizData.map((q, idx) => (
                <div key={idx} className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem", borderLeft: pageQuizEvaluations[idx]?.is_correct ? "4px solid var(--status-green)" : "4px solid var(--status-red)" }}>
                  <h4>{idx + 1}. {q.question}</h4>
                  <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                    <strong>Your Answer:</strong> {pageQuizAnswers[idx] ? (pageQuizAnswers[idx].toUpperCase()) : "No answer"}
                  </p>
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                    <strong>AI Feedback:</strong> {pageQuizEvaluations[idx]?.feedback}
                  </div>
                </div>
              ))}
            </div>
            {pageQuizResult === "passed" ? (
              <button className="btn btn-primary" onClick={handlePageQuizSuccess} style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}>
                <CheckCircle2 size={20} style={{ marginRight: "8px" }} /> Continue to Next Page
              </button>
            ) : (
              <div>
                <p style={{ color: "var(--status-yellow)", marginBottom: "1rem" }}>You did not score enough to pass. You must retake the quiz.</p>
                <button className="btn btn-primary" onClick={retakePageQuiz} style={{ width: "100%", padding: "1rem", background: "var(--status-yellow)", color: "#000", border: "none" }}>
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
          <h2 style={{ color: "var(--accent-cyan)", marginBottom: "1rem" }}>Page Quiz 🧠</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            Let's check your understanding of Page {currentPageIndex + 1}.
          </p>
          <div style={{ textAlign: "left", marginBottom: "2rem" }}>
            {!pageQuizData ? (
              <p>Loading questions...</p>
            ) : (
              pageQuizData.map((q, idx) => (
                <div key={idx} className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                  <h4>{idx + 1}. {q.question}</h4>
                  {q.options ? (
                    <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {Object.keys(q.options).map(optKey => (
                        <label key={optKey} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", cursor: "pointer" }}>
                          <input 
                            type="radio" 
                            name={`page-question-${idx}`}
                            value={optKey}
                            checked={pageQuizAnswers[idx] === optKey}
                            onChange={(e) => setPageQuizAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                          />
                          {optKey.toUpperCase()}: {q.options[optKey]}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={submitPageQuiz} 
            disabled={!pageQuizData || isEvaluating} 
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
            <ScanFace size={18} /> Focus Detection
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="session-timer">
            Time: {formatTime(timeSpent)}
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
          <div className="content-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2>{config.concept}: AI Generated Guide</h2>
            
            <div className="ai-content glass-card" style={{ padding: "2rem", flex: 1, overflowY: "auto", marginBottom: "1rem" }}>
              {loadingContent ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--accent-cyan)' }}>
                  Generating page content with Gemini...
                </div>
              ) : (
                studyPages.length > 0 && (
                  <div>
                    <h3 style={{ marginBottom: "1rem", color: "var(--accent-cyan)" }}>
                      Page {currentPageIndex + 1}: {studyPages[currentPageIndex].title}
                    </h3>
                    <div style={{ lineHeight: "1.8", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                      {studyPages[currentPageIndex].content}
                    </div>
                  </div>
                )
              )}
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0" }}>
              <button 
                className="btn btn-outline"
                disabled={currentPageIndex === 0}
                onClick={() => setCurrentPageIndex(prev => prev - 1)}
              >
                <ChevronLeft size={18} style={{ marginRight: '5px' }} /> Previous Page
              </button>
              
              <span style={{ color: "var(--text-secondary)" }}>
                Page {currentPageIndex + 1}
              </span>
              
              {currentPageIndex < studyPages.length - 1 ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentPageIndex(prev => prev + 1)}
                >
                  Next Page <ChevronRight size={18} style={{ marginLeft: '5px' }} />
                </button>
              ) : currentPageIndex < 3 ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowPageQuiz(true);
                    if (!pageQuizData) {
                      fetchPageQuiz(currentPageIndex);
                    }
                  }}
                >
                  Take Page Quiz <ChevronRight size={18} style={{ marginLeft: '5px' }} />
                </button>
              ) : (
                <button 
                  className="btn btn-primary"
                  style={{ background: "var(--status-green)", borderColor: "var(--status-green)" }}
                  onClick={() => {
                    setShowFinalQuiz(true);
                    fetchQuiz();
                  }}
                >
                  Take Final Quiz <CheckCircle2 size={18} style={{ marginLeft: '5px' }} />
                </button>
              )}
            </div>
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
              <h2>Active Focus Detection</h2>
              <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto 2rem auto" }}>
                The camera is continuously capturing telemetry to detect if you look away or lose focus. This data will be recorded until you complete the final quiz.
              </p>
              
              <div style={{ maxWidth: "400px", margin: "0 auto 2rem auto", overflow: "hidden", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <CameraMonitor 
                  stream={camera.stream} 
                  cameraActive={camera.cameraActive} 
                  permissionError={camera.permissionError} 
                  loading={camera.loading} 
                />
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "2rem" }}>
                <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)", minWidth: "150px" }}>
                  <div style={{ fontSize: "2rem", color: "var(--status-green)", fontWeight: "bold" }}>Active</div>
                  <div style={{ color: "var(--text-secondary)" }}>Camera Status</div>
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
              Focus tracking requires fullscreen. You are not allowed to exit the session until you complete the final quiz.
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
