import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import PageLayout from '../components/PageLayout';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { formatPrice } from '../utils/priceUtils';

const BuyerCart = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getVegetableNameAllLanguages = (item) => {
    const en = item.vegetableName || '';
    const si = item.vegetableNameSi || '';
    const ta = item.vegetableNameTa || '';
    return `${en}${si ? ' | ' + si : ''}${ta ? ' | ' + ta : ''}` || 'N/A';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [user, navigate]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await API.get('/buyer/cart');
      if (res.data.success) {
        setItems(res.data.items || []);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.response?.data?.message || t('errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (brokerSellOrderId) => {
    try {
      const res = await API.delete(`/buyer/cart/${brokerSellOrderId}`);
      if (res.data.success) {
        toast.success(t('cart.itemRemoved'));
        setItems(items.filter(item => item.brokerSellOrderId !== brokerSellOrderId));
      }
    } catch (err) {
      console.error('Error removing item:', err);
      toast.error(err.response?.data?.message || t('cart.failedToRemove'));
    }
  };

  const handleBuy = (brokerSellOrderId) => {
    navigate(`/buyer/payment/${brokerSellOrderId}`);
  };

  const handleChat = (item) => {
    if (item.brokerEmail) {
      navigate(`/messages?email=${encodeURIComponent(item.brokerEmail)}`);
    } else {
      toast.error('Broker email not available');
    }
  };

  const CartContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'grid', gap: '20px' }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} height="150px" />)}
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon="⚠️"
          title={t('cart.failedToLoad')}
          message={error}
          actionLabel={t('common.tryAgain')}
          onAction={fetchCart}
        />
      );
    }

    if (items.length === 0) {
      return (
        <EmptyState
          icon="🛒"
          title={t('cart.cartEmpty')}
          message={t('cart.cartEmptyMessage', { market: t('cart.browseBrokerPosts') })}
          actionLabel={t('common.browseMarket')}
          onAction={() => navigate('/buyer/buyer-broker-orders')}
        />
      );
    }

    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        {items.map(item => (
          <div
            key={item._id}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#2e7d32' }}>
                  {getVegetableNameAllLanguages(item)}
                </h3>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  Broker: {item.brokerName}
                </p>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  Location: {item.location?.district}, {item.location?.village}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#27ae60' }}>
                  {formatPrice(item.pricePerKg)}/kg
                </div>
              </div>
            </div>

            <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Quantity:</span>
                <span style={{ fontWeight: '600' }}>{item.quantity} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Price per kg:</span>
                <span>{formatPrice(item.pricePerKg)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
                <span style={{ fontWeight: '600' }}>Total:</span>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#27ae60' }}>
                  {formatPrice(item.totalValue)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={() => handleBuy(item.brokerSellOrderId)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                🛒 Buy Now
              </button>
              <button
                onClick={() => handleChat(item)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                💬 Chat
              </button>
              <button
                onClick={() => handleRemove(item.brokerSellOrderId)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PageLayout
      title="My Cart"
      subtitle={`${items.length} item${items.length !== 1 ? 's' : ''} in your cart`}
      loading={false}
      error={null}
      onRetry={fetchCart}
    >
      <CartContent />
    </PageLayout>
  );
};

export default BuyerCart;
