import React from 'react';
import './Skeleton.css';

export const SkeletonCard = ({ width = '100%', height = '200px' }) => {
  return (
    <div className="skeleton-card" style={{ width, height }}>
      <div className="skeleton-shimmer"></div>
    </div>
  );
};

export const SkeletonText = ({ lines = 3, width = '100%' }) => {
  return (
    <div className="skeleton-text" style={{ width }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        ></div>
      ))}
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="skeleton-table-cell header"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="skeleton-table-cell"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonChart = ({ height = '300px' }) => {
  return (
    <div className="skeleton-chart" style={{ height }}>
      <div className="skeleton-chart-bars">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-chart-bar"
            style={{ height: `${30 + Math.random() * 50}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const skeletons = Array.from({ length: count });

  switch (type) {
    case 'card':
      return (
        <div className="skeleton-container">
          {skeletons.map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    case 'table':
      return <SkeletonTable />;
    case 'chart':
      return <SkeletonChart />;
    case 'text':
      return <SkeletonText />;
    default:
      return <SkeletonCard />;
  }
};

export default LoadingSkeleton;
