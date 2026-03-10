import React from 'react';
import './PageLayout.css';

const PageLayout = ({ 
  title, 
  subtitle, 
  children, 
  actions,
  breadcrumbs = [],
  loading = false,
  error = null,
  onRetry
}) => {
  return (
    <div className="page-layout">
      <div className="page-layout-header">
        {breadcrumbs.length > 0 && (
          <nav className="page-breadcrumbs">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="breadcrumb-separator">/</span>}
                {crumb.path ? (
                  <a href={crumb.path} className="breadcrumb-link">{crumb.label}</a>
                ) : (
                  <span className="breadcrumb-current">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        
        <div className="page-title-row">
          <div className="page-title-section">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          
          {actions && (
            <div className="page-actions">
              {actions}
            </div>
          )}
        </div>
      </div>

      <div className="page-layout-content">
        {loading ? (
          <div className="page-loading">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="page-error">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            {onRetry && (
              <button className="btn-retry" onClick={onRetry}>
                Try Again
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default PageLayout;
