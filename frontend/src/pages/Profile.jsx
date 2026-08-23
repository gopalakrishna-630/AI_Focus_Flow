import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { showToast } from "../components/Toast";
import { Modal } from "../components/Modal";
import { User, Mail, Award, Clock, Activity, Calendar, Pencil, Loader2 } from "lucide-react";

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit profile form
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      const sessions = await api.getSessions();
      
      // Calculate aggregates
      const totalSessions = sessions.length;
      let totalFocusSeconds = 0;
      let bestScore = 0;
      let scoreSum = 0;

      sessions.forEach(s => {
        totalFocusSeconds += s.duration;
        scoreSum += s.focusScore;
        if (s.focusScore > bestScore) bestScore = s.focusScore;
      });

      const avgFocus = totalSessions > 0 ? Math.round(scoreSum / totalSessions) : 0;
      const hrs = Math.floor(totalFocusSeconds / 3600);
      const mins = Math.floor((totalFocusSeconds % 3600) / 60);
      const formattedTime = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

      setProfileData({
        ...data,
        totalSessions,
        totalFocusTime: formattedTime,
        avgFocus,
        bestScore
      });
      
      // pre-fill edit inputs
      setEditName(data.name);
      setEditEmail(data.email);
    } catch {
      showToast("Error retrieving profile details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    setEditName(profileData.name);
    setEditEmail(profileData.email);
    setIsEditOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      showToast("Name and email are required.", "warning");
      return;
    }

    setUpdating(true);
    try {
      await api.updateProfile({
        ...profileData,
        name: editName,
        email: editEmail
      });
      
      showToast("Profile details updated successfully.", "success");
      setIsEditOpen(false);
      refreshUser(); // sync headers
      loadProfile(); // refresh page metrics
    } catch {
      showToast("Error saving profile.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "FF";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  if (loading || !profileData) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <Loader2 size={32} style={{ animation: "spin 1.5s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ flexGrow: 1, maxWidth: "800px", margin: "0 auto" }}>
      {/* Top Banner Header Profile Card */}
      <div className="glass-card" style={bannerCardStyle}>
        <div style={avatarSectionStyle}>
          <div style={largeAvatarStyle}>
            {getInitials(profileData.name)}
          </div>
          <div>
            <h1 style={profileNameStyle}>{profileData.name}</h1>
            <p style={profileEmailStyle}>{profileData.email}</p>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={handleOpenEdit}>
          <Pencil size={14} />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Aggregate Metric stats grid */}
      <div style={statsGridStyle}>
        <div className="glass-card" style={metricCardStyle}>
          <Activity size={24} color="var(--accent-cyan)" />
          <div style={metricLabelStyle}>Total Sessions</div>
          <div style={metricValStyle}>{profileData.totalSessions}</div>
        </div>

        <div className="glass-card" style={metricCardStyle}>
          <Clock size={24} color="var(--accent-blue)" />
          <div style={metricLabelStyle}>Total Focus Time</div>
          <div style={metricValStyle}>{profileData.totalFocusTime}</div>
        </div>

        <div className="glass-card" style={metricCardStyle}>
          <Award size={24} color="var(--status-green)" />
          <div style={metricLabelStyle}>Average Score</div>
          <div style={metricValStyle}>{profileData.avgFocus}%</div>
        </div>

        <div className="glass-card" style={metricCardStyle}>
          <Calendar size={24} color="var(--accent-purple)" />
          <div style={metricLabelStyle}>Best Session</div>
          <div style={metricValStyle}>{profileData.bestScore}%</div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profile Details">
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="editName">Full Name</label>
            <div style={inputContainerStyle}>
              <User size={18} style={fieldIconStyle} />
              <input
                id="editName"
                type="text"
                className="form-control"
                style={inputFieldStyle}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Hansika"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="editEmail">Email Address</label>
            <div style={inputContainerStyle}>
              <Mail size={18} style={fieldIconStyle} />
              <input
                id="editEmail"
                type="email"
                className="form-control"
                style={inputFieldStyle}
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="hansika@focusflow.ai"
              />
            </div>
          </div>

          <div className="modal-actions-row" style={{ marginTop: "16px" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)} disabled={updating}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updating}>
              {updating ? <Loader2 size={16} style={{ animation: "spin 1.5s linear" }} /> : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Styles for Profile Page
const bannerCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "20px",
  marginBottom: "24px"
};

const avatarSectionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px"
};

const largeAvatarStyle = {
  width: "70px",
  height: "70px",
  borderRadius: "50%",
  background: "var(--accent-gradient)",
  color: "#ffffff",
  fontSize: "1.7rem",
  fontWeight: "700",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 0 16px rgba(6,182,212,0.3)"
};

const profileNameStyle = {
  fontSize: "1.45rem",
  fontWeight: "700",
  color: "var(--text-primary)"
};

const profileEmailStyle = {
  fontSize: "0.85rem",
  color: "var(--text-secondary)"
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "20px"
};

const metricCardStyle = {
  textAlign: "center",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px"
};

const metricLabelStyle = {
  fontSize: "0.75rem",
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  fontWeight: "500",
  letterSpacing: "0.02em"
};

const metricValStyle = {
  fontSize: "1.6rem",
  fontWeight: "700",
  color: "var(--text-primary)",
  fontFamily: "var(--font-display)"
};

const inputContainerStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center"
};

const fieldIconStyle = {
  position: "absolute",
  left: "14px",
  color: "var(--text-muted)"
};

const inputFieldStyle = {
  paddingLeft: "42px"
};

export default Profile;
