import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const API_URL = `${API_BASE_URL}/api`;

const FarmerForecast = ({ selectedVegetable, vegetableName }) => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedVegetable) {
      fetchForecast();
    } else {
      setForecastData(null);
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
      console.log('Farmer Forecast:', response.data);
      setForecastData(response.data || null);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Unable to load forecast');
      setForecastData(null);
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

  const chartData = (forecastData?.forecasts || []).slice(0, 7).map(f => ({
    date: formatDate(f.date),
    price: f.predictedPrice || 0,
  }));

  if (!selectedVegetable) {
    return (
      <div className="farmer-forecast-card" style={{ padding: '20px', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px' }}>
        <p style={{ color: '#666', margin: 0 }}>📊 Select a vegetable to see market predictions</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="farmer-forecast-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
        <p style={{ color: '#666', margin: 0 }}>Loading forecast...</p>
      </div>
    );
  }

  if (error || !forecastData || !forecastData.forecasts || forecastData.forecasts.length === 0) {
    return (
      <div className="farmer-forecast-card" style={{ padding: '20px', textAlign: 'center', background: '#fff3cd', borderRadius: '8px' }}>
        <p style={{ color: '#856404', margin: '0 0 10px 0' }}>⚠️ {error || 'No forecast data available'}</p>
        <button 
          onClick={fetchForecast} 
          style={{ 
            padding: '8px 20px', 
            background: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const isHighDemand = (forecastData.currentData?.demandGrowthRate || 0) > 0.1;
  const avgForecastPrice = forecastData.forecasts.length > 0
    ? forecastData.forecasts.reduce((sum, f) => sum + (f.predictedPrice || 0), 0) / forecastData.forecasts.length
    : 0;

  const demandTrend = (forecastData.currentData?.demandGrowthRate || 0);
  const demandTrendStr = demandTrend > 0.05 ? 'up' : demandTrend < -0.05 ? 'down' : 'stable';

  return (
    <div className="farmer-forecast-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>
          📊 Market Forecast: {vegetableName || forecastData.vegetable?.name}
        </h3>
        {isHighDemand && (
          <span style={{ 
            background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', 
            color: 'white', 
            padding: '6px 12px', 
            borderRadius: '20px', 
            fontSize: '0.75rem', 
            fontWeight: 'bold',
            animation: 'pulse 2s infinite'
          }}>
            🔥 HIGH DEMAND
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>Current Price</span>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>
            Rs.{forecastData.currentData?.currentPrice?.toFixed(2) || 0}/kg
          </span>
        </div>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>7-Day Avg</span>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>
            Rs.{avgForecastPrice.toFixed(2)}/kg
          </span>
        </div>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>Demand Trend</span>
          <span style={{ 
            fontSize: '1rem', 
            fontWeight: 'bold', 
            color: demandTrendStr === 'up' ? '#4CAF50' : demandTrendStr === 'down' ? '#f44336' : '#666' 
          }}>
            {getTrendIcon(demandTrendStr)} {(demandTrend * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {isHighDemand && (
        <div style={{ 
          background: 'linear-gradient(135deg, #FFE5E5, #FFF3E0)', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px', 
          textAlign: 'center', 
          color: '#E65100',
          fontWeight: 500 
        }}>
          🔥 High demand expected! This is a good time to sell.
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>7-Day Price Trend</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 10 }} />
            <Tooltip 
              formatter={(value) => [`Rs.${value.toFixed(2)}/kg`, 'Price']}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#4CAF50" 
              strokeWidth={2}
              dot={{ fill: '#4CAF50', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>📈 Next 7 Days</h4>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {forecastData.forecasts.slice(0, 7).map((day, index) => (
            <div key={index} style={{ flex: 1, minWidth: '70px', background: '#f8f9fa', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>
                {formatDate(day.date)}
              </span>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#333' }}>
                Rs.{day.predictedPrice?.toFixed(0) || 0}
              </span>
              <span style={{ fontSize: '0.8rem' }}>
                {getTrendIcon(day.priceTrend)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FarmerForecast;
