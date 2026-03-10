import React from 'react';
import './StatCard.css';

const StatCard = ({ 
  icon, 
  label, 
  value, 
  trend, 
  trendValue,
  color = 'green',
  gradient,
  className = '',
  onClick
}) => {
  const colorMap = {
    green: { bg: '#d1fae5', text: '#10b981' },
    blue: { bg: '#dbeafe', text: '#3b82f6' },
    orange: { bg: '#fef3c7', text: '#f59e0b' },
    purple: { bg: '#ede9fe', text: '#8b5cf6' },
    pink: { bg: '#fce7f3', text: '#ec4899' },
    red: { bg: '#fee2e2', text: '#ef4444' },
  };

  const colors = colorMap[color] || colorMap.green;

  return (
    <div 
      className={`stat-card ${gradient ? 'stat-card-gradient' : ''} ${onClick ? 'clickable' : ''} ${className}`}
      style={{
        '--card-accent': colors.text,
        '--card-gradient-start': gradient?.[0],
        '--card-gradient-end': gradient?.[1],
      }}
      onClick={onClick}
    >
      <div 
        className={`stat-card-icon ${color}`}
        style={{ background: gradient ? 'rgba(255,255,255,0.2)' : colors.bg }}
      >
        {icon}
      </div>
      <p className="stat-label" style={{ color: gradient ? 'rgba(255,255,255,0.8)' : '#6b7280' }}>
        {label}
      </p>
      <h3 className="stat-value" style={{ color: gradient ? 'white' : '#1f2937' }}>
        {value}
      </h3>
      {trend && (
        <div 
          className="stat-trend"
          style={{ 
            color: trend === 'up' ? (gradient ? 'white' : '#10b981') : (gradient ? 'white' : '#ef4444'),
            background: gradient ? 'rgba(255,255,255,0.2)' : (trend === 'up' ? '#d1fae5' : '#fee2e2'),
          }}
        >
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </div>
      )}
    </div>
  );
};

export default StatCard;
