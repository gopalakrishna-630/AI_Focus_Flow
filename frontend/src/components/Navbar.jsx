import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Menu, Sun, Moon, Calendar, Clock } from "lucide-react";

export const Navbar = ({ toggleSidebar }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  // Clock ticks every second to keep current time live
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard": return "Dashboard";
      case "/monitor": return "Focus Monitor";
      case "/analytics": return "Performance Analytics";
      case "/history": return "Session History";
      case "/profile": return "User Profile";
      case "/settings": return "Settings";
      default: return "AI_FocusFlow";
    }
  };

  const getInitials = (name) => {
    if (!name) return "FF";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  // Format date: e.g. "Saturday, Aug 22"
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  // Format time: e.g. "3:30 PM"
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <header style={navbarStyle}>
      {/* Left items: hamburger on mobile + Title */}
      <div style={leftSectionStyle}>
        <button style={hamburgerBtnStyle} onClick={() => toggleSidebar(true)} aria-label="Open sidebar">
          <Menu size={20} />
        </button>
        <h2 style={titleStyle}>{getPageTitle()}</h2>
      </div>

      {/* Right items: clocks, themes, profile */}
      <div style={rightSectionStyle}>
        {/* Date and Time tracker widget */}
        <div style={dateTimeContainerStyle}>
          <div style={dateTimeItemStyle}>
            <Calendar size={14} color="var(--text-muted)" />
            <span>{formatDate(time)}</span>
          </div>
          <div style={dateTimeItemStyle}>
            <Clock size={14} color="var(--text-muted)" />
            <span>{formatTime(time)}</span>
          </div>
        </div>

        {/* Theme toggler */}
        <button onClick={toggleTheme} style={themeBtnStyle} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User initials bubble shortcut to profile */}
        {user && (
          <Link to="/profile" style={profileShortcutStyle} title="Go to profile">
            {getInitials(user.name)}
          </Link>
        )}
      </div>
    </header>
  );
};

// Styles for Top Navbar
const navbarStyle = {
  position: "fixed",
  top: 0,
  right: 0,
  left: 0,
  height: "var(--navbar-height)",
  backgroundColor: "var(--surface)",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 24px",
  zIndex: 900,
  paddingLeft: "calc(var(--sidebar-width) + 24px)",
  backdropFilter: "blur(8px)",
  transition: "padding-left 0.3s ease, background-color 0.3s"
};

const leftSectionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px"
};

const hamburgerBtnStyle = {
  background: "transparent",
  border: "none",
  color: "var(--text-primary)",
  cursor: "pointer",
  display: "none", // standard desktop hides this
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
  borderRadius: "8px",
  backgroundColor: "var(--surface-light)"
};

const titleStyle = {
  fontSize: "1.25rem",
  fontWeight: "700",
  color: "var(--text-primary)"
};

const rightSectionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px"
};

const dateTimeContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontSize: "0.8rem",
  fontWeight: "500",
  color: "var(--text-secondary)"
};

const dateTimeItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  backgroundColor: "var(--surface-light)",
  padding: "6px 12px",
  borderRadius: "16px",
  border: "1px solid var(--border)"
};

const themeBtnStyle = {
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
  borderRadius: "50%",
  backgroundColor: "var(--surface-light)",
  transition: "all 0.2s",
  ":hover": {
    borderColor: "var(--text-muted)"
  }
};

const profileShortcutStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "var(--accent-gradient)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.85rem",
  fontWeight: "600",
  textDecoration: "none",
  boxShadow: "0 0 8px rgba(6,182,212,0.2)"
};

// Apply responsive query tag dynamically
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML += `
    @media (max-width: 992px) {
      header {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      header button[style*="display: none"] {
        display: flex !important;
      }
      .dateTimeContainerStyle {
        display: none !important;
      }
      /* Hide date time on mobile viewport */
      header div[style*="display: flex; gap: 12px"] {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export default Navbar;
