import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../contexts/SocketContext';
import './Sidebar.css';
import API from '../services/api';

const menuIcons = {
  admin: {
    'dashboard': '📊',
    'national-analytics': '🗺️',
    'market-intelligence': '📈',
    'user-management': '👥',
    'market-prices': '💰',
    'demand-analysis': '📉',
    'future-demand': '🔮',
    'demand-forecast': '📅',
    'notice-management': '📢',
    'customer-support': '🎧',
    'published-orders': '📋',
    'transactions': '💳',
    'messages': '💬',
  },
  farmer: {
    'dashboard': '📊',
    'publish-order': '🌱',
    'my-orders': '📦',
    'broker-orders': '🤝',
    'market-prices': '💰',
    'news': '📰',
    'predicting': '🔮',
    'transactions': '💳',
    'messages': '💬',
  },
  broker: {
    'dashboard': '📊',
    'cart': '🛒',
    'market-prices': '💰',
    'my-orders': '📦',
    'buyer-demands': '🛒',
    'view-farmer-orders': '👨‍🌾',
    'publish-buy': '📥',
    'publish-sell': '📤',
    'broker-news': '📰',
    'transactions': '💳',
    'messages': '💬',
  },
  buyer: {
    'dashboard': '📊',
    'buyer-demand': '🛒',
    'buyer-broker-orders': '🏪',
    'cart': '🛒',
    'transactions': '💳',
    'messages': '💬',
  },
  'lite-admin': {
    'dashboard': '💰',
    'market-prices': '💰',
  },
};

const Sidebar = ({ userRole, onNavigate, activeMenu, isOpen }) => {
  const { t } = useTranslation();
  const [cartCount, setCartCount] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);
  const { unreadCount, unreadMessageCount, resetUnreadMessages, socket } = useSocket() || { unreadCount: 0, unreadMessageCount: 0, resetUnreadMessages: () => { }, socket: null };

  const fetchCartCount = async (role) => {
    try {
      const endpoint = role === 'broker' ? '/broker/cart/count' : '/buyer/cart/count';
      const response = await API.get(endpoint);
      if (response.data?.success) {
        setCartCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const fetchNoticeCount = async () => {
    try {
      const response = await API.get('/admin/notices/unread-count');
      if (response.data?.unreadCount !== undefined) {
        setNoticeCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notice count:', error);
    }
  };

  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      fetchNoticeCount();
      const interval = setInterval(fetchNoticeCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  useEffect(() => {
    if (socket) {
      const handleNoticeCreated = () => {
        fetchNoticeCount();
      };
      socket.on('notice_created', handleNoticeCreated);
      return () => socket.off('notice_created', handleNoticeCreated);
    }
  }, [socket]);

  useEffect(() => {
    const handleNoticeSeen = () => {
      setNoticeCount(0);
    };
    window.addEventListener('notices-marked-seen', handleNoticeSeen);
    return () => window.removeEventListener('notices-marked-seen', handleNoticeSeen);
  }, []);

  useEffect(() => {
    if (userRole === 'broker') {
      fetchCartCount('broker');
    } else if (userRole === 'buyer') {
      fetchCartCount('buyer');
    }
  }, [userRole]);

  useEffect(() => {
    if (activeMenu === 'cart') {
      fetchCartCount(userRole === 'broker' ? 'broker' : 'buyer');
    }
  }, [activeMenu, userRole]);

  const menuItems = {
    admin: [
      { label: t('sidebar.dashboard'), value: 'dashboard' },
      { label: t('sidebar.nationalAnalytics'), value: 'national-analytics' },
      { label: t('sidebar.marketIntelligence'), value: 'market-intelligence' },
      { label: t('sidebar.userManagement'), value: 'user-management' },
      { label: t('sidebar.marketPrices'), value: 'market-prices' },
      { label: t('sidebar.demandAnalysis'), value: 'demand-analysis' },
      { label: t('sidebar.futureDemand'), value: 'future-demand' },
      { label: t('sidebar.thirtyDayForecast'), value: 'demand-forecast' },
      { label: t('sidebar.noticeManagement'), value: 'notice-management' },
      { label: t('sidebar.customerSupport'), value: 'customer-support' },
      { label: t('sidebar.publishedOrders'), value: 'published-orders' },
      { label: t('sidebar.transactionHistory'), value: 'transactions' },
      { label: t('sidebar.messages'), value: 'messages' },
    ],
    farmer: [
      { label: t('sidebar.dashboard'), value: 'dashboard' },
      { label: t('sidebar.publishOrder'), value: 'publish-order' },
      { label: t('sidebar.myOrders'), value: 'my-orders' },
      { label: t('sidebar.brokerOrders'), value: 'broker-orders' },
      { label: t('sidebar.marketPrices'), value: 'market-prices' },
      { label: t('sidebar.news'), value: 'news', noticeBadge: true },
      { label: t('sidebar.predicting'), value: 'predicting' },
      { label: t('sidebar.transactionHistory'), value: 'transactions' },
      { label: t('sidebar.messages'), value: 'messages' },
    ],
    broker: [
      { label: t('sidebar.dashboard'), value: 'dashboard' },
      { label: t('sidebar.cart'), value: 'cart', badge: true },
      { label: t('sidebar.marketPrices'), value: 'market-prices' },
      { label: t('sidebar.myOrdersLower'), value: 'my-orders' },
      { label: t('sidebar.buyerDemands'), value: 'buyer-demands' },
      { label: t('sidebar.farmerPosts'), value: 'view-farmer-orders' },
      { label: t('sidebar.publishBuyOrder'), value: 'publish-buy' },
      { label: t('sidebar.publishSellOrder'), value: 'publish-sell' },
      { label: t('sidebar.brokerNews'), value: 'broker-news', noticeBadge: true },
      { label: t('sidebar.transactionHistory'), value: 'transactions' },
      { label: t('sidebar.messages'), value: 'messages' },
    ],
    buyer: [
      { label: t('sidebar.dashboard'), value: 'dashboard' },
      { label: t('sidebar.buyerDemand'), value: 'buyer-demand' },
      { label: t('sidebar.brokerOrdersTitle'), value: 'buyer-broker-orders' },
      { label: t('sidebar.myCart'), value: 'cart', badge: true },
      { label: t('sidebar.transactionHistory'), value: 'transactions' },
      { label: t('sidebar.messages'), value: 'messages' },
    ],
    'lite-admin': [
      { label: 'Market Prices', value: 'market-prices' },
    ],
  };

  const items = menuItems[userRole] || [];
  const icons = menuIcons[userRole] || {};

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <ul className="sidebar-menu">
        {items.map((item) => (
          <li key={item.value}>
            <button
              className={`sidebar-link ${activeMenu === item.value ? 'active' : ''}`}
              onClick={() => {
                if (item.value === 'messages' && resetUnreadMessages) resetUnreadMessages();
                onNavigate(item.value);
              }}
            >
              <span className="menu-icon">{icons[item.value] || '•'}</span>
              <span className="menu-label">
                {item.label}
                {item.value === 'messages' && unreadMessageCount > 0 && (
                  <span className="cart-badge" style={{ background: '#27ae60' }}>{unreadMessageCount > 9 ? '9+' : unreadMessageCount}</span>
                )}
                {item.noticeBadge && noticeCount > 0 && (
                  <span className="cart-badge" style={{ background: '#e74c3c' }}>{noticeCount > 9 ? '9+' : noticeCount}</span>
                )}
                {item.badge && item.value !== 'messages' && !item.noticeBadge && cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
