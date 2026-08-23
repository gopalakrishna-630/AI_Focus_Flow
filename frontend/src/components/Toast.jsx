import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = "info", duration = 3000 }) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  useEffect(() => {
    const handleToastEvent = (e) => {
      if (e.detail) {
        addToast(e.detail);
      }
    };

    window.addEventListener("show-toast", handleToastEvent);
    return () => {
      window.removeEventListener("show-toast", handleToastEvent);
    };
  }, [addToast]);

  return (
    <div style={containerStyle}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const { id, message, type, duration } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={18} color="var(--status-green)" />;
      case "warning":
        return <AlertTriangle size={18} color="var(--status-yellow)" />;
      case "error":
        return <XCircle size={18} color="var(--status-red)" />;
      default:
        return <Info size={18} color="var(--accent-cyan)" />;
    }
  };

  return (
    <div style={{ ...itemStyle, borderLeft: `4px solid ${getBorderColor(type)}` }}>
      <div style={iconStyle}>{getIcon()}</div>
      <div style={messageStyle}>{message}</div>
      <button onClick={() => onRemove(id)} style={closeBtnStyle}>
        <X size={14} />
      </button>
    </div>
  );
};

const getBorderColor = (type) => {
  switch (type) {
    case "success": return "var(--status-green)";
    case "warning": return "var(--status-yellow)";
    case "error": return "var(--status-red)";
    default: return "var(--accent-cyan)";
  }
};

// Simple global function to trigger toasts easily from any JS/JSX file
export const showToast = (message, type = "info", duration = 3000) => {
  const event = new CustomEvent("show-toast", {
    detail: { message, type, duration }
  });
  window.dispatchEvent(event);
};

// Styling Object
const containerStyle = {
  position: "fixed",
  bottom: "24px",
  right: "24px",
  zIndex: 10000,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  maxWidth: "350px",
  width: "calc(100% - 48px)"
};

const itemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  padding: "14px 16px",
  borderRadius: "8px",
  boxShadow: "var(--card-shadow)",
  animation: "toast-fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
  overflow: "hidden"
};

const iconStyle = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center"
};

const messageStyle = {
  color: "var(--text-primary)",
  fontSize: "0.85rem",
  fontWeight: "500",
  flexGrow: 1,
  lineHeight: "1.4",
  wordBreak: "break-word"
};

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  padding: "2px",
  borderRadius: "4px",
  transition: "color 0.2s, background-color 0.2s"
};

// Append keyframes dynamic style tag to Document
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes toast-fade-in {
      from { transform: translateY(12px) scale(0.95); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

export default ToastContainer;
