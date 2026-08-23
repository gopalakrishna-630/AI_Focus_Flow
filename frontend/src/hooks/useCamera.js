import { useState, useEffect, useCallback, useRef } from "react";

export const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [loading, setLoading] = useState(false);
  const activeStreamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      activeStreamRef.current = null;
    }
    setStream(null);
    setCameraActive(false);
    setLoading(false);
  }, []);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setPermissionError(false);
    
    // Stop any existing tracks before initializing a new stream
    stopCamera();

    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false // We do not need audio tracking
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      activeStreamRef.current = mediaStream;
      setCameraActive(true);
      setPermissionError(false);
    } catch (err) {
      console.error("[useCamera] Camera start permission denied or unavailable:", err);
      setPermissionError(true);
      setStream(null);
      setCameraActive(false);
    } finally {
      setLoading(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    // Cleanup webcam stream when component unmounts
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  return {
    stream,
    cameraActive,
    permissionError,
    loading,
    startCamera,
    stopCamera
  };
};

export default useCamera;
