import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../components/Toast";
import { User, Mail, Lock, Activity, Loader2 } from "lucide-react";

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Validation errors state
  const [errors, setErrors] = useState({});

  const validate = () => {
    const localErrors = {};
    if (!fullName.trim()) {
      localErrors.fullName = "Full name is required.";
    }
    
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
    
    if (password !== confirmPassword) {
      localErrors.confirmPassword = "Passwords do not match.";
    }
    
    setErrors(localErrors);
    return Object.keys(localErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    const result = await register(fullName, email, password);
    setLoading(false);
    
    if (result.success) {
      showToast("Account registered successfully! Please log in.", "success");
      navigate("/login");
    } else {
      showToast(result.error || "Registration failed.", "error");
    }
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
          <p style={brandSubStyle}>Create a free account to monitor and improve your focus.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name field */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <div style={inputContainerStyle}>
              <User size={18} style={fieldIconStyle} />
              <input
                id="fullName"
                type="text"
                className="form-control"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputFieldStyle}
              />
            </div>
            {errors.fullName && <span style={errorTextStyle}>{errors.fullName}</span>}
          </div>

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
                type="password"
                className="form-control"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputFieldStyle}
              />
            </div>
            {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
          </div>

          {/* Confirm Password field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={inputContainerStyle}>
              <Lock size={18} style={fieldIconStyle} />
              <input
                id="confirmPassword"
                type="password"
                className="form-control"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputFieldStyle}
              />
            </div>
            {errors.confirmPassword && <span style={errorTextStyle}>{errors.confirmPassword}</span>}
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
              "Register Account"
            )}
          </button>
        </form>

        {/* Path to Login */}
        <div style={footerTextStyle}>
          Already have an account?{" "}
          <Link to="/login" style={linkRedirectStyle}>
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

// Styles for Register screen
const pageStyle = {
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.05) 0%, rgba(9, 10, 15, 1) 90%)",
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
  backgroundColor: "rgba(139, 92, 246, 0.1)",
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
  paddingLeft: "42px"
};

const errorTextStyle = {
  display: "block",
  fontSize: "0.75rem",
  color: "var(--status-red)",
  marginTop: "6px",
  fontWeight: "500"
};

const submitBtnStyle = {
  width: "100%",
  padding: "12px",
  fontSize: "1rem",
  marginTop: "16px"
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

export default Register;
