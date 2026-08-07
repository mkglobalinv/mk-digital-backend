import React from 'react';
import './FintechComponents.css';

const StatsCard = ({ title, value, icon, trend, bg, trendColor }) => {
  return (
    <div className="fintech-stats-card" style={{ background: 'var(--bg-surface)' }}>
      <div className="stats-header">
        <div className="stats-icon-wrap" style={{ background: bg }}>
          {icon}
        </div>
        <div className="stats-trend" style={{ color: trendColor || 'var(--success)' }}>
          {trend}
        </div>
      </div>
      <div className="stats-body">
        <p className="stats-title">{title}</p>
        <h4 className="stats-value">{value}</h4>
      </div>
    </div>
  );
};

export default StatsCard;
