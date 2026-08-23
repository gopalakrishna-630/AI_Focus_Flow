import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { showToast } from "../components/Toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Loader2, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import "../styles/analytics.css";

// Register ChartJS modules globally to prevent rendering crashes
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState("7d"); // "7d" | "30d"

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const response = await api.getAnalytics();
        setAnalyticsData(response);
      } catch (err) {
        console.error("Analytics fetch failed:", err);
        setError("Unable to render analytics. Check backend link.");
        showToast("Error rendering analytics data.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <Loader2 size={36} style={{ animation: "spin 1.5s linear infinite", color: "var(--accent-cyan)" }} />
        <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>Synthesizing analytics metrics...</p>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="glass-card" style={errorContainerStyle}>
        <AlertTriangle size={36} color="var(--status-red)" />
        <h3 style={{ marginTop: "12px", color: "var(--text-primary)" }}>Failed to Load Analytics</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const { scoresOverTime, emotionDistribution, focusVsDistraction, drowsinessSummary, dailyPerformance } = analyticsData;

  // 1. Chart Options overrides
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "var(--text-secondary)",
          font: { family: "Inter", size: 11 }
        }
      },
      tooltip: {
        padding: 10,
        cornerRadius: 6,
        bodyFont: { family: "Inter" },
        titleFont: { family: "Inter" }
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "var(--text-muted)", font: { family: "Inter" } }
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "var(--text-muted)", font: { family: "Inter" } }
      }
    }
  };

  // 2. Line Chart: Focus Score Over Time
  const lineChartData = {
    labels: scoresOverTime.length > 0 ? scoresOverTime.map(s => s.label) : ["Session 1", "Session 2", "Session 3"],
    datasets: [
      {
        label: "Focus Score %",
        data: scoresOverTime.length > 0 ? scoresOverTime.map(s => s.score) : [80, 85, 90],
        borderColor: "#06b6d4",
        backgroundColor: "rgba(6, 182, 212, 0.08)",
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#ffffff",
        pointHoverRadius: 6
      }
    ]
  };

  // 3. Doughnut Chart: Focus vs Distraction
  const doughnutData = {
    labels: ["Focused Time (min)", "Distraction Time (min)", "Away Time (min)"],
    datasets: [
      {
        data: [focusVsDistraction.focused, focusVsDistraction.distracted, focusVsDistraction.away],
        backgroundColor: ["#10b981", "#fbbf24", "#3b82f6"],
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1
      }
    ]
  };

  // 4. Bar Chart: Daily Productivity
  const barChartData = {
    labels: dailyPerformance.map(d => d.day),
    datasets: [
      {
        label: "Avg Focus Score %",
        data: dailyPerformance.map(d => d.score),
        backgroundColor: "rgba(139, 92, 246, 0.75)",
        hoverBackgroundColor: "var(--accent-purple)",
        borderRadius: 6
      }
    ]
  };

  // 5. Line Chart: Drowsiness Trend
  const drowsinessChartData = {
    labels: scoresOverTime.length > 0 ? scoresOverTime.map(s => s.label) : ["Session 1", "Session 2", "Session 3"],
    datasets: [
      {
        label: "Drowsiness Alert Level (Low=1, Mod=2, High=3)",
        // Map mock levels
        data: scoresOverTime.length > 0 ? scoresOverTime.map(s => s.score > 85 ? 1 : s.score > 70 ? 2 : 3) : [1, 2, 1],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.05)",
        fill: true,
        tension: 0.2,
        pointBackgroundColor: "#ef4444"
      }
    ]
  };

  // 6. Doughnut Chart: Emotion Analysis
  const emotionChartData = {
    labels: emotionDistribution.map(e => e.emotion),
    datasets: [
      {
        data: emotionDistribution.map(e => e.count),
        backgroundColor: ["#06b6d4", "#64748b", "#10b981", "#fbbf24", "#ef4444"],
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1
      }
    ]
  };

  // Summary Metrics calculations
  const calculateAggregateStats = () => {
    if (scoresOverTime.length === 0) return { avg: 0, best: 0, time: "0h", sessions: 0 };
    let sum = 0;
    let best = 0;
    scoresOverTime.forEach(s => {
      sum += s.score;
      if (s.score > best) best = s.score;
    });

    const avg = Math.round(sum / scoresOverTime.length);
    const sessions = scoresOverTime.length;
    const focusMinutes = focusVsDistraction.focused;
    const hrs = Math.floor(focusMinutes / 60);
    const mins = focusMinutes % 60;
    const time = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    return { avg, best, time, sessions };
  };

  const aggregates = calculateAggregateStats();

  return (
    <div style={{ flexGrow: 1 }}>
      {/* Analytics controls page header */}
      <div className="analytics-header-row">
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "4px" }}>Performance Analytics</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Deep dive analysis of attention metrics and fatigue patterns.</p>
        </div>
        
        {/* Toggle Range buttons */}
        <div className="analytics-controls">
          <button 
            className={`analytics-filter-btn ${timeRange === "7d" ? "active" : ""}`}
            onClick={() => setTimeRange("7d")}
          >
            Last 7 Days
          </button>
          <button 
            className={`analytics-filter-btn ${timeRange === "30d" ? "active" : ""}`}
            onClick={() => setTimeRange("30d")}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Aggregate Cards Grid */}
      <div className="analytics-summary-grid">
        <div className="analytics-summary-card">
          <span className="analytics-summary-label">Average Focus</span>
          <span className="analytics-summary-value" style={{ color: "var(--accent-cyan)" }}>
            {aggregates.avg}%
          </span>
          <span className="analytics-summary-sub">Cognitive efficiency</span>
        </div>

        <div className="analytics-summary-card">
          <span className="analytics-summary-label">Total Focus Time</span>
          <span className="analytics-summary-value">
            {aggregates.time}
          </span>
          <span className="analytics-summary-sub">Webcam active tracking</span>
        </div>

        <div className="analytics-summary-card">
          <span className="analytics-summary-label">Best Session</span>
          <span className="analytics-summary-value" style={{ color: "var(--status-green)" }}>
            {aggregates.best}%
          </span>
          <span className="analytics-summary-sub">Personal high record</span>
        </div>

        <div className="analytics-summary-card">
          <span className="analytics-summary-label">Total Sessions</span>
          <span className="analytics-summary-value">
            {aggregates.sessions}
          </span>
          <span className="analytics-summary-sub">Completed runs</span>
        </div>

        <div className="analytics-summary-card">
          <span className="analytics-summary-label">Avg Drowsiness</span>
          <span className="analytics-summary-value" style={{ color: drowsinessSummary.high > 2 ? "var(--status-red)" : "var(--status-green)" }}>
            {drowsinessSummary.high > drowsinessSummary.moderate ? "High" : "Low"}
          </span>
          <span className="analytics-summary-sub">Fatigue frequency</span>
        </div>

        <div className="analytics-summary-card">
          <span className="analytics-summary-label">Dominant Emotion</span>
          <span className="analytics-summary-value" style={{ color: "var(--accent-purple)" }}>
            {emotionDistribution.length > 0 ? emotionDistribution[0].emotion : "Neutral"}
          </span>
          <span className="analytics-summary-sub">Average facial posture</span>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="charts-grid">
        {/* Chart 1: Focus Score Trend */}
        <div className="glass-card chart-card-wrapper">
          <div className="chart-card-title-wrap">
            <h3 className="chart-card-title">Focus Score Over Time</h3>
            <TrendingUp size={16} color="var(--accent-cyan)" />
          </div>
          <div className="chart-canvas-container">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 2: Focus vs Distraction */}
        <div className="glass-card chart-card-wrapper">
          <div className="chart-card-title-wrap">
            <h3 className="chart-card-title">Focus vs Distraction Distribution</h3>
            <Calendar size={16} color="var(--status-green)" />
          </div>
          <div className="chart-canvas-container">
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 3: Daily Productivity */}
        <div className="glass-card chart-card-wrapper">
          <div className="chart-card-title-wrap">
            <h3 className="chart-card-title">Daily Productivity Profile</h3>
          </div>
          <div className="chart-canvas-container">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 4: Emotion Distribution */}
        <div className="glass-card chart-card-wrapper">
          <div className="chart-card-title-wrap">
            <h3 className="chart-card-title">Facial Emotion Distribution</h3>
          </div>
          <div className="chart-canvas-container">
            <Doughnut data={emotionChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 5: Drowsiness Trend */}
        <div className="glass-card chart-card-wrapper" style={{ gridColumn: "span 2" }}>
          <div className="chart-card-title-wrap">
            <h3 className="chart-card-title">Session Drowsiness Trend</h3>
          </div>
          <div className="chart-canvas-container">
            <Line data={drowsinessChartData} options={chartOptions} />
          </div>
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

export default Analytics;
