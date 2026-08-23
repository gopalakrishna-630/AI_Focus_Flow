import { storageService } from "./storageService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper function to safely execute fetch with a fallback to localStorage
const fetchWithFallback = async (endpoint, options = {}, fallbackAction) => {
  try {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[AI_FocusFlow API] Endpoint ${endpoint} failed. Falling back to local storage.`, error);
    return fallbackAction();
  }
};

export const api = {
  // Dashboard
  getDashboardData: async () => {
    return fetchWithFallback("/api/sessions/analytics", { method: "GET" }, () => {
      return {
        total_study_time: 0,
        average_focus_score: 0,
        total_distractions: 0,
        completed_sessions: 0,
        number_of_sessions: 0
      };
    }).then((res) => {
      // Map the Python API response to the Dashboard format
      const avgFocusScore = Math.round(res.average_focus_score || 0);
      let performanceText = "N/A";
      if (avgFocusScore >= 90) performanceText = "Excellent";
      else if (avgFocusScore >= 75) performanceText = "Good";
      else if (avgFocusScore >= 50) performanceText = "Moderate";
      else if (avgFocusScore > 0) performanceText = "Low";

      const focusTime = res.total_study_time || 0;
      const hours = Math.floor(focusTime / 3600);
      const minutes = Math.floor((focusTime % 3600) / 60);
      const focusTimeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      
      const distTime = res.total_distractions || 0;
      const distractionTimeString = `${Math.floor(distTime / 60)}m`;

      return {
        user: "Student", // Fallback, normally passed via Context
        metrics: {
          focusScore: {
            value: avgFocusScore,
            label: performanceText,
            trend: "↑",
            isTrendPositive: true
          },
          focusTime: {
            value: focusTimeString,
            label: "Total focus duration",
            trend: "↑",
            isTrendPositive: true
          },
          distraction: {
            value: distractionTimeString,
            label: "Unfocused intervals",
            trend: "↓",
            isTrendPositive: true
          },
          sessions: {
            value: res.number_of_sessions || 0,
            label: "Completed sessions",
            trend: "↑",
            isTrendPositive: true
          }
        },
        currentStatus: {
          state: "Focused",
          focusScore: avgFocusScore,
          eyeAttention: 92,
          drowsiness: "Low",
          emotion: "Neutral",
          headPosition: "Normal"
        }
      };
    });
  },

  // Focus Session Controls
  startSession: async () => {
    return fetchWithFallback("/api/session/start", { method: "POST" }, () => {
      return { status: "success", message: "Session started locally", timestamp: new Date().toISOString() };
    });
  },

  pauseSession: async () => {
    return fetchWithFallback("/api/session/pause", { method: "POST" }, () => {
      return { status: "success", message: "Session paused locally" };
    });
  },

  resumeSession: async () => {
    return fetchWithFallback("/api/session/resume", { method: "POST" }, () => {
      return { status: "success", message: "Session resumed locally" };
    });
  },

  endSession: async (sessionDetails) => {
    return fetchWithFallback("/api/session/end", {
      method: "POST",
      body: JSON.stringify(sessionDetails),
    }, () => {
      const saved = storageService.saveSession(sessionDetails);
      return { status: "success", session: sessionDetails, allSessions: saved };
    });
  },

  // Live AI Telemetry
  getAIAnalysis: async () => {
    return fetchWithFallback("/api/ai-analysis", { method: "GET" }, () => {
      // Typically generated dynamically in client view loop, this is a fallback placeholder
      return {
        faceDetected: true,
        eyesDetected: true,
        eyeAttention: 90,
        blinkRate: "Normal",
        drowsiness: "Low",
        emotion: "Focused",
        headPosition: "Normal",
        focusScore: 85
      };
    });
  },

  // Analytics
  getAnalytics: async () => {
    return fetchWithFallback("/api/analytics", { method: "GET" }, () => {
      const sessions = storageService.getSessions();
      
      // Format mock metrics or aggregate data from saved sessions
      const scoresOverTime = sessions.map((s, idx) => ({
        label: new Date(s.date).toLocaleDateString([], { month: "short", day: "numeric" }),
        score: s.focusScore
      })).reverse();
      
      const emotionDistribution = {
        Focused: 0,
        Neutral: 0,
        Happy: 0,
        Tired: 0,
        Stressed: 0
      };
      
      let totalDrowsinessLow = 0;
      let totalDrowsinessMod = 0;
      let totalDrowsinessHigh = 0;
      let totalFocusTime = 0;
      let totalDistractionTime = 0;
      
      sessions.forEach(s => {
        if (s.emotion && emotionDistribution[s.emotion] !== undefined) {
          emotionDistribution[s.emotion]++;
        } else {
          emotionDistribution["Focused"]++;
        }
        
        if (s.drowsiness === "Low") totalDrowsinessLow++;
        else if (s.drowsiness === "Moderate") totalDrowsinessMod++;
        else if (s.drowsiness === "High") totalDrowsinessHigh++;
        
        totalFocusTime += s.duration;
        totalDistractionTime += s.distractionTime;
      });
      
      return {
        scoresOverTime,
        emotionDistribution: Object.keys(emotionDistribution).map(key => ({
          emotion: key,
          count: emotionDistribution[key] || 1 // make sure it's not all zeroes
        })),
        focusVsDistraction: {
          focused: Math.round(totalFocusTime / 60),
          distracted: Math.round(totalDistractionTime / 60),
          away: sessions.length * 5 // simulated 5 mins away per session
        },
        drowsinessSummary: {
          low: totalDrowsinessLow,
          moderate: totalDrowsinessMod,
          high: totalDrowsinessHigh
        },
        dailyPerformance: [
          { day: "Mon", score: 82 },
          { day: "Tue", score: 79 },
          { day: "Wed", score: 88 },
          { day: "Thu", score: 85 },
          { day: "Fri", score: 90 },
          { day: "Sat", score: 74 },
          { day: "Sun", score: 80 }
        ]
      };
    });
  },

  // Sessions History
  getSessions: async () => {
    return fetchWithFallback("/api/sessions", { method: "GET" }, () => {
      return storageService.getSessions();
    });
  },

  deleteSession: async (id) => {
    return fetchWithFallback(`/api/sessions/${id}`, { method: "DELETE" }, () => {
      return storageService.deleteSession(id);
    });
  },

  // User Profile
  getProfile: async () => {
    return fetchWithFallback("/api/student/profile", { method: "GET" }, () => {
      return storageService.getUser();
    });
  },

  updateProfile: async (profileData) => {
    return fetchWithFallback({
      endpoint: "/api/profile",
      method: "PUT",
      body: JSON.stringify(profileData),
    }, () => {}, () => {
      storageService.saveUser(profileData);
      return { status: "success", user: profileData };
    });
  },

  // Settings
  updateSettings: async (settingsData) => {
    return fetchWithFallback({
      endpoint: "/api/settings",
      method: "PUT",
      body: JSON.stringify(settingsData),
    }, () => {}, () => {
      storageService.saveSettings(settingsData);
      return { status: "success", settings: settingsData };
    });
  }
};
