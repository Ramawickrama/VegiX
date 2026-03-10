import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useTranslation } from 'react-i18next';
import VegetableSelect from '../components/VegetableSelect';
import '../styles/BrokerBuyer.css';
import { API_BASE_URL } from '../services/api';

const API_URL = `${API_BASE_URL}/api/broker`;

const BrokerBuyerDemands = ({ user }) => {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    vegetableId: '',
    district: '',
    village: '',
    minQuantity: '',
    maxQuantity: ''
  });
  const navigate = useNavigate();
  const { socket } = useSocket();

  const getVegetableNameAllLanguages = (demand) => {
    const en = demand.vegetableName || '';
    const si = demand.vegetableNameSi || '';
    const ta = demand.vegetableNameTa || '';
    return `${en}${si ? ' | ' + si : ''}${ta ? ' | ' + ta : ''}` || 'N/A';
  };

  const districts = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
    "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
    "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
    "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
    "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
  ];

  const fetchDemands = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams();
      if (filters.vegetableId) params.append('vegetableId', filters.vegetableId);
      if (filters.district) params.append('district', filters.district);
      if (filters.village) params.append('village', filters.village);
      if (filters.minQuantity) params.append('minQuantity', filters.minQuantity);
      if (filters.maxQuantity) params.append('maxQuantity', filters.maxQuantity);

      const res = await axios.get(`${API_URL}/buyer-demands?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDemands(res.data || []);
    } catch (err) {
      console.error('Error fetching buyer demands:', err);
      setError('Failed to load buyer demands');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands]);

  useEffect(() => {
    if (!socket) return;

    const handleNewDemand = (demand) => {
      setDemands(prev => {
        if (prev.some(d => d._id === demand._id)) return prev;
        return [demand, ...prev];
      });
    };

    socket.on('buyer-demand-created', handleNewDemand);

    return () => {
      socket.off('buyer-demand-created', handleNewDemand);
    };
  }, [socket]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleVegetableSelect = (id) => {
    setFilters(prev => ({ ...prev, vegetableId: id }));
  };

  const clearFilters = () => {
    setFilters({
      vegetableId: '',
      district: '',
      village: '',
      minQuantity: '',
      maxQuantity: ''
    });
  };

  const handleContact = async (demandId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/buyer-demands/${demandId}/contact`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        navigate(`/broker/messages?email=${encodeURIComponent(res.data.otherUser.email)}`);
      }
    } catch (err) {
      console.error('Error contacting buyer:', err);
      alert(err.response?.data?.message || 'Failed to contact buyer');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '15px' }}>⏳</div>
        <h3 style={{ color: '#666' }}>Loading Buyer Demands...</h3>
      </div>
    );
  }

  const hasFilters = filters.vegetableId || filters.district || filters.village || filters.minQuantity || filters.maxQuantity;

  return (
    <div className="broker-buyer-page">
      <div className="page-header">
        <h1>📋 Buyer Demands</h1>
        <p>View demands from buyers and contact them</p>
      </div>

      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
              Vegetable Type
            </label>
            <VegetableSelect
              value={filters.vegetableId}
              onChange={handleVegetableSelect}
              label=""
              required={false}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
              District
            </label>
            <select
              name="district"
              value={filters.district}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            >
              <option value="">All Districts</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
              Village / Area
            </label>
            <input
              type="text"
              name="village"
              value={filters.village}
              onChange={handleFilterChange}
              placeholder="Search village..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
              Quantity Range (kg)
            </label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                type="number"
                name="minQuantity"
                value={filters.minQuantity}
                onChange={handleFilterChange}
                placeholder="Min"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              />
              <input
                type="number"
                name="maxQuantity"
                value={filters.maxQuantity}
                onChange={handleFilterChange}
                placeholder="Max"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={clearFilters}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: '#e74c3c',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Clear Filters
            </button>
            <span style={{
              padding: '8px 16px',
              background: '#f5f5f5',
              borderRadius: '20px',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              {demands.length} demands found
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
          <button onClick={fetchDemands}>Retry</button>
        </div>
      )}

      {demands.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'white',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>
            No Buyer Demands Found
          </h3>
          <p style={{ color: '#999' }}>
            {hasFilters ? 'Try adjusting your filters' : 'There are no buyer demands at the moment'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {demands.map(demand => (
            <div key={demand._id} className="order-card" style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: '1', minWidth: '100px' }}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#2e7d32' }}>
                    {getVegetableNameAllLanguages(demand)}
                  </h3>
                  <span style={{
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}>
                    {demand.status?.toUpperCase() || 'OPEN'}
                  </span>
                </div>

                {/* Center Company Label */}
                {demand.buyerId?.company && demand.buyerId.company !== 'N/A' && (
                  <div style={{ flex: '1', textAlign: 'center', alignSelf: 'center', minWidth: '120px' }}>
                    <span style={{ fontWeight: '600', color: '#444', fontSize: '1.05rem', background: '#f8f9fa', padding: '6px 16px', borderRadius: '8px', border: '1px solid #eee', display: 'inline-block' }}>
                      🏢 {demand.buyerId.company}
                    </span>
                  </div>
                )}

                <div style={{ flex: '1', textAlign: 'right', minWidth: '80px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#2e7d32' }}>
                    {demand.quantity} kg
                  </div>
                  <small style={{ color: '#666' }}>Required</small>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '15px',
                  marginBottom: '10px'
                }}>
                  <div>
                    <small style={{ color: '#666' }}>Price/kg</small>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>₨ {demand.adminPriceSnapshot}</div>
                  </div>
                  <div>
                    <small style={{ color: '#666' }}>Total Value</small>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>₨ {(demand.quantity * demand.adminPriceSnapshot).toFixed(2)}</div>
                  </div>
                </div>
                <div>
                  <small style={{ color: '#666' }}>Location</small>
                  <div style={{ fontWeight: '500' }}>
                    {typeof demand.location === 'object' && demand.location !== null
                      ? `${demand.location.area}, ${demand.location.city}, ${demand.location.district}`
                      : demand.location}
                  </div>
                </div>
                <div>
                  <small style={{ color: '#666' }}>Delivery Date</small>
                  <div style={{ fontWeight: '500' }}>
                    {demand.deliveryDate ? new Date(demand.deliveryDate).toLocaleDateString() : 'Not specified'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <div style={{ minWidth: '100px' }}>
                  <small style={{ color: '#666' }}>Buyer</small>
                  <div style={{ fontWeight: '500' }}>{demand.buyerId?.name || 'Unknown'}</div>
                </div>
                <button
                  onClick={() => handleContact(demand._id)}
                  style={{
                    padding: '10px 20px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  💬 Contact
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrokerBuyerDemands;
