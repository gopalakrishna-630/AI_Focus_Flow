import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Camera, 
  BarChart3, 
  History, 
  User, 
  Settings, 
  LogOut, 
  X, 
  Activity,
  FileText
} from "lucide-react";

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toggleSidebar(false); // Close drawer if open on mobile
    navigate("/login");
  };

  const navItems = [
    { name: "Study Setup", path: "/setup", icon: <Activity size={20} /> },
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Analytics", path: "/analytics", icon: <BarChart3 size={20} /> },
    { name: "Session History", path: "/history", icon: <History size={20} /> },
    { name: "Materials", path: "/materials", icon: <FileText size={20} /> },
    { name: "Profile", path: "/profile", icon: <User size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> }
  ];

  const getInitials = (name) => {
    if (!name) return "FF";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div style={mobileBackdropStyle} onClick={() => toggleSidebar(false)} />
      )}

      <aside style={{ ...sidebarStyle, transform: isOpen ? "translateX(0)" : undefined }}>
        {/* Logo and close icon */}
        <div style={logoContainerStyle}>
          <div style={logoWrapperStyle}>
            <Activity className="logo-pulse-icon" size={24} color="var(--accent-cyan)" />
            <span style={logoTextStyle}>AI_FocusFlow</span>
          </div>
          <button style={closeBtnStyle} onClick={() => toggleSidebar(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <nav style={navLinksStyle}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => toggleSidebar(false)} // Close menu drawer on link click
              style={({ isActive }) => ({
                ...linkStyle,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                backgroundColor: isActive ? "var(--surface-light)" : "transparent",
                borderLeft: isActive ? "3px solid var(--accent-cyan)" : "3px solid transparent",
                paddingLeft: isActive ? "17px" : "20px"
              })}
            >
              <span style={linkIconStyle}>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer info & logout */}
        <div style={footerStyle}>
          {user && (
            <div style={userSummaryStyle}>
              <div style={avatarStyle}>
                {getInitials(user.name)}
              </div>
              <div style={userTextWrapStyle}>
                <span style={userNameStyle}>{user.name}</span>
                <span style={userEmailStyle}>{user.email}</span>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={logoutBtnStyle}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// Styles for Sidebar
const sidebarStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "var(--sidebar-width)",
  height: "100vh",
  backgroundColor: "var(--surface)",
  borderRight: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  zIndex: 1000,
  transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
};

const mobileBackdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(2px)",
  zIndex: 999,
  animation: "modal-backdrop-fade 0.2s ease"
};

const logoContainerStyle = {
  height: "var(--navbar-height)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
  borderBottom: "1px solid var(--border)",
  flexShrink: 0
};

const logoWrapperStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const logoTextStyle = {
  fontFamily: "var(--font-display)",
  fontWeight: "700",
  fontSize: "1.2rem",
  color: "var(--text-primary)",
  letterSpacing: "-0.01em"
};

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  color: "var(--text-secondary)",
  cursor: "pointer",
  display: "none", // standard desktop hides this
  alignItems: "center",
  padding: "4px",
  borderRadius: "4px"
};

const navLinksStyle = {
  flexGrow: 1,
  padding: "24px 0",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  overflowY: "auto"
};

const linkStyle = {
  display: "flex",
  alignItems: "center",
  padding: "12px 20px",
  fontSize: "0.9rem",
  fontWeight: "500",
  textDecoration: "none",
  transition: "all 0.2s"
};

const linkIconStyle = {
  marginRight: "12px",
  display: "flex",
  alignItems: "center"
};

const footerStyle = {
  padding: "20px 24px",
  borderTop: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  flexShrink: 0
};

const userSummaryStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const avatarStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "var(--accent-gradient)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.85rem",
  fontWeight: "600"
};

const userTextWrapStyle = {
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
};

const userNameStyle = {
  fontSize: "0.85rem",
  fontWeight: "600",
  color: "var(--text-primary)",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  overflow: "hidden"
};

const userEmailStyle = {
  fontSize: "0.75rem",
  color: "var(--text-muted)",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  overflow: "hidden"
};

const logoutBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  width: "100%",
  padding: "10px",
  backgroundColor: "transparent",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--status-red)",
  fontSize: "0.85rem",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s"
};

// Dynamic style appending for pulse
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML += `
    .logo-pulse-icon {
      animation: logo-pulse 2s infinite;
    }
    @keyframes logo-pulse {
      0% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(6,182,212,0.4)); }
      50% { transform: scale(1.1); filter: drop-shadow(0 0 8px rgba(6,182,212,0.7)); }
      100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(6,182,212,0.4)); }
    }
    @media (max-width: 992px) {
      aside {
        transform: translateX(-100%);
      }
      aside button[style*="display: none"] {
        display: flex !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export default Sidebar;
