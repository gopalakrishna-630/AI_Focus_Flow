// Mock Data Generator for AI_FocusFlow Development

export const initialSessions = [
  {
    id: "session-1",
    date: "2026-08-21T10:15:00Z",
    duration: 2700, // 45 minutes in seconds
    focusScore: 88,
    distractionTime: 480, // 8 minutes in seconds
    drowsiness: "Low",
    emotion: "Focused",
    productivity: "Excellent",
    status: "Completed"
  },
  {
    id: "session-2",
    date: "2026-08-20T14:30:00Z",
    duration: 3600, // 60 minutes
    focusScore: 82,
    distractionTime: 720, // 12 minutes
    drowsiness: "Low",
    emotion: "Neutral",
    productivity: "Excellent",
    status: "Completed"
  },
  {
    id: "session-3",
    date: "2026-08-19T09:00:00Z",
    duration: 1800, // 30 minutes
    focusScore: 71,
    distractionTime: 540, // 9 minutes
    drowsiness: "Moderate",
    emotion: "Tired",
    productivity: "Moderate",
    status: "Completed"
  },
  {
    id: "session-4",
    date: "2026-08-18T16:00:00Z",
    duration: 5400, // 90 minutes
    focusScore: 92,
    distractionTime: 360, // 6 minutes
    drowsiness: "Low",
    emotion: "Focused",
    productivity: "Excellent",
    status: "Completed"
  },
  {
    id: "session-5",
    date: "2026-08-17T11:00:00Z",
    duration: 2400, // 40 minutes
    focusScore: 65,
    distractionTime: 960, // 16 minutes
    drowsiness: "Low",
    emotion: "Happy",
    productivity: "Moderate",
    status: "Completed"
  },
  {
    id: "session-6",
    date: "2026-08-16T15:00:00Z",
    duration: 3000, // 50 minutes
    focusScore: 78,
    distractionTime: 600, // 10 minutes
    drowsiness: "Moderate",
    emotion: "Neutral",
    productivity: "Good",
    status: "Completed"
  },
  {
    id: "session-7",
    date: "2026-08-15T10:00:00Z",
    duration: 4800, // 80 minutes
    focusScore: 85,
    distractionTime: 720, // 12 minutes
    drowsiness: "Low",
    emotion: "Focused",
    productivity: "Good",
    status: "Completed"
  }
];

export const initialUser = {
  name: "Hansika",
  email: "hansika@focusflow.ai",
  avatar: null, // will fall back to initials placeholder
};

export const defaultSettings = {
  appearance: {
    theme: "dark", // "dark" or "light"
  },
  monitoring: {
    cameraEnabled: true,
    autoStart: false,
    sensitivity: 70, // percentage slider
  },
  notifications: {
    sessionReminders: true,
    breakReminders: true,
    productivityAlerts: true,
  },
  privacy: {
    localProcessing: true
  }
};

export const mockAIDataPool = [
  {
    faceDetected: true,
    eyesDetected: true,
    eyeAttention: 94,
    blinkRate: "Normal",
    drowsiness: "Low",
    emotion: "Focused",
    headPosition: "Normal",
    focusScore: 89
  },
  {
    faceDetected: true,
    eyesDetected: true,
    eyeAttention: 92,
    blinkRate: "Normal",
    drowsiness: "Low",
    emotion: "Focused",
    headPosition: "Normal",
    focusScore: 87
  },
  {
    faceDetected: true,
    eyesDetected: true,
    eyeAttention: 88,
    blinkRate: "Normal",
    drowsiness: "Low",
    emotion: "Neutral",
    headPosition: "Leaning Left",
    focusScore: 82
  },
  {
    faceDetected: true,
    eyesDetected: true,
    eyeAttention: 95,
    blinkRate: "Normal",
    drowsiness: "Low",
    emotion: "Focused",
    headPosition: "Normal",
    focusScore: 92
  },
  {
    faceDetected: true,
    eyesDetected: false, // looking away
    eyeAttention: 20,
    blinkRate: "Low",
    drowsiness: "Low",
    emotion: "Neutral",
    headPosition: "Looking Right",
    focusScore: 40
  },
  {
    faceDetected: true,
    eyesDetected: true,
    eyeAttention: 65,
    blinkRate: "High",
    drowsiness: "Moderate",
    emotion: "Tired",
    headPosition: "Leaning Down",
    focusScore: 55
  },
  {
    faceDetected: true,
    eyesDetected: true,
    eyeAttention: 35,
    blinkRate: "Very Low",
    drowsiness: "High", // drowsy
    emotion: "Tired",
    headPosition: "Tilt Down",
    focusScore: 32
  },
  {
    faceDetected: true,
    eyesDetected: true,
    eyeAttention: 85,
    blinkRate: "Normal",
    drowsiness: "Low",
    emotion: "Happy",
    headPosition: "Normal",
    focusScore: 84
  },
  {
    faceDetected: false, // User away
    eyesDetected: false,
    eyeAttention: 0,
    blinkRate: "N/A",
    drowsiness: "N/A",
    emotion: "N/A",
    headPosition: "N/A",
    focusScore: 0
  }
];
