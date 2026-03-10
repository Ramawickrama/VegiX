import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import VegetableSelect from '../components/VegetableSelect';
import { useToast } from '../components/Toast';
import { formatPrice } from '../utils/priceUtils';
import '../styles/BrokerBuyer.css';
import { API_BASE_URL } from '../services/api';

const API_BASE = `${API_BASE_URL}/api/buyer`;

const BrokerSellingPosts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, count: 0 });
    const [filters, setFilters] = useState({
        vegetableId: '',
        priceMin: '',
        priceMax: '',
        district: '',
        area: '',
        village: '',
        date: '',
        dateFrom: '',
        dateTo: '',
        minQuantity: '',
        maxQuantity: ''
    });

    const districts = [
        "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
        "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
        "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
        "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
        "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
    ];

    const fetchPosts = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const params = new URLSearchParams();
            if (filters.vegetableId) params.append('vegetableId', filters.vegetableId);
            if (filters.priceMin) params.append('priceMin', filters.priceMin);
            if (filters.priceMax) params.append('priceMax', filters.priceMax);
            if (filters.district) params.append('district', filters.district);
            if (filters.area) params.append('area', filters.area);
            if (filters.village) params.append('village', filters.village);
            if (filters.date) params.append('date', filters.date);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            if (filters.minQuantity) params.append('minQuantity', filters.minQuantity);
            if (filters.maxQuantity) params.append('maxQuantity', filters.maxQuantity);
            params.append('page', page);
            params.append('limit', 20);

            const res = await axios.get(`${API_BASE}/market-orders?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setPosts(res.data.posts || []);
            setPagination({
                page: res.data.page || 1,
                limit: res.data.limit || 20,
                totalPages: res.data.totalPages || 1,
                count: res.data.count || 0
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchPosts(1);
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
            priceMin: '',
            priceMax: '',
            district: '',
            area: '',
            village: '',
            date: '',
            dateFrom: '',
            dateTo: '',
            minQuantity: '',
            maxQuantity: ''
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchPosts(newPage);
        }
    };

    const navigate = useNavigate();
    const toast = useToast();

    const handleContact = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            console.log('[BrokerSellingPosts] Contacting broker for post:', postId);
            
            const res = await axios.post(`${API_BASE}/market-orders/${postId}/contact`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[BrokerSellingPosts] Contact response:', res.data);

            if (res.data.success && res.data.conversationId) {
                navigate(`/buyer/messages?conversationId=${res.data.conversationId}`);
            } else if (res.data.otherUser) {
                navigate(`/buyer/messages?email=${encodeURIComponent(res.data.otherUser.email)}`);
            } else {
                alert('Failed to start conversation: ' + (res.data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('[BrokerSellingPosts] Error contacting broker:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to contact broker';
            alert(errorMsg);
        }
    };

    const handleAddToCart = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/cart/${postId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success('Added to cart!');
                navigate('/buyer/cart');
            } else {
                toast.error(res.data.message || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('[BrokerSellingPosts] Error adding to cart:', error);
            toast.error(error.response?.data?.message || 'Failed to add to cart');
        }
    };

    const hasFilters = filters.vegetableId || filters.priceMin || filters.priceMax || 
                      filters.dateFrom || filters.dateTo ||
                      filters.minQuantity || filters.maxQuantity;

    return (
        <div className="broker-buyer-page">
            <div className="page-header">
                <h1>🛒 Broker Selling Posts</h1>
                <p>Browse and contact brokers directly</p>
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
                            Vegetable
                        </label>
                        <VegetableSelect
                            value={filters.vegetableId}
                            onChange={handleVegetableSelect}
                            label=""
                            required={false}
                            showPrice={false}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                            Price Range (₨)
                        </label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="number"
                                name="priceMin"
                                value={filters.priceMin}
                                onChange={handleFilterChange}
                                placeholder="Min"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                            />
                            <input
                                type="number"
                                name="priceMax"
                                value={filters.priceMax}
                                onChange={handleFilterChange}
                                placeholder="Max"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                            Date Range
                        </label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="date"
                                name="dateFrom"
                                value={filters.dateFrom}
                                onChange={handleFilterChange}
                                placeholder="From"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                            />
                            <input
                                type="date"
                                name="dateTo"
                                value={filters.dateTo}
                                onChange={handleFilterChange}
                                placeholder="To"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                            Kilo Range (kg)
                        </label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="number"
                                name="minQuantity"
                                value={filters.minQuantity}
                                onChange={handleFilterChange}
                                placeholder="Min kg"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                            />
                            <input
                                type="number"
                                name="maxQuantity"
                                value={filters.maxQuantity}
                                onChange={handleFilterChange}
                                placeholder="Max kg"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                            />
                        </div>
                    </div>
                </div>

                {hasFilters && (
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            onClick={clearFilters}
                            style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#e74c3c', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Clear Filters
                        </button>
                        <span style={{ padding: '8px 16px', background: '#f5f5f5', borderRadius: '20px', fontSize: '0.9rem', color: '#666' }}>
                            {pagination.count} posts found
                        </span>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>
            ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '12px' }}>
                    <div style={{ fontSize: '64px' }}>📭</div>
                    <h3 style={{ color: '#666' }}>No Posts Found</h3>
                    <p style={{ color: '#999' }}>{hasFilters ? 'Try adjusting your filters' : 'No broker selling posts available'}</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                        {posts.map(post => (
                            <div key={post._id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', color: '#2e7d32' }}>{post.vegetableName}</h3>
                                        <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                                            Available
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#2e7d32' }}>{post.quantity} kg</div>
                                        <small style={{ color: '#666' }}>Available</small>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                                        <div>
                                            <small style={{ color: '#666' }}>Price</small>
                                            <div style={{ fontWeight: '700', fontSize: '18px', color: '#d63031' }}>{formatPrice(post.sellingPrice)}/kg</div>
                                        </div>
                                    </div>
                                    {post.location && (
                                        <div>
                                            <small style={{ color: '#666' }}>Location</small>
                                            <div style={{ fontWeight: '500' }}>
                                                {[post.location.district, post.location.area, post.location.village].filter(Boolean).join(', ') || 'Not specified'}
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ marginTop: '5px' }}>
                                        <small style={{ color: '#666' }}>Broker</small>
                                        <div style={{ fontWeight: '500' }}>{post.broker?.name || 'Unknown'}</div>
                                    </div>
                                    <div style={{ marginTop: '5px' }}>
                                        <small style={{ color: '#666' }}>Posted</small>
                                        <div style={{ fontWeight: '500' }}>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        onClick={() => handleAddToCart(post._id)}
                                        style={{ flex: 1, padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
                                    >
                                        🛒 Add to Cart
                                    </button>
                                    <button 
                                        onClick={() => handleContact(post._id)}
                                        style={{ flex: 1, padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
                                    >
                                        💬 Contact
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                            <button 
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '8px', background: pagination.page === 1 ? '#f5f5f5' : 'white', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                Previous
                            </button>
                            <span style={{ padding: '10px 20px' }}>
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button 
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '8px', background: pagination.page === pagination.totalPages ? '#f5f5f5' : 'white', cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer' }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BrokerSellingPosts;
