import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import ChartCard from '../components/ChartCard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ef4444', '#22c55e'];

const AdminMarketIntelligence = () => {
  const [loading, setLoading] = useState(true);
  const [nationalOverview, setNationalOverview] = useState(null);
  const [demandIndex, setDemandIndex] = useState([]);
  const [seasonalForecast, setSeasonalForecast] = useState([]);
  const [selectedVegetable, setSelectedVegetable] = useState(null);
  const [error, setError] = useState(null);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewRes, demandRes, seasonalRes] = await Promise.all([
        API.get('/intelligence/national-overview'),
        API.get('/intelligence/demand-index'),
        API.get('/intelligence/seasonal-forecast')
      ]);

      setNationalOverview(overviewRes.data?.data || null);
      setDemandIndex(demandRes.data?.data || []);
      setSeasonalForecast(seasonalRes.data?.data || []);
      
      // Auto-select first vegetable if available
      if (demandRes.data?.data?.length > 0 && !selectedVegetable) {
        setSelectedVegetable(demandRes.data.data[0]);
      }
    } catch (err) {
      console.error('Error fetching market intelligence:', err);
      setError(err.response?.data?.message || 'Failed to load market intelligence');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px' }} className="loading-spinner"></div>
        <h3>Loading Market Intelligence...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ padding: '20px', background: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#b91c1c' }}>⚠️ Error</h3>
          <p style={{ color: '#7f1d1d' }}>{error}</p>
          <button 
            onClick={fetchData}
            style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const demandPieData = [
    { name: 'High Demand', value: demandIndex.filter(d => d.demandStatus === 'High Demand').length },
    { name: 'Normal Demand', value: demandIndex.filter(d => d.demandStatus === 'Normal Demand').length },
    { name: 'Low Demand', value: demandIndex.filter(d => d.demandStatus === 'Low Demand').length }
  ].filter(item => item.value > 0);

  const topDemandData = demandIndex
    .sort((a, b) => b.demandIndex - a.demandIndex)
    .slice(0, 10)
    .map(item => ({
      name: item.vegetableName?.substring(0, 12) || 'Unknown',
      demandIndex: item.demandIndex || 0,
      priceAdjustedIndex: item.priceAdjustedIndex || 0,
      seasonalityIndex: item.seasonalityIndex || 0,
      currentPrice: item.currentPrice || 0
    }));

  const selectedVegData = selectedVegetable ? {
    name: selectedVegetable.vegetableName,
    simpleIndex: selectedVegetable.demandIndex,
    priceAdjusted: selectedVegetable.priceAdjustedIndex,
    seasonality: selectedVegetable.seasonalityIndex,
    currentDemand: selectedVegetable.currentPeriod?.demand || 0,
    baseDemand: selectedVegetable.basePeriod?.demand || 0,
    lastYearDemand: selectedVegetable.lastYearPeriod?.demand || 0,
    priceChange: selectedVegetable.priceChangePercent || 0,
    elasticity: selectedVegetable.elasticity
  } : null;

  return (
    <div style={{ padding: '20px' }}>
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1>📊 National Market Intelligence Dashboard</h1>
            <p>Advanced Demand Index Analysis using Agricultural Economics methodology</p>
          </div>
          <button 
            onClick={() => setShowMethodology(!showMethodology)}
            style={{
              padding: '8px 16px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            📖 {showMethodology ? 'Hide' : 'Show'} Methodology
          </button>
        </div>
      </div>

      {/* Methodology Section */}
      {showMethodology && (
        <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #bae6fd' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0369a1' }}>📐 Demand Index Calculation Methodology</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>1. Simple Demand Index</h4>
              <code style={{ background: '#f3f4f6', padding: '8px', borderRadius: '4px', display: 'block', fontSize: '14px' }}>
                I<sub>d</sub> = (Q<sub>t</sub> / Q<sub>b</sub>) × 100
              </code>
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                Q<sub>t</sub> = Current demand (30 days)<br/>
                Q<sub>b</sub> = Base demand (prior 30 days)
              </p>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>2. Price-Adjusted Demand</h4>
              <code style={{ background: '#f3f4f6', padding: '8px', borderRadius: '4px', display: 'block', fontSize: '14px' }}>
                Elasticity = -0.5
              </code>
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                Adjusts for price changes to determine if demand shifts are due to price or consumer preference
              </p>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>3. Seasonality Filter</h4>
              <code style={{ background: '#f3f4f6', padding: '8px', borderRadius: '4px', display: 'block', fontSize: '14px' }}>
                Compare to Same Period Last Year
              </code>
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                Identifies seasonal patterns by comparing current demand to same month previous year
              </p>
            </div>
          </div>
        </div>
      )}

      {/* National Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <ChartCard 
          title="Total Supply (30d)" 
          value={`${(nationalOverview?.totalSupply || 0).toLocaleString()} kg`} 
          icon="📦" 
          color="#3b82f6" 
        />
        <ChartCard 
          title="Total Demand (30d)" 
          value={`${(nationalOverview?.totalDemand || 0).toLocaleString()} kg`} 
          icon="🛒" 
          color="#10b981" 
        />
        <ChartCard 
          title="Active Posts" 
          value={nationalOverview?.totalPosts || 0} 
          icon="📋" 
          color="#8b5cf6" 
        />
        <ChartCard 
          title="Total Orders" 
          value={nationalOverview?.totalOrders || 0} 
          icon="📝" 
          color="#f59e0b" 
        />
        <ChartCard 
          title="Demand Index" 
          value={nationalOverview?.demandIndex || 0} 
          icon="📈" 
          color={nationalOverview?.demandIndex >= 120 ? '#ef4444' : nationalOverview?.demandIndex <= 70 ? '#eab308' : '#22c55e'} 
        />
      </div>

      {/* Vegetable Selector */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px', color: '#1f2937' }}>🔍 Detailed Vegetable Analysis</h3>
        <select 
          value={selectedVegetable?._id || ''}
          onChange={(e) => {
            const veg = demandIndex.find(v => v.vegetableId === e.target.value);
            setSelectedVegetable(veg || null);
          }}
          style={{
            padding: '10px 15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            width: '100%',
            maxWidth: '400px'
          }}
        >
          {demandIndex.map(veg => (
            <option key={veg.vegetableId} value={veg.vegetableId}>
              {veg.vegetableName} - Demand Index: {veg.demandIndex} | Price Adj: {veg.priceAdjustedIndex}
            </option>
          ))}
        </select>
        
        {selectedVegData && (
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '12px', color: '#166534', marginBottom: '5px' }}>SIMPLE DEMAND INDEX</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d' }}>{selectedVegData.simpleIndex}</div>
              <div style={{ fontSize: '12px', color: '#166534' }}>
                Current: {selectedVegData.currentDemand} kg | Base: {selectedVegData.baseDemand} kg
              </div>
            </div>
            <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '5px' }}>PRICE-ADJUSTED INDEX</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1d4ed8' }}>{selectedVegData.priceAdjusted}</div>
              <div style={{ fontSize: '12px', color: '#1e40af' }}>
                Price Change: {selectedVegData.priceChange > 0 ? '+' : ''}{selectedVegData.priceChange}% (Elasticity: {selectedVegData.elasticity})
              </div>
            </div>
            <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '5px' }}>SEASONALITY INDEX</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>{selectedVegData.seasonality}</div>
              <div style={{ fontSize: '12px', color: '#92400e' }}>
                vs Same Period Last Year: {selectedVegData.lastYearDemand} kg
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Demand Index Bar Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>📊 Demand Index by Vegetable</h3>
          {topDemandData.length > 0 ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDemandData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value, name) => {
                      if (name === 'demandIndex') return [`${value}`, 'Simple Index'];
                      if (name === 'priceAdjustedIndex') return [`${value}`, 'Price-Adjusted'];
                      if (name === 'seasonalityIndex') return [`${value}`, 'Seasonality'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="demandIndex" fill="#3b82f6" name="Simple Index" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="priceAdjustedIndex" fill="#8b5cf6" name="Price-Adjusted" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No demand data available</p>
          )}
        </div>

        {/* Demand Status Pie Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>🥧 Market Demand Distribution</h3>
          {demandPieData.length > 0 ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demandPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {demandPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#22c55e' : '#eab308'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No demand distribution data</p>
          )}
        </div>
      </div>

      {/* Detailed Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Demand Index Table */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>🔥 Demand Index Details</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Vegetable</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Simple Idx</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Price Adj</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Seasonal</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {demandIndex
                  .sort((a, b) => b.demandIndex - a.demandIndex)
                  .slice(0, 12)
                  .map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px', fontWeight: '500' }}>{item.vegetableName || 'Unknown'}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: item.demandIndex >= 120 ? '#dc2626' : item.demandIndex <= 70 ? '#ca8a04' : '#16a34a' }}>
                        {item.demandIndex || 0}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '500' }}>{item.priceAdjustedIndex || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '500' }}>{item.seasonalityIndex || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          backgroundColor: item.demandStatus === 'High Demand' ? '#fee2e2' : item.demandStatus === 'Low Demand' ? '#fef9c3' : '#dcfce7',
                          color: item.demandStatus === 'High Demand' ? '#dc2626' : item.demandStatus === 'Low Demand' ? '#ca8a04' : '#16a34a'
                        }}>
                          {item.demandStatus || 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Seasonal Forecast Table */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>📅 Seasonal Forecast</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Vegetable</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Best Month</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Seasonal Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Current Price</th>
                </tr>
              </thead>
              <tbody>
                {seasonalForecast
                  .sort((a, b) => {
                    if (a.seasonalStatus === 'Seasonal High') return -1;
                    if (b.seasonalStatus === 'Seasonal High') return 1;
                    return 0;
                  })
                  .slice(0, 12)
                  .map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px', fontWeight: '500' }}>{item.vegetable || 'Unknown'}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{item.bestMonth || 'N/A'}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          backgroundColor: item.seasonalStatus === 'Seasonal High' ? '#fef9c3' : '#f1f5f9',
                          color: item.seasonalStatus === 'Seasonal High' ? '#a16207' : '#64748b'
                        }}>
                          {item.seasonalStatus || 'Normal'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>Rs {(item.currentPrice || 0).toFixed(0)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Vegetables */}
      {nationalOverview?.topVegetables && nationalOverview.topVegetables.length > 0 && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: '20px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>🏆 Top Vegetables by Price</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
            {nationalOverview.topVegetables.map((veg, idx) => (
              <div key={idx} style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🥬</div>
                <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>{veg.name}</div>
                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>Rs {veg.currentPrice}/kg</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Avg: Rs {veg.avgPrice}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarketIntelligence;
