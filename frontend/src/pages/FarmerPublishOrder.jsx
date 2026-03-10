import React, { useState, useEffect } from 'react';
import API from '../services/api';
import VegetableSelect from '../components/VegetableSelect';
import '../styles/PublishOrder.css';

const FarmerPublishOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);
  const [formData, setFormData] = useState({
    vegetableId: '',
    vegetableName: '',
    quantity: '',
    unit: 'kg',
    pricePerUnit: '',
    location: '',
    quality: 'standard',
    description: '',
    deliveryDate: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [selectedVegetable, setSelectedVegetable] = useState(null);

  // Auto-fill price when a vegetable is selected via the dropdown component
  const handleVegetableSelection = (veg) => {
    if (!veg) return;

    setSelectedVegetable(veg);
    setFormData((prev) => ({
      ...prev,
      vegetableId: veg._id || veg.vegetableId,
      vegetableName: veg.name,
      pricePerUnit: veg.currentPrice || '',
      unit: veg.defaultUnit || 'kg'
    }));

    console.log(`✓ Selected: ${veg.name} (Auto-filled Price: ₨${veg.currentPrice})`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.vegetableId || !formData.quantity || !formData.pricePerUnit) {
      setError('Please select a vegetable and enter quantity/price');
      setLoading(false);
      return;
    }

    try {
      // POST to the correct endpoint
      const response = await API.post('/farmer/publish-order', formData);

      console.log('Order published successfully:', response.data);
      setSuccessMessage('Order published successfully!');

      // Reset form
      setFormData({
        vegetableId: '',
        vegetableName: '',
        quantity: '',
        unit: 'kg',
        pricePerUnit: '',
        location: '',
        quality: 'standard',
        description: '',
        deliveryDate: '',
      });
      setSelectedVegetable(null);

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
        <h1>📋 Publish Order</h1>
        <p>List your vegetables for sale</p>
      </div>

      <div className="page-content">
        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="order-form">
          <h2>Order Details</h2>

          <div className="form-group">
            <VegetableSelect
              value={formData.vegetableId}
              onVegetableSelect={handleVegetableSelection}
              label="Select Vegetable *"
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
              <label>Price Per Unit (₨) *</label>
              <input
                type="number"
                name="pricePerUnit"
                placeholder="Market price auto-fills, but can be adjusted"
                step="0.01"
                value={formData.pricePerUnit}
                onChange={handleChange}
                required
              />
              {formData.pricePerUnit && (
                <small style={{ color: '#27ae60', fontWeight: 'bold' }}>
                  ✓ Current Market Price: ₨{formData.pricePerUnit}/{formData.unit}
                </small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quality</label>
              <select name="quality" value={formData.quality} onChange={handleChange}>
                <option value="economy">Economy</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location</label>
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
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Add details about your vegetables..."
              rows="4"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-item">
              <span>Vegetable:</span>
              <span>{selectedVegetable ? `${selectedVegetable.vegetableId} - ${selectedVegetable.name}` : 'Not selected'}</span>
            </div>
            <div className="summary-item">
              <span>Quantity:</span>
              <span>{formData.quantity || '0'} {formData.unit}</span>
            </div>
            <div className="summary-item">
              <span>Unit Price:</span>
              <span>₨ {formData.pricePerUnit || '0'}</span>
            </div>
            <div className="summary-item total">
              <span>Total Price:</span>
              <span>₨ {(parseFloat(formData.quantity || 0) * parseFloat(formData.pricePerUnit || 0)).toFixed(2)}</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Publishing...' : 'Publish Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FarmerPublishOrder;
