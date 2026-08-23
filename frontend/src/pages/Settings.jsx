import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { storageService } from "../services/storageService";
import { showToast } from "../components/Toast";
import { 
  Eye, 
  Sliders, 
  Bell, 
  ShieldAlert, 
  Sun, 
  Moon, 
  Trash2, 
  RefreshCw, 
  Camera 
} from "lucide-react";

export const Settings = () => {
  const { theme, setTheme, isDark } = useTheme();
  
  // Settings local state
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    // Load local settings parameters
    const currentSettings = storageService.getSettings();
    setSettings(currentSettings);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    
    // Save locally
    const updated = {
      ...settings,
      appearance: { theme: nextTheme }
    };
    setSettings(updated);
    storageService.saveSettings(updated);
    showToast(`Visual style switched to ${nextTheme} mode.`, "success");
  };

  const handleUpdateMonitoring = (key, value) => {
    const updated = {
      ...settings,
      monitoring: {
        ...settings.monitoring,
        [key]: value
      }
    };
    setSettings(updated);
    storageService.saveSettings(updated);
    showToast("Monitoring settings saved.", "success");
  };

  const handleUpdateNotifications = (key, value) => {
    const updated = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    };
    setSettings(updated);
    storageService.saveSettings(updated);
    showToast("Alert preferences updated.", "success");
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all historical focus session logs? This action is irreversible.")) {
      storageService.clearSessions();
      showToast("All historical focus logs have been purged.", "success");
    }
  };

  const handleResetApp = () => {
    if (window.confirm("Are you sure you want to reset the application? This will wipe profile details, preferences, and session data, and reload defaults.")) {
      storageService.resetApp();
      showToast("Application data reset successfully.", "success");
      // Force app reload to sync state contexts
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  if (!settings) return null;

  return (
    <div style={{ flexGrow: 1, maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. SECTION: Theme / Appearance */}
      <section className="glass-card" style={sectionCardStyle}>
        <h3 style={sectionHeaderStyle}>
          <Eye size={20} color="var(--accent-cyan)" />
          <span>Appearance</span>
        </h3>
        <p style={sectionSubtextStyle}>Choose your preferred dashboard style theme.</p>
        
        <div style={themeTogglesStyle}>
          <button 
            type="button" 
            onClick={handleToggleTheme}
            style={{ 
              ...themeItemStyle, 
              borderColor: !isDark ? "var(--accent-cyan)" : "var(--border)",
              backgroundColor: !isDark ? "var(--surface-light)" : "transparent"
            }}
          >
            <Sun size={20} color={!isDark ? "var(--accent-cyan)" : "var(--text-secondary)"} />
            <div style={themeDetailsStyle}>
              <span style={{ fontWeight: "600", color: !isDark ? "var(--text-primary)" : "var(--text-secondary)" }}>Light Theme</span>
              <span style={themeSubStyle}>For brighter workspace settings</span>
            </div>
          </button>

          <button 
            type="button" 
            onClick={handleToggleTheme}
            style={{ 
              ...themeItemStyle, 
              borderColor: isDark ? "var(--accent-cyan)" : "var(--border)",
              backgroundColor: isDark ? "var(--surface-light)" : "transparent"
            }}
          >
            <Moon size={20} color={isDark ? "var(--accent-cyan)" : "var(--text-secondary)"} />
            <div style={themeDetailsStyle}>
              <span style={{ fontWeight: "600", color: isDark ? "var(--text-primary)" : "var(--text-secondary)" }}>Dark Theme</span>
              <span style={themeSubStyle}>Default sleek SaaS styling</span>
            </div>
          </button>
        </div>
      </section>

      {/* 2. SECTION: Monitoring Calibration */}
      <section className="glass-card" style={sectionCardStyle}>
        <h3 style={sectionHeaderStyle}>
          <Sliders size={20} color="var(--accent-blue)" />
          <span>Monitoring Calibration</span>
        </h3>
        <p style={sectionSubtextStyle}>Adjust computer vision eye-tracking thresholds.</p>

        <div style={optionsListStyle}>
          <div style={optionItemStyle}>
            <label style={checkboxLabelWrap}>
              <input
                type="checkbox"
                style={checkboxElement}
                checked={settings.monitoring.autoStart}
                onChange={(e) => handleUpdateMonitoring("autoStart", e.target.checked)}
              />
              <div>
                <div style={optionTitleStyle}>Auto-Start Monitoring</div>
                <div style={optionDescStyle}>Trigger camera stream as soon as tracking starts.</div>
              </div>
            </label>
          </div>

          <div style={{ ...optionItemStyle, flexDirection: "column", alignItems: "stretch", borderBottom: "none" }}>
            <div style={sliderLabelRow}>
              <span style={optionTitleStyle}>AI Tracking Sensitivity</span>
              <span style={sliderValStyle}>{settings.monitoring.sensitivity}%</span>
            </div>
            <p style={optionDescStyle}>Higher values raise triggers for eye distraction and drowsiness alerts.</p>
            <input
              type="range"
              min="20"
              max="100"
              style={rangeSliderStyle}
              value={settings.monitoring.sensitivity}
              onChange={(e) => handleUpdateMonitoring("sensitivity", parseInt(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* 3. SECTION: Notification Alerts */}
      <section className="glass-card" style={sectionCardStyle}>
        <h3 style={sectionHeaderStyle}>
          <Bell size={20} color="var(--accent-purple)" />
          <span>Notification & Alerts</span>
        </h3>
        <p style={sectionSubtextStyle}>Select custom dashboard audio/visual alarms.</p>

        <div style={optionsListStyle}>
          <div style={optionItemStyle}>
            <label style={checkboxLabelWrap}>
              <input
                type="checkbox"
                style={checkboxElement}
                checked={settings.notifications.productivityAlerts}
                onChange={(e) => handleUpdateNotifications("productivityAlerts", e.target.checked)}
              />
              <div>
                <div style={optionTitleStyle}>Drowsiness Audio Alarms</div>
                <div style={optionDescStyle}>Play alert sounds when persistent eye closures are triggered.</div>
              </div>
            </label>
          </div>

          <div style={optionItemStyle}>
            <label style={checkboxLabelWrap}>
              <input
                type="checkbox"
                style={checkboxElement}
                checked={settings.notifications.breakReminders}
                onChange={(e) => handleUpdateNotifications("breakReminders", e.target.checked)}
              />
              <div>
                <div style={optionTitleStyle}>Break Reminders</div>
                <div style={optionDescStyle}>Suggest brief posture adjustments after 45 minutes of tracking.</div>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* 4. SECTION: Privacy Assurance */}
      <section className="glass-card" style={sectionCardStyle}>
        <h3 style={sectionHeaderStyle}>
          <Camera size={20} color="var(--status-green)" />
          <span>Privacy & Capture Agreement</span>
        </h3>
        <p style={{ ...optionDescStyle, fontSize: "0.85rem", lineHeight: 1.4 }}>
          AI_FocusFlow respects physical privacy. All computer vision camera captures, face tracking, eye detection, and emotion telemetry are calculated and evaluated **locally on your device's browser client thread**. Under local mockup parameters, zero video telemetry leaves your network client, maintaining complete data confidentiality.
        </p>
      </section>

      {/* 5. SECTION: Danger Area */}
      <section className="glass-card" style={{ ...sectionCardStyle, borderColor: "rgba(239, 68, 68, 0.2)" }}>
        <h3 style={{ ...sectionHeaderStyle, color: "var(--status-red)" }}>
          <ShieldAlert size={20} />
          <span>Danger Zone</span>
        </h3>
        <p style={sectionSubtextStyle}>Destructive operations. Please proceed with caution.</p>

        <div style={dangerButtonsRow}>
          <button type="button" className="btn btn-secondary" style={dangerItemBtn} onClick={handleClearHistory}>
            <Trash2 size={16} />
            <span>Clear Focus History</span>
          </button>
          
          <button type="button" className="btn btn-secondary" style={{ ...dangerItemBtn, color: "var(--status-red)", borderColor: "rgba(239, 68, 68, 0.4)" }} onClick={handleResetApp}>
            <RefreshCw size={16} />
            <span>Reset App Defaults</span>
          </button>
        </div>
      </section>
    </div>
  );
};

// Styles objects
const sectionCardStyle = {
  padding: "24px"
};

const sectionHeaderStyle = {
  fontSize: "1.1rem",
  fontWeight: "600",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "4px"
};

const sectionSubtextStyle = {
  fontSize: "0.8rem",
  color: "var(--text-secondary)",
  marginBottom: "20px"
};

const themeTogglesStyle = {
  display: "flex",
  gap: "16px"
};

const themeItemStyle = {
  flex: 1,
  padding: "16px",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  textAlign: "left",
  cursor: "pointer",
  transition: "all 0.2s"
};

const themeDetailsStyle = {
  display: "flex",
  flexDirection: "column"
};

const themeSubStyle = {
  fontSize: "0.75rem",
  color: "var(--text-muted)",
  marginTop: "2px"
};

const optionsListStyle = {
  display: "flex",
  flexDirection: "column"
};

const optionItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  borderBottom: "1px solid var(--border)",
  paddingBottom: "16px",
  marginBottom: "16px"
};

const checkboxLabelWrap = {
  display: "flex",
  gap: "14px",
  alignItems: "flex-start",
  cursor: "pointer",
  width: "100%"
};

const checkboxElement = {
  marginTop: "4px",
  cursor: "pointer",
  accentColor: "var(--accent-cyan)"
};

const optionTitleStyle = {
  fontSize: "0.95rem",
  fontWeight: "600",
  color: "var(--text-primary)"
};

const optionDescStyle = {
  fontSize: "0.8rem",
  color: "var(--text-secondary)",
  marginTop: "2px"
};

const sliderLabelRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%"
};

const sliderValStyle = {
  fontSize: "1rem",
  fontWeight: "700",
  color: "var(--accent-cyan)"
};

const rangeSliderStyle = {
  width: "100%",
  marginTop: "12px",
  accentColor: "var(--accent-cyan)",
  cursor: "pointer"
};

const dangerButtonsRow = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap"
};

const dangerItemBtn = {
  fontSize: "0.85rem",
  fontWeight: "600"
};

export default Settings;
