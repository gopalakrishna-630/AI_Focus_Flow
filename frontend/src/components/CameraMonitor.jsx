import React, { useEffect, useRef } from "react";
import { Camera, CameraOff, AlertCircle, Loader2 } from "lucide-react";

export const CameraMonitor = ({ stream, cameraActive, permissionError, loading }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="webcam-container">
      {/* 1. Loading state spinner */}
      {loading && (
        <div className="webcam-overlay">
          <Loader2 size={36} className="webcam-overlay-icon" style={{ animation: "spin 1.5s linear infinite" }} />
          <h4 className="webcam-overlay-title">Initializing Camera...</h4>
          <p className="webcam-overlay-desc">Requesting hardware capture interfaces</p>
        </div>
      )}

      {/* 2. Error warning overlay */}
      {!loading && permissionError && (
        <div className="webcam-overlay error">
          <AlertCircle size={36} className="webcam-overlay-icon" />
          <h4 className="webcam-overlay-title">Camera Permission Required</h4>
          <p className="webcam-overlay-desc">
            To enable real-time eye tracking, drowsiness indicators, and AI analysis, please grant camera permissions in your browser.
          </p>
        </div>
      )}

      {/* 3. Offline default placeholder overlay */}
      {!loading && !permissionError && !cameraActive && (
        <div className="webcam-overlay">
          <CameraOff size={36} className="webcam-overlay-icon" />
          <h4 className="webcam-overlay-title">Camera Monitoring Stopped</h4>
          <p className="webcam-overlay-desc">
            Start a tracking session to turn on camera capture and begin AI-assisted productivity monitoring.
          </p>
        </div>
      )}

      {/* 4. Active streaming media video frame */}
      {cameraActive && stream && (
        <video
          ref={videoRef}
          className="webcam-feed"
          autoPlay
          playsInline
          muted
        />
      )}

      {/* Overlay indicator when running */}
      {cameraActive && (
        <div style={liveBadgeStyle}>
          <span style={liveDotStyle} />
          <span>LIVE TRACKING</span>
        </div>
      )}
    </div>
  );
};

const liveBadgeStyle = {
  position: "absolute",
  top: "16px",
  left: "16px",
  backgroundColor: "rgba(0, 0, 0, 0.65)",
  color: "var(--status-green)",
  border: "1px solid rgba(16, 185, 129, 0.3)",
  fontSize: "0.7rem",
  fontWeight: "700",
  padding: "6px 12px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  letterSpacing: "0.05em",
  zIndex: 5
};

const liveDotStyle = {
  width: "6px",
  height: "6px",
  backgroundColor: "var(--status-green)",
  borderRadius: "50%",
  boxShadow: "0 0 6px var(--status-green)"
};

// Add rotation keyframe dynamic rule
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML += `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default CameraMonitor;
