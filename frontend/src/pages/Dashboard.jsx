import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { StatCard } from "../components/StatCard";
import { FocusScore } from "../components/FocusScore";
import { FocusStatus } from "../components/FocusStatus";
import { showToast } from "../components/Toast";
import { 
  Target, 
  Clock, 
  AlertTriangle, 
  Activity, 
  HelpCircle, 
  Lightbulb, 
  Zap, 
  EyeOff, 
  Loader2 
} from "lucide-react";
import "../styles/dashboard.css";

export const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.getDashboardData();
        setData(response);
      } catch (err) {
        console.error("Dashboard loading failed:", err);
        setError("Unable to load dashboard data. Please try again.");
        showToast("Error retrieving metrics.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning";
    if (hrs < 17) return "Good afternoon";
    return "Good evening";
  };

  const getGreetingDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <Loader2 size={36} style={{ animation: "spin 1.5s linear infinite", color: "var(--accent-cyan)" }} />
        <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>Loading dashboard metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card" style={errorContainerStyle}>
        <AlertTriangle size={36} color="var(--status-red)" />
        <h3 style={{ marginTop: "12px", color: "var(--text-primary)" }}>Failed to Load Dashboard</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>{error || "Check backend connection."}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const { metrics, currentStatus } = data;

  return (
    <div style={{ flexGrow: 1 }}>
      {/* Greetings Header */}
      <div className="dashboard-header">
        <div className="dashboard-greetings">
          <h1>{getGreeting()}, {user?.name || "User"}</h1>
          <p>Here's your productivity and focus overview.</p>
        </div>
        <div className="dashboard-date">
          {getGreetingDate()}
        </div>
      </div>

      {/* Metrics Stat Cards Row */}
      <div className="stats-grid">
        <StatCard
          icon={<Target size={22} />}
          value={`${metrics.focusScore.value}%`}
          label="Focus Score"
          subtitle={metrics.focusScore.label}
          trend={metrics.focusScore.trend}
          isTrendPositive={metrics.focusScore.isTrendPositive}
          iconColor="cyan"
        />
        <StatCard
          icon={<Clock size={22} />}
          value={metrics.focusTime.value}
          label="Focus Time"
          subtitle={metrics.focusTime.label}
          trend={metrics.focusTime.trend}
          isTrendPositive={metrics.focusTime.isTrendPositive}
          iconColor="blue"
        />
        <StatCard
          icon={<AlertTriangle size={22} />}
          value={metrics.distraction.value}
          label="Distraction Time"
          subtitle={metrics.distraction.label}
          trend={metrics.distraction.trend}
          isTrendPositive={metrics.distraction.isTrendPositive}
          iconColor="purple"
        />
        <StatCard
          icon={<Activity size={22} />}
          value={metrics.sessions.value.toString()}
          label="Total Sessions"
          subtitle={metrics.sessions.label}
          trend={metrics.sessions.trend}
          isTrendPositive={metrics.sessions.isTrendPositive}
          iconColor="green"
        />
      </div>

      {/* Dashboard Main Visual Layout split */}
      <div className="dashboard-layout">
        {/* Left pane: Score gauge + tips */}
        <div>
          <FocusScore score={metrics.focusScore.value} />
          
          <div className="glass-card tips-widget">
            <h3 className="tips-title">
              <Lightbulb size={20} color="var(--accent-cyan)" />
              <span>Personalized Focus Tips</span>
            </h3>
            <div className="tips-list">
              <div className="tip-item">
                <Zap className="tip-icon" />
                <div className="tip-text">
                  <h4>Try the 45/15 rule</h4>
                  <p>Tracked sessions show your attention drops significantly after 45 minutes. Take a 15-minute breather.</p>
                </div>
              </div>
              <div className="tip-item">
                <EyeOff className="tip-icon" />
                <div className="tip-text">
                  <h4>Calibrate your lighting</h4>
                  <p>Low facial illumination detected during late-night sessions can lead to sub-optimal eye detection rates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Status tracker */}
        <div>
          <FocusStatus status={currentStatus} />
        </div>
      </div>
    </div>
  );
};

const loadingContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "60vh"
};

const errorContainerStyle = {
  textAlign: "center",
  padding: "48px 24px",
  margin: "40px auto",
  maxWidth: "500px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

export default Dashboard;
