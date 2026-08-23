import { useState, useEffect, useRef } from "react";

export const useTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const [timerState, setTimerState] = useState("IDLE"); // "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED"
  const intervalRef = useRef(null);

  const startTimer = () => {
    setSeconds(0);
    setTimerState("RUNNING");
  };

  const pauseTimer = () => {
    if (timerState === "RUNNING") {
      setTimerState("PAUSED");
    }
  };

  const resumeTimer = () => {
    if (timerState === "PAUSED") {
      setTimerState("RUNNING");
    }
  };

  const stopTimer = () => {
    setTimerState("COMPLETED");
  };

  const resetTimer = () => {
    setSeconds(0);
    setTimerState("IDLE");
  };

  useEffect(() => {
    if (timerState === "RUNNING") {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState]);

  // Formats seconds to hh:mm:ss
  const formatTime = () => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0")
    ].join(":");
  };

  return {
    seconds,
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    formatTime,
    isIdle: timerState === "IDLE",
    isRunning: timerState === "RUNNING",
    isPaused: timerState === "PAUSED",
    isCompleted: timerState === "COMPLETED"
  };
};
export default useTimer;
