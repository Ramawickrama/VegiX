import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const API_URL = `${API_BASE_URL}/api`;

const DemandForecastChart = () => {
  const [vegetables, setVegetables] = useState([]);
  const [selectedVegetable, setSelectedVegetable] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVegetables();
  }, []);

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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVegetable) {
      fetchForecast();
    }
  }, [selectedVegetable]);

  const fetchForecast = async () => {
    if (!selectedVegetable) return;
    
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/forecast/${selectedVegetable}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Forecast API response:', response.data);
      setForecastData(response.data || null);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Failed to load forecast data. Please try again.');
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  const triggerForecast = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/forecast/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchForecast();
    } catch (err) {
      console.error('Error triggering forecast:', err);
      setError('Failed to generate forecast');
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

  const getGrowthIndicator = () => {
    if (!forecastData?.forecasts || forecastData.forecasts.length === 0) return null;
    const forecasts = forecastData.forecasts;
    const firstWeek = forecasts.slice(0, 7);
    const lastWeek = forecasts.slice(-7);
    const firstAvg = firstWeek.reduce((sum, d) => sum + (d.predictedDemand || 0), 0) / firstWeek.length;
    const lastAvg = lastWeek.reduce((sum, d) => sum + (d.predictedDemand || 0), 0) / lastWeek.length;
    const growth = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;
    return { 
      growth: growth.toFixed(1), 
      trend: growth > 5 ? 'increasing' : growth < -5 ? 'decreasing' : 'stable' 
    };
  };

  const growthIndicator = getGrowthIndicator();

  const chartData = (forecastData?.forecasts || []).map(item => ({
    date: formatDate(item.date),
    dateRaw: item.date,
    predictedPrice: item.predictedPrice || 0,
    predictedDemand: item.predictedDemand || 0,
    priceTrend: item.priceTrend || 'stable',
    demandTrend: item.demandTrend || 'stable',
  }));

  if (loading) {
    return (
      <div className="admin-page">
        <div className="page-header">
          <h1>📊 30-Day Demand Forecast</h1>
          <p>AI-powered demand prediction using Weighted Moving Average</p>
        </div>
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
        <h1>📊 30-Day Demand Forecast</h1>
        <p>AI-powered demand prediction using Weighted Moving Average</p>
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
                {veg.name}
              </option>
            ))}
          </select>
          <button onClick={triggerForecast} className="refresh-btn" disabled={loading}>
            🔄 Generate Forecast
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ padding: '10px', background: '#fee', borderRadius: '4px', marginBottom: '15px' }}>
            {error}
            <button onClick={fetchForecast} style={{ marginLeft: '10px', padding: '5px 10px' }}>Retry</button>
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
                <div className="stat-value">Rs.{forecastData.currentData?.currentPrice?.toFixed(2) || 0}/kg</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Today's Demand</div>
                <div className="stat-value">{forecastData.currentData?.todayDemand?.toFixed(0) || 0} kg</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">30-Day Avg Forecast</div>
                <div className="stat-value">
                  {forecastData.forecasts.length
                    ? Math.round(forecastData.forecasts.reduce((sum, d) => sum + (d.predictedDemand || 0), 0) / forecastData.forecasts.length)
                    : 0} kg
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Growth Indicator</div>
                <div className={`stat-value ${growthIndicator?.trend === 'increasing' ? 'positive' : growthIndicator?.trend === 'decreasing' ? 'negative' : ''}`}>
                  {growthIndicator ? (
                    <>
                      {growthIndicator.trend === 'increasing' ? '📈' : growthIndicator.trend === 'decreasing' ? '📉' : '➡️'}
                      {' '}{growthIndicator.growth > 0 ? '+' : ''}{growthIndicator.growth}%
                    </>
                  ) : 'N/A'}
                </div>
              </div>
            </div>

            <div className="data-card">
              <h3>📈 30-Day Demand Forecast Chart</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'predictedPrice' ? `Rs.${value.toFixed(2)}/kg` : `${value.toFixed(0)} kg`,
                      name === 'predictedPrice' ? 'Predicted Price' : 'Predicted Demand'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predictedDemand" 
                    stroke="#4CAF50" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#demandGradient)" 
                    name="predictedDemand"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {growthIndicator?.trend === 'decreasing' && (
              <div className="alert-card warning" style={{ marginTop: '15px' }}>
                <span className="alert-icon">⚠️</span>
                <div className="alert-content">
                  <h4>Low Supply Warning</h4>
                  <p>Demand is projected to decrease. Consider adjusting harvest schedules or exploring alternative markets.</p>
                </div>
              </div>
            )}

            {growthIndicator?.trend === 'increasing' && (
              <div className="alert-card success" style={{ marginTop: '15px' }}>
                <span className="alert-icon">🔥</span>
                <div className="alert-content">
                  <h4>Demand Surge Alert</h4>
                  <p>High demand expected in the next 30 days. This is an excellent time to harvest and sell!</p>
                </div>
              </div>
            )}

            <div className="data-card" style={{ marginTop: '20px' }}>
              <h3>Detailed Forecast Data</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Predicted Price</th>
                    <th>Predicted Demand</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.forecasts.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td>{formatDate(item.date)}</td>
                      <td>Rs.{item.predictedPrice?.toFixed(2) || 0}</td>
                      <td>{item.predictedDemand?.toFixed(0) || 0} kg</td>
                      <td>
                        {item.demandTrend === 'up' ? (
                          <span className="trend-badge increasing">📈 High</span>
                        ) : item.demandTrend === 'down' ? (
                          <span className="trend-badge decreasing">📉 Low</span>
                        ) : (
                          <span className="trend-badge stable">➡️ Stable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {forecastData.forecasts.length > 10 && (
                <p className="more-data">... and {forecastData.forecasts.length - 10} more days</p>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <p>No forecast data available for this vegetable.</p>
            <button onClick={triggerForecast} className="primary-btn" style={{ marginTop: '15px' }}>
              Generate Forecast Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemandForecastChart;
