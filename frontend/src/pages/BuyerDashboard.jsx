import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import '../styles/Dashboard.css';
import '../styles/BrokerBuyer.css';
import '../components/StatCard.css';
import '../components/Card.css';
import '../components/Button.css';
import API from '../services/api';

const BuyerDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [demands, setDemands] = useState([]);
  const [brokerOrders, setBrokerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDemand, setEditingDemand] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: '', deliveryDate: '' });

  const getVegetableNameAllLanguages = (item) => {
    const en = item.vegetableName || '';
    const si = item.vegetableNameSi || '';
    const ta = item.vegetableNameTa || '';
    return `${en}${si ? ' | ' + si : ''}${ta ? ' | ' + ta : ''}` || 'N/A';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [demandsRes, brokerRes] = await Promise.all([
          API.get('/buyer/my-demands'),
          API.get('/buyer/market-orders'),
        ]);
        setDemands(demandsRes.data || []);
        setBrokerOrders(brokerRes.data.posts || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (demand) => {
    setEditingDemand(demand);
    setEditForm({
      quantity: demand.quantity,
      deliveryDate: demand.deliveryDate ? demand.deliveryDate.split('T')[0] : ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const res = await API.put(`/buyer/demand/${editingDemand._id}`, editForm);

      if (res.data.success) {
        setDemands(demands.map(d => d._id === editingDemand._id ? res.data.demand : d));
        setEditingDemand(null);
      }
    } catch (error) {
      console.error('Error updating demand:', error);
      alert(t('errors.failedToSave'));
    }
  };

  const handleDelete = async (demandId) => {
    if (!window.confirm(t('demands.confirmDelete'))) return;

    try {
      await API.delete(`/buyer/demand/${demandId}`);
      setDemands(demands.filter(d => d._id !== demandId));
    } catch (error) {
      console.error('Error deleting demand:', error);
      alert(t('errors.failedToDelete'));
    }
  };

  const handleStatusChange = async (demandId, newStatus) => {
    try {
      const res = await API.put(`/buyer/demand/${demandId}`, { status: newStatus });

      if (res.data.success) {
        setDemands(demands.map(d => d._id === demandId ? res.data.demand : d));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: 'white' }}>Buyer Dashboard</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Market access with transparent pricing. All prices include 10% broker commission.</p>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <StatCard
          icon="📋"
          label="My Demands"
          value={demands.length}
          color="blue"
        />
        <StatCard
          icon="⏳"
          label="Active Demands"
          value={demands.filter(o => o.status === 'open').length}
          color="orange"
        />
        <StatCard
          icon="📦"
          label="Broker Supply"
          value={brokerOrders.length}
          color="green"
        />
      </div>

      <div className="dashboard-content">
        <div className="content-section">
          <h2>Your Published Demands</h2>
          {demands.length > 0 ? (
            <div className="orders-list">
              {demands.map(demand => (
                <div key={demand._id} className="order-item">
                  <div className="order-info">
                    <h4>{getVegetableNameAllLanguages(demand)}</h4>
                    <p>
                      {demand.quantity} kg | {
                        typeof demand.location === 'object' && demand.location !== null
                          ? `${demand.location.area}, ${demand.location.city}, ${demand.location.district}`
                          : demand.location
                      }
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#b2bec3' }}>Needed by: {new Date(demand.deliveryDate).toLocaleDateString()}</p>
                  </div>
                  <div className={`order-status ${demand.status}`}>
                    {demand.status.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                    <button
                      onClick={() => handleEdit(demand)}
                      style={{
                        padding: '6px 12px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(demand._id)}
                      style={{
                        padding: '6px 12px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Delete
                    </button>
                    <select
                      value={demand.status}
                      onChange={(e) => handleStatusChange(demand._id, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No demands published yet</p>
          )}
        </div>

        <div className="content-section">
          <h2>Top Broker Supplies</h2>
          {brokerOrders.length > 0 ? (
            <div className="orders-list">
              {brokerOrders.slice(0, 5).map(order => (
                <div key={order._id} className="order-item">
                  <div className="order-info">
                    <h4>{getVegetableNameAllLanguages(order)}</h4>
                    <p>Broker: {order.brokerId?.name} | {order.quantity} kg available</p>
                  </div>
                  <div className="order-price" style={{ color: '#d63031' }}>
                    ₨ {order.finalPrice.toFixed(2)}/kg
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No broker listings available currently</p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingDemand && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2e7d32' }}>Edit Demand</h3>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '0.9rem' }}>
              Vegetable: <strong>{getVegetableNameAllLanguages(editingDemand)}</strong>
            </p>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Quantity (kg)
              </label>
              <input
                type="number"
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Delivery Date
              </label>
              <input
                type="date"
                value={editForm.deliveryDate}
                onChange={(e) => setEditForm({ ...editForm, deliveryDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingDemand(null)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
