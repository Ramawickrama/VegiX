import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import PageLayout from '../components/PageLayout';
import { useToast } from '../components/Toast';
import { formatPrice } from '../utils/priceUtils';
import './LiveMarket.css';

const LiveMarket = ({ user }) => {
  const { t } = useTranslation();
  const toast = useToast();
  
  const [prices, setPrices] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const [filters, setFilters] = useState({
    vegetable: '',
    market: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [pricesRes, vegRes, marketRes] = await Promise.all([
        API.get('/live-market/latest'),
        API.get('/live-market/vegetables'),
        API.get('/live-market/markets')
      ]);
      
      if (pricesRes.data?.success) {
        setPrices(pricesRes.data.data || []);
        setLastUpdated(pricesRes.data.lastUpdated);
      }
      
      if (vegRes.data?.success) {
        setVegetables(vegRes.data.data || []);
      }
      
      if (marketRes.data?.success) {
        setMarkets(marketRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      toast.error(t('errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (user?.role !== 'admin') {
      toast.error(t('errors.unauthorized'));
      return;
    }
    
    setRefreshing(true);
    try {
      const res = await API.post('/live-market/refresh');
      if (res.data?.success) {
        toast.success(t('success.updated'));
        fetchInitialData();
      }
    } catch (err) {
      console.error('Error refreshing prices:', err);
      toast.error(t('errors.genericError'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = async (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    
    try {
      setLoading(true);
      const params = {};
      if (newFilters.vegetable) params.vegetable = newFilters.vegetable;
      if (newFilters.market) params.market = newFilters.market;
      
      const res = await API.get('/live-market/latest', { params });
      if (res.data?.success) {
        setPrices(res.data.data || []);
      }
    } catch (err) {
      console.error('Error filtering prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceChangeClass = (change) => {
    if (change > 0) return 'price-up';
    if (change < 0) return 'price-down';
    return 'price-stable';
  };

  const formatPrice = (price) => {
    return `Rs. ${price?.toFixed(2) || '0.00'}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const translateVegetable = (name) => {
    return t(`vegetables.${name}`, name);
  };

  return (
    <PageLayout>
      <div className="live-market-container">
        <div className="market-header">
          <div className="header-title">
            <h1>🥬 {t('market.marketPrices')}</h1>
            <p>{t('app.title')}</p>
          </div>
          
          <div className="header-actions">
            {lastUpdated && (
              <span className="last-updated">
                {t('dashboard.lastUpdated')}: {formatDate(lastUpdated)}
              </span>
            )}
            {user?.role === 'admin' && (
              <button 
                className="btn-refresh"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? t('common.loading') : t('common.refresh')}
              </button>
            )}
          </div>
        </div>

        <div className="market-filters">
          <div className="filter-group">
            <label>{t('orders.vegetableName')}</label>
            <select 
              name="vegetable" 
              value={filters.vegetable}
              onChange={handleFilterChange}
            >
              <option value="">{t('common.all')} {t('cart.vegetable')}</option>
              {vegetables.map((veg) => (
                <option key={veg.name} value={veg.name}>
                  {translateVegetable(veg.name)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>{t('common.location')}</label>
            <select 
              name="market" 
              value={filters.market}
              onChange={handleFilterChange}
            >
              <option value="">{t('common.all')} {t('common.location')}</option>
              {markets.map((market) => (
                <option key={market.name} value={market.name}>
                  {market.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="market-loading">
            <div className="loading-spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : prices.length === 0 ? (
          <div className="market-empty">
            <span className="empty-icon">📊</span>
            <h3>{t('common.noData')}</h3>
            <p>{t('market.noOrdersAvailable')}</p>
          </div>
        ) : (
          <div className="market-grid">
            {prices.map((price, index) => (
              <div key={price._id || index} className="price-card">
                <div className="price-card-header">
                  <h3>{translateVegetable(price.vegetableName)}</h3>
                  <span className="market-badge">{price.location}</span>
                </div>
                
                <div className="price-card-body">
                  <div className="price-row">
                    <span className="price-label">{t('market.averagePrice')}</span>
                    <span className="price-value main-price">
                      {formatPrice(price.pricePerKg)}
                      <span className={`price-change ${getPriceChangeClass(price.priceChange)}`}>
                        {price.priceChange > 0 ? '↑' : price.priceChange < 0 ? '↓' : '→'} 
                        {Math.abs(price.priceChangePercentage || 0)}%
                      </span>
                    </span>
                  </div>
                  
                  <div className="price-range">
                    <div className="range-item">
                      <span className="range-label">{t('market.lowestPrice')}</span>
                      <span className="range-value">{formatPrice(price.minPrice)}</span>
                    </div>
                    <div className="range-item">
                      <span className="range-label">{t('market.highestPrice')}</span>
                      <span className="range-value">{formatPrice(price.maxPrice)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="price-card-footer">
                  <span className="unit">{t('common.kg')}</span>
                  <span className="updated">{formatDate(price.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default LiveMarket;
