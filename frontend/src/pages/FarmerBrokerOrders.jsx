import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useTranslation } from 'react-i18next';

const SRI_LANKA_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Moneragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vanni'
];

const CITIES = [
  'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Anuradhapura',
  'Gampaha', 'Kalmunai', 'Vanni', 'Matara', 'Batticaloa', 'Trincomalee',
  'Kalutara', 'Ratnapura', 'Badulla', 'Hanguranketa', 'Kegalle',
  'Kurunegala', 'Mannar', 'Matale', 'Moneragala', 'Polonnaruwa'
];

// Fallback vegetables in case API fails
const FALLBACK_VEGETABLES = [
  { _id: '1', name: 'Tomato' },
  { _id: '2', name: 'Potato' },
  { _id: '3', name: 'Onion' },
  { _id: '4', name: 'Carrot' },
  { _id: '5', name: 'Cabbage' },
  { _id: '6', name: 'Lettuce' },
  { _id: '7', name: 'Bell Pepper' },
  { _id: '8', name: 'Chili' },
  { _id: '9', name: 'Garlic' },
  { _id: '10', name: 'Ginger' },
  { _id: '11', name: 'Brinjal' },
  { _id: '12', name: 'Pumpkin' },
  { _id: '13', name: 'Cucumber' },
  { _id: '14', name: 'Beans' },
  { _id: '15', name: 'Peas' }
];

const FarmerBrokerOrders = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { i18n } = useTranslation();
  const currentLanguage = i18n?.language || 'en';

  const getLocalizedVegetableName = (order) => {
    const en = order.vegetableName || '';
    const si = order.vegetableNameSi || '';
    const ta = order.vegetableNameTa || '';
    return `${en}${si ? ' | ' + si : ''}${ta ? ' | ' + ta : ''}` || 'Unknown';
  };

  // === STATE ===
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vegetables, setVegetables] = useState([]);
  const [contactingBroker, setContactingBroker] = useState(null);
  const [filters, setFilters] = useState({
    vegetable: '',
    district: '',
    city: '',
    date: '',
    minKg: '',
    maxKg: ''
  });

  // === FETCH DATA ===
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch vegetables - API returns { success: true, data: [...] }
      try {
        const vegResponse = await axios.get(`${API_BASE_URL}/api/vegetables`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Handle response format: { success: true, data: [...] } or just [...]
        const vegData = vegResponse.data?.data || vegResponse.data || [];
        if (vegData.length > 0) {
          setVegetables(vegData);
          console.log('Vegetables loaded from API:', vegData.length);
        } else {
          setVegetables(FALLBACK_VEGETABLES);
          console.log('Using fallback vegetables');
        }
      } catch (e) {
        console.log('Vegetables fetch failed, using fallback:', e.message);
        setVegetables(FALLBACK_VEGETABLES);
      }

      // Fetch broker orders
      const response = await axios.get(`${API_BASE_URL}/api/farmer/broker-buying-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.requests) {
        setOrders(response.data.requests);
      } else if (response.data && response.data.offers) {
        setOrders(response.data.offers);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load broker orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // === SOCKET ===
  useEffect(() => {
    if (!socket) return;

    // Refresh orders when any global broker order changes
    const reloadOrders = () => fetchOrders();

    socket.on("brokerOrderCreated", reloadOrders);
    socket.on("brokerOrderUpdated", reloadOrders);
    socket.on("brokerOrderDeleted", reloadOrders);

    return () => {
      socket.off("brokerOrderCreated", reloadOrders);
      socket.off("brokerOrderUpdated", reloadOrders);
      socket.off("brokerOrderDeleted", reloadOrders);
    };
  }, [socket, fetchOrders]);

  // === FILTER ===
  const filteredOrders = orders.filter(order => {
    // Vegetable filter
    if (filters.vegetable) {
      const match = order?.vegetableName?.toLowerCase().includes(filters.vegetable.toLowerCase());
      if (!match) return false;
    }

    // District filter
    if (filters.district) {
      const orderDistrict = order?.district || order?.location?.district || '';
      const match = orderDistrict.toLowerCase() === filters.district.toLowerCase();
      if (!match) return false;
    }

    // City filter
    if (filters.city) {
      const orderCity = order?.village || order?.location?.village || order?.city || '';
      const match = orderCity.toLowerCase().includes(filters.city.toLowerCase());
      if (!match) return false;
    }

    // Date filter
    if (filters.date) {
      const orderDate = order?.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : null;
      if (orderDate !== filters.date) return false;
    }

    // Quantity filter
    const qty = Number(order?.requiredQuantity) || 0;
    if (filters.minKg && qty < Number(filters.minKg)) return false;
    if (filters.maxKg && qty > Number(filters.maxKg)) return false;

    return true;
  });

  // === HANDLERS ===
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      ...(field === 'district' ? { district: value, city: '' } : { [field]: value })
    }));
  };

  const clearFilters = () => {
    setFilters({
      vegetable: '',
      district: '',
      city: '',
      date: '',
      minKg: '',
      maxKg: ''
    });
  };

  const handleContact = async (order) => {
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
    } catch (err) {
      console.error('Error contacting broker:', err);
      const errorMessage = err.response?.data?.message || 'Failed to contact broker. Please try again.';
      alert(errorMessage);
    } finally {
      setContactingBroker(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const hasFilters = Object.values(filters).some(v => v !== '');

  // === RENDER ===
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '50px', height: '50px',
          border: '4px solid #eee',
          borderTopColor: '#27ae60',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>Loading broker orders...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
        <h3 style={{ color: '#c0392b' }}>Error Loading Orders</h3>
        <p>{error}</p>
        <button
          onClick={fetchOrders}
          style={{
            background: '#27ae60', color: 'white',
            border: 'none', padding: '12px 24px',
            borderRadius: '8px', cursor: 'pointer',
            marginTop: '15px'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px', color: '#27ae60', fontSize: '2rem' }}>📥 Broker Buying Requests</h1>
        <p style={{ margin: 0, color: '#666' }}>Browse broker orders from across Sri Lanka</p>
      </div>

      {/* Filters */}
      <div style={{
        background: '#f8f9fa', borderRadius: '12px', padding: '20px', marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px', display: 'block' }}>Vegetable</label>
            <select
              value={filters.vegetable}
              onChange={(e) => handleFilterChange('vegetable', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
            >
              <option value="">All Vegetables</option>
              {(vegetables || []).map(v => {
                const localName = currentLanguage === 'si' ? (v.nameSi || v.name) : currentLanguage === 'ta' ? (v.nameTa || v.name) : v.name;
                return (
                  <option key={v._id || v.vegetableId || v.name} value={v.name}>
                    {localName}
                  </option>
                );
              })}
              {(vegetables || []).length === 0 && (
                <option value="" disabled>No vegetables available</option>
              )}
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px', display: 'block' }}>District</label>
            <select
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
            >
              <option value="">All Districts</option>
              {SRI_LANKA_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px', display: 'block' }}>City</label>
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
            >
              <option value="">All Cities</option>
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px', display: 'block' }}>Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
            />
          </div>

          <div style={{ flex: '1 1 100px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px', display: 'block' }}>Min KG</label>
            <input
              type="number"
              placeholder="Min"
              value={filters.minKg}
              onChange={(e) => handleFilterChange('minKg', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
            />
          </div>

          <div style={{ flex: '1 1 100px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px', display: 'block' }}>Max KG</label>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxKg}
              onChange={(e) => handleFilterChange('maxKg', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                background: '#e74c3c', color: 'white',
                border: 'none', padding: '12px 20px',
                borderRadius: '8px', cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '20px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          Found <strong style={{ color: '#27ae60' }}>{filteredOrders.length}</strong> broker orders
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          {(vegetables || []).length} vegetables loaded
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredOrders.map(order => (
            <div
              key={order?._id}
              style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                color: 'white',
                padding: '18px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{getLocalizedVegetableName(order)}</h3>
                <span style={{
                  background: 'rgba(255,255,255,0.25)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  {order?.status === 'active' || order?.status === 'open' ? 'OPEN' : order?.status?.toUpperCase()}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#666' }}>Required</span>
                  <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                    {order?.requiredQuantity?.toLocaleString() || 0} {order?.unit || 'kg'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#666' }}>Price</span>
                  <span style={{ fontWeight: '600', color: '#27ae60', fontSize: '1.1rem' }}>
                    Rs {order?.offeredPrice?.toLocaleString() || 0}/{order?.unit || 'kg'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#666' }}>Total</span>
                  <span style={{ fontWeight: '700', color: '#27ae60', fontSize: '1.2rem' }}>
                    Rs {order?.totalPrice?.toLocaleString() || 0}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#666' }}>Broker</span>
                  <span style={{ fontWeight: '600' }}>{order?.brokerId?.name || 'N/A'}</span>
                </div>
                {order?.brokerId?.company && order.brokerId.company !== 'N/A' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ color: '#666' }}>🏢 Company</span>
                    <span style={{ fontWeight: '600' }}>{order.brokerId.company}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#666' }}>📍 Location</span>
                  <span style={{ fontWeight: '600' }}>
                    {order?.village ? `${order.village}, ` : ''}{order?.district || order?.brokerId?.location || 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#666' }}>📅 Delivery</span>
                  <span style={{ fontWeight: '600', color: '#e67e22' }}>{formatDate(order?.deliveryDate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ color: '#666' }}>Posted</span>
                  <span style={{ fontWeight: '600' }}>{formatDate(order?.createdAt)}</span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '15px 20px', background: '#f8f9fa' }}>
                <button
                  onClick={() => handleContact(order)}
                  disabled={contactingBroker === order._id}
                  style={{
                    width: '100%',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: contactingBroker === order._id ? 'not-allowed' : 'pointer',
                    opacity: contactingBroker === order._id ? 0.7 : 1
                  }}
                >
                  {contactingBroker === order._id ? '⏳ Connecting...' : '📞 Contact Broker'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
          <h3 style={{ color: '#333', marginBottom: '10px' }}>No Broker Orders Found</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {hasFilters
              ? 'No orders match your filters. Try adjusting your search.'
              : 'No broker buying requests available at the moment.'}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                background: '#27ae60', color: 'white',
                border: 'none', padding: '12px 24px',
                borderRadius: '8px', cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Mobile Responsive */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(2, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FarmerBrokerOrders;
