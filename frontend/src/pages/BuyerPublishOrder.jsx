import React, { useState } from 'react';
import axios from 'axios';
import '../styles/PublishOrder.css';
import { API_BASE_URL } from '../services/api';

const BuyerPublishOrder = () => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    vegetableId: '',
    quantity: '',
    unit: 'kg',
    pricePerUnit: '',
    location: '',
    quality: 'standard',
    description: '',
    deliveryDate: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/buyer/publish-order`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage('Order published successfully! Brokers will see your request.');
      setFormData({
        vegetableId: '',
        quantity: '',
        unit: 'kg',
        pricePerUnit: '',
        location: '',
        quality: 'standard',
        description: '',
        deliveryDate: '',
      });

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error publishing order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-order-page">
      <div className="page-header">
        <h1>📋 Place Order</h1>
        <p>Request vegetables from brokers (Visible only to brokers)</p>
      </div>

      <div className="page-content">
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="order-form">
          <h2>Order Details</h2>

          <div className="form-group">
            <label>Vegetable Needed *</label>
            <input
              type="text"
              name="vegetableId"
              placeholder="Vegetable ID (e.g., tomato, onion)"
              value={formData.vegetableId}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                name="quantity"
                placeholder="0"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Unit</label>
              <select name="unit" value={formData.unit} onChange={handleChange}>
                <option value="kg">Kilogram (kg)</option>
                <option value="lb">Pound (lb)</option>
                <option value="dozen">Dozen</option>
              </select>
            </div>

            <div className="form-group">
              <label>Budget Per Unit (₨) *</label>
              <input
                type="number"
                name="pricePerUnit"
                placeholder="0.00"
                value={formData.pricePerUnit}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quality Required</label>
              <select name="quality" value={formData.quality} onChange={handleChange}>
                <option value="economy">Economy</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="form-group">
              <label>Delivery Location *</label>
              <input
                type="text"
                name="location"
                placeholder="Your restaurant/market location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Needed By</label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Special Requirements</label>
            <textarea
              name="description"
              placeholder="Organic, pesticide-free, specific size, etc..."
              rows="4"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="order-summary">
            <h3>Order Budget</h3>
            <div className="summary-item">
              <span>Quantity:</span>
              <span>{formData.quantity || '0'} {formData.unit}</span>
            </div>
            <div className="summary-item total">
              <span>Total Budget:</span>
              <span>₨ {(parseFloat(formData.quantity || 0) * parseFloat(formData.pricePerUnit || 0)).toFixed(2)}</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Publishing...' : 'Place Order (Visible to Brokers Only)'}
          </button>
        </form>

        <div className="info-box">
          <h3>ℹ️ How it works:</h3>
          <ul>
            <li>Your order is posted and visible only to brokers</li>
            <li>Brokers review your request and respond with quotes</li>
            <li>Choose the best broker offer for your needs</li>
            <li>Complete the transaction directly with the broker</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BuyerPublishOrder;
