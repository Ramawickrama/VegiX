import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import OrderCard from '../components/OrderCard';
import '../styles/ViewOrders.css';
import { API_BASE_URL } from '../services/api';

const BrokerPublishBuyOrder = () => {
  const [vegetables, setVegetables] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchVegetablesAndPrices();
  }, []);

  const fetchVegetablesAndPrices = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const vegResponse = await axios.get(`${API_BASE_URL}/api/vegetables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // API returns { success, count, data: [...] }
      setVegetables(vegResponse.data.data || []);

      const priceResponse = await axios.get(`${API_BASE_URL}/api/admin/market-prices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const priceMap = {};
      (priceResponse.data.prices || []).forEach((price) => {
        priceMap[price.vegetableId] = price.pricePerKg;
      });
      setMarketPrices(priceMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load vegetables');
    }
  };

  const handleVegetableChange = (e) => {
    const vegetableId = e.target.value;
    setFormData({
      ...formData,
      vegetableId,
    });

    if (vegetableId && marketPrices[vegetableId]) {
      setFormData((prev) => ({
        ...prev,
        pricePerUnit: marketPrices[vegetableId],
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'vegetableId') {
      handleVegetableChange(e);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.vegetableId || !formData.quantity || !formData.pricePerUnit) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Publishing buy order:', formData);
      await axios.post(`${API_BASE_URL}/api/broker/buy-orders`, {
        vegetableId: formData.vegetableId,
        quantityRequired: parseFloat(formData.quantity),
        collectionLocation: formData.location || formData.deliveryDate ? `${formData.location || ''} ${formData.deliveryDate || ''}`.trim() : 'Not specified'
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage('Buy order published successfully!');
      setTimeout(() => {
        navigate('/broker/dashboard');
      }, 1500);
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
      setError(error.response?.data?.message || 'Failed to publish order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-order-page">
      <div className="page-header">
        <h1>🛒 Publish Buy Order</h1>
        <p>Create a buying order to source from farmers</p>
      </div>

      <div className="page-content">
        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="order-form">
          <h2>Buy Order Details</h2>

          <div className="form-group">
            <label>Vegetable *</label>
            <select
              name="vegetableId"
              value={formData.vegetableId}
              onChange={handleVegetableChange}
              required
            >
              <option value="">-- Select Vegetable --</option>
              {vegetables.map((veg) => (
                <option key={veg._id} value={veg._id}>
                  {veg.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity Needed *</label>
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
              <label>Expected Price Per Unit (₨)</label>
              <input
                type="number"
                name="pricePerUnit"
                placeholder="Auto-filled from market price"
                step="0.01"
                value={formData.pricePerUnit}
                onChange={handleChange}
              />
              {marketPrices[formData.vegetableId] && (
                <small>Market base price: ₨{marketPrices[formData.vegetableId]}</small>
              )}
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
              <label>Pickup Location</label>
              <input
                type="text"
                name="location"
                placeholder="Your location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Delivery Date</label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              name="description"
              placeholder="Special requirements, bulk discounts, etc..."
              rows="4"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="order-summary">
            <h3>Expected Cost</h3>
            <div className="summary-item total">
              <span>Total Budget:</span>
              <span>₨ {(parseFloat(formData.quantity || 0) * parseFloat(formData.pricePerUnit || 0)).toFixed(2)}</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Publishing...' : 'Publish Buy Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BrokerPublishBuyOrder;
