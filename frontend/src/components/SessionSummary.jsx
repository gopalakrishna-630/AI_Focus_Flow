import React from "react";
import { Modal } from "./Modal";
import { Award, BarChart3, RotateCcw } from "lucide-react";

export const SessionSummary = ({ isOpen, onClose, summary = {}, onViewAnalytics }) => {
  const {
    duration = 0, // seconds
    focusScore = 0,
    distractionTime = 0, // seconds
    drowsiness = "Low",
    emotion = "Focused",
    productivity = "Good"
  } = summary;

  const formatMinSec = (secVal) => {
    const mins = Math.floor(secVal / 60);
    const secs = secVal % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getProductivityColor = (r) => {
    switch (r) {
      case "Excellent": return "var(--status-green)";
      case "Good": return "var(--accent-cyan)";
      case "Moderate": return "var(--status-yellow)";
      default: return "var(--status-red)";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      <div className="summary-modal-header">
        <Award className="summary-modal-header-icon" size={48} color="var(--status-green)" />
        <h2 className="summary-modal-title">Session Completed! 🎉</h2>
        <p className="summary-modal-desc">Here's your real-time cognitive metrics profile</p>
      </div>

      <div className="summary-grid">
        <div className="summary-metric-card">
          <div className="summary-metric-label">Duration</div>
          <div className="summary-metric-val">{formatMinSec(duration)}</div>
        </div>

        <div className="summary-metric-card">
          <div className="summary-metric-label">Average Focus</div>
          <div className="summary-metric-val" style={{ color: "var(--accent-cyan)" }}>
            {focusScore}%
          </div>
        </div>

        <div className="summary-metric-card">
          <div className="summary-metric-label">Distraction</div>
          <div className="summary-metric-val" style={{ color: "var(--status-yellow)" }}>
            {formatMinSec(distractionTime)}
          </div>
        </div>

        <div className="summary-metric-card">
          <div className="summary-metric-label">Drowsiness</div>
          <div className="summary-metric-val">{drowsiness}</div>
        </div>

        <div className="summary-metric-card">
          <div className="summary-metric-label">Common Emotion</div>
          <div className="summary-metric-val">{emotion}</div>
        </div>

        <div className="summary-metric-card">
          <div className="summary-metric-label">Productivity</div>
          <div className="summary-metric-val" style={{ color: getProductivityColor(productivity) }}>
            {productivity}
          </div>
        </div>
      </div>

      <div className="modal-actions-row centered">
        <button className="btn btn-secondary" onClick={onClose}>
          <RotateCcw size={16} />
          <span>Start New Session</span>
        </button>
        <button className="btn btn-primary" onClick={onViewAnalytics}>
          <BarChart3 size={16} />
          <span>View Analytics</span>
        </button>
      </div>
    </Modal>
  );
};

export default SessionSummary;
