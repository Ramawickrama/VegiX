import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#27ae60', '#e74c3c', '#3498db', '#f39c12', '#9b59b6'];

const FarmerPrediction = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || 'en';
  const [vegetables, setVegetables] = useState([]);
  const [selectedVeg, setSelectedVeg] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [supplyDemand, setSupplyDemand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocalizedVegName = (veg) => {
    if (!veg) return 'Unknown';
    const nameEn = veg.name || 'Unknown';
    const nameSi = veg.nameSi || '';
    const nameTa = veg.nameTa || '';

    if (currentLanguage === 'si' && nameSi) return `${nameEn} | ${nameSi}`;
    if (currentLanguage === 'ta' && nameTa) return `${nameEn} | ${nameTa}`;
    if (nameSi || nameTa) return `${nameEn} | ${nameSi || ''} ${nameTa ? '| ' + nameTa : ''}`.replace(/\s+\|\s*$/, '').replace(/\s+\|\s+\|/g, ' |');
    return nameEn;
  };

  const getSelectedVegName = () => {
    const veg = vegetables.find(v => v._id === selectedVeg);
    return getLocalizedVegName(veg);
  };

  const fetchVegetables = async () => {
    try {
      setLoading(true);
      const res = await API.get('/vegetables');
      const veggies = res.data?.data || res.data || [];
      setVegetables(veggies);
      if (veggies.length > 0 && !selectedVeg) {
        setSelectedVeg(veggies[0]._id);
      }
    } catch (err) {
      console.error('Error fetching vegetables:', err);
      setError('Failed to load vegetables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVegetables();
  }, []);

  useEffect(() => {
    if (selectedVeg) {
      fetchPriceHistory(selectedVeg);
      fetchSupplyDemand(selectedVeg, selectedDate);
    }
  }, [selectedVeg, selectedDate]);

  const fetchPriceHistory = async (vegId) => {
    try {
      setChartLoading(true);
      const res = await API.get(`/analytics/price-trend/${vegId}`);
      const data = res.data || [];

      const formattedData = Array.isArray(data) ? data.map(item => ({
        date: item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
        price: Number(item.price) || Number(item.pricePerKg) || 0
      })) : [];

      setPriceHistory(formattedData);
    } catch (err) {
      console.error('Error fetching price history:', err);
      setPriceHistory([]);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchSupplyDemand = async (vegId, date) => {
    try {
      setChartLoading(true);
      const res = await API.get(`/analytics/supply-demand?vegetableId=${vegId}&date=${date}`);
      const data = res.data;

      if (data && (data.supply > 0 || data.demand > 0)) {
        setSupplyDemand({
          supply: Number(data.supply) || 0,
          demand: Number(data.demand) || 0,
          supplyPercent: Number(data.supplyPercent) || 0,
          demandPercent: Number(data.demandPercent) || 0,
          vegetableName: data.vegetableName || getSelectedVegName(),
          date: data.date || selectedDate
        });
      } else {
        setSupplyDemand({
          supply: 0,
          demand: 0,
          supplyPercent: 0,
          demandPercent: 0,
          vegetableName: data?.vegetableName || getSelectedVegName(),
          date: data?.date || selectedDate,
          noData: true
        });
      }
    } catch (err) {
      console.error('Error fetching supply/demand:', err);
      setSupplyDemand({
        supply: 0,
        demand: 0,
        supplyPercent: 0,
        demandPercent: 0,
        noData: true,
        vegetableName: getSelectedVegName(),
        date: selectedDate
      });
    } finally {
      setChartLoading(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const pieData = supplyDemand && !supplyDemand.noData ? [
    { name: 'Supply', value: supplyDemand.supplyPercent || 50, kg: supplyDemand.supply },
    { name: 'Demand', value: supplyDemand.demandPercent || 50, kg: supplyDemand.demand }
  ] : [];

  if (loading) {
    return (
      <div className="admin-page">
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>📈 Price Trends & Analytics</h1>
        <p>Historical price data and market supply/demand analysis</p>
      </div>

      <div className="page-content">
        {error && (
          <div style={{ padding: '15px', background: '#fee2e2', borderRadius: '8px', marginBottom: '20px', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
          padding: '20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333' }}>
              Select Vegetable:
            </label>
            <select
              value={selectedVeg}
              onChange={(e) => setSelectedVeg(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                width: '100%',
                background: 'white'
              }}
            >
              {vegetables.map(veg => (
                <option key={veg._id} value={veg._id}>
                  {getLocalizedVegName(veg)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333' }}>
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              max={getTodayDate()}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                width: '100%',
                background: 'white'
              }}
            />
          </div>
        </div>

        {chartLoading ? (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p>Loading chart data...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Price History Line Chart */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '20px', color: '#27ae60' }}>📊 Price Trend (Last 7 Days)</h3>
              {priceHistory.length > 0 ? (
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val) => `Rs ${val}`}
                      />
                      <Tooltip
                        formatter={(value) => [`Rs ${value}`, 'Price']}
                        labelStyle={{ color: '#333' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#27ae60"
                        strokeWidth={3}
                        dot={{ fill: '#27ae60', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                  No price history available
                </div>
              )}
              <p style={{ marginTop: '15px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                Showing historical prices from database records
              </p>
            </div>

            {/* Supply vs Demand Pie Chart */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '10px', color: '#3498db' }}>
                🥧 Supply vs Demand
              </h3>
              <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                {supplyDemand?.vegetableName || getSelectedVegName()} - {selectedDate}
              </p>

              {supplyDemand && !supplyDemand.noData ? (
                <>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                          labelLine={true}
                        >
                          <Cell key="supply" fill={COLORS[0]} />
                          <Cell key="demand" fill={COLORS[1]} />
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value}% (${(props.payload.kg || 0).toLocaleString()} kg)`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                        {supplyDemand.supply.toLocaleString()} kg
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Total Supply</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                        {supplyDemand.demand.toLocaleString()} kg
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Total Demand</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{
                  height: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '48px' }}>📊</div>
                  <div>No supply or demand data available for selected date</div>
                </div>
              )}
              <p style={{ marginTop: '15px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                Supply = Farmer posts | Demand = Buyer orders
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FarmerPrediction;
