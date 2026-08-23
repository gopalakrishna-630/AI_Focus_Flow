import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "r") as f:
    content = f.read()

# 1. Replace state definitions
old_states = """  const [activeTab, setActiveTab] = useState("content");
  const [timeLeft, setTimeLeft] = useState(resumeTime !== undefined ? resumeTime : config.estimatedTime * 60);
  const [exitWarning, setExitWarning] = useState(false);
  
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  const [studyPages, setStudyPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loadingContent, setLoadingContent] = useState(true);"""

new_states = """  const [activeTab, setActiveTab] = useState("content");
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
  const [pageQuizEvaluations, setPageQuizEvaluations] = useState({});"""
content = content.replace(old_states, new_states)

# 2. Replace fetchContent, fetchQuiz, useEffects
old_fetch = """  const fetchContent = async () => {
    setLoadingContent(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/ai/generate-content`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: config.concept })
      });
      const data = await res.json();
      if (data.content && data.content.length > 0) {
        setStudyPages(data.content);
      } else {
        setStudyPages([{ page_number: 1, title: "Content Unavailable", content: "Could not generate content. Please study independently." }]);
      }
    } catch (e) {
      console.error(e);
      setStudyPages([{ page_number: 1, title: "Error", content: "Error fetching AI content." }]);
    }
    setLoadingContent(false);
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

  useEffect(() => {
    fetchContent();
    camera.startCamera();
    return () => {
      camera.stopCamera();
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0 && !showQuiz) {
      setShowQuiz(true);
      fetchQuiz();
      return;
    }
    
    if (timeLeft <= 0 || showQuiz) return;
    
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showQuiz]);"""

new_fetch = """  const fetchSinglePage = async (pageNumber) => {
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
  }, [showFinalQuiz]);"""
content = content.replace(old_fetch, new_fetch)

# 3. Replace timeLeft in handleDiscontinue and formatTime rendering
content = content.replace("localStorage.setItem(\"incompleteSession\", JSON.stringify({ config, timeLeft }));", "localStorage.setItem(\"incompleteSession\", JSON.stringify({ config, timeLeft: timeSpent }));")
content = content.replace("{formatTime(timeLeft)}", "Time: {formatTime(timeSpent)}")

# 4. Page Quiz Logic
page_quiz_funcs = """  const submitPageQuiz = async () => {
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
    fetchSinglePage(studyPages.length + 1);
    setCurrentPageIndex(prev => prev + 1);
  };
"""

content = content.replace("const retakeQuiz = () => {", page_quiz_funcs + "\n  const retakeQuiz = () => {")

# 5. UI replacements
# replace if (showQuiz) with if (showFinalQuiz || showPageQuiz)
old_show_quiz = "if (showQuiz) {"
new_show_quiz = "if (showFinalQuiz) {"
content = content.replace(old_show_quiz, new_show_quiz)

# Add showPageQuiz UI logic right after it returns for showFinalQuiz
page_quiz_ui = """  if (showPageQuiz) {
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
"""
content = content.replace("  return (\n    <div className=\"study-session-container\" ref={containerRef}>", page_quiz_ui + "\n  return (\n    <div className=\"study-session-container\" ref={containerRef}>")

# 6. Content Pagination Buttons
old_pagination = """              <button 
                className="btn btn-outline"
                disabled={currentPageIndex === 0}
                onClick={() => setCurrentPageIndex(prev => prev - 1)}
              >
                <ChevronLeft size={18} style={{ marginRight: '5px' }} /> Previous Page
              </button>
              
              <span style={{ color: "var(--text-secondary)" }}>
                Page {currentPageIndex + 1} of {studyPages.length}
              </span>
              
              {currentPageIndex < studyPages.length - 1 ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentPageIndex(prev => prev + 1)}
                >
                  Next Page <ChevronRight size={18} style={{ marginLeft: '5px' }} />
                </button>
              ) : (
                <button 
                  className="btn btn-primary"
                  style={{ background: "var(--status-green)", borderColor: "var(--status-green)" }}
                  onClick={() => {
                    setShowQuiz(true);
                    fetchQuiz();
                  }}
                >
                  Take Final Quiz <CheckCircle2 size={18} style={{ marginLeft: '5px' }} />
                </button>
              )}"""

new_pagination = """              <button 
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
                    fetchPageQuiz(currentPageIndex);
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
              )}"""
content = content.replace(old_pagination, new_pagination)

# Fix loading content message
content = content.replace("Generating 4 pages of study content with Gemini...", "Generating page content with Gemini...")

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "w") as f:
    f.write(content)

