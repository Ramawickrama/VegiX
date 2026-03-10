# 🎨 VegiX Frontend Implementation Guide

## 📋 Table of Contents

1. [Vegetable Selection & Auto-population](#vegetable-selection)
2. [Order Forms by Role](#order-forms)
3. [Commission Display](#commission-display)
4. [Notification System](#notification-system)
5. [Sample React Code](#sample-react-code)

---

## 🥕 Vegetable Selection & Auto-population {#vegetable-selection}

### Requirement
When users select a vegetable ID from a dropdown, the vegetable name and price should **automatically populate** the form fields.

### Implementation Steps

#### 1. Create Vegetable Dropdown Component
```jsx
// components/VegetableSelector.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VegetableSelector = ({ onVegetableSelect, selectedVegetableId }) => {
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVegetables = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/vegetables');
        setVegetables(response.data.vegetables || response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching vegetables:', error);
        setLoading(false);
      }
    };
    fetchVegetables();
  }, []);

  const handleVegetableChange = (e) => {
    const vegetableId = e.target.value;
    const vegetable = vegetables.find(v => v._id === vegetableId);
    
    if (vegetable) {
      onVegetableSelect({
        id: vegetable._id,
        name: vegetable.name,
        basePrice: vegetable.averagePrice,
        unit: vegetable.unit
      });
    }
  };

  return (
    <div className="vegetable-selector">
      <label htmlFor="vegetable">Select Vegetable *</label>
      <select 
        id="vegetable"
        value={selectedVegetableId || ''}
        onChange={handleVegetableChange}
        className="form-control"
      >
        <option value="">Choose a vegetable...</option>
        {vegetables.map(veg => (
          <option key={veg._id} value={veg._id}>
            {veg.name} - Rs. {veg.averagePrice}/{veg.unit}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VegetableSelector;
```

#### 2. Farmer Order Form with Auto-population
```jsx
// pages/FarmerOrderForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import VegetableSelector from '../components/VegetableSelector';
import NotificationAlert from '../components/NotificationAlert';

const FarmerOrderForm = () => {
  const [formData, setFormData] = useState({
    vegetableId: '',
    vegetableName: '',
    basePrice: '',
    quantity: '',
    unit: 'kg',
    pricePerUnit: '',
    location: '',
    quality: 'standard',
    description: '',
    deliveryDate: ''
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleVegetableSelect = (vegetable) => {
    setFormData(prev => ({
      ...prev,
      vegetableId: vegetable.id,
      vegetableName: vegetable.name,
      basePrice: vegetable.basePrice,
      unit: vegetable.unit
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotalPrice = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.pricePerUnit) || 0;
    return (quantity * price).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vegetableId || !formData.quantity || !formData.pricePerUnit) {
      setNotification({ type: 'error', message: 'Please fill all required fields' });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        '/api/farmer/publish-order',
        {
          vegetableId: formData.vegetableId,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          pricePerUnit: parseFloat(formData.pricePerUnit),
          location: formData.location,
          quality: formData.quality,
          description: formData.description,
          deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotification({
        type: 'success',
        message: `Order published successfully! Order #${response.data.order.orderNumber}`
      });

      // Reset form
      setFormData({
        vegetableId: '',
        vegetableName: '',
        basePrice: '',
        quantity: '',
        unit: 'kg',
        pricePerUnit: '',
        location: '',
        quality: 'standard',
        description: '',
        deliveryDate: ''
      });

      setLoading(false);
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error publishing order'
      });
      setLoading(false);
    }
  };

  return (
    <div className="order-form-container">
      <h1>Publish Selling Order</h1>
      
      {notification && (
        <NotificationAlert 
          type={notification.type} 
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="order-form">
        {/* Vegetable Selection */}
        <VegetableSelector 
          selectedVegetableId={formData.vegetableId}
          onVegetableSelect={handleVegetableSelect}
        />

        {/* Auto-populated Vegetable Name */}
        <div className="form-group">
          <label>Vegetable Name</label>
          <input 
            type="text"
            value={formData.vegetableName}
            disabled
            className="form-control"
            placeholder="Auto-populated"
          />
        </div>

        {/* Auto-populated Base Price */}
        <div className="form-group">
          <label>Base Price (from market)</label>
          <div className="input-group">
            <input 
              type="number"
              value={formData.basePrice}
              disabled
              className="form-control"
              placeholder="Auto-populated"
            />
            <span className="input-group-text">Rs. per {formData.unit}</span>
          </div>
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label>Quantity *</label>
          <div className="input-group">
            <input 
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Enter quantity"
              step="0.01"
              required
            />
            <span className="input-group-text">{formData.unit}</span>
          </div>
        </div>

        {/* Price Per Unit */}
        <div className="form-group">
          <label>Your Price Per Unit *</label>
          <div className="input-group">
            <input 
              type="number"
              name="pricePerUnit"
              value={formData.pricePerUnit}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Enter your price"
              step="0.01"
              required
            />
            <span className="input-group-text">Rs.</span>
          </div>
        </div>

        {/* Total Price Display */}
        <div className="form-group">
          <label>Total Price</label>
          <div className="input-group">
            <input 
              type="text"
              value={`Rs. ${calculateTotalPrice()}`}
              disabled
              className="form-control bg-light"
            />
          </div>
        </div>

        {/* Location */}
        <div className="form-group">
          <label>Location</label>
          <input 
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="form-control"
            placeholder="e.g., Colombo, Kandy"
          />
        </div>

        {/* Quality */}
        <div className="form-group">
          <label>Quality</label>
          <select 
            name="quality"
            value={formData.quality}
            onChange={handleInputChange}
            className="form-control"
          >
            <option value="premium">Premium</option>
            <option value="standard">Standard</option>
            <option value="economy">Economy</option>
          </select>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description</label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="form-control"
            rows="3"
            placeholder="Additional details about your order..."
          />
        </div>

        {/* Delivery Date */}
        <div className="form-group">
          <label>Expected Delivery Date</label>
          <input 
            type="date"
            name="deliveryDate"
            value={formData.deliveryDate}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Publishing...' : 'Publish Order'}
        </button>
      </form>
    </div>
  );
};

export default FarmerOrderForm;
```

---

## 📝 Order Forms by Role {#order-forms}

### Farmer Order Form
```jsx
// Required fields: vegetableId, quantity, pricePerUnit
// Optional: location, quality, description, deliveryDate
// Auto-filled: vegetableName, basePrice

{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 100,
  "pricePerUnit": 150,
  "unit": "kg",
  "location": "Colombo",
  "quality": "premium",
  "description": "Fresh tomatoes",
  "deliveryDate": "2026-02-28"
}
```

### Broker Buying Order Form
```jsx
// Required fields: vegetableId, quantity, pricePerUnit
// Optional: location, quality, description, deliveryDate
// Auto-filled: vegetableName, basePrice

{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 200,
  "pricePerUnit": 140,
  "unit": "kg",
  "location": "Colombo Market",
  "quality": "standard",
  "description": "For market supply",
  "deliveryDate": "2026-02-25"
}
```

### Broker Selling Order Form (WITH COMMISSION)
```jsx
// Required fields: vegetableId, quantity
// Commission automatically calculated: 10% per kg
// AUTO-CALCULATED: basePricePerUnit, finalPricePerUnit, totalCommission

{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 150,
  "unit": "kg",
  "location": "Colombo",
  "quality": "premium",
  "description": "Bulk available",
  "deliveryDate": "2026-02-26"
}

// Response includes:
// basePricePerUnit: 150
// finalPricePerUnit: 165 (150 + 10%)
// totalCommission: 2250
```

### Buyer Order Form
```jsx
// Required fields: vegetableId, quantity, budgetPerUnit
// Optional: location, quality, description, deliveryDate
// Auto-filled: vegetableName, basePrice

{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 50,
  "budgetPerUnit": 160,
  "unit": "kg",
  "location": "Hotel XYZ",
  "quality": "premium",
  "description": "Daily supply",
  "deliveryDate": "2026-02-25"
}
```

---

## 💰 Commission Display {#commission-display}

### Broker Selling Order - Commission Calculation Component
```jsx
// components/BrokerCommissionDisplay.jsx
import React from 'react';

const BrokerCommissionDisplay = ({ vegetable, quantity, unit = 'kg' }) => {
  if (!vegetable) return null;

  const basePrice = vegetable.averagePrice;
  const commissionPercentage = 0.1; // 10%
  const commissionPerKg = basePrice * commissionPercentage;
  const finalPrice = basePrice + commissionPerKg;
  
  const totalBasePrice = quantity * basePrice;
  const totalCommission = quantity * commissionPerKg;
  const totalFinalPrice = quantity * finalPrice;

  return (
    <div className="commission-display card">
      <div className="card-header bg-success text-white">
        <h5>💰 Commission Breakdown</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <p><strong>Base Price:</strong> Rs. {basePrice.toFixed(2)}/{unit}</p>
            <p><strong>Commission (10%):</strong> Rs. {commissionPerKg.toFixed(2)}/{unit}</p>
            <p><strong>Price to Buyer:</strong> Rs. {finalPrice.toFixed(2)}/{unit}</p>
          </div>
          <div className="col-md-6">
            <p><strong>Quantity:</strong> {quantity} {unit}</p>
            <p><strong>Your Total Commission:</strong> <span className="badge bg-success">Rs. {totalCommission.toFixed(2)}</span></p>
            <p><strong>Total Price (Buyer Pays):</strong> Rs. {totalFinalPrice.toFixed(2)}</p>
          </div>
        </div>
        <hr />
        <div className="alert alert-info">
          <strong>ℹ️ Info:</strong> Brokers earn 10% commission per kilogram. 
          The price shown to buyers includes this commission.
        </div>
      </div>
    </div>
  );
};

export default BrokerCommissionDisplay;
```

### Usage in Broker Selling Order Form
```jsx
<BrokerCommissionDisplay 
  vegetable={selectedVegetable}
  quantity={formData.quantity}
  unit={formData.unit}
/>
```

### Expected Output for 150 kg at Rs. 150/kg base:
```
Base Price: Rs. 150.00/kg
Commission (10%): Rs. 15.00/kg
Price to Buyer: Rs. 165.00/kg

Quantity: 150 kg
Your Total Commission: Rs. 2,250.00
Total Price (Buyer Pays): Rs. 24,750.00
```

---

## 🔔 Notification System {#notification-system}

### Notification Types
1. **order-published** - Order successfully published
2. **order-accepted** - Order accepted by counterparty
3. **broker-interested** - Broker shown interest
4. **order-completed** - Order completed
5. **order-cancelled** - Order cancelled

### Notification Component
```jsx
// components/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications(); // Refresh list
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications(); // Refresh list
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h4>Notifications</h4>
        {unreadCount > 0 && (
          <span className="badge bg-danger">{unreadCount} new</span>
        )}
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <p className="text-muted">No notifications</p>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif._id} 
              className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
            >
              <div className="notification-content">
                <h6>{notif.title}</h6>
                <p>{notif.message}</p>
                <small className="text-muted">
                  {new Date(notif.createdAt).toLocaleDateString()} 
                  {' '} 
                  {new Date(notif.createdAt).toLocaleTimeString()}
                </small>
              </div>
              <div className="notification-actions">
                {!notif.isRead && (
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => markAsRead(notif._id)}
                  >
                    Mark as read
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => deleteNotification(notif._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
```

---

## 💻 Sample React Code {#sample-react-code}

### Broker Selling Order Form with Commission Display
```jsx
// pages/BrokerSellingOrderForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import VegetableSelector from '../components/VegetableSelector';
import BrokerCommissionDisplay from '../components/BrokerCommissionDisplay';
import NotificationAlert from '../components/NotificationAlert';

const BrokerSellingOrderForm = () => {
  const [formData, setFormData] = useState({
    vegetableId: '',
    vegetable: null,
    quantity: '',
    unit: 'kg',
    location: '',
    quality: 'standard',
    description: '',
    deliveryDate: ''
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleVegetableSelect = (vegetable) => {
    setFormData(prev => ({
      ...prev,
      vegetableId: vegetable.id,
      vegetable: vegetable
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vegetableId || !formData.quantity) {
      setNotification({ 
        type: 'error', 
        message: 'Please select vegetable and enter quantity' 
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        '/api/broker/publish-sell-order',
        {
          vegetableId: formData.vegetableId,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          location: formData.location,
          quality: formData.quality,
          description: formData.description,
          deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { order, commissionDetails } = response.data.order;

      setNotification({
        type: 'success',
        message: `Order published! You'll earn Rs. ${commissionDetails.totalCommission} commission`
      });

      // Show success with commission
      console.log('Order published with commission:', commissionDetails);

      // Reset form
      setFormData({
        vegetableId: '',
        vegetable: null,
        quantity: '',
        unit: 'kg',
        location: '',
        quality: 'standard',
        description: '',
        deliveryDate: ''
      });

      setLoading(false);
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error publishing order'
      });
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Publish Selling Order</h1>

      {notification && (
        <NotificationAlert 
          type={notification.type} 
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="row">
        <div className="col-md-8">
          <form onSubmit={handleSubmit}>
            <VegetableSelector 
              selectedVegetableId={formData.vegetableId}
              onVegetableSelect={handleVegetableSelect}
            />

            <div className="form-group">
              <label>Quantity *</label>
              <input 
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter quantity"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input 
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Quality</label>
              <select 
                name="quality"
                value={formData.quality}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="premium">Premium</option>
                <option value="standard">Standard</option>
                <option value="economy">Economy</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-control"
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Selling Order'}
            </button>
          </form>
        </div>

        <div className="col-md-4">
          {formData.vegetable && (
            <BrokerCommissionDisplay 
              vegetable={formData.vegetable}
              quantity={parseFloat(formData.quantity) || 0}
              unit={formData.unit}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BrokerSellingOrderForm;
```

---

## 🎯 Testing Checklist

- [ ] Vegetable dropdown loads correctly
- [ ] Vegetable name auto-populates when selected
- [ ] Base price auto-populates
- [ ] Quantity input updates total price
- [ ] Broker commission displays correctly (10%)
- [ ] Final price = base + commission
- [ ] Order publishes successfully
- [ ] Notification received
- [ ] Email sent to user
- [ ] Order appears in user's order list

---

**Updated:** February 23, 2026  
**Version:** 2.0.0
