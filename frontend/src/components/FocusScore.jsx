import React from "react";

export const FocusScore = ({ score = 0, showDesc = true }) => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  // SVG dimensions
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Determine tiers and styling variables
  const getTierDetails = (val) => {
    if (val >= 90) {
      return {
        label: "Excellent",
        color: "var(--accent-cyan)",
        gradient: "url(#cyanGrad)",
        desc: "You are exhibiting peak focus and zero cognitive drift. Keep it up!"
      };
    } else if (val >= 75) {
      return {
        label: "Good",
        color: "var(--accent-blue)",
        gradient: "url(#blueGrad)",
        desc: "Solid attention spans with minor eye distraction. You're on track."
      };
    } else if (val >= 50) {
      return {
        label: "Moderate",
        color: "var(--status-yellow)",
        gradient: "url(#yellowGrad)",
        desc: "Signs of cognitive tiredness or physical distractions detected."
      };
    } else {
      return {
        label: "Low Focus",
        color: "var(--status-red)",
        gradient: "url(#redGrad)",
        desc: "High drowsiness alerts or constant eye evasion. Take a short break."
      };
    }
  };

  const tier = getTierDetails(normalizedScore);

  return (
    <div className="glass-card focus-score-container">
      <div className="focus-score-svg-wrapper">
        <svg className="focus-score-svg" width="160" height="160" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            className="focus-score-bg"
            cx="80"
            cy="80"
            r={radius}
          />
          {/* Progress circle */}
          <circle
            className="focus-score-fill"
            cx="80"
            cy="80"
            r={radius}
            stroke={tier.gradient}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="focus-score-text-wrapper">
          <span className="focus-score-number">
            {normalizedScore}<span className="focus-score-percent">%</span>
          </span>
          <span className="focus-score-sublabel">Score</span>
        </div>
      </div>
      
      {showDesc && (
        <>
          <div className="focus-score-tier" style={{ color: tier.color }}>
            {tier.label}
          </div>
          <p className="focus-score-desc">
            {tier.desc}
          </p>
        </>
      )}
    </div>
  );
};

export default FocusScore;
