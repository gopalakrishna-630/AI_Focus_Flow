import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../components/Toast";
import { Mail, Lock, Eye, EyeOff, Activity, Loader2 } from "lucide-react";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Validation errors state
  const [errors, setErrors] = useState({});

  const validate = () => {
    const localErrors = {};
    if (!email) {
      localErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      localErrors.email = "Please enter a valid email address.";
    }
    
    if (!password) {
      localErrors.password = "Password is required.";
    } else if (password.length < 6) {
      localErrors.password = "Password must be at least 6 characters.";
    }
    
    setErrors(localErrors);
    return Object.keys(localErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    const result = await login(email, password, rememberMe);
    setLoading(false);
    
    if (result.success) {
      showToast("Welcome back to AI_FocusFlow!", "success");
      navigate("/dashboard");
    } else {
      showToast(result.error || "Authentication failed.", "error");
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    showToast("Password reset link has been dispatched to your email address.", "info");
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle} className="glass-card">
        {/* Brand Logo header */}
        <div style={brandHeaderStyle}>
          <div style={logoIconStyle}>
            <Activity size={32} color="var(--accent-cyan)" />
          </div>
          <h1 style={brandTitleStyle}>AI_FocusFlow</h1>
          <p style={brandSubStyle}>Welcome Back. Track your productivity spans.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div style={inputContainerStyle}>
              <Mail size={18} style={fieldIconStyle} />
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputFieldStyle}
              />
            </div>
            {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
          </div>

          {/* Password field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={inputContainerStyle}>
              <Lock size={18} style={fieldIconStyle} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputFieldStyle}
              />
              <button
                type="button"
                style={eyeBtnStyle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
          </div>

          {/* Remember me & forgot row */}
          <div style={optionsRowStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Remember me</span>
            </label>
            <a href="#forgot" onClick={handleForgotPassword} style={forgotLinkStyle}>
              Forgot Password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            style={submitBtnStyle}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} style={{ animation: "spin 1.5s linear infinite" }} />
            ) : (
              "Log In"
            )}
          </button>
        </form>

        {/* Path to register */}
        <div style={footerTextStyle}>
          Don't have an account?{" "}
          <Link to="/register" style={linkRedirectStyle}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

// Styles for Login screen
const pageStyle = {
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.08) 0%, rgba(9, 10, 15, 1) 90%)",
  padding: "20px"
};

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  padding: "32px"
};

const brandHeaderStyle = {
  textAlign: "center",
  marginBottom: "32px"
};

const logoIconStyle = {
  display: "inline-flex",
  padding: "12px",
  borderRadius: "14px",
  backgroundColor: "rgba(6, 182, 212, 0.1)",
  marginBottom: "16px",
  animation: "logo-pulse 2.5s infinite"
};

const brandTitleStyle = {
  fontSize: "1.8rem",
  fontWeight: "800",
  color: "var(--text-primary)",
  marginBottom: "6px"
};

const brandSubStyle = {
  fontSize: "0.85rem",
  color: "var(--text-secondary)"
};

const inputContainerStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center"
};

const fieldIconStyle = {
  position: "absolute",
  left: "14px",
  color: "var(--text-muted)",
  pointerEvents: "none"
};

const inputFieldStyle = {
  paddingLeft: "42px",
  paddingRight: "42px"
};

const eyeBtnStyle = {
  position: "absolute",
  right: "12px",
  background: "transparent",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center"
};

const errorTextStyle = {
  display: "block",
  fontSize: "0.75rem",
  color: "var(--status-red)",
  marginTop: "6px",
  fontWeight: "500"
};

const optionsRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  margin: "24px 0",
  fontSize: "0.85rem"
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "var(--text-secondary)",
  cursor: "pointer",
  userSelect: "none"
};

const checkboxStyle = {
  cursor: "pointer",
  accentColor: "var(--accent-cyan)"
};

const forgotLinkStyle = {
  color: "var(--accent-cyan)",
  fontWeight: "500"
};

const submitBtnStyle = {
  width: "100%",
  padding: "12px",
  fontSize: "1rem"
};

const footerTextStyle = {
  textAlign: "center",
  marginTop: "24px",
  fontSize: "0.85rem",
  color: "var(--text-secondary)"
};

const linkRedirectStyle = {
  color: "var(--accent-cyan)",
  fontWeight: "600"
};

export default Login;
