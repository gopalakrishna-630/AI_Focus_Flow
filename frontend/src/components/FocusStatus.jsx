import React from "react";

export const FocusStatus = ({ status = {} }) => {
  const {
    state = "Inactive", // "Focused" | "Distracted" | "Drowsy" | "Away" | "Inactive"
    focusScore = 0,
    eyeAttention = 0,
    drowsiness = "N/A",
    emotion = "N/A",
    headPosition = "N/A"
  } = status;

  const getStatusColor = (s) => {
    switch (s) {
      case "Focused":
        return {
          text: "Currently Focused",
          color: "var(--status-green)",
          bg: "var(--status-green-glow)",
          dotClass: "bg-success"
        };
      case "Distracted":
        return {
          text: "Distraction Alert",
          color: "var(--status-yellow)",
          bg: "var(--status-yellow-glow)",
          dotClass: "bg-warning"
        };
      case "Drowsy":
        return {
          text: "Drowsiness Alert",
          color: "var(--status-red)",
          bg: "var(--status-red-glow)",
          dotClass: "bg-danger"
        };
      case "Away":
        return {
          text: "User Away",
          color: "var(--accent-blue)",
          bg: "rgba(59, 130, 246, 0.15)",
          dotClass: "bg-blue"
        };
      default:
        return {
          text: "System Inactive",
          color: "var(--text-muted)",
          bg: "var(--surface-light)",
          dotClass: "bg-muted"
        };
    }
  };

  const currentTheme = getStatusColor(state);

  return (
    <div className="glass-card focus-status-card" style={cardOverrideStyle}>
      <h3 style={headerStyle}>AI Focus Status</h3>
      
      {/* Top Pulse Row */}
      <div className="status-indicator-wrapper">
        <span 
          className="status-dot-pulse" 
          style={{ 
            backgroundColor: currentTheme.color,
            boxShadow: `0 0 10px ${currentTheme.color}`
          }}
        />
        <span style={{ ...statusLabelStyle, color: currentTheme.color }}>
          {currentTheme.text}
        </span>
      </div>

      {/* Grid Values metrics */}
      <div className="focus-status-grid">
        <div className="status-metric-item">
          <div className="status-metric-label">Focus Score</div>
          <div className="status-metric-value">{state === "Inactive" ? "N/A" : `${focusScore}%`}</div>
        </div>

        <div className="status-metric-item">
          <div className="status-metric-label">Eye Attention</div>
          <div className="status-metric-value">{state === "Inactive" ? "N/A" : `${eyeAttention}%`}</div>
        </div>

        <div className="status-metric-item">
          <div className="status-metric-label">Drowsiness</div>
          <div 
            className="status-metric-value" 
            style={{ color: drowsiness === "High" ? "var(--status-red)" : drowsiness === "Moderate" ? "var(--status-yellow)" : undefined }}
          >
            {drowsiness}
          </div>
        </div>

        <div className="status-metric-item">
          <div className="status-metric-label">Emotion</div>
          <div className="status-metric-value">{emotion}</div>
        </div>

        <div className="status-metric-item" style={{ gridColumn: "span 2" }}>
          <div className="status-metric-label">Head Position</div>
          <div className="status-metric-value">{headPosition}</div>
        </div>
      </div>
    </div>
  );
};

const cardOverrideStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between"
};

const headerStyle = {
  fontSize: "1.1rem",
  fontWeight: "600",
  marginBottom: "16px",
  color: "var(--text-primary)"
};

const statusLabelStyle = {
  fontSize: "1rem",
  fontWeight: "700"
};

export default FocusStatus;
