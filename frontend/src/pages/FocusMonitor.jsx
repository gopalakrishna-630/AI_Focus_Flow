import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTimer } from "../hooks/useTimer";
import { useCamera } from "../hooks/useCamera";
import { api } from "../services/api";
import { CameraMonitor } from "../components/CameraMonitor";
import { AIAnalysis } from "../components/AIAnalysis";
import { SessionTimer } from "../components/SessionTimer";
import { SessionSummary } from "../components/SessionSummary";
import { mockAIDataPool } from "../data/mockData";
import { showToast } from "../components/Toast";
import "../styles/monitor.css";

export const FocusMonitor = () => {
  const navigate = useNavigate();
  const timer = useTimer();
  const camera = useCamera();

  // Live Simulated AI data
  const [aiData, setAIData] = useState({
    faceDetected: false,
    eyesDetected: false,
    eyeAttention: 0,
    blinkRate: "N/A",
    drowsiness: "N/A",
    emotion: "N/A",
    headPosition: "N/A",
    focusScore: 0
  });

  // Simulated metrics records for summary aggregates
  const telemetryHistoryRef = useRef([]);
  const telemetryIntervalRef = useRef(null);

  // Modal display controllers
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState({});

  // Active status text state
  const [currentStatus, setCurrentStatus] = useState("Inactive");

  const getStatusFromAI = (telemetry) => {
    if (!telemetry.faceDetected) return "Away";
    if (telemetry.drowsiness === "High" || telemetry.drowsiness === "Moderate") return "Drowsy";
    if (!telemetry.eyesDetected || telemetry.eyeAttention < 60) return "Distracted";
    return "Focused";
  };

  // Start Session handler
  const handleStartSession = async () => {
    try {
      await api.startSession();
      // 1. Request webcam access and start track
      await camera.startCamera();
      
      // 2. Clear previous logs
      telemetryHistoryRef.current = [];
      
      // 3. Start timer
      timer.startTimer();
      
      setCurrentStatus("Focused");
      showToast("Focus tracking session initialized.", "success");
    } catch (err) {
      showToast("Unable to start webcam camera.", "error");
    }
  };

  // Listen to camera status: if permission fails, stop session timer
  useEffect(() => {
    if (camera.permissionError && timer.isRunning) {
      handleEndSession(true); // silent end with clear
      showToast("Camera access denied. Session terminated.", "error");
    }
  }, [camera.permissionError]);

  // Telemetry loop manager
  useEffect(() => {
    if (timer.isRunning && camera.cameraActive && !camera.permissionError) {
      telemetryIntervalRef.current = setInterval(() => {
        // Grab random telemetry simulation from constants pool
        const randomIndex = Math.floor(Math.random() * mockAIDataPool.length);
        let sample = { ...mockAIDataPool[randomIndex] };

        // Force user away if camera gets offline, but since camera is active we randomize
        // Let's slightly weight towards focused parameters (80% focused, 20% distract/away/drowsy)
        const biasWeight = Math.random();
        if (biasWeight < 0.7) {
          // Force active focus state
          sample = {
            faceDetected: true,
            eyesDetected: true,
            eyeAttention: Math.floor(Math.random() * 11) + 88, // 88-98%
            blinkRate: "Normal",
            drowsiness: "Low",
            emotion: "Focused",
            headPosition: "Normal",
            focusScore: Math.floor(Math.random() * 11) + 85 // 85-95
          };
        }

        setAIData(sample);
        const derivedStatus = getStatusFromAI(sample);
        setCurrentStatus(derivedStatus);
        
        // Log telemetry sample to history ref
        telemetryHistoryRef.current.push({
          ...sample,
          statusState: derivedStatus,
          timestamp: Date.now()
        });

        // Trigger warning alerts on specific states
        if (derivedStatus === "Drowsy") {
          showToast("Drowsiness alert: Face drift detected. Stretch your eyes!", "warning");
        } else if (derivedStatus === "Distracted") {
          showToast("Focus alert: Eye deviation detected. Lock back in!", "info");
        }
      }, 1500);
    } else {
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
      }
    }

    return () => {
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
      }
    };
  }, [timer.isRunning, camera.cameraActive]);

  // Pause session handler
  const handlePauseSession = async () => {
    await api.pauseSession();
    timer.pauseTimer();
    setCurrentStatus("Inactive");
    showToast("Session tracking paused.", "info");
  };

  // Resume session handler
  const handleResumeSession = async () => {
    await api.resumeSession();
    timer.resumeTimer();
    setCurrentStatus("Focused");
    showToast("Session tracking resumed.", "info");
  };

  // End Session handler
  const handleEndSession = async (isDiscarded = false) => {
    // Stop feeds
    timer.stopTimer();
    camera.stopCamera();
    setCurrentStatus("Inactive");
    
    if (telemetryIntervalRef.current) {
      clearInterval(telemetryIntervalRef.current);
    }

    // Default resetting of stats display
    setAIData({
      faceDetected: false,
      eyesDetected: false,
      eyeAttention: 0,
      blinkRate: "N/A",
      drowsiness: "N/A",
      emotion: "N/A",
      headPosition: "N/A",
      focusScore: 0
    });

    if (isDiscarded || telemetryHistoryRef.current.length === 0) {
      timer.resetTimer();
      return;
    }

    // Compile aggregates from history logs
    const history = telemetryHistoryRef.current;
    const duration = timer.seconds;
    
    let scoreSum = 0;
    let drowsinessLow = 0;
    let drowsinessMod = 0;
    let drowsinessHigh = 0;
    let distractionTicks = 0;
    const emotionFrequency = {};

    history.forEach(sample => {
      scoreSum += sample.focusScore;
      
      if (sample.drowsiness === "Low") drowsinessLow++;
      else if (sample.drowsiness === "Moderate") drowsinessMod++;
      else if (sample.drowsiness === "High") drowsinessHigh++;
      
      if (sample.statusState === "Distracted" || sample.statusState === "Away") {
        distractionTicks++;
      }

      if (sample.emotion && sample.emotion !== "N/A") {
        emotionFrequency[sample.emotion] = (emotionFrequency[sample.emotion] || 0) + 1;
      }
    });

    const averageFocus = Math.round(scoreSum / history.length) || 0;
    const distractionSeconds = Math.round(distractionTicks * 1.5); // 1.5 seconds per tick
    
    let dominantDrowsiness = "Low";
    if (drowsinessHigh > drowsinessMod && drowsinessHigh > drowsinessLow) dominantDrowsiness = "High";
    else if (drowsinessMod > drowsinessLow) dominantDrowsiness = "Moderate";

    // Most common emotion
    let commonEmotion = "Focused";
    let maxEmotionCount = 0;
    Object.keys(emotionFrequency).forEach(emo => {
      if (emotionFrequency[emo] > maxEmotionCount) {
        maxEmotionCount = emotionFrequency[emo];
        commonEmotion = emo;
      }
    });

    // Productivity rating
    let productivity = "Moderate";
    if (averageFocus >= 90) productivity = "Excellent";
    else if (averageFocus >= 75) productivity = "Good";
    else if (averageFocus >= 50) productivity = "Moderate";
    else productivity = "Low";

    const sessionSummary = {
      id: "session-" + Date.now(),
      date: new Date().toISOString(),
      duration,
      focusScore: averageFocus,
      distractionTime: distractionSeconds,
      drowsiness: dominantDrowsiness,
      emotion: commonEmotion,
      productivity,
      status: "Completed"
    };

    // Save end session to LocalStorage via API
    await api.endSession(sessionSummary);
    
    // Set summary states and display Modal
    setSummaryData(sessionSummary);
    setSummaryModalOpen(true);
    showToast("Focus tracking session saved successfully.", "success");
  };

  const handleCloseSummary = () => {
    setSummaryModalOpen(false);
    timer.resetTimer();
  };

  const handleRedirectAnalytics = () => {
    setSummaryModalOpen(false);
    timer.resetTimer();
    navigate("/analytics");
  };

  return (
    <div style={{ flexGrow: 1 }}>
      <div className="monitor-grid">
        {/* Left Side: Cam feed and session timer controls */}
        <div>
          <CameraMonitor
            stream={camera.stream}
            cameraActive={camera.cameraActive}
            permissionError={camera.permissionError}
            loading={camera.loading}
          />
          <SessionTimer
            timerState={timer.timerState}
            formatTime={timer.formatTime}
            onStart={handleStartSession}
            onPause={handlePauseSession}
            onResume={handleResumeSession}
            onEnd={() => handleEndSession(false)}
            focusScore={aiData.focusScore}
            statusText={currentStatus}
          />
        </div>

        {/* Right Side: AI Telemetry dashboard displays */}
        <div>
          <AIAnalysis aiData={aiData} />
        </div>
      </div>

      {/* Post-Session Summary Modal */}
      <SessionSummary
        isOpen={summaryModalOpen}
        onClose={handleCloseSummary}
        summary={summaryData}
        onViewAnalytics={handleRedirectAnalytics}
      />
    </div>
  );
};

export default FocusMonitor;
