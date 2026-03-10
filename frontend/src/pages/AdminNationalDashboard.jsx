import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

const AdminNationalDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/market/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDateRangeData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/market/date-range?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching date range data:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-grid"></div>
        </div>
      </div>
    );
  }

  const categoryDistribution = overview?.topVegetables?.reduce((acc, veg) => {
    const existing = acc.find(item => item.name === veg.category);
    if (existing) {
      existing.value += veg.totalSupply + veg.totalDemand;
    } else {
      acc.push({ name: veg.category || 'General', value: veg.totalSupply + veg.totalDemand });
    }
    return acc;
  }, []) || [];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>🏛️ National Market Analytics Dashboard</h1>
        <p>Comprehensive market intelligence and analytics for Sri Lanka's vegetable exchange</p>
      </div>

      <div className="page-content">
        {/* KEY METRICS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-label">Total Supply Today</div>
            <div className="stat-value">{overview?.totalSupplyToday?.toLocaleString() || 0} kg</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📥</div>
            <div className="stat-label">Total Demand Today</div>
            <div className="stat-value">{overview?.totalDemandToday?.toLocaleString() || 0} kg</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚜</div>
            <div className="stat-label">Active Farmers</div>
            <div className="stat-value">{overview?.farmerParticipation?.activeFarmers || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🤝</div>
            <div className="stat-label">Broker Transactions</div>
            <div className="stat-value">{(overview?.brokerTransactions?.totalBuyOrders || 0) + (overview?.brokerTransactions?.totalSellOrders || 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏪</div>
            <div className="stat-label">Buyer Requests</div>
            <div className="stat-value">{overview?.buyerRequests || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-label">Market Status</div>
            <div className={`stat-value ${overview?.marketStatus === 'High Demand' ? 'positive' : overview?.marketStatus === 'Oversupply' ? 'negative' : ''}`}>
              {overview?.marketStatus || 'Unknown'}
            </div>
          </div>
        </div>

        {/* SUPPLY VS DEMAND CHART */}
        <div className="data-card">
          <h3>📊 National Supply vs Demand</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={overview?.brokerTransactions?.byDay || []}>
                <defs>
                  <linearGradient id="supplyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196F3" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2196F3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="buyCount" stroke="#2196F3" fillOpacity={1} fill="url(#demandGradient)" name="Buy Orders" />
                <Area type="monotone" dataKey="sellCount" stroke="#4CAF50" fillOpacity={1} fill="url(#supplyGradient)" name="Sell Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          {/* VEGETABLE CATEGORY DISTRIBUTION */}
          <div className="data-card">
            <h3>🥬 Vegetable Category Distribution</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TOP VEGETABLES */}
          <div className="data-card">
            <h3>🏆 Top Vegetables by Activity</h3>
            <div style={{ width: '100%', height: 300, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vegetable</th>
                    <th>Category</th>
                    <th>Supply</th>
                    <th>Demand</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.topVegetables?.slice(0, 8).map((veg, index) => (
                    <tr key={index}>
                      <td><strong>{veg.vegetableName}</strong></td>
                      <td>{veg.category || 'General'}</td>
                      <td>{veg.totalSupply.toLocaleString()} kg</td>
                      <td>{veg.totalDemand.toLocaleString()} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FARMER PARTICIPATION */}
        <div className="data-card" style={{ marginTop: '20px' }}>
          <h3>👨‍🌾 Farmer Participation (Last 30 Days)</h3>
          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            <div className="mini-stat">
              <span className="mini-stat-value">{overview?.farmerParticipation?.totalFarmers || 0}</span>
              <span className="mini-stat-label">Total Farmers</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value">{overview?.farmerParticipation?.activeFarmers || 0}</span>
              <span className="mini-stat-label">Active Farmers</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value">{overview?.farmerParticipation?.participationRate || 0}%</span>
              <span className="mini-stat-label">Participation Rate</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={overview?.farmerParticipation?.byDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4CAF50" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BROKER TRANSACTIONS */}
        <div className="data-card" style={{ marginTop: '20px' }}>
          <h3>🤝 Broker Transactions (Last 30 Days)</h3>
          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            <div className="mini-stat">
              <span className="mini-stat-value">{overview?.brokerTransactions?.totalBuyOrders || 0}</span>
              <span className="mini-stat-label">Buy Orders</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value">{overview?.brokerTransactions?.totalSellOrders || 0}</span>
              <span className="mini-stat-label">Sell Orders</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value">{overview?.brokerTransactions?.totalVolume?.toLocaleString() || 0}</span>
              <span className="mini-stat-label">Total Volume (kg)</span>
            </div>
          </div>
        </div>

        {/* RECENT CONVERSATIONS */}
        <div className="data-card" style={{ marginTop: '20px' }}>
          <h3>💬 Recent Market Conversations</h3>
          {overview?.recentConversations?.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Participants</th>
                  <th>Last Message</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentConversations.slice(0, 5).map((conv, index) => (
                  <tr key={index}>
                    <td>{conv.participants?.length || 0} participants</td>
                    <td>{conv.lastMessage?.substring(0, 50) || 'No messages'}...</td>
                    <td>{new Date(conv.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No recent conversations</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNationalDashboard;
