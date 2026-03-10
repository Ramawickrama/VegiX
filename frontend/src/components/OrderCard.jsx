import React from 'react';
import { useTranslation } from 'react-i18next';
import './OrderCard.css';

const OrderCard = ({ 
  order, 
  onViewDetails, 
  onAccept, 
  onReject, 
  onChat, 
  actionLabel = 'View Details',
  isBrokerOrder = false,
  chatLoading = false
}) => {
  const { t } = useTranslation();
  
  const getTranslatedVegetable = (name) => {
    return t(`vegetables.${name}`, name);
  };
  
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'active';
      case 'pending': return 'pending';
      case 'accepted': return 'accepted';
      case 'completed': return 'completed';
      case 'rejected': return 'rejected';
      case 'cancelled': return 'cancelled';
      case 'in-progress': return 'in-progress';
      default: return 'active';
    }
  };

  if (isBrokerOrder) {
    return (
      <div className="order-card broker-order-card">
        <div className="order-card-header">
          <h3>{getTranslatedVegetable(order.vegetableName) || t('orders.vegetableName')}</h3>
          <span className={`order-status ${getStatusClass(order.status)}`}>
            {order.status?.toUpperCase() || 'ACTIVE'}
          </span>
        </div>
        <div className="order-card-body">
          <div className="order-detail">
            <span className="detail-label">Required Quantity:</span>
            <span className="detail-value">{order.requiredQuantity || 0} kg</span>
          </div>
          <div className="order-detail">
            <span className="detail-label">Offered Price:</span>
            <span className="detail-value price">Rs {order.offeredPrice || 0}/Kg</span>
          </div>
          <div className="order-detail">
            <span className="detail-label">Total Price:</span>
            <span className="detail-value total">Rs {order.totalPrice || 0}</span>
          </div>
          <div className="order-detail">
            <span className="detail-label">Broker Name:</span>
            <span className="detail-value">{order.brokerId?.name || 'N/A'}</span>
          </div>
          <div className="order-detail">
            <span className="detail-label">Broker Phone:</span>
            <span className="detail-value">{order.brokerId?.phone || 'N/A'}</span>
          </div>
          <div className="order-detail">
            <span className="detail-label">Order Posted:</span>
            <span className="detail-value">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
        <div className="order-card-footer broker-actions">
          <button className="btn-secondary" onClick={() => onViewDetails?.(order._id)}>
            View Details
          </button>
          <button className="btn-accept" onClick={() => onAccept?.(order._id)}>
            Accept Order
          </button>
          <button className="btn-reject" onClick={() => onReject?.(order._id)}>
            Reject Order
          </button>
          <button className="btn-chat" onClick={() => onChat?.(order)} disabled={chatLoading}>
            {chatLoading ? 'Connecting...' : 'Chat with Broker'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-card">
      <div className="order-card-header">
        <h3>{getTranslatedVegetable(order.vegetable?.name) || t('orders.vegetableName')}</h3>
        <span className={`order-status ${order.status}`}>{order.status?.toUpperCase()}</span>
      </div>
      <div className="order-card-body">
        <div className="order-detail">
          <span className="detail-label">Order #:</span>
          <span className="detail-value">{order.orderNumber}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Quantity:</span>
          <span className="detail-value">{order.quantity} {order.unit}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Price per Unit:</span>
          <span className="detail-value">₨ {order.pricePerUnit}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Total Price:</span>
          <span className="detail-value total">₨ {order.totalPrice}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Quality:</span>
          <span className="detail-value">{order.quality}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Location:</span>
          <span className="detail-value">{order.location || 'N/A'}</span>
        </div>
      </div>
      <div className="order-card-footer">
        <button
          className="btn-primary"
          onClick={() => onViewDetails(order._id)}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
