import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import '../styles/Dashboard.css';
import '../components/StatCard.css';
import '../components/Card.css';
import '../components/Button.css';
import { API_BASE_URL } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    farmers: 0,
    brokers: 0,
    buyers: 0,
    admins: 0,
  });
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, demandRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/user-stats`, { headers }),
        axios.get(`${API_BASE_URL}/api/admin/demand-analysis`, { headers })
      ]);

      setStats(statsRes.data);

      // Top 5 vegetables by combined supply + demand (best performers)
      const sortedDemands = (demandRes.data.demands || [])
        .map(d => ({
          name: d.vegetable?.name || 'Unknown',
          demand: d.demandQuantity || 0,
          supply: d.supplyQuantity || 0,
          total: (d.demandQuantity || 0) + (d.supplyQuantity || 0)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setMarketData(sortedDemands);

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh when page gains focus (user returns to dashboard)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) return <div className="loading">{t('dashboard.loadDashboard')}</div>;

  return (
    <div className="dashboard-container">
      {/* Hero Header */}
      <div className="dashboard-header" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: 'white' }}>
              {t('dashboard.welcome', { name: user?.name || 'Admin' })}
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>{t('dashboard.marketOverview')}</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '12px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(10px)'
            }}
          >
            {refreshing ? '⟳ Updating...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <StatCard 
          icon="🚜" 
          label={t('roles.farmer')} 
          value={stats.farmers} 
          color="green"
        />
        <StatCard 
          icon="🤝" 
          label={t('roles.broker')} 
          value={stats.brokers} 
          color="purple"
        />
        <StatCard 
          icon="🏪" 
          label={t('roles.buyer')} 
          value={stats.buyers} 
          color="blue"
        />
        <StatCard 
          icon="👥" 
          label={t('dashboard.totalUsers')} 
          value={stats.totalUsers} 
          color="orange"
        />
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

        {/* MARKET SNAPSHOT CHART */}
        <div className="card" style={{ borderTop: '4px solid #667eea' }}>
          <div className="card-header">
            <h3 className="card-header-title">
              <span>📊</span> {t('market.priceTrend')}
            </h3>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>{t('market.currentPrices')}</p>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="demand" fill="#e74c3c" name="Demand (Kg)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="supply" fill="#10b981" name="Supply (Kg)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="card" style={{ borderTop: '4px solid #10b981' }}>
          <div className="card-header">
            <h3 className="card-header-title">
              <span>⚡</span> Quick Actions
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => window.location.href = '/admin/market-prices'} 
                className="btn" style={{ justifyContent: 'flex-start', background: '#f0fdf4', color: '#166534' }}>
                💰 Update Market Prices
              </button>
              <button onClick={() => window.location.href = '/admin/notice-management'} 
                className="btn" style={{ justifyContent: 'flex-start', background: '#eff6ff', color: '#1d4ed8' }}>
                📢 Post Announcement
              </button>
              <button onClick={() => window.location.href = '/admin/user-management'} 
                className="btn" style={{ justifyContent: 'flex-start', background: '#fef3c7', color: '#b45309' }}>
                👥 Manage Users
              </button>
              <button onClick={() => window.location.href = '/admin/demand-analysis'} 
                className="btn" style={{ justifyContent: 'flex-start', background: '#f3e8ff', color: '#7c3aed' }}>
                🔮 View Forecasts
              </button>
            </div>

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '15px', color: '#374151' }}>Platform Status</h4>
              <div className="status-item">
                <span className="status-label">Database:</span>
                <span className="status-indicator active">● Online</span>
              </div>
              <div className="status-item">
                <span className="status-label">Forecaster:</span>
                <span className="status-indicator active">● Active</span>
              </div>
              <div className="status-item">
                <span className="status-label">Auto-updates:</span>
                <span className="status-indicator active">● Enabled</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
