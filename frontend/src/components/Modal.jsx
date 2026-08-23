import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden"; // lock page scrolling
      window.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const getWidth = () => {
    switch (size) {
      case "sm": return "360px";
      case "lg": return "700px";
      default: return "500px";
    }
  };

  return (
    <div style={backdropStyle} onClick={handleBackdropClick}>
      <div 
        ref={modalRef} 
        style={{ ...modalContainerStyle, maxWidth: getWidth() }}
        className="glass-card"
      >
        <div style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>{title}</h3>
          <button style={closeBtnStyle} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <div style={modalBodyStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Styles for Modal component
const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.65)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "16px",
  animation: "modal-backdrop-fade 0.2s ease-out forwards"
};

const modalContainerStyle = {
  width: "100%",
  position: "relative",
  padding: "24px",
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  boxShadow: "var(--card-shadow)",
  animation: "modal-container-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column"
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
  flexShrink: 0
};

const modalTitleStyle = {
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "var(--text-primary)"
};

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  color: "var(--text-secondary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  padding: "6px",
  borderRadius: "50%",
  transition: "background-color 0.2s, color 0.2s",
  ":hover": {
    backgroundColor: "var(--surface-light)",
    color: "var(--text-primary)"
  }
};

const modalBodyStyle = {
  overflowY: "auto",
  flexGrow: 1
};

// Append Keyframes Style tag
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML += `
    @keyframes modal-backdrop-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modal-container-enter {
      from { transform: translateY(20px) scale(0.96); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

export default Modal;
