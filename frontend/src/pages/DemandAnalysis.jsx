import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Area
} from 'recharts';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const DemandAnalysis = () => {
  const [demands, setDemands] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show3Tier, setShow3Tier] = useState(false);
  const [forecast3Tier, setForecast3Tier] = useState([]);
  const [selectedVeg, setSelectedVeg] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const REFRESH_INTERVAL = 30000;

  useEffect(() => {
    fetchDemandAnalysis();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDemandAnalysis(false);
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchDemandAnalysis = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem('token');
      
      const [demandRes, vegRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/demand-analysis`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/vegetables`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      setDemands(demandRes.data.demands || []);
      setVegetables(vegRes.data.data || []);
      setLastUpdated(new Date());

      const supplyHistory = demandRes.data.charts?.supplyHistory || [];
      const demandHistory = demandRes.data.charts?.demandHistory || [];
      const allDates = [...new Set([...supplyHistory.map(d => d._id), ...demandHistory.map(d => d._id)])].sort();

      const combined = allDates.map(date => ({
        name: date,
        supply: supplyHistory.find(d => d._id === date)?.total || 0,
        demand: demandHistory.find(d => d._id === date)?.total || 0,
      }));

      setChartData(combined);
    } catch (error) {
      console.error('Error fetching demand analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetch3TierForecast = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/demand-analysis-3tier`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForecast3Tier(response.data.data || []);
      if (response.data.data?.length > 0) {
        setSelectedVeg(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching 3-tier forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeDemand = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/admin/analyze-demand`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDemandAnalysis();
    } catch (error) {
      console.error('Error analyzing demand:', error);
      setLoading(false);
    }
  };

  const getVegetableData = (vegName) => {
    const demand = demands.find(d => d.vegetable?.name === vegName);
    return demand || null;
  };

  const toggle3Tier = () => {
    if (!show3Tier) {
      fetch3TierForecast();
    }
    setShow3Tier(!show3Tier);
  };

  if (loading) return <div className="loading">Loading demand analysis...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1>📊 Demand & Supply Analysis</h1>
            <p>Market trends with 3-tier forecasting model (Tactical, Operational, Strategic)</p>
            {lastUpdated && (
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
                {autoRefresh && <span style={{ marginLeft: '10px', color: '#10b981' }}>● Auto-refresh enabled</span>}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px' }}>Auto-refresh</span>
            </label>
            <button 
              onClick={toggle3Tier}
              style={{ padding: '10px 20px', background: show3Tier ? '#6b7280' : '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              {show3Tier ? '📈 Hide 3-Tier Forecast' : '🔮 Show 3-Tier Forecast'}
            </button>
          </div>
        </div>
      </div>

      {/* 3-Tier Forecast Section */}
      {show3Tier && (
        <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #bae6fd' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0369a1' }}>🔮 3-Tier Forecasting Model</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>📅 7-Day Tactical</h4>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Weighted Moving Average (W1=0.5, W2=0.3, W3=0.2)</p>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>Confidence: 90%</div>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>📆 30-Day Operational</h4>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Linear Regression + Price Elasticity</p>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>Confidence: 75%</div>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>🗓️ 3-Month Strategic</h4>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Seasonal Index + Event Spikes</p>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#d97706', fontWeight: 'bold' }}>Confidence: 60%</div>
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        <div className="action-bar">
          <button onClick={analyzeDemand} className="btn-primary">🔄 Re-run Market Analysis</button>
        </div>

        {/* TREND CHART */}
        <div className="data-card chart-section">
          <h2>Market Activity (Last 7 Days)</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="demand" stroke="#e74c3c" strokeWidth={2} name="Total Demand (Kg)" />
                <Line type="monotone" dataKey="supply" stroke="#2ecc71" strokeWidth={2} name="Total Supply (Kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3-Tier Forecast Details */}
        {show3Tier && selectedVeg && (
          <>
            {/* Vegetable Selector */}
            <div className="data-card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px' }}>Select Vegetable for Detailed Forecast</h3>
              <select 
                value={selectedVeg.vegetable.id}
                onChange={(e) => {
                  const veg = forecast3Tier.find(f => f.vegetable.id === e.target.value);
                  setSelectedVeg(veg || null);
                }}
                style={{ padding: '10px 15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', width: '100%', maxWidth: '400px' }}
              >
                {forecast3Tier.map(f => (
                  <option key={f.vegetable.id} value={f.vegetable.id}>
                    {f.vegetable.name} - Current Price: Rs {f.vegetable.currentPrice}
                  </option>
                ))}
              </select>
            </div>

            {/* 3-Tier Forecast Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {/* 7-Day Tactical */}
              <div className="data-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <h3>📅 7-Day Tactical Forecast</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6', margin: '15px 0' }}>
                  {selectedVeg.forecasts.tactical7Day.forecast.toLocaleString()} kg
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6b7280' }}>Confidence</span>
                  <span style={{ fontWeight: 'bold', color: '#059669' }}>{selectedVeg.forecasts.tactical7Day.confidence}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6b7280' }}>Methodology</span>
                  <span style={{ fontSize: '12px' }}>Weighted MA</span>
                </div>
                {selectedVeg.forecasts.tactical7Day.shockApplied && (
                  <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '6px', marginTop: '10px', fontSize: '12px' }}>
                    ⚠️ Shock variables applied (weather/fuel)
                  </div>
                )}
              </div>

              {/* 30-Day Operational */}
              <div className="data-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                <h3>📆 30-Day Operational Forecast</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6', margin: '15px 0' }}>
                  {selectedVeg.forecasts.operational30Day.forecast.toLocaleString()} kg
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6b7280' }}>Confidence</span>
                  <span style={{ fontWeight: 'bold', color: '#059669' }}>{selectedVeg.forecasts.operational30Day.confidence}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6b7280' }}>Trend</span>
                  <span style={{ fontWeight: 'bold', color: selectedVeg.forecasts.operational30Day.trend === 'Increasing' ? '#16a34a' : selectedVeg.forecasts.operational30Day.trend === 'Decreasing' ? '#dc2626' : '#6b7280' }}>
                    {selectedVeg.forecasts.operational30Day.trend === 'Increasing' ? '📈' : selectedVeg.forecasts.operational30Day.trend === 'Decreasing' ? '📉' : '➡️'} {selectedVeg.forecasts.operational30Day.trend}
                  </span>
                </div>
                {selectedVeg.forecasts.operational30Day.priceAdjustment !== 'Normal' && (
                  <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '6px', marginTop: '10px', fontSize: '12px' }}>
                    💰 {selectedVeg.forecasts.operational30Day.priceAdjustment}
                  </div>
                )}
              </div>

              {/* 3-Month Strategic */}
              <div className="data-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <h3>🗓️ 3-Month Strategic Forecast</h3>
                <div style={{ marginBottom: '15px' }}>
                  {selectedVeg.forecasts.strategic3Month.forecasts?.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid #eee' : 'none' }}>
                      <span style={{ fontWeight: '500' }}>{f.monthName}</span>
                      <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{f.forecast.toLocaleString()} kg</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6b7280' }}>Confidence</span>
                  <span style={{ fontWeight: 'bold', color: '#d97706' }}>{selectedVeg.forecasts.strategic3Month.confidence}%</span>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Base: {selectedVeg.forecasts.strategic3Month.baseDemand?.toLocaleString()} kg/month
                </div>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="data-card" style={{ marginBottom: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#166534' }}>🎯 Overall Confidence Score</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: selectedVeg.confidence >= 75 ? '#16a34a' : selectedVeg.confidence >= 60 ? '#d97706' : '#dc2626' }}>
                  {selectedVeg.confidence}%
                </div>
                <div>
                  <p style={{ margin: 0, color: '#166534' }}>
                    {selectedVeg.confidence >= 75 ? 'High confidence - Short-term forecasts are reliable' : 
                     selectedVeg.confidence >= 60 ? 'Medium confidence - Use for planning' : 
                     'Low confidence - Need more historical data'}
                  </p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Data points: {selectedVeg.dataQuality.dailyDataPoints} daily, {selectedVeg.dataQuality.monthlyDataPoints} monthly
                  </p>
                </div>
              </div>
            </div>

            {/* All Vegetables Summary */}
            <div className="data-card">
              <h3>All Vegetables 3-Tier Forecast Summary</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vegetable</th>
                    <th>Price/kg</th>
                    <th>7-Day Forecast</th>
                    <th>30-Day Trend</th>
                    <th>3-Month Total</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast3Tier.map((f, idx) => (
                    <tr key={idx} onClick={() => setSelectedVeg(f)} style={{ cursor: 'pointer', background: selectedVeg?.vegetable?.id === f.vegetable.id ? '#f0f9ff' : 'transparent' }}>
                      <td><strong>{f.vegetable.name}</strong></td>
                      <td>Rs {f.vegetable.currentPrice}</td>
                      <td>{f.forecasts.tactical7Day.forecast.toLocaleString()} kg</td>
                      <td>
                        <span style={{ color: f.forecasts.operational30Day.trend === 'Increasing' ? '#16a34a' : f.forecasts.operational30Day.trend === 'Decreasing' ? '#dc2626' : '#6b7280', fontWeight: 'bold' }}>
                          {f.forecasts.operational30Day.trend === 'Increasing' ? '📈' : f.forecasts.operational30Day.trend === 'Decreasing' ? '📉' : '➡️'} {f.forecasts.operational30Day.trend}
                        </span>
                      </td>
                      <td><strong>{f.forecasts.strategic3Month.forecasts?.reduce((s, fc) => s + fc.forecast, 0).toLocaleString()} kg</strong></td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                          background: f.confidence >= 75 ? '#dcfce7' : f.confidence >= 60 ? '#fef3c7' : '#fee2e2',
                          color: f.confidence >= 75 ? '#16a34a' : f.confidence >= 60 ? '#d97706' : '#dc2626'
                        }}>
                          {f.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Supply & Demand Breakdown - All Vegetables */}
        <div className="data-card">
          <h2>Supply & Demand Breakdown</h2>
          {vegetables.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vegetable</th>
                  <th>Current Demand</th>
                  <th>Current Supply</th>
                  <th>Market Trend</th>
                  <th>Forecast (next 7d)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vegetables.map((veg) => {
                  const demandData = getVegetableData(veg.name);
                  const demandQty = demandData?.demandQuantity || 0;
                  const supplyQty = demandData?.supplyQuantity || 0;
                  const trend = demandData?.demandTrend || 'stable';
                  const forecast = demandData?.forecastedDemand || 0;
                  
                  return (
                    <tr key={veg._id}>
                      <td><strong>{veg.name}</strong></td>
                      <td>{demandQty} Kg</td>
                      <td>{supplyQty} Kg</td>
                      <td>
                        <span className={`badge ${trend}`}>
                          {trend === 'increasing' ? '📈 High Demand' :
                            trend === 'decreasing' ? '📉 Surplus' : '➡️ Stable'}
                        </span>
                      </td>
                      <td><strong style={{ color: '#2980b9' }}>{forecast} Kg</strong></td>
                      <td>
                        {demandQty > supplyQty ? (
                          <span className="badge high" style={{ backgroundColor: '#e74c3c', color: 'white' }}>Shortage</span>
                        ) : demandQty > 0 || supplyQty > 0 ? (
                          <span className="badge safe" style={{ backgroundColor: '#2ecc71', color: 'white' }}>Good</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#9ca3af', color: 'white' }}>No Data</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No vegetable data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandAnalysis;
