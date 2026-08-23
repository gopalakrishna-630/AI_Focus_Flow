import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { ToastContainer } from "./components/Toast";

// Pages
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { FocusMonitor } from "./pages/FocusMonitor";
import { Analytics } from "./pages/Analytics";
import { SessionHistory } from "./pages/SessionHistory";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { StudySetup } from "./pages/StudySetup";
import { StudySession } from "./pages/StudySession";
import { Materials } from "./pages/Materials";

// Import styling sheets
import "./styles/global.css";

// 1. Protected Route layout gate
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={spinnerContainerStyle}>
        <div style={spinnerStyle} />
      </div>
    );
  }

  // Redirect to login if unauthenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      {/* Persistent sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />
      
      {/* Right side page wrappers */}
      <div className="main-content">
        <Navbar toggleSidebar={setSidebarOpen} />
        <main style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// 2. Public route layout check (redirects to dashboard if already logged in)
const PublicLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={spinnerContainerStyle}>
        <div style={spinnerStyle} />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/setup" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes group */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected dashboard routes group */}
            <Route element={<ProtectedLayout />}>
              <Route path="/setup" element={<StudySetup />} />
              <Route path="/session" element={<StudySession />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/history" element={<SessionHistory />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* General redirects */}
            <Route path="*" element={<Navigate to="/setup" replace />} />
          </Routes>
          
          {/* Global toast notification system */}
          <ToastContainer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Inline Styles for startup fallback spinners
const spinnerContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  width: "100vw",
  backgroundColor: "#090a0f"
};

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid rgba(6, 182, 212, 0.1)",
  borderTop: "4px solid var(--accent-cyan)",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
};

export default App;
