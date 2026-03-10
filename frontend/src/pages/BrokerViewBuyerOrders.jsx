import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/ViewOrders.css';
import { API_BASE_URL } from '../services/api';

const BrokerViewBuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vegetables, setVegetables] = useState([]);
  const [contactingBuyer, setContactingBuyer] = useState(null);
  
  // Filter states
  const [vegetableId, setVegetableId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchVegetables();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [vegetableId, selectedDate]);

  const fetchVegetables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/vegetables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVegetables(response.data || []);
    } catch (error) {
      console.error('Error fetching vegetables:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build query params
      const params = new URLSearchParams();
      if (vegetableId) params.append('vegetableId', vegetableId);
      if (selectedDate) params.append('deliveryDate', selectedDate);
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/api/broker/buyer-orders${queryString ? '?' + queryString : ''}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVegetableChange = (e) => {
    setVegetableId(e.target.value);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const clearFilters = () => {
    setVegetableId('');
    setSelectedDate('');
  };

  const hasActiveFilters = vegetableId || selectedDate;

  const handleChatBuyer = async (order) => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      navigate('/login', { state: { from: '/broker/buyer-orders' } });
      return;
    }

    if (user.role !== 'broker') {
      alert('Only brokers can contact buyers');
      return;
    }

    setContactingBuyer(order._id);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/broker/buyer-orders/${order._id}/contact`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const buyerEmail = response.data.otherUser.email;
        navigate(`/broker/messages?email=${encodeURIComponent(buyerEmail)}`);
      } else {
        alert(response.data.message || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error contacting buyer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to contact buyer. Please try again.';
      alert(errorMessage);
    } finally {
      setContactingBuyer(null);
    }
  };

  const handleSendOffer = (order) => {
    alert(`Send Offer functionality for Order: ${order.orderNumber}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#27ae60',
      'in-progress': '#f39c12',
      completed: '#3498db',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#666';
  };

  return (
    <div className="view-orders-page">
      <div className="page-header">
        <h1>🛒 Buyer Orders</h1>
        <p>Browse buyer purchase requests - Connect with buyers and fulfill their vegetable needs</p>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600, color: '#333' }}>Filters:</span>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: showFilters ? '#27ae60' : '#f8f9fa',
                color: showFilters ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {showFilters ? '▼ Less Filters' : '▶ More Filters'}
            </button>
          </div>

          {/* Main Filters - Always Visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
            {/* Vegetable Type Dropdown */}
            <div style={{ flex: 1, maxWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666' }}>
                Vegetable Type
              </label>
              <select
                value={vegetableId}
                onChange={handleVegetableChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Vegetables</option>
                {vegetables.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.vegetableId} - {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div style={{ flex: 1, maxWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666' }}>
                Required Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#e74c3c',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginTop: '18px'
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Results Count */}
          <div style={{ 
            padding: '8px 16px', 
            background: '#f8f9fa', 
            borderRadius: '20px',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            {loading ? 'Loading...' : `${orders.length} orders found`}
          </div>
        </div>

        {/* Additional Filters - Collapsible */}
        {showFilters && (
          <div style={{ 
            marginTop: '20px', 
            paddingTop: '20px', 
            borderTop: '1px solid #eee',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>District / Location</label>
              <input
                type="text"
                placeholder="Search location..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>Min Quantity (kg)</label>
              <input
                type="number"
                placeholder="Min kg"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>Max Quantity (kg)</label>
              <input
                type="number"
                placeholder="Max kg"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading">Loading buyer orders...</div>
        </div>
      ) : orders.length > 0 ? (
        <div className="orders-container" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '20px',
          padding: '20px'
        }}>
          {orders.map(order => (
            <div 
              key={order._id} 
              className="notice-item" 
              style={{ 
                borderLeft: `4px solid ${getStatusColor(order.status)}`,
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              <div className="notice-header" style={{ padding: '15px 20px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: '#27ae60' }}>
                    {order.vegetable?.vegCode || 'VEG000'} - {order.vegetable?.name || 'Unknown'}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: getStatusColor(order.status),
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '8px 0', fontSize: '0.95rem' }}>
                    <strong>📦 Quantity Needed:</strong> {order.quantity} {order.unit || 'kg'}
                  </p>
                  <p style={{ margin: '8px 0', fontSize: '0.95rem' }}>
                    <strong>💰 Expected Price:</strong> Rs.{order.budgetPerUnit}/kg
                    <span style={{ color: '#666', fontSize: '0.85rem', marginLeft: '10px' }}>
                      (Total: Rs.{order.totalBudget?.toLocaleString()})
                    </span>
                  </p>
                  <p style={{ margin: '8px 0', fontSize: '0.95rem' }}>
                    <strong>📍 Location:</strong> {order.location || 'Not specified'}
                  </p>
                  <p style={{ margin: '8px 0', fontSize: '0.95rem' }}>
                    <strong>📅 Delivery Date:</strong> {formatDate(order.deliveryDate)}
                  </p>
                  {order.quality && (
                    <p style={{ margin: '8px 0', fontSize: '0.95rem' }}>
                      <strong>⭐ Quality:</strong> {order.quality}
                    </p>
                  )}
                </div>

                <div style={{ 
                  padding: '12px', 
                  background: '#f8f9fa', 
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                    <strong>👤 Buyer:</strong> {order.buyerName || 'Unknown'}
                  </p>
                  {order.description && (
                    <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
                      "{order.description}"
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleChatBuyer(order)}
                    disabled={contactingBuyer === order._id}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: '#3498db',
                      color: 'white',
                      fontWeight: 600,
                      cursor: contactingBuyer === order._id ? 'not-allowed' : 'pointer',
                      opacity: contactingBuyer === order._id ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {contactingBuyer === order._id ? '⏳ Connecting...' : '💬 Chat Buyer'}
                  </button>
                  <button
                    onClick={() => handleSendOffer(order)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: '#27ae60',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    📤 Send Offer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>
            {hasActiveFilters ? 'No orders match your filters' : 'No buyer orders available'}
          </h3>
          <p style={{ color: '#999' }}>
            {hasActiveFilters 
              ? 'Try adjusting your filters or clear them to see all orders.' 
              : 'There are no active buyer orders at the moment. Check back later!'}
          </p>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              style={{
                marginTop: '15px',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: '#27ae60',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BrokerViewBuyerOrders;
