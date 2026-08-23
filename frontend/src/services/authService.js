import { storageService } from "./storageService";

// Helper to simulate API network lag
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  login: async (email, password, rememberMe = false) => {
    await sleep(800); // simulate API latency
    
    // Attempt backend fetch (in future) or perform local check
    // For local mock validation:
    const registeredUsers = JSON.parse(localStorage.getItem("ai_focus_flow_registered_users") || "[]");
    
    // Check registered accounts first, or allow default Hansika account
    const foundUser = registeredUsers.find(u => u.email === email && u.password === password) || 
      (email === "hansika@focusflow.ai" && password === "password" ? { name: "Hansika", email: "hansika@focusflow.ai" } : null);

    if (foundUser) {
      const authData = {
        isAuthenticated: true,
        user: {
          name: foundUser.name,
          email: foundUser.email,
        }
      };
      
      storageService.saveAuth(authData);
      
      // Update profile name in storage if custom user logged in
      const localProfile = storageService.getUser();
      storageService.saveUser({
        ...localProfile,
        name: foundUser.name,
        email: foundUser.email
      });

      return { success: true, user: authData.user };
    }
    
    throw new Error("Invalid email or password combination.");
  },

  register: async (fullName, email, password) => {
    await sleep(1000);
    
    if (!fullName || !email || !password) {
      throw new Error("Please fill in all registration fields.");
    }

    const registeredUsers = JSON.parse(localStorage.getItem("ai_focus_flow_registered_users") || "[]");
    
    if (registeredUsers.some(u => u.email === email) || email === "hansika@focusflow.ai") {
      throw new Error("An account with this email address already exists.");
    }

    // Save newly registered user locally
    registeredUsers.push({ name: fullName, email, password });
    localStorage.setItem("ai_focus_flow_registered_users", JSON.stringify(registeredUsers));

    return { success: true, message: "Account registered successfully." };
  },

  logout: async () => {
    await sleep(300);
    storageService.clearAuth();
    return { success: true };
  },

  getCurrentUser: () => {
    const auth = storageService.getAuth();
    return auth.isAuthenticated ? auth.user : null;
  }
};
