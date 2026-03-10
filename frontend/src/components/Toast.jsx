import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log('Toast:', msg),
      error: (msg) => console.error('Toast:', msg),
      warning: (msg) => console.warn('Toast:', msg),
      info: (msg) => console.info('Toast:', msg),
    };
  }
  return context;
};

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  };

  return (
    <div style={styles.container}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          style={{
            ...styles.toast,
            borderLeftColor: getBorderColor(toast.type),
            backgroundColor: getBgColor(toast.type),
          }}
          onClick={() => removeToast(toast.id)}
        >
          <span style={styles.icon}>{getIcon(toast.type)}</span>
          <span style={styles.message}>{toast.message}</span>
          <button style={styles.closeBtn} onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}>✕</button>
        </div>
      ))}
    </div>
  );
};

const getBorderColor = (type) => {
  switch (type) {
    case 'success': return '#27ae60';
    case 'error': return '#e74c3c';
    case 'warning': return '#f39c12';
    case 'info': return '#3498db';
    default: return '#666';
  }
};

const getBgColor = (type) => {
  switch (type) {
    case 'success': return '#f0fdf4';
    case 'error': return '#fef2f2';
    case 'warning': return '#fffbeb';
    case 'info': return '#eff6ff';
    default: return '#fff';
  }
};

const styles = {
  container: {
    position: 'fixed',
    top: '90px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '400px',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderLeft: '4px solid',
    cursor: 'pointer',
    animation: 'slideIn 0.3s ease',
    fontSize: '14px',
  },
  icon: {
    marginRight: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    color: '#333',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px',
    marginLeft: '8px',
  },
};

export default ToastContext;
