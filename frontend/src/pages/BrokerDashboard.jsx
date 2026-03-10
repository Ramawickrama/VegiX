import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import { useSocket } from '../contexts/SocketContext';
import '../styles/Dashboard.css';
import '../styles/BrokerBuyer.css';
import '../components/StatCard.css';
import '../components/Card.css';
import '../components/Button.css';
import API from '../services/api';

const BrokerDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [buyOrders, setBuyOrders] = useState([]);
  const [buyOrdersLoading, setBuyOrdersLoading] = useState(true);
  const [buyOrdersError, setBuyOrdersError] = useState('');

  // State for wallet
  const [walletBalance, setWalletBalance] = useState(0);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addingFunds, setAddingFunds] = useState(false);

  // State for sell orders
  const [sellOrders, setSellOrders] = useState([]);
  const [sellOrdersLoading, setSellOrdersLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const { subscribe, unsubscribe, joinRoom, socket } = useSocket();
  const isMountedRef = useRef(true);

  // Get broker ID from props or localStorage
  const currentBrokerId = user?._id || (() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser)._id : null;
    } catch { return null; }
  })();

  // FETCH: Buy Orders
  const fetchBuyOrders = useCallback(async () => {
    try {
      setBuyOrdersError('');
      const response = await API.get('/broker/buy-orders');
      if (isMountedRef.current) {
        setBuyOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching buy orders:', error);
      if (isMountedRef.current) {
        setBuyOrdersError(error.response?.data?.message || 'Failed to load buy orders');
      }
    } finally {
      if (isMountedRef.current) {
        setBuyOrdersLoading(false);
      }
    }
  }, []);

  // FETCH: Sell Orders
  const fetchSellOrders = useCallback(async () => {
    try {
      const response = await API.get('/broker/dashboard');
      if (isMountedRef.current) {
        setSellOrders(response.data.sellOrders || []);
      }
    } catch (error) {
      console.error('Error fetching sell orders:', error);
    } finally {
      if (isMountedRef.current) {
        setSellOrdersLoading(false);
      }
    }
  }, []);

  // FETCH: Wallet Balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      const response = await API.get('/broker/wallet');
      if (isMountedRef.current) {
        setWalletBalance(response.data.walletBalance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  }, []);

  // ADD FUNDS TO WALLET
  const handleAddFunds = async (e) => {
    e.preventDefault();
    const amount = parseFloat(addFundsAmount);

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setAddingFunds(true);
      const response = await API.post('/broker/wallet/add', { amount });

      if (response.data.success) {
        setWalletBalance(response.data.walletBalance);
        setAddFundsAmount('');
        setShowAddFunds(false);
        alert('Funds added successfully!');
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      alert(error.response?.data?.message || 'Failed to add funds');
    } finally {
      setAddingFunds(false);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    isMountedRef.current = true;
    fetchBuyOrders();
    fetchSellOrders().then(() => setLoading(false));
    fetchWalletBalance();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBuyOrders, fetchSellOrders, fetchWalletBalance]);

  // SOCKET: Join broker room on connect
  useEffect(() => {
    if (currentBrokerId && socket) {
      joinRoom(`broker:${currentBrokerId}`);
    }
  }, [currentBrokerId, socket, joinRoom]);

  // SOCKET: Listen for broker buy order events
  useEffect(() => {
    if (!socket) return;

    const handleBrokerOrderCreated = (order) => {
      if (!order) return;
      const orderBrokerId = order.brokerId?.toString();
      if (orderBrokerId === currentBrokerId?.toString()) {
        setBuyOrders(prev => [order, ...prev]);
      }
    };

    const handleBrokerOrderUpdated = (updated) => {
      if (!updated) return;
      const orderBrokerId = updated.brokerId?.toString();
      if (orderBrokerId === currentBrokerId?.toString()) {
        setBuyOrders(prev =>
          prev.map(o =>
            o._id === updated._id ? updated : o
          )
        );
      }
    };

    const handleBrokerOrderDeleted = (orderId) => {
      if (!orderId) return;
      setBuyOrders(prev =>
        prev.filter(o => o._id !== orderId)
      );
    };

    const handleWalletUpdated = (data) => {
      if (data && typeof data.walletBalance === 'number') {
        setWalletBalance(data.walletBalance);
      }
    };

    socket.on("brokerOrderCreated", handleBrokerOrderCreated);
    socket.on("brokerOrderUpdated", handleBrokerOrderUpdated);
    socket.on("brokerOrderDeleted", handleBrokerOrderDeleted);
    socket.on("walletUpdated", handleWalletUpdated);

    return () => {
      socket.off("brokerOrderCreated", handleBrokerOrderCreated);
      socket.off("brokerOrderUpdated", handleBrokerOrderUpdated);
      socket.off("brokerOrderDeleted", handleBrokerOrderDeleted);
      socket.off("walletUpdated", handleWalletUpdated);
    };
  }, [socket, currentBrokerId]);

  // ACTION: Cancel Buy Order
  const handleCancelOrder = async (orderId) => {
    try {
      await API.delete(`/broker/buy-orders/${orderId}`);
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  // ACTION: End Buy Order
  const handleEndOrder = async (orderId) => {
    try {
      await API.put(`/broker/buy-orders/${orderId}/end`);
    } catch (error) {
      console.error('Error ending order:', error);
      alert(error.response?.data?.message || 'Failed to end order');
    }
  };

  // ACTION: Delete Buy Order (Permanent)
  const handleDeleteOrder = async (orderId) => {
    try {
      await API.delete(`/broker/buy-orders/${orderId}/permanent`);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert(error.response?.data?.message || 'Failed to delete order');
    }
  };

  // COMPUTED
  const activeBuyOrders = buyOrders?.filter(o => o.status === 'open' || o.status === 'active')?.length || 0;
  const totalSell = sellOrders.length;
  const totalProfit = sellOrders.reduce((sum, o) => sum + ((o.profitPerKg || 0) * (o.quantity || 0)), 0);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: 'white' }}>Broker Dashboard</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Manage your buying and selling orders. System auto-calculates your 10% commission.</p>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <StatCard
          icon="💳"
          label="Wallet Balance"
          value={`₨ ${Number(walletBalance).toFixed(2)}`}
          color="red"
        />
        <StatCard
          icon="🛒"
          label="Active Buy Orders"
          value={activeBuyOrders}
          color="blue"
        />
        <StatCard
          icon="📦"
          label="Sell Orders"
          value={totalSell}
          color="green"
        />
        <StatCard
          icon="💰"
          label="Estimated Profit"
          value={`₨ ${totalProfit.toFixed(2)}`}
          color="orange"
        />
      </div>


      <div className="dashboard-content">
        {/* Buy Orders Section */}
        <div className="content-section">
          <h2>Buy Orders</h2>

          {buyOrdersLoading ? (
            <p className="empty-state">Loading orders...</p>
          ) : buyOrdersError ? (
            <div className="error-message">
              {buyOrdersError}
              <button onClick={fetchBuyOrders}>Retry</button>
            </div>
          ) : buyOrders?.length > 0 ? (
            <div className="orders-list">
              {buyOrders.map(order => (
                <div key={order?._id} className="order-item">
                  <div className="order-info">
                    <h4>{order?.vegetableName}</h4>
                    <p>{order?.quantityRequired} kg @ ₨ {Number(order?.adminPrice || 0).toFixed(2)}/kg</p>
                    {order?.company && order.company !== 'N/A' && (
                      <small style={{ display: 'block', color: '#666' }}>🏢 Company: {order.company}</small>
                    )}
                    <small>{order?.collectionLocation}</small>
                    <small style={{ marginLeft: '10px' }}>{order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</small>
                  </div>
                  <div className={`order-status ${order?.status}`} style={{
                    backgroundColor: (order?.status === 'open' || order?.status === 'active') ? '#27ae60' :
                      order?.status === 'cancelled' ? '#e74c3c' :
                        order?.status === 'ended' ? '#f39c12' : '#95a5a6'
                  }}>
                    {(order?.status === 'open' || order?.status === 'active') ? 'ACTIVE' :
                      order?.status === 'cancelled' ? 'CANCELLED' :
                        order?.status === 'ended' ? 'ENDED' :
                          order?.status?.toUpperCase() || 'OPEN'}
                  </div>
                  {(order?.status === 'open' || order?.status === 'active') && (
                    <>
                      <button
                        onClick={() => handleEndOrder(order?._id)}
                        className="btn-end"
                        style={{ marginRight: '8px', backgroundColor: '#f39c12' }}
                      >
                        End
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order?._id)}
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order?._id)}
                        className="btn-delete"
                        style={{ marginLeft: '8px', backgroundColor: '#e74c3c' }}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No buy orders yet</p>
          )}
        </div>

        {/* Sell Orders Section */}
        <div className="content-section">
          <h2>Active Sell Orders (to Buyers)</h2>
          {sellOrdersLoading ? (
            <p className="empty-state">Loading orders...</p>
          ) : sellOrders.length > 0 ? (
            <div className="orders-list">
              {sellOrders.map(order => (
                <div key={order._id} className="order-item">
                  <div className="order-info">
                    <h4>{order.vegetableName}</h4>
                    <p>{order.quantity} kg | Profit: ₨ {Number(order.profitPerKg || 0).toFixed(2)}/kg</p>
                  </div>
                  <div className="order-price" style={{ color: '#d63031' }}>
                    ₨ {Number(order.sellingPrice || 0).toFixed(2)}/kg
                  </div>
                  <div className={`order-status ${order.status}`}>
                    {order.status?.toUpperCase() || 'OPEN'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No sell orders yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrokerDashboard;
