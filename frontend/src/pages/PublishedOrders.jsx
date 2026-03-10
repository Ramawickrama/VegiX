import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const PublishedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalSupply: 0,
    totalDemand: 0,
    marketStatus: 'Balanced'
  });

  const [filters, setFilters] = useState({
    date: '',
    vegetableId: 'all',
    userType: 'all'
  });

  useEffect(() => {
    fetchVegetables();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [filters.date, filters.vegetableId, filters.userType]);

  const fetchVegetables = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/vegetables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const vegData = res.data.data || res.data;
      setVegetables(Array.isArray(vegData) ? vegData : []);
    } catch (err) {
      console.error('Error fetching vegetables:', err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/published-orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          date: filters.date,
          vegetableId: filters.vegetableId,
          userType: filters.userType
        }
      });
      setOrders(res.data.orders || []);
      setSummary({
        totalSupply: res.data.totalSupply || 0,
        totalDemand: res.data.totalDemand || 0,
        marketStatus: res.data.marketStatus || 'Balanced'
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    if (status === 'High Demand') return '#e74c3c';
    if (status === 'Oversupply') return '#f39c12';
    return '#2ecc71';
  };

  const getUserTypeBadge = (type) => {
    const styles = {
      farmer: { bg: '#dcfce7', color: '#16a34a' },
      broker: { bg: '#dbeafe', color: '#1d4ed8' },
      buyer: { bg: '#fef3c7', color: '#d97706' }
    };
    const s = styles[type] || styles.buyer;
    return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: s.bg, color: s.color }}>{type.toUpperCase()}</span>;
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>📢 Published Orders Management & Analysis</h1>
        <p>Monitor all orders from farmers, brokers, and buyers</p>
      </div>

      <div className="page-content">
        {/* FILTERS */}
        <div className="filter-bar" style={{ display: 'flex', gap: '20px', marginBottom: '30px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
          <div className="filter-group">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📅 Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div className="filter-group">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>👤 User Type</label>
            <select
              name="userType"
              value={filters.userType}
              onChange={handleFilterChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
            >
              <option value="all">All Users</option>
              <option value="farmer">🚜 Farmers</option>
              <option value="broker">🤝 Brokers</option>
              <option value="buyer">🏪 Buyers</option>
            </select>
          </div>
          <div className="filter-group">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🥦 Vegetable</label>
            <select
              name="vegetableId"
              value={filters.vegetableId}
              onChange={handleFilterChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
            >
              <option value="all">All Vegetables</option>
              {vegetables.map(veg => (
                <option key={veg._id} value={veg._id}>{veg.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div className="info-card" style={{ borderLeft: '5px solid #2ecc71' }}>
            <h3 style={{ color: '#7f8c8d' }}>📦 Total Supply</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>{summary.totalSupply.toLocaleString()} Kg</div>
            <small>Farmer Posts</small>
          </div>
          <div className="info-card" style={{ borderLeft: '5px solid #e74c3c' }}>
            <h3 style={{ color: '#7f8c8d' }}>🛒 Total Demand</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>{summary.totalDemand.toLocaleString()} Kg</div>
            <small>Buyer & Broker Requests</small>
          </div>
          <div className="info-card" style={{ borderLeft: `5px solid ${getStatusColor(summary.marketStatus)}` }}>
            <h3 style={{ color: '#7f8c8d' }}>⚖️ Market Status</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: getStatusColor(summary.marketStatus) }}>
              {summary.marketStatus.toUpperCase()}
            </div>
            <small>For {filters.date}</small>
          </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="data-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>📋 All Published Orders ({orders.length})</h2>
            <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '5px 15px' }}>🔄 Refresh</button>
          </div>

          {loading ? (
            <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>Fetching orders...</div>
          ) : orders.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Type</th>
                  <th>Order Type</th>
                  <th>Vegetable</th>
                  <th>Quantity (Kg)</th>
                  <th>Price/Kg</th>
                  <th>Total Price</th>
                  <th>User Name</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{getUserTypeBadge(order.userType)}</td>
                    <td>
                      <span className={`order-type ${order.orderType}`}>
                        {order.orderType.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <strong>{order.vegetableName}</strong>
                      <br /><small style={{ color: '#95a5a6' }}>{order.category}</small>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{order.quantity?.toLocaleString()}</td>
                    <td>₨ {order.unitPrice}</td>
                    <td className="price">₨ {order.totalPrice?.toFixed(2)}</td>
                    <td>{order.user}</td>
                    <td>{order.location}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {order.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px', color: '#bdc3c7' }}>
              <div style={{ fontSize: '48px' }}>📂</div>
              <p>No published orders found for the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishedOrders;
