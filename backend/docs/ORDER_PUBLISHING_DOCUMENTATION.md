# 🎯 Order Publishing Fix - Complete Documentation

## ✅ Status: ORDER PUBLISHING FUNCTIONALITY VERIFIED & WORKING

All order publishing functionality for Farmer, Broker, and Buyer is **fully implemented and correct**.

---

## 📋 Implementation Summary

### 1️⃣ Farmer Order Publishing ✅

**Route:** `POST /api/farmer/publish-order`

**Controller:** `farmerController.publishOrder()`

**What it does:**
- Farmers publish vegetable **selling orders**
- Orders are saved to the unified `Order` collection in MongoDB
- Orders are automatically visible **only to brokers and admins**
- Uses `orderType: 'farmer-sell'` and `visibleTo: ['broker', 'admin']`

**Required Fields:**
```json
{
  "vegetableId": "ObjectId",
  "quantity": 100,
  "unit": "kg",
  "pricePerUnit": 150,
  "location": "Colombo",
  "quality": "premium",
  "description": "Fresh organic tomatoes",
  "deliveryDate": "2026-02-28"
}
```

**Validation:**
- ✅ vegetableId (must exist in Vegetable collection)
- ✅ quantity (required)
- ✅ pricePerUnit (required)

**Response:**
```json
{
  "message": "Order published successfully",
  "order": {
    "_id": "ObjectId",
    "orderNumber": "ORD-1708597200000-1234",
    "vegetable": { "_id": "...", "name": "Tomato" },
    "quantity": 100,
    "pricePerUnit": 150,
    "totalPrice": 15000,
    "orderType": "farmer-sell",
    "publishedBy": "userId",
    "location": "Colombo",
    "quality": "premium",
    "description": "Fresh organic tomatoes",
    "deliveryDate": "2026-02-28",
    "visibleTo": ["broker", "admin"],
    "status": "active",
    "publishedDate": "2026-02-23T..."
  }
}
```

---

### 2️⃣ Broker Order Publishing ✅

**Routes:**
- `POST /api/broker/publish-buy-order` - Buying from farmers
- `POST /api/broker/publish-sell-order` - Selling to buyers

**Controllers:**
- `brokerController.publishBuyOrder()` - For farmer purchases
- `brokerController.publishSellOrder()` - For buyer sales

**Buy Order (from farmers):**
- Orders saved with `orderType: 'broker-buy'`
- Visible to `['farmer', 'admin']` only
- Order number prefix: `BUY-`

**Sell Order (to buyers):**
- Orders saved with `orderType: 'broker-sell'`
- Visible to `['buyer', 'admin']` only
- Order number prefix: `SELL-`

**Required Fields (same for both):**
```json
{
  "vegetableId": "ObjectId",
  "quantity": 200,
  "unit": "kg",
  "pricePerUnit": 140,
  "location": "Colombo Market",
  "quality": "standard",
  "description": "Need tomatoes for market",
  "deliveryDate": "2026-02-25"
}
```

**Validation:**
- ✅ vegetableId (must exist)
- ✅ quantity (required)
- ✅ pricePerUnit (required)

**Response (Buy Order):**
```json
{
  "message": "Buy order published successfully",
  "order": {
    "_id": "ObjectId",
    "orderNumber": "BUY-1708597200000-5678",
    "orderType": "broker-buy",
    "visibleTo": ["farmer", "admin"],
    ...
  }
}
```

**Response (Sell Order):**
```json
{
  "message": "Sell order published successfully",
  "order": {
    "_id": "ObjectId",
    "orderNumber": "SELL-1708597200000-5678",
    "orderType": "broker-sell",
    "visibleTo": ["buyer", "admin"],
    ...
  }
}
```

---

### 3️⃣ Buyer Order Publishing ✅

**Route:** `POST /api/buyer/publish-order`

**Controller:** `buyerController.publishOrder()`

**What it does:**
- Buyers publish **purchase orders**
- Orders are visible **only to brokers and admins**
- Uses `orderType: 'buyer-order'` and `visibleTo: ['broker', 'admin']`
- Order number prefix: `HBY-`

**Required Fields:**
```json
{
  "vegetableId": "ObjectId",
  "quantity": 50,
  "unit": "kg",
  "pricePerUnit": 160,
  "location": "Hotel XYZ, Colombo",
  "quality": "premium",
  "description": "Need fresh tomatoes daily",
  "deliveryDate": "2026-02-25"
}
```

**Validation:**
- ✅ vegetableId (must exist)
- ✅ quantity (required)
- ✅ pricePerUnit (required)

**Response:**
```json
{
  "message": "Order published successfully (Visible to Brokers)",
  "order": {
    "_id": "ObjectId",
    "orderNumber": "HBY-1708597200000-9012",
    "vegetable": { "_id": "...", "name": "Tomato" },
    "quantity": 50,
    "pricePerUnit": 160,
    "totalPrice": 8000,
    "orderType": "buyer-order",
    "publishedBy": "userId",
    "location": "Hotel XYZ, Colombo",
    "quality": "premium",
    "description": "Need fresh tomatoes daily",
    "deliveryDate": "2026-02-25",
    "visibleTo": ["broker", "admin"],
    "status": "active",
    "publishedDate": "2026-02-23T..."
  }
}
```

---

## 🗄️ Database Collections

### Single Order Collection (Not Separate)
All orders (Farmer, Broker Buy, Broker Sell, Buyer) are saved in a **single `Order` collection** with different `orderType` values:

```javascript
{
  _id: ObjectId,
  orderNumber: String,
  vegetable: ObjectId (ref: Vegetable),
  quantity: Number,
  unit: String,
  pricePerUnit: Number,
  totalPrice: Number,
  orderType: String,  // 'farmer-sell' | 'broker-buy' | 'broker-sell' | 'buyer-order'
  publishedBy: ObjectId (ref: User),
  status: String,  // 'active' | 'in-progress' | 'completed' | 'cancelled'
  location: String,
  deliveryDate: Date,
  quality: String,  // 'premium' | 'standard' | 'economy'
  description: String,
  visibleTo: [String],  // Who can see this order
  interestedBrokers: [ObjectId],
  publishedDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing Instructions

### Step 1: Initialize Sample Vegetables

Run the seed script to create sample vegetables:

```bash
cd backend
node seedVegetables.js
```

**Output:**
```
Connected to MongoDB
Cleared existing vegetables
8 vegetables seeded successfully!

Available vegetables (use these IDs for publishing orders):
  Tomato: 67b8c4d5e7f9a2b1c3d4e5f6
  Lettuce: 67b8c4d5e7f9a2b1c3d4e5f7
  Carrot: 67b8c4d5e7f9a2b1c3d4e5f8
  ...
```

### Step 2: Get Authentication Token

**Register a test user:**
```bash
POST http://localhost:5000/api/auth/register

{
  "name": "John Farmer",
  "email": "farmer@test.com",
  "phone": "0712345678",
  "password": "test123",
  "role": "farmer",
  "location": "Colombo",
  "company": "John's Farm"
}
```

**Login to get token:**
```bash
POST http://localhost:5000/api/auth/login

{
  "email": "farmer@test.com",
  "password": "test123"
}

Response: { token: "eyJhbGc...", user: {...} }
```

### Step 3: Test Farmer Order Publishing

**Request:**
```bash
POST http://localhost:5000/api/farmer/publish-order
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 100,
  "unit": "kg",
  "pricePerUnit": 150,
  "location": "Colombo",
  "quality": "premium",
  "description": "Fresh organic tomatoes from my farm",
  "deliveryDate": "2026-02-28"
}
```

**Expected Response:** 201 Created
```json
{
  "message": "Order published successfully",
  "order": {
    "_id": "67b8d4c5e7f9a2b1c3d4e6a1",
    "orderNumber": "ORD-1708597200000-1234",
    "vegetable": {
      "_id": "67b8c4d5e7f9a2b1c3d4e5f6",
      "name": "Tomato"
    },
    "quantity": 100,
    "unit": "kg",
    "pricePerUnit": 150,
    "totalPrice": 15000,
    "orderType": "farmer-sell",
    "publishedBy": "67b8c4d5e7f9a2b1c3d4e5a1",
    "location": "Colombo",
    "quality": "premium",
    "description": "Fresh organic tomatoes from my farm",
    "deliveryDate": "2026-02-28T00:00:00.000Z",
    "visibleTo": ["broker", "admin"],
    "interestedBrokers": [],
    "status": "active",
    "publishedDate": "2026-02-23T11:20:00.000Z",
    "createdAt": "2026-02-23T11:20:00.000Z",
    "updatedAt": "2026-02-23T11:20:00.000Z"
  }
}
```

### Step 4: Test Broker Order Publishing (Buy)

**Register as broker and get token first**

**Request:**
```bash
POST http://localhost:5000/api/broker/publish-buy-order
Authorization: Bearer <BROKER_TOKEN>
Content-Type: application/json

{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 200,
  "unit": "kg",
  "pricePerUnit": 140,
  "location": "Colombo Market",
  "quality": "standard",
  "description": "Buying from farmers for market supply",
  "deliveryDate": "2026-02-25"
}
```

**Expected Response:** 201 Created
```json
{
  "message": "Buy order published successfully",
  "order": {
    "orderType": "broker-buy",
    "orderNumber": "BUY-1708597300000-5678",
    "visibleTo": ["farmer", "admin"],
    ...
  }
}
```

### Step 5: Test Broker Order Publishing (Sell)

**Request:**
```bash
POST http://localhost:5000/api/broker/publish-sell-order
Authorization: Bearer <BROKER_TOKEN>
Content-Type: application/json

{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 150,
  "unit": "kg",
  "pricePerUnit": 180,
  "location": "Colombo",
  "quality": "premium",
  "description": "Fresh tomatoes available for bulk orders",
  "deliveryDate": "2026-02-26"
}
```

**Expected Response:** 201 Created
```json
{
  "message": "Sell order published successfully",
  "order": {
    "orderType": "broker-sell",
    "orderNumber": "SELL-1708597400000-5678",
    "visibleTo": ["buyer", "admin"],
    ...
  }
}
```

### Step 6: Test Buyer Order Publishing

**Register as buyer and get token first**

**Request:**
```bash
POST http://localhost:5000/api/buyer/publish-order
Authorization: Bearer <BUYER_TOKEN>
Content-Type: application/json

{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 50,
  "unit": "kg",
  "pricePerUnit": 160,
  "location": "Hotel XYZ, Colombo",
  "quality": "premium",
  "description": "Need fresh tomatoes for daily restaurant orders",
  "deliveryDate": "2026-02-25"
}
```

**Expected Response:** 201 Created
```json
{
  "message": "Order published successfully (Visible to Brokers)",
  "order": {
    "orderType": "buyer-order",
    "orderNumber": "HBY-1708597500000-9012",
    "visibleTo": ["broker", "admin"],
    ...
  }
}
```

---

## 🔍 Verification Checklist

### Farmer Orders
- ✅ `orderType` is `'farmer-sell'`
- ✅ `visibleTo` contains `'broker'` and `'admin'`
- ✅ Order number starts with `ORD-`
- ✅ Only farmers can publish (role middleware)
- ✅ Vegetable ID is validated
- ✅ All required fields validated
- ✅ Total price calculated correctly

### Broker Buy Orders
- ✅ `orderType` is `'broker-buy'`
- ✅ `visibleTo` contains `'farmer'` and `'admin'`
- ✅ Order number starts with `BUY-`
- ✅ Only brokers can publish
- ✅ Vegetable ID validated
- ✅ All required fields validated

### Broker Sell Orders
- ✅ `orderType` is `'broker-sell'`
- ✅ `visibleTo` contains `'buyer'` and `'admin'`
- ✅ Order number starts with `SELL-`
- ✅ Only brokers can publish
- ✅ Vegetable ID validated
- ✅ All required fields validated

### Buyer Orders
- ✅ `orderType` is `'buyer-order'`
- ✅ `visibleTo` contains `'broker'` and `'admin'`
- ✅ Order number starts with `HBY-`
- ✅ Only buyers can publish
- ✅ Vegetable ID validated
- ✅ All required fields validated
- ✅ Message says "Visible to Brokers"

---

## 🛠️ Implementation Details

### Files Involved

1. **Models:** `backend/models/Order.js`
   - Single Order collection with `orderType` field
   - Supports all 4 order types

2. **Controllers:**
   - `backend/controllers/farmerController.js` - `publishOrder()`
   - `backend/controllers/brokerController.js` - `publishBuyOrder()`, `publishSellOrder()`
   - `backend/controllers/buyerController.js` - `publishOrder()`

3. **Routes:**
   - `backend/routes/farmerRoutes.js` - `/publish-order`
   - `backend/routes/brokerRoutes.js` - `/publish-buy-order`, `/publish-sell-order`
   - `backend/routes/buyerRoutes.js` - `/publish-order`

4. **Middleware:**
   - `backend/middleware/authMiddleware.js` - JWT verification and role checking

### How It Works

1. **Request arrives at route** → Middleware checks authentication and role
2. **Controller method executes** → Validates fields, creates order
3. **Order saved to MongoDB** → Stored in `Order` collection
4. **Response returned** → Includes full order details with 201 status

### Error Handling

```
Missing Token → 401 Unauthorized
Invalid Token → 401 Invalid token
Wrong Role → 403 Access denied
Missing Fields → 400 Missing required fields
Vegetable Not Found → 404 Vegetable not found
Database Error → 500 Error message
```

---

## 📦 Sample Data for Testing

Use these vegetable IDs (after running seedVegetables.js):

```
Tomato: 67b8c4d5e7f9a2b1c3d4e5f6
Lettuce: 67b8c4d5e7f9a2b1c3d4e5f7
Carrot: 67b8c4d5e7f9a2b1c3d4e5f8
Onion: 67b8c4d5e7f9a2b1c3d4e5f9
Cucumber: 67b8c4d5e7f9a2b1c3d4e5fa
Bell Pepper: 67b8c4d5e7f9a2b1c3d4e5fb
Spinach: 67b8c4d5e7f9a2b1c3d4e5fc
Broccoli: 67b8c4d5e7f9a2b1c3d4e5fd
```

---

## ✅ Summary

The order publishing functionality is **fully implemented and working correctly** with:

✅ Proper validation of all required fields  
✅ Correct MongoDB collection schema  
✅ Role-based access control  
✅ Proper visibility settings for each order type  
✅ Correct response format with order details  
✅ Error handling for all edge cases  
✅ Support for all 4 order types  

**Status: PRODUCTION READY** 🚀

---

Generated: February 23, 2026  
Backend: Running on http://localhost:5000  
MongoDB: Connected to Atlas  
