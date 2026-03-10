import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/BrokerBuyer.css';
import { API_BASE_URL } from '../services/api';

const BrokerMarketPrices = () => {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Please login to view market prices');
                    setLoading(false);
                    return;
                }
                const response = await axios.get(`${API_BASE_URL}/api/broker/market-prices/today`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPrices(response.data || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching market prices:', err);
                setError(err.response?.data?.message || 'Failed to load market prices');
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
    }, []);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="broker-buyer-page">
                <div className="page-header">
                    <h1>💹 Today's Market Prices</h1>
                    <p>Prices issued by Admin for the entire ecosystem</p>
                </div>
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading market prices...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="broker-buyer-page">
                <div className="page-header">
                    <h1>💹 Today's Market Prices</h1>
                    <p>Prices issued by Admin for the entire ecosystem</p>
                </div>
                <div style={{ textAlign: 'center', padding: '60px', background: '#fee2e2', borderRadius: '12px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
                    <h3 style={{ color: '#c0392b' }}>Error Loading Prices</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="broker-buyer-page">
            <div className="page-header">
                <h1>💹 Today's Market Prices</h1>
                <p>Prices issued by Admin for the entire ecosystem</p>
            </div>

            {/* Table View */}
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '16px', textAlign: 'left' }}>Veg ID</th>
                            <th style={{ padding: '16px', textAlign: 'left' }}>Vegetable Name</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>Current Price (Rs/kg)</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>Min Price</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>Max Price</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(prices || []).length > 0 ? (
                            prices.map((market, index) => (
                                <tr
                                    key={market?.vegCode || index}
                                    style={{
                                        borderBottom: '1px solid #f0f0f0',
                                        background: index % 2 === 0 ? 'white' : '#f8f9fa'
                                    }}
                                >
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            background: '#27ae60',
                                            color: 'white',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontWeight: '700',
                                            fontSize: '0.9rem'
                                        }}>
                                            {market?.vegCode || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: '600', color: '#333' }}>
                                        {market?.vegetableName || 'Unknown'}
                                        {(market?.vegetableNameSi || market?.vegetableNameTa) && (
                                            <div style={{ fontWeight: '400', fontSize: '0.82rem', color: '#666', marginTop: '2px' }}>
                                                {[market.vegetableNameSi, market.vegetableNameTa].filter(Boolean).join(' | ')}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#27ae60', fontSize: '1.1rem' }}>
                                        Rs {market?.price?.toLocaleString() || 0}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', color: '#666' }}>
                                        Rs {market?.minPrice?.toLocaleString() || 0}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', color: '#666' }}>
                                        Rs {market?.maxPrice?.toLocaleString() || 0}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', color: '#666' }}>
                                        {formatDate(market?.lastUpdated)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    No market prices available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Card Grid (Alternative View) */}
            <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#333' }}>Quick View</h3>
            <div className="card-grid">
                {(prices || []).map((market) => (
                    <div key={market?.vegCode} className="order-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{
                                background: '#27ae60',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontWeight: '700',
                                fontSize: '0.85rem'
                            }}>
                                {market?.vegCode || 'N/A'}
                            </span>
                            <span className="badge badge-open">Active</span>
                        </div>
                        <h3>
                            {market?.vegetableName || 'Unknown'}
                            {(market?.vegetableNameSi || market?.vegetableNameTa) && (
                                <div style={{ fontWeight: '400', fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                                    {[market.vegetableNameSi, market.vegetableNameTa].filter(Boolean).join(' | ')}
                                </div>
                            )}
                        </h3>
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                                Min: Rs {market?.minPrice?.toLocaleString() || 0} | Max: Rs {market?.maxPrice?.toLocaleString() || 0}
                            </p>
                        </div>
                        <span className="price-tag">Rs {market?.price?.toLocaleString() || 0}/kg</span>
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                            Updated: {formatDate(market?.lastUpdated)}
                        </p>
                    </div>
                ))}
            </div>

            {(!prices || prices.length === 0) && (
                <div style={{ textAlign: 'center', padding: '60px', background: '#f8f9fa', borderRadius: '12px', marginTop: '20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
                    <h3>No Market Prices Available</h3>
                    <p>Please check back later for updated prices.</p>
                </div>
            )}

            <style>{`
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #e0e0e0;
                    border-top-color: #27ae60;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 768px) {
                    table {
                        display: block;
                        overflow-x: auto;
                    }
                }
            `}</style>
        </div>
    );
};

export default BrokerMarketPrices;
