import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrderCard from '../components/OrderCard';
import '../styles/ViewOrders.css';
import { API_BASE_URL } from '../services/api';

const FarmerViewBrokerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [contactingBroker, setContactingBroker] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/farmer/broker-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.offers || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (orderId) => {
    console.log('View Details:', orderId);
  };

  const handleAcceptOrder = async (orderId) => {
    console.log('Accept Order:', orderId);
  };

  const handleRejectOrder = async (orderId) => {
    console.log('Reject Order:', orderId);
  };

  const handleChatWithBroker = async (order) => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      navigate('/login', { state: { from: '/farmer/broker-orders' } });
      return;
    }

    if (user.role !== 'farmer') {
      alert('Only farmers can contact brokers');
      return;
    }

    setContactingBroker(order._id);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/farmer/broker-orders/${order._id}/contact-broker`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.conversationId) {
        navigate(`/farmer/messages?conversationId=${response.data.conversationId}`);
      } else if (response.data.otherUser) {
        navigate(`/farmer/messages?email=${encodeURIComponent(response.data.otherUser.email)}`);
      } else {
        alert(response.data.message || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error contacting broker:', error);
      const errorMessage = error.response?.data?.message || 'Failed to contact broker. Please try again.';
      alert(errorMessage);
    } finally {
      setContactingBroker(null);
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  if (loading) return <div className="loading">Loading broker orders...</div>;

  return (
    <div className="view-orders-page">
      <div className="page-header">
        <h1>🤝 Broker Orders</h1>
        <p>Browse and respond to broker offers</p>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({orders.length})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button
          className={`filter-btn ${filter === 'accepted' ? 'active' : ''}`}
          onClick={() => setFilter('accepted')}
        >
          Accepted ({orders.filter(o => o.status === 'accepted').length})
        </button>
      </div>

      <div className="broker-orders-container">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <OrderCard
              key={order._id}
              order={order}
              isBrokerOrder={true}
              onViewDetails={handleViewDetails}
              onAccept={handleAcceptOrder}
              onReject={handleRejectOrder}
              onChat={handleChatWithBroker}
              chatLoading={contactingBroker === order._id}
            />
          ))
        ) : (
          <div className="empty-state">
            <p>No broker orders available at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerViewBrokerOrders;
