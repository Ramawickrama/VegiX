import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';
import PageLayout from '../components/PageLayout';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { SkeletonCard, SkeletonText } from '../components/Skeleton';
import '../styles/Dashboard.css';
import '../styles/ViewOrders.css';
import '../components/StatCard.css';
import '../components/Card.css';
import '../components/Button.css';
import { useSocket } from '../contexts/SocketContext';

const initialDashboardState = {
  success: false,
  stats: {
    totalIncome: 0,
    completedOrders: 0,
    activeSellingPosts: 0,
    pendingBrokerOffers: 0,
    unreadNotifications: 0
  },
  marketPrices: [],
  notices: []
};

const FarmerDashboardContent = ({ user }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(initialDashboardState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboard();
  }, [user, navigate, refreshKey]);

  const { subscribe, joinMarketRoom } = useSocket();

  useEffect(() => {
    // Listen for real-time market price updates via context
    const cleanup = subscribe('market_price_updated', () => {
      console.log('⚡ Market prices updated, refreshing dashboard...');
      fetchDashboard();
    });

    // Ensure we are in the market prices room
    joinMarketRoom();

    return cleanup;
  }, [subscribe, joinMarketRoom]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await API.get('/farmer/dashboard', { signal: controller.signal });
      clearTimeout(timeoutId);

      const responseData = res?.data;

      if (responseData && typeof responseData === 'object') {
        setDashboard({
          success: responseData.success === true,
          stats: {
            totalIncome: Number(responseData?.stats?.totalIncome) || 0,
            completedOrders: Number(responseData?.stats?.completedOrders) || 0,
            activeSellingPosts: Number(responseData?.stats?.activeSellingPosts) || 0,
            pendingBrokerOffers: Number(responseData?.stats?.pendingBrokerOffers) || 0,
            unreadNotifications: Number(responseData?.stats?.unreadNotifications) || 0
          },
          marketPrices: Array.isArray(responseData?.marketPrices) ? responseData.marketPrices : [],
          notices: Array.isArray(responseData?.notices) ? responseData.notices.slice(0, 5) : []
        });
      } else {
        setDashboard(initialDashboardState);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      const errorMessage = err.name === 'AbortError' || err.code === 'ECONNABORTED'
        ? t('errors.timeout')
        : err.response?.data?.message || t('errors.failedToLoad');
      setError(errorMessage);
      setDashboard(initialDashboardState);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const QuickActions = () => (
    <div className="content-section">
      <h2>Quick Actions</h2>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/farmer/publish-order')}
          style={{
            padding: '15px 25px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Publish New Order
        </button>
        <button
          onClick={() => navigate('/farmer/my-orders')}
          style={{
            padding: '15px 25px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          View My Orders
        </button>
        <button
          onClick={() => navigate('/farmer/market-prices')}
          style={{
            padding: '15px 25px',
            background: '#9b59b6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Market Prices
        </button>
      </div>
    </div>
  );

  const DashboardContent = () => {
    if (loading) {
      return (
        <>
          <div className="stats-grid">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} height="100px" />
            ))}
          </div>
          <div className="content-section">
            <SkeletonText lines={2} />
          </div>
        </>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon="⚠️"
          title="Unable to load dashboard"
          message={error}
          actionLabel="Try Again"
          onAction={handleRefresh}
        />
      );
    }

    const stats = dashboard?.stats || initialDashboardState.stats;
    const marketPrices = dashboard?.marketPrices || [];
    const notices = dashboard?.notices || [];

    return (
      <>
        {/* Hero Header */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          color: 'white'
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: 'white' }}>Farmer Dashboard</h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Welcome back, {user?.name || 'Farmer'}!</p>
        </div>

        {/* Stats Cards - Modern */}
        <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <StatCard
            icon="💰"
            label="Total Earnings"
            value={`Rs ${(stats.totalIncome || 0).toLocaleString()}`}
            color="green"
          />
          <StatCard
            icon="✅"
            label="Completed Orders"
            value={stats.completedOrders || 0}
            color="blue"
          />
          <StatCard
            icon="🌱"
            label="Active Posts"
            value={stats.activeSellingPosts || 0}
            color="orange"
          />
          <StatCard
            icon="🤝"
            label="Pending Requests"
            value={stats.pendingBrokerOffers || 0}
            color="purple"
          />
        </div>

        <QuickActions />

        {/* Market Prices Table */}
        <div className="content-section">
          <h2>Today's Market Prices</h2>
          {marketPrices.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Vegetable</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Price (Rs/kg)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {marketPrices.map((price, index) => {
                    const diff = (price.currentPrice || 0) - (price.previousPrice || 0);
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: i18n.language === 'en' ? '1rem' : '1.15rem' }}>
                            {i18n.language === 'si' ? (price.nameSi || price.vegetable?.nameSi || price.vegetableName) :
                              i18n.language === 'ta' ? (price.nameTa || price.vegetable?.nameTa || price.vegetableName) :
                                (price.vegetableName || 'Unknown')}
                          </div>
                          {i18n.language === 'en' && (price.nameSi || price.nameTa || price.vegetable?.nameSi) && (
                            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                              {price.nameSi || price.vegetable?.nameSi || ''}
                              {(price.nameTa || price.vegetable?.nameTa) ? ' | ' + (price.nameTa || price.vegetable?.nameTa) : ''}
                            </div>
                          )}
                          {i18n.language !== 'en' && (
                            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '2px' }}>
                              {price.vegetableName}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold' }}>Rs {(price.currentPrice || 0).toFixed(2)}</div>
                          <div style={{ fontSize: '11px', color: '#999' }}>per {price.unit || 'kg'}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {(price.percentageChange || 0) > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span style={{ color: '#27ae60', fontWeight: 'bold' }}>↑ {(price.percentageChange || 0).toFixed(1)}%</span>
                              <span style={{ fontSize: '11px', color: '#2ecc71' }}>+Rs {diff.toFixed(2)}</span>
                            </div>
                          ) : (price.percentageChange || 0) < 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>↓ {Math.abs(price.percentageChange || 0).toFixed(1)}%</span>
                              <span style={{ fontSize: '11px', color: '#e74c3c' }}>-Rs {Math.abs(diff).toFixed(2)}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#999', fontSize: '13px' }}>--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="📊"
              title="No market prices available"
              message="Market prices will appear here once available."
            />
          )}
        </div>

        {/* Admin Notices */}
        <div className="content-section">
          <h2>Admin Notices</h2>
          {notices.length > 0 ? (
            <div className="news-feed" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {notices.map((notice, index) => (
                <div key={index} style={{
                  padding: '15px',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: notice.priority === 'high' ? '#fff5f5' : 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <h4 style={{ margin: 0 }}>{notice.title || 'No Title'}</h4>
                    {notice.priority === 'high' && (
                      <span style={{ background: '#e53e3e', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                        HIGH
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                    {notice.content || 'No content'}
                  </p>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📢"
              title="No notices from admin"
              message="System announcements will appear here."
            />
          )}
        </div>
      </>
    );
  };

  return (
    <PageLayout
      title="Farmer Dashboard"
      subtitle={`Welcome back, ${user?.name || 'Farmer'}!`}
      loading={false}
      error={null}
      onRetry={handleRefresh}
    >
      <DashboardContent />
    </PageLayout>
  );
};

const FarmerDashboard = (props) => (
  <ErrorBoundary>
    <FarmerDashboardContent {...props} />
  </ErrorBoundary>
);

export default FarmerDashboard;
