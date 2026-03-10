import React from 'react';
import './OrderCard.css';

const BrokerBuyingRequestCard = ({ 
  request, 
  onViewDetails, 
  onAccept, 
  onReject, 
  onChat 
}) => {
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'active';
      case 'pending': return 'pending';
      case 'accepted': return 'accepted';
      case 'completed': return 'completed';
      case 'closed': return 'closed';
      case 'cancelled': return 'cancelled';
      default: return 'active';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="order-card broker-buying-card">
      <div className="order-card-header">
        <h3>{request.vegetableName || 'Vegetable'}</h3>
        <span className={`order-status ${getStatusClass(request.status)}`}>
          {request.status === 'active' ? 'OPEN' : request.status?.toUpperCase() || 'OPEN'}
        </span>
      </div>
      <div className="order-card-body">
        <div className="order-detail">
          <span className="detail-label">Required Quantity:</span>
          <span className="detail-value">{request.requiredQuantity || 0} {request.unit || 'kg'}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Offered Price:</span>
          <span className="detail-value price">Rs {request.offeredPrice || 0}/{request.unit || 'kg'}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Total Value:</span>
          <span className="detail-value total">Rs {request.totalPrice || 0}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Broker Name:</span>
          <span className="detail-value">{request.brokerId?.name || 'N/A'}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Location:</span>
          <span className="detail-value">{request.brokerId?.location || 'N/A'}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Delivery Date:</span>
          <span className="detail-value">{formatDate(request.deliveryDate)}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Posted Date:</span>
          <span className="detail-value">{formatDate(request.createdAt)}</span>
        </div>
      </div>
      <div className="order-card-footer broker-buying-actions">
        <button className="btn-view" onClick={() => onViewDetails?.(request._id)}>
          View Details
        </button>
        <button className="btn-accept" onClick={() => onAccept?.(request._id)}>
          Accept
        </button>
        <button className="btn-reject" onClick={() => onReject?.(request._id)}>
          Reject
        </button>
        <button className="btn-chat" onClick={() => onChat?.(request)}>
          Chat
        </button>
      </div>
    </div>
  );
};

export default BrokerBuyingRequestCard;
