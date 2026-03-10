# Market Price System - Code Changes Reference

## Quick Reference: Before and After

---

## 1. MarketPrice.js Schema

### BEFORE (Old Schema)
```javascript
const marketPriceSchema = new mongoose.Schema({
  vegetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vegetable',
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  previousPrice: Number,
  minPrice: Number,
  maxPrice: Number,
  priceChange: Number,
  priceChangePercentage: Number,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // ... timestamps
});
```

### AFTER (New Schema)
```javascript
const marketPriceSchema = new mongoose.Schema({
  vegetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vegetable',
    required: true,
    unique: true  // ← NEW: Unique constraint
  },
  vegetableName: {
    type: String,
    required: true  // ← NEW: Denormalized name
  },
  pricePerKg: {
    type: Number,
    required: true  // ← RENAMED: currentPrice → pricePerKg
  },
  previousPrice: Number,
  minPrice: Number,
  maxPrice: Number,
  priceChange: Number,
  priceChangePercentage: Number,
  updatedBy: {
    type: String,  // ← CHANGED: User ref → String
    required: true
  },
  unit: {
    type: String,  // ← NEW: 'kg', 'litre', etc
    default: 'kg'
  },
  historicalData: [
    {
      pricePerKg: Number,
      timestamp: Date
    }
  ],  // ← NEW: Price history array
  timestamps: true
});
```

**Key Changes:**
- `vegetable` → `vegetableId` (with unique constraint)
- `currentPrice` → `pricePerKg`
- Added `vegetableName` (denormalized)
- Changed `updatedBy` from User ref to String
- Added `unit` field
- Added `historicalData` array

---

## 2. adminDashboardController.js

### updateMarketPrice() - BEFORE
```javascript
exports.updateMarketPrice = async (req, res) => {
  try {
    const { vegetable, currentPrice, minPrice, maxPrice } = req.body;
    
    // OLD: Used 'vegetable' ref and 'currentPrice'
    const marketPrice = await MarketPrice.findOneAndUpdate(
      { vegetable },
      { vegetable, currentPrice, minPrice, maxPrice },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'Market price updated', marketPrice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### updateMarketPrice() - AFTER
```javascript
exports.updateMarketPrice = async (req, res) => {
  try {
    const { vegetableId, pricePerKg } = req.body;  // ← NEW field names

    // Validate vegetable exists
    const vegetable = await Vegetable.findById(vegetableId);
    if (!vegetable) {
      return res.status(404).json({ message: 'Vegetable not found' });
    }

    // Get existing price to calculate change
    const existingPrice = await MarketPrice.findOne({ vegetableId });
    const previousPrice = existingPrice ? existingPrice.pricePerKg : pricePerKg;
    const priceChange = pricePerKg - previousPrice;
    const priceChangePercentage = previousPrice ? (priceChange / previousPrice) * 100 : 0;

    // NEW: Maintain historical data
    const historicalData = [
      { pricePerKg, timestamp: new Date() },
      ...(existingPrice?.historicalData || [])
    ].slice(0, 30); // Keep max 30 entries

    // Create/update with new schema
    const marketPrice = await MarketPrice.findOneAndUpdate(
      { vegetableId },  // ← NEW: Query by vegetableId (unique)
      {
        vegetableId,
        vegetableName: vegetable.name,  // ← NEW: Embed vegetable name
        pricePerKg,  // ← NEW: Store as pricePerKg
        previousPrice,
        priceChange,
        priceChangePercentage,
        historicalData,  // ← NEW: Store history
        updatedBy: req.user?.name || 'admin',  // ← CHANGED: Store name string
        unit: 'kg',
        minPrice: Math.min(pricePerKg, existingPrice?.minPrice || pricePerKg),
        maxPrice: Math.max(pricePerKg, existingPrice?.maxPrice || pricePerKg)
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: 'Market price updated successfully',
      marketPrice
    });
  } catch (error) {
    console.error('Error updating market price:', error);
    res.status(500).json({ message: error.message });
  }
};
```

**Key Changes:**
- Input changed: `vegetable`, `currentPrice` → `vegetableId`, `pricePerKg`
- Added vegetable validation
- Calculate price change and percentage
- Maintain historicalData array
- Embed vegetableName from Vegetable collection
- Query by vegetableId (unique constraint handles upsert)
- updatedBy stores string (admin name) not User ref

---

### getMarketPrices() - BEFORE
```javascript
exports.getMarketPrices = async (req, res) => {
  try {
    const prices = await MarketPrice.find()
      .populate('vegetable')  // OLD: populate vegetable ref
      .sort({ createdAt: -1 });
    
    res.json({ prices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### getMarketPrices() - AFTER
```javascript
exports.getMarketPrices = async (req, res) => {
  try {
    const prices = await MarketPrice.find()
      .sort({ updatedAt: -1 });  // ← Sort by updatedAt (newest first)

    // Map to clean response (new schema field names)
    const formattedPrices = prices.map(price => ({
      vegetableId: price.vegetableId,  // ← NEW: Include vegetableId
      vegetableName: price.vegetableName,  // ← NEW: Include denormalized name
      pricePerKg: price.pricePerKg,  // ← NEW: Show pricePerKg
      minPrice: price.minPrice,
      maxPrice: price.maxPrice,
      unit: price.unit,
      updatedBy: price.updatedBy,
      updatedAt: price.updatedAt
    }));

    res.status(200).json({
      message: 'Market prices retrieved successfully',
      prices: formattedPrices,
      count: formattedPrices.length
    });
  } catch (error) {
    console.error('Error fetching market prices:', error);
    res.status(500).json({ message: error.message });
  }
};
```

**Key Changes:**
- Removed populate (vegetableId doesn't need population)
- Map response to include vegetableId and vegetableName
- Show pricePerKg (not currentPrice)
- Sort by updatedAt descending
- Include count in response

---

### getPriceHistory() - BEFORE
```javascript
exports.getPriceHistory = async (req, res) => {
  try {
    const { vegetable } = req.params;  // OLD: Took vegetable param
    
    const history = await MarketPrice.findOne({ vegetable })
      .populate('vegetable');
    
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### getPriceHistory() - AFTER
```javascript
exports.getPriceHistory = async (req, res) => {
  try {
    const { vegetableId } = req.params;  // ← CHANGED: vegetable → vegetableId

    // Fetch by vegetableId (unique, fast lookup)
    const priceHistory = await MarketPrice.findOne({ vegetableId });

    if (!priceHistory) {
      return res.status(404).json({ message: 'Price history not found for this vegetable' });
    }

    res.status(200).json({
      message: 'Price history retrieved successfully',
      priceHistory: {
        vegetableId: priceHistory.vegetableId,  // ← NEW: Include vegetableId
        vegetableName: priceHistory.vegetableName,  // ← NEW: Include vegetableName
        currentPrice: priceHistory.pricePerKg,  // ← Show current as pricePerKg
        historicalData: priceHistory.historicalData || []  // ← Show history array
      }
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ message: error.message });
  }
};
```

**Key Changes:**
- Query param: `vegetable` → `vegetableId`
- Removed populate (not needed with vegetableId)
- Return denormalized vegetableId and vegetableName
- Show currentPrice as pricePerKg
- Include full historicalData array

---

## 3. farmerController.js - publishOrder()

### BEFORE
```javascript
exports.publishOrder = async (req, res) => {
  try {
    const { vegetableId, quantity, unit, pricePerUnit, ... } = req.body;

    // Get vegetable
    const vegetable = await Vegetable.findById(vegetableId);
    
    // Generate order number
    const orderNumber = `FARM-${Date.now()}-${req.user.userId.toString().slice(-4)}`;
    
    // OLD: Used static vegetable.averagePrice
    const totalPrice = quantity * pricePerUnit;

    // Create farmer order
    const order = new FarmerOrder({
      orderNumber,
      vegetable: {
        _id: vegetable._id,
        name: vegetable.name,
        basePrice: vegetable.averagePrice,  // ← STATIC PRICE (OLD)
      },
      quantity,
      unit: unit || 'kg',
      pricePerUnit,
      totalPrice,
      // ...
    });
    
    await order.save();
    res.status(201).json({ message: 'Order published successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### AFTER
```javascript
const BrokerBuyingOrder = require('../models/BrokerBuyingOrder');
const BrokerSellingOrder = require('../models/BrokerSellingOrder');
const FarmerOrder = require('../models/FarmerOrder');
const BuyerOrder = require('../models/BuyerOrder');
const Vegetable = require('../models/Vegetable');
const MarketPrice = require('../models/MarketPrice');  // ← NEW IMPORT
const User = require('../models/User');
const { sendOrderPublishedEmail, sendBrokerCommissionEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

exports.publishOrder = async (req, res) => {
  try {
    const { vegetableId, quantity, unit, pricePerUnit, ... } = req.body;

    // Get vegetable
    const vegetable = await Vegetable.findById(vegetableId);
    if (!vegetable) {
      return res.status(404).json({ message: 'Vegetable not found' });
    }

    // NEW: Fetch market price (dynamic)
    const marketPrice = await MarketPrice.findOne({ vegetableId });

    // Get user details for email
    const user = await User.findById(req.user.userId);

    // Generate order number
    const orderNumber = `FARM-${Date.now()}-${req.user.userId.toString().slice(-4)}`;
    const totalPrice = quantity * pricePerUnit;

    // Create farmer order
    const order = new FarmerOrder({
      orderNumber,
      vegetable: {
        _id: vegetable._id,
        name: vegetable.name,
        basePrice: marketPrice ? marketPrice.pricePerKg : vegetable.averagePrice,  // ← DYNAMIC (NEW)
      },
      quantity,
      unit: unit || 'kg',
      pricePerUnit,
      totalPrice,
      // ...
    });

    await order.save();

    // Send email notification
    await sendOrderPublishedEmail(user.email, {
      orderNumber,
      vegetableName: vegetable.name,
      quantity,
      basePrice: marketPrice ? marketPrice.pricePerKg : vegetable.averagePrice,
      // ...
    });

    // Create in-app notification
    await createNotification({
      recipient: req.user.userId,
      type: 'order-published',
      title: 'Order Published Successfully',
      message: `Your order for ${vegetable.name} (${quantity} ${unit || 'kg'}) has been published. Order #${orderNumber}`,
      relatedOrder: order._id,
      orderModel: 'FarmerOrder'
    });

    res.status(201).json({ message: 'Order published successfully', order });
  } catch (error) {
    console.error('Error publishing order:', error);
    res.status(500).json({ message: error.message });
  }
};
```

**Key Changes:**
- Added `MarketPrice` import
- Fetch market price: `await MarketPrice.findOne({ vegetableId })`
- basePrice now uses market price with fallback: `marketPrice ? marketPrice.pricePerKg : vegetable.averagePrice`
- Email includes market-based price
- Notification system sends price update

---

## 4. brokerController.js - publishBuyOrder() & publishSellOrder()

### BEFORE
```javascript
const BrokerBuyingOrder = require('../models/BrokerBuyingOrder');
const BrokerSellingOrder = require('../models/BrokerSellingOrder');
const FarmerOrder = require('../models/FarmerOrder');
const BuyerOrder = require('../models/BuyerOrder');
const Vegetable = require('../models/Vegetable');
const User = require('../models/User');
const { sendOrderPublishedEmail, sendBrokerCommissionEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

// publishBuyOrder - No market price logic
// publishSellOrder - Used static vegetable.averagePrice
const basePricePerUnit = vegetable.averagePrice;
const commissionAmount = basePricePerUnit * brokerCommissionPerKg;
// ...
```

### AFTER
```javascript
const BrokerBuyingOrder = require('../models/BrokerBuyingOrder');
const BrokerSellingOrder = require('../models/BrokerSellingOrder');
const FarmerOrder = require('../models/FarmerOrder');
const BuyerOrder = require('../models/BuyerOrder');
const Vegetable = require('../models/Vegetable');
const MarketPrice = require('../models/MarketPrice');  // ← NEW IMPORT
const User = require('../models/User');
const { sendOrderPublishedEmail, sendBrokerCommissionEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

// publishBuyOrder
exports.publishBuyOrder = async (req, res) => {
  try {
    const { vegetableId, quantity, unit, pricePerUnit, ... } = req.body;

    const vegetable = await Vegetable.findById(vegetableId);

    // NEW: Fetch market price (even though buying order doesn't use commission)
    const marketPrice = await MarketPrice.findOne({ vegetableId });

    const user = await User.findById(req.user.userId);

    const orderNumber = `BUY-${Date.now()}-${req.user.userId.toString().slice(-4)}`;
    const totalPrice = quantity * pricePerUnit;

    const order = new BrokerBuyingOrder({
      orderNumber,
      vegetable: {
        _id: vegetable._id,
        name: vegetable.name,
        // basePrice uses market price if available
        basePrice: marketPrice ? marketPrice.pricePerKg : vegetable.averagePrice,  // ← NEW
      },
      quantity,
      // ...
    });

    await order.save();
    // ... rest of method
  }
};

// publishSellOrder
exports.publishSellOrder = async (req, res) => {
  try {
    const { vegetableId, quantity, unit, ... } = req.body;

    const vegetable = await Vegetable.findById(vegetableId);
    if (!vegetable) {
      return res.status(404).json({ message: 'Vegetable not found' });
    }

    // NEW: Fetch market price (used for commission calculation)
    const marketPrice = await MarketPrice.findOne({ vegetableId });

    const user = await User.findById(req.user.userId);

    const orderNumber = `SELL-${Date.now()}-${req.user.userId.toString().slice(-4)}`;

    // Commission calculation: 10% per kg
    const brokerCommissionPerKg = 0.1;
    
    // NEW: Use market price with fallback
    const basePricePerUnit = marketPrice ? marketPrice.pricePerKg : vegetable.averagePrice;
    
    const commissionAmount = basePricePerUnit * brokerCommissionPerKg;
    const finalPricePerUnit = basePricePerUnit + commissionAmount;

    // Calculate totals
    const totalBasePrice = quantity * basePricePerUnit;
    const totalCommission = quantity * commissionAmount;
    const totalFinalPrice = quantity * finalPricePerUnit;

    const order = new BrokerSellingOrder({
      orderNumber,
      vegetable: {
        _id: vegetable._id,
        name: vegetable.name,
        basePrice: basePricePerUnit,
      },
      quantity,
      unit: unit || 'kg',
      basePricePerUnit,
      brokerCommissionPerKg,
      finalPricePerUnit,
      totalBasePrice,
      totalCommission,
      totalFinalPrice,
      publishedBy: req.user.userId,
      // ...
    });

    await order.save();

    // NEW: Send commission breakdown email
    await sendBrokerCommissionEmail(user.email, {
      orderNumber,
      vegetableName: vegetable.name,
      quantity,
      basePricePerUnit,
      commissionPerKg: commissionAmount,
      finalPricePerUnit,
      totalBasePrice,
      totalCommission,
      totalFinalPrice
    });

    // Create notification
    await createNotification({
      recipient: req.user.userId,
      type: 'order-published',
      title: 'Selling Order Published Successfully',
      message: `Your selling order for ${vegetable.name} (${quantity} ${unit || 'kg'}) has been published. Order #${orderNumber}`,
      relatedOrder: order._id,
      orderModel: 'BrokerSellingOrder'
    });

    res.status(201).json({
      message: 'Sell order published successfully',
      order
    });
  } catch (error) {
    console.error('Error publishing broker selling order:', error);
    res.status(500).json({ message: error.message });
  }
};
```

**Key Changes in publishBuyOrder:**
- Added `MarketPrice` import (file-level)
- Fetch market price for consistency
- basePrice uses market price with fallback

**Key Changes in publishSellOrder:**
- Fetch market price: `await MarketPrice.findOne({ vegetableId })`
- basePricePerUnit uses market price: `marketPrice ? marketPrice.pricePerKg : vegetable.averagePrice`
- Commission now based on live market price
- Email includes commission breakdown with market prices

---

## 5. adminRoutes.js

### NO CHANGES NEEDED ✅
```javascript
const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const adminDashboardController = require('../controllers/adminDashboardController');

// These routes already correctly map to updated controller methods
router.put('/market-price', authMiddleware, roleMiddleware(['admin']), adminDashboardController.updateMarketPrice);
router.get('/market-prices', authMiddleware, adminDashboardController.getMarketPrices);
router.get('/price-history/:vegetableId', authMiddleware, adminDashboardController.getPriceHistory);

module.exports = router;
```

**Status:** ✅ Routes correctly configured - no changes needed

---

## Summary of Changes

| File | Changes | Type |
|------|---------|------|
| MarketPrice.js | Schema: vegetable→vegetableId (unique), currentPrice→pricePerKg, added vegetableName, historicalData, changed updatedBy to String | Schema |
| adminDashboardController.js | updateMarketPrice: new schema fields, price change calculation, historical data; getMarketPrices: new field names; getPriceHistory: vegetableId query | Logic |
| farmerController.js | Added MarketPrice import, fetch market price, use pricePerKg with fallback | Logic |
| brokerController.js | Added MarketPrice import, fetch in both publishBuyOrder/publishSellOrder, use pricePerKg for commission | Logic |
| adminRoutes.js | ✅ No changes - already correct | N/A |

---

## All Market Price Queries Now Use:

```javascript
const marketPrice = await MarketPrice.findOne({ vegetableId });
const basePrice = marketPrice ? marketPrice.pricePerKg : vegetable.averagePrice;
```

This pattern appears in:
- ✅ farmerController.js (line 24)
- ✅ brokerController.js (line 28, line 109)

All 3 locations implemented consistently.

