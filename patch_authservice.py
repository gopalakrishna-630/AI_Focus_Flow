import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/services/authService.js", "r") as f:
    content = f.read()

new_content = """import { storageService } from "./storageService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const authService = {
  login: async (email, password, rememberMe = false) => {
    const response = await fetch(`${API_URL}/api/auth/student_login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      const authData = {
        isAuthenticated: true,
        user: {
          name: data.user.name,
          email: data.user.email,
        }
      };
      storageService.saveAuth(authData);
      
      const localProfile = storageService.getUser();
      storageService.saveUser({
        ...localProfile,
        name: data.user.name,
        email: data.user.email
      });
      return { success: true, user: authData.user };
    }
    
    throw new Error("Invalid email or password combination.");
  },

  register: async (fullName, email, password) => {
    if (!fullName || !email || !password) {
      throw new Error("Please fill in all registration fields.");
    }
    
    const response = await fetch(`${API_URL}/api/auth/register_student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: fullName, email, password })
    });
    
    if (response.ok) {
      return { success: true, message: "Account registered successfully." };
    }
    
    const data = await response.json();
    throw new Error(data.error || "An error occurred during registration.");
  },

  logout: async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {
      console.error(e);
    }
    storageService.clearAuth();
    return { success: true };
  },

  getCurrentUser: () => {
    const auth = storageService.getAuth();
    return auth.isAuthenticated ? auth.user : null;
  }
};
"""

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/services/authService.js", "w") as f:
    f.write(new_content)
