import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const Navbar = ({ user, onLogout, onMenuToggle }) => {
  const { t } = useTranslation();
  const socketContext = useSocket() || { 
    isConnected: false, 
    unreadCount: 0, 
    notifications: [], 
    clearNotifications: () => {}, 
    removeNotification: () => {} 
  };
  const { isConnected, unreadCount, notifications, clearNotifications, removeNotification } = socketContext;
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (unreadCount > 0) {
      clearNotifications();
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return t('common.justNow') || 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
      case 'order_sold':
        return '✅';
      case 'warning':
      case 'order_created':
        return '⚠️';
      case 'error':
        return '❌';
      case 'message':
        return '💬';
      case 'price':
        return '💰';
      default:
        return '📢';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <h1>🥬 VegiX</h1>
        </div>
        
        <button 
          className="mobile-menu-toggle sidebar-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '👤'}
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="navbar-user">
            <LanguageSwitcher />
            {user ? (
              <>
                <div className="connection-status" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isConnected ? '#27ae60' : '#e74c3c'
                  }}></span>
                  <span style={{ fontSize: '12px', color: isConnected ? '#27ae60' : '#e74c3c' }}>
                    {isConnected ? t('nav.live') : t('nav.offline')}
                  </span>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={handleNotificationClick}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      padding: '5px 10px',
                      position: 'relative'
                    }}
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: '#e74c3c',
                        color: 'white',
                        borderRadius: '50%',
                        fontSize: '10px',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="notifications-dropdown">
                      <div style={{
                        padding: '15px',
                        borderBottom: '1px solid #eee',
                        fontWeight: 'bold',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{t('nav.notifications')}</span>
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearNotifications}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#3498db',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {t('nav.clearAll')}
                          </button>
                        )}
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div style={{
                          padding: '30px',
                          textAlign: 'center',
                          color: '#999'
                        }}>
                          {t('nav.noNotifications')}
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((notif, index) => (
                          <div
                            key={notif._id || index}
                            style={{
                              padding: '12px 15px',
                              borderBottom: '1px solid #f0f0f0',
                              cursor: 'pointer',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start',
                              background: '#fafafa'
                            }}
                            onClick={() => removeNotification(notif._id)}
                          >
                            <span style={{ fontSize: '20px' }}>
                              {getNotificationIcon(notif.type)}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', fontSize: '14px' }}>
                                {notif.title || notif.message || 'Notification'}
                              </div>
                              {notif.message && (
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                  {notif.message.substring(0, 50)}
                                  {notif.message.length > 50 ? '...' : ''}
                                </div>
                              )}
                              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                {formatTime(notif.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                <span className="user-info">{t('common.welcome')}, {user.name}</span>
                <span className={`user-role ${user.role}`}>{user.role.toUpperCase()}</span>
                <button onClick={onLogout} className="logout-btn">{t('common.logout')}</button>
              </>
            ) : (
              <span>{t('common.notLoggedIn')}</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
