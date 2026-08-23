import { initialSessions, initialUser, defaultSettings } from "../data/mockData";

const KEYS = {
  USER: "ai_focus_flow_user",
  AUTH: "ai_focus_flow_auth",
  SESSIONS: "ai_focus_flow_sessions",
  SETTINGS: "ai_focus_flow_settings"
};

// Check and seed default data if not present
export const initializeStorage = () => {
  if (!localStorage.getItem(KEYS.USER)) {
    localStorage.setItem(KEYS.USER, JSON.stringify(initialUser));
  }
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
  if (!localStorage.getItem(KEYS.SESSIONS)) {
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(initialSessions));
  }
};

// Immediately invoke to make sure data is present
initializeStorage();

export const storageService = {
  // Authentication
  getAuth: () => {
    try {
      const auth = localStorage.getItem(KEYS.AUTH);
      return auth ? JSON.parse(auth) : { isAuthenticated: false, user: null };
    } catch {
      return { isAuthenticated: false, user: null };
    }
  },
  
  saveAuth: (authData) => {
    localStorage.setItem(KEYS.AUTH, JSON.stringify(authData));
  },
  
  clearAuth: () => {
    localStorage.removeItem(KEYS.AUTH);
  },

  // User Profile
  getUser: () => {
    const user = localStorage.getItem(KEYS.USER);
    return user ? JSON.parse(user) : initialUser;
  },

  saveUser: (userData) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(userData));
    // Update Auth context user as well if logged in
    const auth = storageService.getAuth();
    if (auth.isAuthenticated) {
      auth.user = { ...auth.user, ...userData };
      storageService.saveAuth(auth);
    }
  },

  // Sessions
  getSessions: () => {
    const sessions = localStorage.getItem(KEYS.SESSIONS);
    return sessions ? JSON.parse(sessions) : [];
  },

  saveSession: (session) => {
    const sessions = storageService.getSessions();
    // Add new or update existing
    const index = sessions.findIndex(s => s.id === session.id);
    if (index > -1) {
      sessions[index] = session;
    } else {
      sessions.unshift(session); // Add to beginning (latest first)
    }
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
    return sessions;
  },

  deleteSession: (id) => {
    let sessions = storageService.getSessions();
    sessions = sessions.filter(s => s.id !== id);
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
    return sessions;
  },

  clearSessions: () => {
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify([]));
  },

  // Settings
  getSettings: () => {
    const settings = localStorage.getItem(KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : defaultSettings;
  },

  saveSettings: (settingsData) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settingsData));
  },

  // Global reset
  resetApp: () => {
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.AUTH);
    localStorage.removeItem(KEYS.SESSIONS);
    localStorage.removeItem(KEYS.SETTINGS);
    initializeStorage();
  }
};
