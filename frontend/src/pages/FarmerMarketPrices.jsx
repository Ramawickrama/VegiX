import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import { formatPrice } from '../utils/priceUtils';

const FarmerMarketPrices = () => {
    const { i18n } = useTranslation();
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPrices = async () => {
        try {
            setLoading(true);
            const response = await API.get('/market-prices/today');

            // Safely extract prices array
            const pricesData = Array.isArray(response.data) ? response.data :
                Array.isArray(response.data?.prices) ? response.data.prices : [];

            setPrices(pricesData);
            setError(null);
        } catch (err) {
            console.error('Error fetching market prices:', err);
            setError(err.response?.data?.message || 'Failed to load market prices. Please try again.');
            setPrices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return 'N/A';
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div style={{ padding: '50px', textAlign: 'center' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading market prices...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-page">
                <div className="page-header">
                    <h1>📊 Today's Market Prices</h1>
                    <p>Live vegetable prices updated by the Admin</p>
                </div>
                <div className="page-content">
                    <div style={{ padding: '30px', textAlign: 'center', background: '#fee2e2', borderRadius: '8px' }}>
                        <p style={{ color: '#b91c1c', marginBottom: '15px' }}>{error}</p>
                        <button
                            onClick={fetchPrices}
                            style={{
                                padding: '10px 20px',
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>📊 Today's Market Prices</h1>
                <p>Live vegetable prices updated by the Admin</p>
            </div>

            <div className="page-content">
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666' }}>
                        {prices.length} vegetable{prices.length !== 1 ? 's' : ''} available today
                    </span>
                    <button
                        onClick={fetchPrices}
                        style={{
                            padding: '8px 16px',
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Refresh
                    </button>
                </div>

                {prices.length === 0 ? (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        background: '#f9f9f9',
                        borderRadius: '8px'
                    }}>
                        <p style={{ color: '#666', fontSize: '16px' }}>No Market Prices Available Today</p>
                        <p style={{ color: '#999' }}>Prices will be updated by the admin</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            background: 'white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            <thead>
                                <tr style={{ background: '#27ae60', color: 'white' }}>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Vegetable ID</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Vegetable Name</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Price (Rs/Kg)</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Min Price</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Max Price</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prices.map((price, index) => (
                                    <tr
                                        key={price._id || index}
                                        style={{
                                            borderBottom: '1px solid #f0f0f0',
                                            background: index % 2 === 0 ? '#fff' : '#f9f9f9'
                                        }}
                                    >
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                background: '#27ae60',
                                                color: 'white',
                                                padding: '4px 10px',
                                                borderRadius: '4px',
                                                fontWeight: '700',
                                                fontSize: '0.85rem'
                                            }}>
                                                {price.vegCode || price.vegetableId || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: '600' }}>
                                            <div style={{ fontSize: i18n.language === 'en' ? '1rem' : '1.15rem' }}>
                                                {i18n.language === 'si' ? (price.nameSi || price.vegetable?.nameSi || price.vegetableName) :
                                                    i18n.language === 'ta' ? (price.nameTa || price.vegetable?.nameTa || price.vegetableName) :
                                                        (price.vegetableName || 'Unknown')}
                                            </div>
                                            {i18n.language === 'en' && (price.nameSi || price.nameTa || price.vegetable?.nameSi) && (
                                                <div style={{ fontSize: '14px', color: '#666', fontWeight: '500', marginTop: '6px' }}>
                                                    {price.nameSi || price.vegetable?.nameSi || ''}
                                                    {(price.nameTa || price.vegetable?.nameTa) ? ' | ' + (price.nameTa || price.vegetable?.nameTa) : ''}
                                                </div>
                                            )}
                                            {i18n.language !== 'en' && (
                                                <div style={{ fontSize: '0.85rem', color: '#888', fontWeight: '400', marginTop: '2px' }}>
                                                    {price.vegetableName}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>
                                            {formatPrice(price.pricePerKg || 0)}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', color: '#666' }}>
                                            {formatPrice(price.minPrice || 0)}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', color: '#666' }}>
                                            {formatPrice(price.maxPrice || 0)}
                                        </td>
                                        <td style={{ padding: '12px', color: '#999', fontSize: '14px' }}>
                                            {formatDate(price.updatedAt || price.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FarmerMarketPrices;
