import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import VegetableSelect from '../components/VegetableSelect';
import '../styles/BrokerBuyer.css';
import { API_BASE_URL } from '../services/api';

const API_BASE = `${API_BASE_URL}/api/buyer`;

const MarketOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        vegetableId: '',
        district: '',
        minQuantity: '',
        maxQuantity: '',
        date: ''
    });

    const districts = [
        "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
        "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
        "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
        "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
        "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
    ];

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const params = new URLSearchParams();
            if (filters.vegetableId) params.append('vegetableId', filters.vegetableId);
            if (filters.district) params.append('district', filters.district);
            if (filters.minQuantity) params.append('minQuantity', filters.minQuantity);
            if (filters.maxQuantity) params.append('maxQuantity', filters.maxQuantity);
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
            minQuantity: '',
            maxQuantity: '',
            date: ''
        });
    };

    const navigate = useNavigate();

    const handleContact = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/market-orders/${orderId}/contact`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.conversationId) {
                navigate(`/messages?conversationId=${res.data.conversationId}`);
            } else if (res.data.otherUser) {
                navigate(`/messages?email=${encodeURIComponent(res.data.otherUser.email)}`);
            }
        } catch (error) {
            console.error('Error contacting broker:', error);
            alert(error.response?.data?.message || 'Failed to contact broker');
        }
    };

    const hasFilters = filters.vegetableId || filters.district || filters.minQuantity || filters.maxQuantity || filters.date;

    const getAllLanguagesName = (order) => {
        const names = [];
        if (order.vegetableName) names.push(order.vegetableName);
        if (order.vegetableNameSi) names.push(order.vegetableNameSi);
        if (order.vegetableNameTa) names.push(order.vegetableNameTa);
        return names.join(' | ') || 'N/A';
    };

    if (loading) return <div className="broker-buyer-page">Loading market...</div>;

    return (
        <div className="broker-buyer-page">
            <div className="page-header">
                <h1>🛒 Broker Supply Orders</h1>
                <p>Buy directly from Brokers. Prices include all commissions.</p>
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
                    gridTemplateColumns: 'repeat(4, 1fr)', 
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
                            {orders.length} orders found
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
                        No Orders Found
                    </h3>
                    <p style={{ color: '#999' }}>
                        {hasFilters ? 'Try adjusting your filters' : 'No broker supply orders available'}
                    </p>
                </div>
            ) : (
                <div className="card-grid">
                    {orders.map(order => (
                        <div key={order._id} className="order-card" style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}>
                            <span className="badge badge-open">Available</span>
                            <h3 style={{ color: '#2e7d32', marginTop: '10px' }}>{getAllLanguagesName(order)}</h3>
                            <p>Quantity: {order.quantity} kg</p>
                            <p>Broker: {order.brokerId?.name}</p>
                            <span className="price-tag">Price: ₨ {order.finalPrice?.toFixed(2)}/kg</span>

                            <button 
                                className="btn-contact" 
                                onClick={() => handleContact(order._id)}
                                style={{
                                    marginTop: '15px',
                                    width: '100%'
                                }}
                            >
                                💬 Contact Broker
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MarketOrders;
