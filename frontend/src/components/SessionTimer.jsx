import React from "react";
import { Play, Pause, Square, SkipForward } from "lucide-react";

export const SessionTimer = ({
  timerState,
  formatTime,
  onStart,
  onPause,
  onResume,
  onEnd,
  focusScore = 0,
  statusText = "Inactive"
}) => {
  const getStatusColor = (s) => {
    switch (s) {
      case "Focused": return "var(--status-green)";
      case "Distracted": return "var(--status-yellow)";
      case "Drowsy": return "var(--status-red)";
      default: return "var(--text-secondary)";
    }
  };

  return (
    <div className="glass-card timer-card">
      <div className="timer-label">Session Duration</div>
      <div className="timer-clock">{formatTime()}</div>

      {timerState !== "IDLE" && (
        <div style={detailsRowStyle}>
          <div style={detailItemStyle}>
            <span style={detailLabelStyle}>Focus Index</span>
            <span style={detailValStyle}>{focusScore}%</span>
          </div>
          <div style={detailItemStyle}>
            <span style={detailLabelStyle}>Status</span>
            <span style={{ ...detailValStyle, color: getStatusColor(statusText) }}>{statusText}</span>
          </div>
        </div>
      )}

      <div className="timer-controls-row">
        {/* State 1: IDLE */}
        {timerState === "IDLE" && (
          <button className="btn btn-primary" onClick={onStart} style={btnStretchStyle}>
            <Play size={16} />
            <span>Start Session</span>
          </button>
        )}

        {/* State 2: RUNNING */}
        {timerState === "RUNNING" && (
          <>
            <button className="btn btn-secondary" onClick={onPause}>
              <Pause size={16} />
              <span>Pause Tracking</span>
            </button>
            <button className="btn btn-danger" onClick={onEnd}>
              <Square size={16} />
              <span>End Session</span>
            </button>
          </>
        )}

        {/* State 3: PAUSED */}
        {timerState === "PAUSED" && (
          <>
            <button className="btn btn-primary" onClick={onResume}>
              <Play size={16} />
              <span>Resume Tracking</span>
            </button>
            <button className="btn btn-danger" onClick={onEnd}>
              <Square size={16} />
              <span>End Session</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const detailsRowStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "32px",
  marginBottom: "24px"
};

const detailItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

const detailLabelStyle = {
  fontSize: "0.75rem",
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  marginBottom: "4px"
};

const detailValStyle = {
  fontSize: "1.1rem",
  fontWeight: "700"
};

const btnStretchStyle = {
  minWidth: "200px"
};

export default SessionTimer;
