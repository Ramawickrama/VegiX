import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VegetableSelect from '../components/VegetableSelect';
import { useToast } from '../components/Toast';
import { formatPrice } from '../utils/priceUtils';
import '../styles/BrokerBuyer.css';
import { API_BASE_URL } from '../services/api';

const API_BASE = `${API_BASE_URL}/api/buyer`;

const styles = {
    container: {
        padding: '20px',
        maxWidth: '1400px',
        margin: '0 auto'
    },
    filterSection: {
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    filterGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '15px',
        alignItems: 'end'
    },
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
    },
    card: {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    cardActions: {
        display: 'flex',
        gap: '10px',
        marginTop: '10px'
    },
    mobileTapIndicator: {
        display: 'none',
        textAlign: 'center',
        padding: '8px',
        color: '#999',
        fontSize: '0.85rem'
    }
};

const BuyerMarketOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [filters, setFilters] = useState({
        vegetableId: searchParams.get('vegetableId') || '',
        district: '',
        village: '',
        date: ''
    });

    const getVegetableNameAllLanguages = (item) => {
        const en = item.vegetableName || '';
        const si = item.vegetableNameSi || '';
        const ta = item.vegetableNameTa || '';
        return `${en}${si ? ' | ' + si : ''}${ta ? ' | ' + ta : ''}` || 'N/A';
    };

    const districts = [
        "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
        "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
        "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
        "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
        "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
    ];

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const params = new URLSearchParams();
            if (filters.vegetableId) params.append('vegetableId', filters.vegetableId);
            if (filters.district) params.append('district', filters.district);
            if (filters.village) params.append('village', filters.village);
            if (filters.date) params.append('date', filters.date);

            const res = await axios.get(`${API_BASE}/market-orders?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const vegFromUrl = searchParams.get('vegetableId');
        if (vegFromUrl && vegFromUrl !== filters.vegetableId) {
            setFilters(prev => ({ ...prev, vegetableId: vegFromUrl }));
        }
    }, [searchParams]);

    useEffect(() => {
        fetchOrders();
    }, [filters]);

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
            date: ''
        });
    };

    const handleContact = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/market-orders/${orderId}/contact`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.conversationId) {
                navigate(`/buyer/messages?conversationId=${res.data.conversationId}`);
            } else if (res.data.otherUser) {
                navigate(`/buyer/messages?email=${encodeURIComponent(res.data.otherUser.email)}`);
            }
        } catch (error) {
            console.error('Error contacting broker:', error);
            alert(error.response?.data?.message || 'Failed to contact broker');
        }
    };

    const handleAddToCart = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/cart/${orderId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success('Added to cart!');
                navigate('/buyer/cart');
            } else {
                toast.error(res.data.message || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error(error.response?.data?.message || 'Failed to add to cart');
        }
    };

    const hasFilters = filters.vegetableId || filters.district || filters.village || filters.date;

    if (loading) return <div className="broker-buyer-page">Loading...</div>;

    return (
        <div className="broker-buyer-page">
            <div className="page-header">
                <h1>🛒 Broker Selling Posts</h1>
                <p>View broker selling posts and contact them directly</p>
            </div>

                <div className="filter-section-mobile" style={styles.filterSection}>
                <div style={styles.filterGrid} className="filter-grid-desktop">
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                            Name
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
                            Date
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={filters.date}
                            onChange={handleFilterChange}
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
                            {orders.length} posts found
                        </span>
                    </div>
                )}
            </div>

            {orders.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '80px 20px', 
                    background: 'white', 
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
                    <h3 style={{ color: '#666', marginBottom: '10px' }}>
                        No Posts Found
                    </h3>
                    <p style={{ color: '#999' }}>
                        {hasFilters ? 'Try adjusting your filters' : 'No broker selling posts available'}
                    </p>
                </div>
            ) : (
                <div className="orders-card-grid" style={styles.cardGrid}>
                    {orders.map(order => (
                        <div key={order._id} className="order-card-mobile" style={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#2e7d32' }}>
                                        {getVegetableNameAllLanguages(order)}
                                    </h3>
                                    <span style={{ 
                                        background: '#e8f5e9', 
                                        color: '#2e7d32', 
                                        padding: '4px 12px', 
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: '500'
                                    }}>
                                        Available
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#2e7d32' }}>
                                        {order.quantity} kg
                                    </div>
                                    <small style={{ color: '#666' }}>Available</small>
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <div>
                                    <small style={{ color: '#666' }}>Selling Price</small>
                                    <div style={{ fontWeight: '700', fontSize: '18px', color: '#d63031' }}>
                                        {formatPrice(order.finalPrice)}/kg
                                    </div>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <small style={{ color: '#666' }}>Location</small>
                                    <div style={{ fontWeight: '500' }}>
                                        {order.location?.area || '-'}, {order.location?.district || '-'}
                                    </div>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <small style={{ color: '#666' }}>Broker</small>
                                    <div style={{ fontWeight: '500' }}>{order.brokerId?.name || 'Unknown'}</div>
                                </div>
                                <div style={{ marginTop: '5px' }}>
                                    <small style={{ color: '#666' }}>Posted Date</small>
                                    <div style={{ fontWeight: '500' }}>
                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="card-actions-mobile" style={styles.cardActions}>
                                <button 
                                    onClick={() => handleAddToCart(order._id)}
                                    className="btn-mobile-action"
                                    style={{
                                        flex: 1,
                                        padding: '14px 12px',
                                        background: '#27ae60',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1rem'
                                    }}
                                >
                                    🛒 Add to Cart
                                </button>
                                <button 
                                    onClick={() => handleContact(order._id)}
                                    className="btn-mobile-action"
                                    style={{
                                        flex: 1,
                                        padding: '14px 12px',
                                        background: '#3498db',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1rem'
                                    }}
                                >
                                    💬 Contact
                                </button>
                            </div>
                            
                            {/* Mobile Tap Indicator */}
                            <div className="mobile-tap-indicator" style={styles.mobileTapIndicator}>
                                👆 Tap to view details
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BuyerMarketOrders;
