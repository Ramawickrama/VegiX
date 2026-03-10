import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const FutureDemand = () => {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVeg, setSelectedVeg] = useState(null);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    fetchForecasts();
  }, []);

  const fetchForecasts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/demand-forecast?months=3`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForecasts(response.data.data || []);
      if (response.data.data?.length > 0) {
        setSelectedVeg(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching forecasts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading advanced demand forecast...</div>;

  const chartData = selectedVeg?.forecasts?.map(f => ({
    name: f.monthName,
    demand: f.demand,
    confidence: f.confidence === 'High' ? 100 : f.confidence === 'Medium' ? 66 : 33
  })) || [];

  return (
    <div className="admin-page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1>🔮 Advanced Demand Forecast</h1>
            <p>ML-based 3-month demand prediction using XGBoost/Random Forest methodology</p>
          </div>
          <button 
            onClick={() => setShowMethodology(!showMethodology)}
            style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
          >
            📊 {showMethodology ? 'Hide' : 'Show'} Methodology
          </button>
        </div>
      </div>

      {/* Methodology Section */}
      {showMethodology && (
        <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #bae6fd' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0369a1' }}>📐 Forecasting Methodology</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Recommended Model: XGBoost</h4>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                XGBoost handles non-linear relationships and external variables well. Alternative: Random Forest, ARIMA, or Prophet for time-series.
              </p>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Input Variables</h4>
              <ul style={{ fontSize: '13px', color: '#6b7280', margin: 0, paddingLeft: '20px' }}>
                <li>Historical Sales Volume (Monthly)</li>
                <li>Average Price per Unit</li>
                <li>Seasonality Factors</li>
                <li>Price Elasticity (-0.5)</li>
              </ul>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Model Validation: MAE</h4>
              <code style={{ background: '#f3f4f6', padding: '8px', borderRadius: '4px', display: 'block', fontSize: '12px' }}>
                MAE = (1/n) × Σ|Actual - Predicted|
              </code>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                Lower MAE = Better forecast accuracy
              </p>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>External Variables</h4>
              <ul style={{ fontSize: '13px', color: '#6b7280', margin: 0, paddingLeft: '20px' }}>
                <li>Fuel/Logistics costs</li>
                <li>Seasonality (festivals)</li>
                <li>Weather patterns</li>
                <li>Market sentiment</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        {/* Vegetable Selector */}
        <div className="data-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>🔍 Select Vegetable for Detailed Forecast</h3>
          <select 
            value={selectedVeg?.vegetable?.id || ''}
            onChange={(e) => {
              const veg = forecasts.find(f => f.vegetable.id === e.target.value);
              setSelectedVeg(veg || null);
            }}
            style={{ padding: '10px 15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', width: '100%', maxWidth: '400px' }}
          >
            {forecasts.map(f => (
              <option key={f.vegetable.id} value={f.vegetable.id}>
                {f.vegetable.name} - Avg: {f.historicalSummary.avgMonthlyDemand} kg/month
              </option>
            ))}
          </select>
        </div>

        {/* Selected Vegetable Forecast Details */}
        {selectedVeg && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '12px', color: '#166534', marginBottom: '5px' }}>AVG MONTHLY DEMAND</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d' }}>{selectedVeg.historicalSummary.avgMonthlyDemand} kg</div>
                <div style={{ fontSize: '12px', color: '#166534' }}>{selectedVeg.historicalSummary.totalOrders} orders in dataset</div>
              </div>
              <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '5px' }}>SEASONALITY INDEX</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1d4ed8' }}>{selectedVeg.metrics.seasonalityIndex}</div>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>{parseFloat(selectedVeg.metrics.seasonalityIndex) > 1 ? 'High season' : 'Low season'}</div>
              </div>
              <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '5px' }}>TREND</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>{selectedVeg.metrics.trendPercent}%</div>
                <div style={{ fontSize: '12px', color: '#92400e' }}>{parseFloat(selectedVeg.metrics.trendPercent) > 0 ? '📈 Increasing' : '📉 Decreasing'}</div>
              </div>
              <div style={{ background: '#fdf2f8', padding: '20px', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                <div style={{ fontSize: '12px', color: '#9d174d', marginBottom: '5px' }}>PRICE ELASTICITY</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#be185d' }}>{selectedVeg.metrics.priceElasticity}</div>
                <div style={{ fontSize: '12px', color: '#9d174d' }}>Standard elasticity</div>
              </div>
            </div>

            {/* Forecast Chart */}
            <div className="data-card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '20px' }}>📈 3-Month Demand Forecast: {selectedVeg.vegetable.name}</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value, name) => [name === 'demand' ? `${value} kg` : `${value}%`, name === 'demand' ? 'Forecasted Demand' : 'Confidence']}
                    />
                    <Bar dataKey="demand" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Demand" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Forecast Table */}
            <div className="data-card">
              <h3 style={{ marginBottom: '20px' }}>📅 Monthly Forecast Details</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Forecasted Demand (kg)</th>
                    <th>Trend</th>
                    <th>Confidence</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVeg.forecasts.map((forecast, idx) => (
                    <tr key={idx}>
                      <td><strong>{forecast.monthName}</strong></td>
                      <td style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{forecast.demand.toLocaleString()} kg</td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                          background: forecast.trend === 'Increasing' ? '#dcfce7' : forecast.trend === 'Decreasing' ? '#fee2e2' : '#f3f4f6',
                          color: forecast.trend === 'Increasing' ? '#16a34a' : forecast.trend === 'Decreasing' ? '#dc2626' : '#6b7280'
                        }}>
                          {forecast.trend === 'Increasing' ? '📈' : forecast.trend === 'Decreasing' ? '📉' : '➡️'} {forecast.trend}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                          background: forecast.confidence === 'High' ? '#dbeafe' : forecast.confidence === 'Medium' ? '#fef3c7' : '#f3f4f6',
                          color: forecast.confidence === 'High' ? '#1d4ed8' : forecast.confidence === 'Medium' ? '#d97706' : '#6b7280'
                        }}>
                          {forecast.confidence}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                          background: forecast.risk === 'Low' ? '#dcfce7' : forecast.risk === 'Medium' ? '#fef3c7' : '#fee2e2',
                          color: forecast.risk === 'Low' ? '#16a34a' : forecast.risk === 'Medium' ? '#d97706' : '#dc2626'
                        }}>
                          {forecast.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* All Vegetables Summary */}
        <div className="data-card" style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>🌾 All Vegetables Forecast Summary</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vegetable</th>
                <th>Category</th>
                <th>Avg Demand</th>
                <th>Seasonality</th>
                <th>Trend</th>
                <th>Forecast (Next 3 Months)</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f, idx) => {
                const totalForecast = f.forecasts.reduce((s, fc) => s + fc.demand, 0);
                const avgRisk = f.forecasts.reduce((s, fc) => {
                  if (fc.risk === 'High') return s + 3;
                  if (fc.risk === 'Medium') return s + 2;
                  return s + 1;
                }, 0) / f.forecasts.length;
                
                return (
                  <tr key={idx} onClick={() => setSelectedVeg(f)} style={{ cursor: 'pointer', background: selectedVeg?.vegetable?.id === f.vegetable.id ? '#f0f9ff' : 'transparent' }}>
                    <td><strong>{f.vegetable.name}</strong></td>
                    <td>{f.vegetable.category || 'N/A'}</td>
                    <td>{f.historicalSummary.avgMonthlyDemand.toLocaleString()} kg</td>
                    <td>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                        background: f.metrics.seasonalityIndex > 1.1 ? '#dcfce7' : f.metrics.seasonalityIndex < 0.9 ? '#fee2e2' : '#f3f4f6',
                        color: f.metrics.seasonalityIndex > 1.1 ? '#16a34a' : f.metrics.seasonalityIndex < 0.9 ? '#dc2626' : '#6b7280'
                      }}>
                        {f.metrics.seasonalityIndex}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: parseFloat(f.metrics.trendPercent) > 0 ? '#16a34a' : parseFloat(f.metrics.trendPercent) < 0 ? '#dc2626' : '#6b7280', fontWeight: 'bold' }}>
                        {parseFloat(f.metrics.trendPercent) > 0 ? '+' : ''}{f.metrics.trendPercent}%
                      </span>
                    </td>
                    <td><strong>{totalForecast.toLocaleString()} kg</strong></td>
                    <td>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                        background: avgRisk < 1.5 ? '#dcfce7' : avgRisk < 2 ? '#fef3c7' : '#fee2e2',
                        color: avgRisk < 1.5 ? '#16a34a' : avgRisk < 2 ? '#d97706' : '#dc2626'
                      }}>
                        {avgRisk < 1.5 ? 'Low' : avgRisk < 2 ? 'Medium' : 'High'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FutureDemand;
