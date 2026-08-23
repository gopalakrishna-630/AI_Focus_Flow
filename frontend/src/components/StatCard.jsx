import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export const StatCard = ({ icon, value, label, subtitle, trend, isTrendPositive, iconColor = "cyan" }) => {
  return (
    <div className="glass-card stat-card">
      <div className={`stat-card-icon ${iconColor}`}>
        {icon}
      </div>
      <div className="stat-card-info">
        <div style={labelStyle}>{label}</div>
        <div className="stat-card-value">{value}</div>
        {subtitle && <div style={subStyle}>{subtitle}</div>}
        {trend && (
          <div className={`stat-card-trend ${isTrendPositive ? "up" : "down"}`}>
            {isTrendPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const labelStyle = {
  fontSize: "0.8rem",
  color: "var(--text-secondary)",
  fontWeight: "500",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  marginBottom: "2px"
};

const subStyle = {
  fontSize: "0.8rem",
  fontWeight: "600",
  color: "var(--text-primary)",
  marginBottom: "4px"
};

export default StatCard;
