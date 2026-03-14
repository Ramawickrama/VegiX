# Market Price System Testing Guide

## Overview
This guide walks through testing the complete Market Price system that enables:
1. Admin updating market prices for vegetables
2. Farmers seeing and using updated market prices when publishing orders
3. Brokers calculating commissions based on market prices
4. Prices auto-filling from market data on the frontend

---

## Prerequisites
- Backend running on `http://localhost:5000`
- MongoDB connected and populated with vegetables
- Valid admin JWT token
- Valid farmer/broker JWT tokens

---

## Testing Flow

### Step 1: Admin Updates Market Price

**Endpoint:** `PUT /api/admin/market-price`

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "vegetableId": "66a1b2c3d4e5f6g7h8i9j0k1",
  "pricePerKg": 150
}
```

**Expected Response:**
```json
{
  "message": "Market price updated successfully",
  "marketPrice": {
    "_id": "...",
    "vegetableId": "66a1b2c3d4e5f6g7h8i9j0k1",
    "vegetableName": "Tomato",
    "pricePerKg": 150,
    "minPrice": 140,
    "maxPrice": 160,
    "priceChange": 5,
    "priceChangePercentage": 3.45,
    "updatedBy": "admin_name",
    "createdAt": "2026-02-23T10:30:00.000Z",
    "updatedAt": "2026-02-23T10:30:00.000Z"
  }
}
```

**What it tests:**
- ✅ Admin can set/update market prices
- ✅ MarketPrice document created with vegetableId (unique), vegetableName, pricePerKg
- ✅ Price change calculations (priceChange, priceChangePercentage)
- ✅ updatedBy field stores admin name

---

### Step 2: Verify Market Prices Retrieved

**Endpoint:** `GET /api/admin/market-prices`

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Expected Response:**
```json
{
  "message": "Market prices retrieved successfully",
  "prices": [
    {
      "vegetableId": "66a1b2c3d4e5f6g7h8i9j0k1",
      "vegetableName": "Tomato",
      "pricePerKg": 150,
      "minPrice": 140,
      "maxPrice": 160,
      "unit": "kg",
      "updatedBy": "admin_name",
      "updatedAt": "2026-02-23T10:30:00.000Z"
    },
    {
      "vegetableId": "66a1b2c3d4e5f6g7h8i9j0k2",
      "vegetableName": "Onion",
      "pricePerKg": 80,
      "minPrice": 70,
      "maxPrice": 90,
      "unit": "kg",
      "updatedBy": "admin_name",
      "updatedAt": "2026-02-23T11:00:00.000Z"
    }
  ],
  "count": 2
}
```

**What it tests:**
- ✅ Retrieves all market prices with new schema fields
- ✅ Returns vegetableId and vegetableName (not old `vegetable` ref)
- ✅ Returns pricePerKg (not `currentPrice`)
- ✅ Sorted by updatedAt descending (newest first)

---

### Step 3: Check Price History

**Endpoint:** `GET /api/admin/price-history/:vegetableId`

**Example:** `GET /api/admin/price-history/66a1b2c3d4e5f6g7h8i9j0k1`

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Expected Response:**
```json
{
  "message": "Price history retrieved successfully",
  "priceHistory": {
    "vegetableId": "66a1b2c3d4e5f6g7h8i9j0k1",
    "vegetableName": "Tomato",
    "currentPrice": 150,
    "historicalData": [
      {
        "pricePerKg": 150,
        "timestamp": "2026-02-23T10:30:00.000Z"
      },
      {
        "pricePerKg": 145,
        "timestamp": "2026-02-23T09:00:00.000Z"
      },
      {
        "pricePerKg": 140,
        "timestamp": "2026-02-23T08:00:00.000Z"
      }
    ]
  }
}
```

**What it tests:**
- ✅ Price history retrieved for specific vegetable by vegetableId
- ✅ Returns vegetableId and vegetableName (denormalized)
- ✅ Shows currentPrice (pricePerKg)
- ✅ Shows historical data array with timestamps (up to 30 entries)

---

### Step 4: Farmer Publishes Order with Market Price

**Endpoint:** `POST /api/farmer/publish-order`

**Headers:**
```
Authorization: Bearer <FARMER_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "vegetableId": "66a1b2c3d4e5f6g7h8i9j0k1",
  "quantity": 50,
  "unit": "kg",
  "pricePerUnit": 150,
  "location": "Farm A, District",
  "quality": "premium",
  "description": "Fresh organic tomatoes",
  "deliveryDate": "2026-03-01T10:00:00.000Z"
}
```

**Expected Response:**
```json
{
  "message": "Order published successfully",
  "order": {
    "_id": "66b3c4d5e6f7g8h9i0j1k2l3",
    "orderNumber": "FARM-1708672200000-a1b2",
    "vegetable": {
      "_id": "66a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Tomato",
      "basePrice": 150  // ← Uses market price if available
    },
    "quantity": 50,
    "unit": "kg",
    "pricePerUnit": 150,
    "totalPrice": 7500,
    "orderStatus": "published",
    "publishedBy": "66a1b2c3d4e5f6g7h8i9j0k0",
    "createdAt": "2026-02-23T10:35:00.000Z"
  }
}
```

**What it tests:**
- ✅ Farmer can publish order with vegetableId
- ✅ Order embeds vegetable details (name, basePrice)
- ✅ **basePrice uses market price** (150 from MarketPrice.pricePerKg) if available
- ✅ If no MarketPrice exists, falls back to vegetable.averagePrice
- ✅ Order creates notification and sends email

---

### Step 5: Broker Publishing Buying Order

**Endpoint:** `POST /api/broker/publish-buy-order`

**Headers:**
```
Authorization: Bearer <BROKER_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "vegetableId": "66a1b2c3d4e5f6g7h8i9j0k1",
  "quantity": 100,
  "unit": "kg",
  "pricePerUnit": 140,
  "location": "Wholesale Market",
  "quality": "standard",
  "description": "Bulk tomato purchase"
}
```

**Expected Response:**
```json
{
  "message": "Buy order published successfully",
  "order": {
    "_id": "66b3c4d5e6f7g8h9i0j1k2l4",
    "orderNumber": "BUY-1708672300000-a1b2",
    "vegetable": {
      "_id": "66a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Tomato",
      "basePrice": 140
    },
    "quantity": 100,
    "unit": "kg",
    "pricePerUnit": 140,
    "totalPrice": 14000,
    "orderType": "Broker Buying Order",
    "orderStatus": "published",
    "publishedBy": "66a1b2c3d4e5f6g7h8i9j0k1",
    "createdAt": "2026-02-23T10:40:00.000Z"
  }
}
```

**What it tests:**
- ✅ Broker can create buying orders
- ✅ Vegetable details embedded (name, basePrice)

---

### Step 6: Broker Publishing Selling Order with Commission

**Endpoint:** `POST /api/broker/publish-sell-order`

**Headers:**
```
Authorization: Bearer <BROKER_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "vegetableId": "66a1b2c3d4e5f6g7h8i9j0k1",
  "quantity": 75,
  "unit": "kg",
  "location": "Market Stall",
  "quality": "premium"
}
```

**Expected Response:**
```json
{
  "message": "Sell order published successfully",
  "order": {
    "_id": "66b3c4d5e6f7g8h9i0j1k2l5",
    "orderNumber": "SELL-1708672400000-a1b2",
    "vegetable": {
      "_id": "66a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Tomato",
      "basePrice": 150  // ← Market price used
    },
    "quantity": 75,
    "unit": "kg",
    "basePricePerUnit": 150,
    "brokerCommissionPerKg": 0.1,
    "finalPricePerUnit": 165,  // ← 150 + (150 * 0.1)
    "totalBasePrice": 11250,
    "totalCommission": 1125,   // ← 75 kg * 15 per kg commission
    "totalFinalPrice": 12375,  // ← Total that buyer sees
    "orderStatus": "published",
    "publishedBy": "66a1b2c3d4e5f6g7h8i9j0k1",
    "createdAt": "2026-02-23T10:45:00.000Z"
  }
}
```

**What it tests:**
- ✅ Broker selling order uses **market price** (150) as basePricePerUnit
- ✅ Commission calculated: 10% of basePricePerUnit = 0.1 * 150 = 15 per kg
- ✅ finalPricePerUnit = basePricePerUnit + commission = 150 + 15 = 165
- ✅ Totals calculated correctly:
  - totalBasePrice = 75 * 150 = 11,250
  - totalCommission = 75 * 15 = 1,125
  - totalFinalPrice = 75 * 165 = 12,375
- ✅ Commission email sent to broker with breakdown

---

### Step 7: Verify Notifications Created

**Endpoint:** `GET /api/notifications`

**Headers:**
```
Authorization: Bearer <FARMER_JWT_TOKEN>
Content-Type: application/json
```

**Expected Response:**
```json
{
  "message": "Notifications retrieved successfully",
  "notifications": [
    {
      "_id": "66b3c4d5e6f7g8h9i0j1k2l6",
      "recipient": "66a1b2c3d4e5f6g7h8i9j0k0",
      "type": "order-published",
      "title": "Order Published Successfully",
      "message": "Your order for Tomato (50 kg) has been published. Order #FARM-1708672200000-a1b2",
      "relatedOrder": "66b3c4d5e6f7g8h9i0j1k2l3",
      "orderModel": "FarmerOrder",
      "isRead": false,
      "createdAt": "2026-02-23T10:35:00.000Z"
    }
  ]
}
```

**What it tests:**
- ✅ In-app notifications created for order publishes
- ✅ Notification links to order with relatedOrder and orderModel
- ✅ Users can retrieve notifications

---

## Critical Test Scenarios

### Scenario 1: Market Price Update Propagates to New Orders
1. Admin sets market price for Tomato = 150/kg
2. Farmer publishes order → Should see basePrice = 150 ✅
3. Admin updates market price for Tomato = 170/kg
4. Farmer publishes new order → Should see basePrice = 170 ✅

### Scenario 2: Fallback to Vegetable Average Price
1. No MarketPrice document exists for Carrot
2. Farmer publishes Carrot order
3. Should use vegetable.averagePrice as basePrice ✅

### Scenario 3: Commission Calculation with Market Price
1. Market price Tomato = 100/kg
2. Broker publishes selling order, quantity = 50 kg
3. Calculation should be:
   - basePricePerUnit = 100 (from market price)
   - commission = 100 * 0.1 = 10
   - finalPricePerUnit = 110
   - totalCommission = 50 * 10 = 500 ✅
4. Buyers see finalPricePerUnit = 110 in order

### Scenario 4: Price Change Tracking
1. Admin sets Tomato price = 140
2. Admin updates to 150
3. getPriceHistory should show:
   - priceChange = 10 (150 - 140)
   - priceChangePercentage = 7.14% ((10/140) * 100)
   - historicalData array with both entries ✅

---

## Integration Testing Checklist

- [ ] Admin can update market price via PUT /api/admin/market-price
- [ ] Market price creates MarketPrice document with vegetableId (unique), vegetableName, pricePerKg
- [ ] getMarketPrices returns all prices with new schema (no old `vegetable` ref field)
- [ ] getPriceHistory returns historical data for specific vegetable
- [ ] Farmer publishOrder fetches MarketPrice and uses pricePerKg as basePrice
- [ ] Farmer order has basePrice matching market price
- [ ] Farmer receives notification and email on order publish
- [ ] Broker publishSellOrder fetches MarketPrice and uses pricePerKg as basePricePerUnit
- [ ] Broker selling order commission calculated correctly: finalPricePerUnit = basePricePerUnit * 1.1
- [ ] Broker receives commission email with breakdown (base, commission, final prices)
- [ ] Broker buying order publishes without commission logic (only selling orders have commission)
- [ ] If MarketPrice doesn't exist, fallback to vegetable.averagePrice works
- [ ] Multiple price updates create historicalData array (up to 30 entries)
- [ ] Notifications appear in-app and emails are sent (if EMAIL_SERVICE configured)

---

## Troubleshooting

### Issue: Market price update returns 500 error
**Solution:** 
1. Verify vegetableId is valid ObjectId
2. Check if Vegetable with that ID exists
3. Review server logs for specific error

### Issue: Farmer order has old static price, not market price
**Solution:**
1. Verify MarketPrice document exists in MongoDB
2. Check MarketPrice query: `MarketPrice.findOne({ vegetableId })`
3. Ensure field name is `pricePerKg`, not `currentPrice`

### Issue: Broker commission calculation incorrect
**Solution:**
1. Verify basePricePerUnit = market price (or vegetable.averagePrice)
2. Check commission: should be `basePricePerUnit * 0.1`
3. Verify finalPricePerUnit = basePricePerUnit + commission

### Issue: Emails not sending
**Solution:**
1. Verify EMAIL_SERVICE environment variables in .env
2. Check nodemailer installed: `npm list nodemailer`
3. Review emailService.js sendEmail() function

---

## Database Schema Verification

### MarketPrice Collection
```javascript
{
  _id: ObjectId,
  vegetableId: ObjectId (ref: Vegetable, unique),  // ← NEW: unique constraint
  vegetableName: String,                            // ← NEW: denormalized name
  pricePerKg: Number,                               // ← NEW: market price per unit
  previousPrice: Number,                            // Optional
  minPrice: Number,                                 // Optional
  maxPrice: Number,                                 // Optional
  priceChange: Number,                              // calculated
  priceChangePercentage: Number,                    // calculated
  unit: String,                                     // 'kg', 'litre', etc.
  updatedBy: String,                                // ← CHANGED: from User ref to String
  historicalData: [
    {
      pricePerKg: Number,
      timestamp: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### FarmerOrder Collection
```javascript
{
  vegetable: {
    _id: ObjectId,
    name: String,
    basePrice: Number  // ← Should use market price (pricePerKg)
  },
  // ... other fields
}
```

### BrokerSellingOrder Collection
```javascript
{
  vegetable: {
    _id: ObjectId,
    name: String,
    basePrice: Number
  },
  basePricePerUnit: Number,              // ← Should use market price
  brokerCommissionPerKg: 0.1,            // 10% commission
  finalPricePerUnit: Number,             // basePricePerUnit * 1.1
  totalCommission: Number,               // Broker's earnings
  totalFinalPrice: Number,               // What buyer pays
  // ... other fields
}
```

---

## Next Steps After Testing

1. **Frontend Integration:**
   - Fetch market prices in order form frontend
   - Auto-populate basePrice from market price
   - Show market price per kg in dropdown

2. **Admin Dashboard:**
   - Display market price update interface
   - Show price history charts
   - Set price alerts

3. **Analytics:**
   - Track price changes over time
   - Analyze demand vs. price correlations
   - Generate price forecasting

---

## Database Commands for Testing

### Check MarketPrice collection
```javascript
db.marketprices.find({})  // See all market prices
db.marketprices.findOne({ vegetableId: ObjectId("66a1b2c3d4e5f6g7h8i9j0k1") })  // Specific vegetable
```

### Check FarmerOrder basePrice
```javascript
db.farmerorders.findOne({}, { "vegetable.basePrice": 1 })
```

### Check BrokerSellingOrder commission
```javascript
db.brokerselllingorders.findOne({}, { "basePricePerUnit": 1, "finalPricePerUnit": 1, "totalCommission": 1 })
```

### Count price history entries
```javascript
db.marketprices.findOne({}).historicalData.length
```

