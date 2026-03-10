import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const API_URL = `${API_BASE_URL}/api`;

const AdminForecastDashboard = () => {
  const [vegetables, setVegetables] = useState([]);
  const [selectedVegetable, setSelectedVegetable] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVegetables();
  }, []);

  useEffect(() => {
    if (selectedVegetable) {
      fetchForecast(selectedVegetable);
    }
  }, [selectedVegetable]);

  const fetchVegetables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/vegetables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const veggies = response.data || [];
      setVegetables(veggies);
      if (veggies.length > 0) {
        setSelectedVegetable(veggies[0]._id);
      }
    } catch (err) {
      console.error('Error fetching vegetables:', err);
      setError('Failed to load vegetables');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (vegetableId) => {
    if (!vegetableId) return;
    
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/forecast/${vegetableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Forecast API:', response.data);
      setForecastData(response.data || null);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Failed to load forecast data');
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/forecast/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selectedVegetable) {
        await fetchForecast(selectedVegetable);
      }
      alert('Forecast generated successfully!');
    } catch (err) {
      console.error('Error generating forecast:', err);
      alert('Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const chartData = (forecastData?.forecasts || []).map(f => ({
    date: formatDate(f.date),
    price: f.predictedPrice || 0,
    demand: f.predictedDemand || 0,
    priceTrend: f.priceTrend || 'stable',
    demandTrend: f.demandTrend || 'stable',
  }));

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading forecast data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>📊 30-Day Forecast Dashboard</h1>
        <p>AI-powered demand and price prediction using Moving Average + Trend Growth Method</p>
      </div>

      <div className="page-content">
        <div className="filter-bar">
          <select
            value={selectedVegetable}
            onChange={(e) => setSelectedVegetable(e.target.value)}
            className="vegetable-select"
            disabled={loading}
          >
            {vegetables.map((veg) => (
              <option key={veg._id} value={veg._id}>
                {veg.name} ({veg.category})
              </option>
            ))}
          </select>
          <button onClick={generateForecast} className="refresh-btn" disabled={loading}>
            🔄 Generate Forecast
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ padding: '10px', background: '#fee', borderRadius: '4px', marginBottom: '15px' }}>
            {error}
            <button onClick={() => fetchForecast(selectedVegetable)} style={{ marginLeft: '10px', padding: '5px 10px' }}>Retry</button>
          </div>
        )}

        {forecastData && forecastData.forecasts && forecastData.forecasts.length > 0 ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Vegetable</div>
                <div className="stat-value">{forecastData.vegetable?.name || 'N/A'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Current Price</div>
                <div className="stat-value">
                  Rs.{forecastData.currentData?.currentPrice?.toFixed(2) || 0}/kg
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Today's Demand</div>
                <div className="stat-value">
                  {forecastData.currentData?.todayDemand?.toFixed(0) || 0} kg
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Today's Supply</div>
                <div className="stat-value">
                  {forecastData.currentData?.todaySupply?.toFixed(0) || 0} kg
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Demand Trend</div>
                <div className={`stat-value ${(forecastData.currentData?.demandGrowthRate || 0) > 0 ? 'positive' : (forecastData.currentData?.demandGrowthRate || 0) < 0 ? 'negative' : ''}`}>
                  {getTrendIcon((forecastData.currentData?.demandGrowthRate || 0) > 0.05 ? 'up' : (forecastData.currentData?.demandGrowthRate || 0) < -0.05 ? 'down' : 'stable')}
                  {' '}{(forecastData.currentData?.demandGrowthRate || 0) > 0 ? '+' : ''}{(((forecastData.currentData?.demandGrowthRate || 0) * 100)).toFixed(1)}%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Price Trend</div>
                <div className={`stat-value ${(forecastData.currentData?.priceGrowthRate || 0) > 0 ? 'positive' : (forecastData.currentData?.priceGrowthRate || 0) < 0 ? 'negative' : ''}`}>
                  {getTrendIcon((forecastData.currentData?.priceGrowthRate || 0) > 0.05 ? 'up' : (forecastData.currentData?.priceGrowthRate || 0) < -0.05 ? 'down' : 'stable')}
                  {' '}{(forecastData.currentData?.priceGrowthRate || 0) > 0 ? '+' : ''}{(((forecastData.currentData?.priceGrowthRate || 0) * 100)).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="data-card">
              <h3>📈 30-Day Price & Demand Forecast</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF9800" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF9800" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="price" orientation="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="demand" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'price' ? `Rs.${value.toFixed(2)}/kg` : `${value.toFixed(0)} kg`,
                      name === 'price' ? 'Predicted Price' : 'Predicted Demand'
                    ]}
                  />
                  <Legend />
                  <Area 
                    yAxisId="price"
                    type="monotone" 
                    dataKey="price" 
                    stroke="#FF9800" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#priceGradient)" 
                    name="price"
                  />
                  <Area 
                    yAxisId="demand"
                    type="monotone" 
                    dataKey="demand" 
                    stroke="#4CAF50" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#demandGradient)" 
                    name="demand"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="data-card" style={{ marginTop: '20px' }}>
              <h3>📋 Detailed Forecast Data</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Predicted Price (Rs/kg)</th>
                    <th>Predicted Demand (kg)</th>
                    <th>Price Trend</th>
                    <th>Demand Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.forecasts.slice(0, 15).map((item, index) => (
                    <tr key={index}>
                      <td>{formatDate(item.date)}</td>
                      <td>Rs.{item.predictedPrice?.toFixed(2) || 0}</td>
                      <td>{item.predictedDemand?.toFixed(0) || 0} kg</td>
                      <td>
                        <span className={`trend-badge ${item.priceTrend || 'stable'}`}>
                          {getTrendIcon(item.priceTrend)} {(item.priceTrend || 'stable').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`trend-badge ${item.demandTrend || 'stable'}`}>
                          {getTrendIcon(item.demandTrend)} {(item.demandTrend || 'stable').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {forecastData.forecasts.length > 15 && (
                <p className="more-data">... and {forecastData.forecasts.length - 15} more days</p>
              )}
            </div>

            {(forecastData.currentData?.demandGrowthRate || 0) > 0.1 && (
              <div className="alert-card success" style={{ marginTop: '20px' }}>
                <span className="alert-icon">🔥</span>
                <div className="alert-content">
                  <h4>High Demand Alert</h4>
                  <p>Demand is projected to increase significantly. Consider increasing supply to meet market demand.</p>
                </div>
              </div>
            )}

            {(forecastData.currentData?.demandGrowthRate || 0) < -0.1 && (
              <div className="alert-card warning" style={{ marginTop: '20px' }}>
                <span className="alert-icon">⚠️</span>
                <div className="alert-content">
                  <h4>Low Demand Warning</h4>
                  <p>Demand is projected to decrease. Consider adjusting production or finding alternative markets.</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <p>No forecast data available. Generate a forecast to see predictions.</p>
            <button onClick={generateForecast} className="primary-btn" style={{ marginTop: '15px' }}>
              Generate Forecast Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminForecastDashboard;
