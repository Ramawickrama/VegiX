import React from 'react';
import './EmptyState.css';

const EmptyState = ({
  icon = '📭',
  title = 'Nothing here yet',
  message = 'There are no items to display.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      
      {actionLabel && onAction && (
        <button className="btn-empty-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      
      {secondaryActionLabel && onSecondaryAction && (
        <button className="btn-empty-secondary" onClick={onSecondaryAction}>
          {secondaryActionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
