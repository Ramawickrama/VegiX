import React from 'react';
import './ChartCard.css';

const ChartCard = ({ title, value, change, icon, color = '#2ecc71' }) => {
  const isPositive = change >= 0;

  return (
    <div className="chart-card" style={{ borderLeftColor: color }}>
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        <span className="chart-card-icon" style={{ color }}>
          {icon}
        </span>
      </div>
      <div className="chart-card-value">{value}</div>
      {change !== undefined && (
        <div className={`chart-card-change ${isPositive ? 'positive' : 'negative'}`}>
          <span className="change-icon">{isPositive ? '▲' : '▼'}</span>
          <span className="change-value">{Math.abs(change)}%</span>
        </div>
      )}
    </div>
  );
};

export default ChartCard;
