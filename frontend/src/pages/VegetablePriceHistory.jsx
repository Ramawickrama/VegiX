import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const VegetablePriceHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [vegetable, setVegetable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const res = await axios.get(`${API_BASE_URL}/api/market-prices/${id}`, { headers });

            setHistory(res.data.historicalData || []);
            setVegetable({
                name: res.data.vegetableName,
                currentPrice: res.data.currentPrice
            });
        } catch (err) {
            setError('Failed to fetch price history');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div className="loading">Loading history data...</div>;

    const chartData = history.map(h => ({
        date: new Date(h.date).toLocaleDateString(),
        price: h.price,
        min: h.min,
        max: h.max
    }));

    return (
        <div className="admin-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <button
                        className="btn-secondary"
                        onClick={() => {
                            if (window.history.length > 1) {
                                navigate(-1);
                            } else {
                                navigate('/admin/market-prices');
                            }
                        }}
                        style={{ marginBottom: '15px' }}
                    >
                        ← Back to List
                    </button>
                    <h1>📈 Price History: {vegetable?.name}</h1>
                    <p>Historical market price trends and daily variations</p>
                </div>
                <div className="data-card" style={{ padding: '10px 20px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Current Market Price</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2ecc71' }}>₨ {vegetable?.currentPrice}/kg</div>
                </div>
            </div>

            <div className="page-content">
                {error && <div className="error-message">{error}</div>}

                <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>

                    {/* CHART CARD */}
                    <div className="data-card" style={{ padding: '20px' }}>
                        <h3>Market Price Trend (Last 30 Days)</h3>
                        <div style={{ width: '100%', height: 400, marginTop: '20px' }}>
                            <ResponsiveContainer>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2ecc71" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="date" />
                                    <YAxis unit="₨" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="price"
                                        stroke="#2ecc71"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorPrice)"
                                        name="Avg Price"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="max"
                                        stroke="#e74c3c"
                                        strokeDasharray="5 5"
                                        name="Max Price"
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="min"
                                        stroke="#3498db"
                                        strokeDasharray="5 5"
                                        name="Min Price"
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* TABLE CARD */}
                    <div className="data-card">
                        <h3>Detailed Daily Logs</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Price (₨/kg)</th>
                                    <th>Min Price</th>
                                    <th>Max Price</th>
                                    <th>Change (₨)</th>
                                    <th>Change (%)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.slice().reverse().map((h, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>{new Date(h.date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 700, color: '#2ecc71' }}>₨ {h.price}</td>
                                        <td>₨ {h.min || (h.price * 0.9).toFixed(0)}</td>
                                        <td>₨ {h.max || (h.price * 1.1).toFixed(0)}</td>
                                        <td style={{
                                            fontWeight: 600,
                                            color: h.change > 0 ? '#e74c3c' : h.change < 0 ? '#2ecc71' : '#666'
                                        }}>
                                            {h.change > 0 ? `+${h.change}` : h.change || 0}
                                        </td>
                                        <td style={{
                                            fontWeight: 600,
                                            color: h.changePct > 0 ? '#e74c3c' : h.changePct < 0 ? '#2ecc71' : '#666'
                                        }}>
                                            {h.changePct ? `${h.changePct > 0 ? '+' : ''}${parseFloat(h.changePct).toFixed(2)}%` : '0.00%'}
                                        </td>
                                        <td>
                                            <span className="badge badge-open">Recorded</span>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No historical data available for this vegetable.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default VegetablePriceHistory;
