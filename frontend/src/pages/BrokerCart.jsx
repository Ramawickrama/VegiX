import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import PageLayout from '../components/PageLayout';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useToast } from '../components/Toast';
import { SkeletonCard } from '../components/Skeleton';
import { formatPrice } from '../utils/priceUtils';
import './BrokerCart.css';

const BrokerCart = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || 'en';
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, item: null });
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  const getLocalizedVegetableName = (item) => {
    if (currentLanguage === 'si' && item.vegetableNameSi) {
      return item.vegetableNameSi;
    }
    if (currentLanguage === 'ta' && item.vegetableNameTa) {
      return item.vegetableNameTa;
    }
    return item.vegetableName || item.vegetable?.name || 'N/A';
  };
  const toast = useToast();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get('/broker/cart');
      if (response.data?.success) {
        setCart(response.data.cart || { items: [] });
      } else {
        setCart({ items: [] });
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(t('errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (item) => {
    setCancelDialog({ isOpen: true, item });
  };

  const confirmRemove = async () => {
    const item = cancelDialog.item;
    try {
      setProcessing(item._id);
      await API.delete(`/broker/cart/${item.sellOrderId}`);
      toast.success(t('cart.itemRemoved'));
      fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.message || t('cart.failedToRemove'));
    } finally {
      setProcessing(null);
      setCancelDialog({ isOpen: false, item: null });
    }
  };

  const handleBuy = async (item) => {
    try {
      setProcessing(item._id);
      navigate(`/broker/payment/${item.sellOrderId}`);
    } catch (err) {
      toast.error(t('cart.initiatePayment'));
    } finally {
      setProcessing(null);
    }
  };

  const handleChat = async (item) => {
    try {
      setProcessing(item._id);
      const response = await API.post(`/broker/farmer-orders/${item.sellOrderId}/contact`);
      if (response.data.success) {
        const farmerEmail = response.data.otherUser.email;
        navigate(`/broker/messages?email=${encodeURIComponent(farmerEmail)}`);
      } else {
        toast.error(response.data.message || 'Failed to start conversation');
      }
    } catch (err) {
      console.error('Error contacting farmer:', err);
      toast.error(err.response?.data?.message || 'Failed to contact farmer');
    } finally {
      setProcessing(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="cart-skeleton">
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} height="150px" />
          ))}
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

    if (!cart.items || cart.items.length === 0) {
      return (
        <EmptyState
          icon="🛒"
          title={t('cart.cartEmpty')}
          message={t('cart.cartEmptyMessage', { market: t('cart.browseFarmerPosts') })}
          actionLabel={t('cart.browseFarmerPosts')}
          onAction={() => navigate('/broker/view-farmer-orders')}
        />
      );
    }

    return (
      <div className="cart-items">
        {cart.items.map(item => (
          <div key={item._id} className="cart-item">
            <div className="cart-item-header">
              <h3>
                {item.vegetableName}
                {item.vegetableNameSi && <span className="veg-name-si"> | {item.vegetableNameSi}</span>}
                {item.vegetableNameTa && <span className="veg-name-ta"> | {item.vegetableNameTa}</span>}
              </h3>
              <span className="badge badge-bought">Bought</span>
            </div>
            <div className="cart-item-details">
              <div className="detail-row">
                <span className="detail-label">Quantity:</span>
                <span className="detail-value">{item.quantity} kg</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Price/kg:</span>
                <span className="detail-value">{formatPrice(item.pricePerKg)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Value:</span>
                <span className="detail-value total">{formatPrice(item.totalValue)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{item.location?.district}, {item.location?.village}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Farmer:</span>
                <span className="detail-value">{item.farmerId?.name || 'N/A'}</span>
              </div>
            </div>
            <div className="cart-item-actions">
              <button
                className="btn-cancel"
                onClick={() => handleRemove(item)}
                disabled={processing === item._id}
              >
                Cancel
              </button>
              <button
                className="btn-buy"
                onClick={() => handleBuy(item)}
                disabled={processing === item._id}
              >
                {processing === item._id ? 'Processing...' : 'Buy Now'}
              </button>
              <button
                className="btn-chat"
                onClick={() => handleChat(item)}
                disabled={processing === item._id}
                title="Chat with farmer"
              >
                💬 Chat
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
      subtitle="Items you've bidded from farmers"
      loading={loading}
      error={error}
      onRetry={fetchCart}
    >
      {renderContent()}

      <ConfirmationDialog
        isOpen={cancelDialog.isOpen}
        title="Remove from Cart"
        message="Are you sure you want to remove this item from your cart? The sell order will become active again."
        confirmText="Remove"
        cancelText="Keep"
        onConfirm={confirmRemove}
        onCancel={() => setCancelDialog({ isOpen: false, item: null })}
        type="warning"
        loading={!!processing}
      />
    </PageLayout>
  );
};

export default BrokerCart;
