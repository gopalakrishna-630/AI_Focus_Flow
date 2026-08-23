import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Target, Clock, Zap, Loader2 } from "lucide-react";
import "../styles/study.css";

export const StudySetup = () => {
  const [concept, setConcept] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [incompleteSession, setIncompleteSession] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const saved = localStorage.getItem("incompleteSession");
    if (saved) {
      try {
        setIncompleteSession(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleGeneratePreview = async () => {
    if (!concept.trim()) return;
    setLoading(true);
    
    try {
      // Import the API_URL from env or hardcode fallback
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/ai/create-session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept })
      });
      
      if (!response.ok) throw new Error("Failed to generate plan");
      
      const data = await response.json();
      setPreview(data);
    } catch (err) {
      console.error(err);
      // Fallback
      setPreview({
        concept: concept,
        estimatedTime: 45,
        modules: [
          "Introduction & Core Principles",
          "Advanced Mechanisms",
          "Practical Applications & Quiz"
        ],
        distractionThreshold: "High Sensitivity"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = () => {
    // Clear any previous incomplete sessions since we are starting a new one
    localStorage.removeItem("incompleteSession");
    navigate("/session", { state: { config: preview } });
  };

  const handleResumeSession = () => {
    navigate("/session", { state: { config: incompleteSession.config, resumeTime: incompleteSession.timeLeft } });
  };

  return (
    <div className="study-setup-container">
      <div className="setup-card">
        <h1 className="setup-title">What do you want to learn today?</h1>
        
        {incompleteSession && !preview && !loading && (
          <div className="glass-card" style={{ marginBottom: "2rem", border: "1px solid var(--accent-cyan)", padding: "1.5rem" }}>
            <h3 style={{ color: "var(--accent-cyan)", marginTop: 0 }}>You have an incomplete session!</h3>
            <p style={{ color: "var(--text-secondary)" }}>Concept: <strong>{incompleteSession.config?.concept}</strong></p>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Time remaining: {Math.floor(incompleteSession.timeLeft / 60)} minutes</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: "1rem", fontSize: "1.1rem", background: "var(--accent-purple)" }}
                onClick={handleResumeSession}
              >
                <Target size={20} style={{ marginRight: "8px" }} />
                Resume {incompleteSession.config?.concept}
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: "1rem", fontSize: "1.1rem" }}
                onClick={() => setIncompleteSession(null)}
              >
                <Zap size={20} style={{ marginRight: "8px" }} />
                Create New Session
              </button>
            </div>
          </div>
        )}

        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Enter a concept, and our AI will create a personalized, focused study plan.
        </p>
        
        <input 
          type="text"
          className="concept-input"
          placeholder="e.g. Quantum Computing, React Hooks, Cellular Respiration..."
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGeneratePreview()}
          disabled={loading || preview}
        />

        {!preview && !loading && (
          <button 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
            onClick={handleGeneratePreview}
            disabled={!concept.trim()}
          >
            <Zap size={20} style={{ marginRight: "8px" }} />
            Generate Study Plan
          </button>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", color: "var(--accent-cyan)" }}>
            <Loader2 size={32} className="logo-pulse-icon" style={{ animation: "spin 1s linear infinite" }} />
            <p>Analyzing knowledge graph and preparing modules...</p>
          </div>
        )}

        {preview && (
          <div className="preview-box">
            <h3><Target size={20} /> Study Plan Preview</h3>
            <div style={{ margin: "1rem 0", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Topic:</span>
                <strong>{preview.concept}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}><Clock size={16} style={{ verticalAlign: "middle" }}/> Estimated Time:</span>
                <strong>{preview.estimatedTime} mins</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Face Det./Distraction:</span>
                <strong>{preview.distractionThreshold}</strong>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <span style={{ color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Modules:</span>
                <ul style={{ paddingLeft: "20px", margin: 0, color: "var(--text-primary)" }}>
                  {preview.modules.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            </div>
            
            <p style={{ fontSize: "0.9rem", color: "var(--status-red)", margin: "1.5rem 0", textAlign: "center" }}>
              Note: Once started, you must remain in full-screen mode until completion. Exiting early will discontinue the session.
            </p>

            <button 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", background: "var(--status-green)" }}
              onClick={handleStartSession}
            >
              <BookOpen size={20} style={{ marginRight: "8px" }} />
              Start Full-Screen Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudySetup;
