import React from 'react';
import '../styles/Auth.css';

const NotFound = () => {
  return (
    <div className="auth-container">
      <div className="auth-card not-found-card">
        <h1>404</h1>
        <p className="auth-subtitle">Page Not Found</p>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/" className="btn-submit">Go Home</a>
      </div>
    </div>
  );
};

export default NotFound;
