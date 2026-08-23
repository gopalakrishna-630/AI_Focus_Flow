import React from "react";
import { 
  ScanFace, 
  Eye, 
  Sparkles, 
  Activity, 
  Compass, 
  Flame, 
  Smile 
} from "lucide-react";

export const AIAnalysis = ({ aiData = {} }) => {
  const {
    faceDetected = false,
    eyesDetected = false,
    eyeAttention = 0,
    blinkRate = "N/A",
    drowsiness = "N/A",
    emotion = "N/A",
    headPosition = "N/A",
    focusScore = 0
  } = aiData;

  // Mini circular SVG focus configurations
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (focusScore / 100) * circumference;

  const getScoreColor = (val) => {
    if (val >= 90) return "var(--accent-cyan)";
    if (val >= 75) return "var(--accent-blue)";
    if (val >= 50) return "var(--status-yellow)";
    return "var(--status-red)";
  };

  const getAttentionColor = (val) => {
    if (val >= 85) return "var(--status-green)";
    if (val >= 60) return "var(--status-yellow)";
    return "var(--status-red)";
  };

  return (
    <div className="glass-card ai-panel">
      <h3 style={headerStyle}>AI Analysis</h3>
      
      {/* Live Focus Meter Mini Row */}
      <div className="live-focus-score-row" style={gaugeRowStyle}>
        <div className="live-focus-gauge-wrapper">
          <div className="live-gauge-svg">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="var(--surface-light)"
                strokeWidth="6"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke={getScoreColor(focusScore)}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div className="live-gauge-number" style={{ color: getScoreColor(focusScore) }}>
              {focusScore}
            </div>
          </div>
          <div>
            <div style={gaugeLabelStyle}>Focus Index</div>
            <div style={gaugeDescStyle}>Real-time score rating</div>
          </div>
        </div>
      </div>

      {/* Metric List Key Values */}
      <div className="ai-metrics-list">
        <div className="ai-metric-row">
          <div className="ai-metric-name-wrap">
            <ScanFace size={16} />
            <span>Face Detected</span>
          </div>
          <div 
            className="ai-metric-value-wrap" 
            style={{ color: faceDetected ? "var(--status-green)" : "var(--status-red)" }}
          >
            {faceDetected ? "YES" : "NO"}
          </div>
        </div>

        <div className="ai-metric-row">
          <div className="ai-metric-name-wrap">
            <Eye size={16} />
            <span>Eyes Detected</span>
          </div>
          <div 
            className="ai-metric-value-wrap" 
            style={{ color: eyesDetected ? "var(--status-green)" : "var(--status-red)" }}
          >
            {eyesDetected ? "YES" : "NO"}
          </div>
        </div>

        <div className="ai-metric-row">
          <div className="ai-metric-name-wrap">
            <Activity size={16} />
            <span>Eye Attention</span>
          </div>
          <div 
            className="ai-metric-value-wrap" 
            style={{ color: getAttentionColor(eyeAttention) }}
          >
            {eyeAttention}%
          </div>
        </div>

        <div className="ai-metric-row">
          <div className="ai-metric-name-wrap">
            <Sparkles size={16} />
            <span>Blink Rate</span>
          </div>
          <div className="ai-metric-value-wrap">{blinkRate}</div>
        </div>

        <div className="ai-metric-row">
          <div className="ai-metric-name-wrap">
            <Flame size={16} />
            <span>Drowsiness</span>
          </div>
          <div 
            className="ai-metric-value-wrap" 
            style={{ color: drowsiness === "High" ? "var(--status-red)" : drowsiness === "Moderate" ? "var(--status-yellow)" : "var(--status-green)" }}
          >
            {drowsiness}
          </div>
        </div>

        <div className="ai-metric-row">
          <div className="ai-metric-name-wrap">
            <Smile size={16} />
            <span>Emotion</span>
          </div>
          <div className="ai-metric-value-wrap">{emotion}</div>
        </div>

        <div className="ai-metric-row">
          <div className="ai-metric-name-wrap">
            <Compass size={16} />
            <span>Head Position</span>
          </div>
          <div className="ai-metric-value-wrap">{headPosition}</div>
        </div>
      </div>
    </div>
  );
};

const headerStyle = {
  fontSize: "1.1rem",
  fontWeight: "600",
  marginBottom: "12px",
  color: "var(--text-primary)"
};

const gaugeRowStyle = {
  display: "flex",
  alignItems: "center"
};

const gaugeLabelStyle = {
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "var(--text-primary)"
};

const gaugeDescStyle = {
  fontSize: "0.75rem",
  color: "var(--text-secondary)"
};

export default AIAnalysis;
