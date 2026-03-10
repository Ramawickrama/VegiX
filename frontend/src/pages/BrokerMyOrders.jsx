import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import VegetableSelect from '../components/VegetableSelect';
import '../styles/DataTables.css';
import '../styles/PublishOrder.css';
import { API_BASE_URL } from '../services/api';

const API_URL = `${API_BASE_URL}/api/broker`;

const BrokerMyOrders = ({ user }) => {
  const [activeTab, setActiveTab] = useState('buy');
  const [buyOrders, setBuyOrders] = useState([]);
  const [sellOrders, setSellOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const { socket } = useSocket();
  const isMountedRef = useRef(true);

  const currentBrokerId = user?._id || (() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser)._id : null;
    } catch { return null; }
  })();

  const fetchBuyOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await axios.get(`${API_URL}/buy-orders${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isMountedRef.current) {
        setBuyOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching buy orders:', err);
      if (isMountedRef.current) {
        setError('Failed to load buy orders');
      }
    }
  }, [statusFilter]);

  const fetchSellOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await axios.get(`${API_URL}/sell-orders${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isMountedRef.current) {
        setSellOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching sell orders:', err);
      if (isMountedRef.current) {
        setError('Failed to load sell orders');
      }
    }
  }, [statusFilter]);

  useEffect(() => {
    isMountedRef.current = true;
    setLoading(true);
    if (activeTab === 'buy') {
      fetchBuyOrders();
    } else {
      fetchSellOrders();
    }
    setLoading(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [activeTab, statusFilter, fetchBuyOrders, fetchSellOrders]);

  useEffect(() => {
    if (!socket) return;

    const handleBuyOrderCreated = (order) => {
      const orderBrokerId = order?.brokerId?.toString();
      if (orderBrokerId === currentBrokerId?.toString()) {
        fetchBuyOrders();
      }
    };

    const handleBuyOrderUpdated = (updated) => {
      const orderBrokerId = updated?.brokerId?.toString();
      if (orderBrokerId === currentBrokerId?.toString()) {
        fetchBuyOrders();
      }
    };

    const handleBuyOrderDeleted = (orderId) => {
      fetchBuyOrders();
    };

    const handleSellOrderCreated = (order) => {
      const orderBrokerId = order?.brokerId?.toString();
      if (orderBrokerId === currentBrokerId?.toString()) {
        fetchSellOrders();
      }
    };

    const handleSellOrderUpdated = (updated) => {
      const orderBrokerId = updated?.brokerId?.toString();
      if (orderBrokerId === currentBrokerId?.toString()) {
        fetchSellOrders();
      }
    };

    const handleSellOrderDeleted = (orderId) => {
      fetchSellOrders();
    };

    socket.on("brokerOrderCreated", handleBuyOrderCreated);
    socket.on("brokerOrderUpdated", handleBuyOrderUpdated);
    socket.on("brokerOrderDeleted", handleBuyOrderDeleted);
    socket.on("brokerSellOrderCreated", handleSellOrderCreated);
    socket.on("brokerSellOrderUpdated", handleSellOrderUpdated);
    socket.on("brokerSellOrderDeleted", handleSellOrderDeleted);

    return () => {
      socket.off("brokerOrderCreated", handleBuyOrderCreated);
      socket.off("brokerOrderUpdated", handleBuyOrderUpdated);
      socket.off("brokerOrderDeleted", handleBuyOrderDeleted);
      socket.off("brokerSellOrderCreated", handleSellOrderCreated);
      socket.off("brokerSellOrderUpdated", handleSellOrderUpdated);
      socket.off("brokerSellOrderDeleted", handleSellOrderDeleted);
    };
  }, [socket, currentBrokerId, fetchBuyOrders, fetchSellOrders]);

  const handleStatusChange = async (orderId, newStatus, type) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'buy' ? 'buy-orders' : 'sell-orders';
      await axios.patch(`${API_URL}/${endpoint}/${orderId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (type === 'buy') {
        fetchBuyOrders();
      } else {
        fetchSellOrders();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (orderId, type) => {
    if (!window.confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'buy' ? 'buy-orders' : 'sell-orders';
      const deleteEndpoint = type === 'buy' 
        ? `${API_URL}/${endpoint}/${orderId}/permanent`
        : `${API_URL}/${endpoint}/${orderId}`;
      
      await axios.delete(deleteEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (type === 'buy') {
        fetchBuyOrders();
      } else {
        fetchSellOrders();
      }
      alert('Order permanently deleted!');
    } catch (err) {
      console.error('Error deleting order:', err);
      alert(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const openEditModal = (order, type) => {
    setEditingOrder({ ...order, type });
    if (type === 'buy') {
      setEditFormData({
        quantityRequired: order.quantityRequired,
        collectionLocation: order.collectionLocation,
      });
    } else {
      setEditFormData({
        quantity: order.quantity,
      });
    }
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const token = localStorage.getItem('token');
      const endpoint = editingOrder.type === 'buy' ? 'buy-orders' : 'sell-orders';

      await axios.patch(`${API_URL}/${endpoint}/${editingOrder._id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEditSuccess('Order updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        setEditingOrder(null);
        if (editingOrder.type === 'buy') {
          fetchBuyOrders();
        } else {
          fetchSellOrders();
        }
      }, 1000);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update order');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
      case 'active':
        return 'badge-open';
      case 'fulfilled':
      case 'sold':
        return 'badge-fulfilled';
      case 'cancelled':
        return 'badge-cancelled';
      case 'ended':
        return 'badge-ended';
      default:
        return '';
    }
  };

  const renderBuyOrders = () => {
    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (buyOrders.length === 0) return <div className="empty-state">No buy orders found</div>;

    return (
      <table className="data-table">
        <thead>
          <tr>
            <th>Vegetable</th>
            <th>Quantity (kg)</th>
            <th>Price/kg</th>
            <th>Location</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {buyOrders.map(order => (
            <tr key={order._id}>
              <td>{order.vegetableName}</td>
              <td>{order.quantityRequired}</td>
              <td>₨ {Number(order.adminPrice).toFixed(2)}</td>
              <td>{order.collectionLocation}</td>
              <td>
                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                  {order.status?.toUpperCase() || 'OPEN'}
                </span>
              </td>
              <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
              <td>
                {order.status === 'open' && (
                  <>
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(order, 'buy')}
                      style={{ marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-status"
                      onClick={() => handleStatusChange(order._id, 'cancelled', 'buy')}
                      style={{ marginRight: '5px', backgroundColor: '#e74c3c' }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-status"
                      onClick={() => handleStatusChange(order._id, 'ended', 'buy')}
                      style={{ marginRight: '5px', backgroundColor: '#f39c12' }}
                    >
                      End
                    </button>
                  </>
                )}
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(order._id, 'buy')}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderSellOrders = () => {
    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (sellOrders.length === 0) return <div className="empty-state">No sell orders found</div>;

    return (
      <table className="data-table">
        <thead>
          <tr>
            <th>Vegetable</th>
            <th>Quantity (kg)</th>
            <th>Admin Price</th>
            <th>Selling Price</th>
            <th>Profit/kg</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sellOrders.map(order => (
            <tr key={order._id}>
              <td>{order.vegetableName}</td>
              <td>{order.quantity}</td>
              <td>₨ {Number(order.adminPrice).toFixed(2)}</td>
              <td>₨ {Number(order.sellingPrice).toFixed(2)}</td>
              <td>₨ {Number(order.profitPerKg).toFixed(2)}</td>
              <td>
                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                  {order.status?.toUpperCase() || 'OPEN'}
                </span>
              </td>
              <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
              <td>
                {order.status === 'open' && (
                  <>
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(order, 'sell')}
                      style={{ marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-status"
                      onClick={() => handleStatusChange(order._id, 'cancelled', 'sell')}
                      style={{ marginRight: '5px', backgroundColor: '#e74c3c' }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-status"
                      onClick={() => handleStatusChange(order._id, 'sold', 'sell')}
                      style={{ marginRight: '5px', backgroundColor: '#27ae60' }}
                    >
                      Mark Sold
                    </button>
                  </>
                )}
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(order._id, 'sell')}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="my-orders-page">
      <div className="page-header">
        <h1>📋 My Orders</h1>
        <p>Manage your buying and selling orders</p>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'buy' ? 'active' : ''}`}
            onClick={() => setActiveTab('buy')}
          >
            Buying Orders ({buyOrders.length})
          </button>
          <button
            className={`tab ${activeTab === 'sell' ? 'active' : ''}`}
            onClick={() => setActiveTab('sell')}
          >
            Selling Orders ({sellOrders.length})
          </button>
        </div>

        <div className="filter-container">
          <label>Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="active">Active</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="sold">Sold</option>
            <option value="cancelled">Cancelled</option>
            <option value="ended">Ended</option>
          </select>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'buy' ? renderBuyOrders() : renderSellOrders()}
      </div>

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit {editingOrder?.type === 'buy' ? 'Buy' : 'Sell'} Order</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              {editSuccess && <div className="success-message">{editSuccess}</div>}
              {editError && <div className="error-message">{editError}</div>}

              {editingOrder?.type === 'buy' ? (
                <>
                  <div className="form-group">
                    <label>Quantity Required (kg)</label>
                    <input
                      type="number"
                      name="quantityRequired"
                      value={editFormData.quantityRequired}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Collection Location</label>
                    <input
                      type="text"
                      name="collectionLocation"
                      value={editFormData.collectionLocation}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>Quantity (kg)</label>
                  <input
                    type="number"
                    name="quantity"
                    value={editFormData.quantity}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="submit" className="btn-submit" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerMyOrders;
