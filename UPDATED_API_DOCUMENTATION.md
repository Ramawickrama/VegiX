# 📋 VegiX Order Publishing API - Complete Guide

## 🎯 Overview

This guide covers all the updated order publishing endpoints with the new features:
- ✅ Vegetable name and ID embedded in orders
- ✅ 10% broker commission for broker selling orders
- ✅ Email notifications for all order types
- ✅ In-app notification system

---

## 📦 New Models & Collections

### 1. **FarmerOrder** Collection
```javascript
{
  _id: ObjectId,
  orderNumber: "ORD-1708597200000-abcd",
  vegetable: {
    _id: ObjectId,
    name: "Tomato",
    basePrice: 150
  },
  quantity: 100,
  unit: "kg",
  pricePerUnit: 150,
  totalPrice: 15000,
  publishedBy: ObjectId,
  status: "active",
  location: "Colombo",
  deliveryDate: Date,
  quality: "premium",
  description: "Fresh organic tomatoes",
  interestedBrokers: [ObjectId],
  publishedDate: Date,
  timestamps
}
```

### 2. **BrokerBuyingOrder** Collection
```javascript
{
  _id: ObjectId,
  orderNumber: "BUY-1708597300000-abcd",
  vegetable: {
    _id: ObjectId,
    name: "Tomato",
    basePrice: 150
  },
  quantity: 200,
  unit: "kg",
  pricePerUnit: 140,
  totalPrice: 28000,
  publishedBy: ObjectId,
  status: "active",
  location: "Colombo Market",
  deliveryDate: Date,
  quality: "standard",
  description: "Buying for market supply",
  interestedFarmers: [ObjectId],
  publishedDate: Date,
  timestamps
}
```

### 3. **BrokerSellingOrder** Collection (WITH COMMISSION)
```javascript
{
  _id: ObjectId,
  orderNumber: "SELL-1708597400000-abcd",
  vegetable: {
    _id: ObjectId,
    name: "Tomato",
    basePrice: 150
  },
  quantity: 150,
  unit: "kg",
  basePricePerUnit: 150,
  brokerCommissionPerKg: 0.1,  // 10%
  finalPricePerUnit: 165,      // 150 + (150 * 0.1)
  totalBasePrice: 22500,       // 150 * 150
  totalCommission: 2250,       // 22500 * 0.1
  totalFinalPrice: 24750,      // 22500 + 2250
  publishedBy: ObjectId,
  status: "active",
  location: "Colombo",
  deliveryDate: Date,
  quality: "premium",
  description: "Fresh tomatoes available",
  interestedBuyers: [ObjectId],
  publishedDate: Date,
  timestamps
}
```

### 4. **BuyerOrder** Collection
```javascript
{
  _id: ObjectId,
  orderNumber: "HBY-1708597500000-abcd",
  vegetable: {
    _id: ObjectId,
    name: "Tomato",
    basePrice: 150
  },
  quantity: 50,
  unit: "kg",
  budgetPerUnit: 160,
  totalBudget: 8000,
  publishedBy: ObjectId,
  status: "active",
  location: "Hotel XYZ, Colombo",
  deliveryDate: Date,
  quality: "premium",
  description: "Daily restaurant supply",
  interestedBrokers: [ObjectId],
  publishedDate: Date,
  timestamps
}
```

### 5. **Notification** Collection
```javascript
{
  _id: ObjectId,
  recipient: ObjectId (User),
  type: "order-published" | "order-accepted" | "broker-interested" | etc,
  title: "Order Published Successfully",
  message: "Your order for Tomato has been published",
  relatedOrder: ObjectId,
  orderModel: "FarmerOrder" | "BrokerBuyingOrder" | "BrokerSellingOrder" | "BuyerOrder",
  isRead: false,
  readAt: null,
  createdAt: Date
}
```

---

## 🔌 API Endpoints

### 📌 FARMER ORDERS

#### Publish Farmer Selling Order
```
POST /api/farmer/publish-order
Authorization: Bearer <token>
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

**Response (201 Created):**
```json
{
  "message": "Order published successfully",
  "order": {
    "_id": "67b8d4c5e7f9a2b1c3d4e6a1",
    "orderNumber": "ORD-1708597200000-1234",
    "vegetable": {
      "_id": "67b8c4d5e7f9a2b1c3d4e5f6",
      "name": "Tomato",
      "basePrice": 150
    },
    "quantity": 100,
    "unit": "kg",
    "pricePerUnit": 150,
    "totalPrice": 15000,
    "publishedBy": "67b8c4d5e7f9a2b1c3d4e5a1",
    "status": "active",
    "location": "Colombo",
    "deliveryDate": "2026-02-28T00:00:00.000Z",
    "quality": "premium",
    "description": "Fresh organic tomatoes from my farm",
    "interestedBrokers": [],
    "publishedDate": "2026-02-23T11:20:00.000Z"
  }
}
```

---

### 📌 BROKER ORDERS

#### Publish Broker Buying Order
```
POST /api/broker/publish-buy-order
Authorization: Bearer <token>
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

**Response (201 Created):**
```json
{
  "message": "Buy order published successfully",
  "order": {
    "_id": "67b8d4c5e7f9a2b1c3d4e6b2",
    "orderNumber": "BUY-1708597300000-5678",
    "vegetable": {
      "_id": "67b8c4d5e7f9a2b1c3d4e5f6",
      "name": "Tomato",
      "basePrice": 150
    },
    "quantity": 200,
    "unit": "kg",
    "pricePerUnit": 140,
    "totalPrice": 28000,
    "publishedBy": "67b8c4d5e7f9a2b1c3d4e5b2",
    "status": "active",
    "location": "Colombo Market"
  }
}
```

#### Publish Broker Selling Order (WITH 10% COMMISSION)
```
POST /api/broker/publish-sell-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 150,
  "unit": "kg",
  "location": "Colombo",
  "quality": "premium",
  "description": "Fresh tomatoes available for bulk orders",
  "deliveryDate": "2026-02-26"
}
```

**Response (201 Created) - WITH COMMISSION DETAILS:**
```json
{
  "message": "Sell order published successfully",
  "order": {
    "_id": "67b8d4c5e7f9a2b1c3d4e6c3",
    "orderNumber": "SELL-1708597400000-5678",
    "vegetable": {
      "_id": "67b8c4d5e7f9a2b1c3d4e5f6",
      "name": "Tomato",
      "basePrice": 150
    },
    "quantity": 150,
    "unit": "kg",
    "basePricePerUnit": 150,
    "brokerCommissionPerKg": 0.1,
    "finalPricePerUnit": 165,
    "totalBasePrice": 22500,
    "totalCommission": 2250,
    "totalFinalPrice": 24750,
    "publishedBy": "67b8c4d5e7f9a2b1c3d4e5b2",
    "status": "active",
    "location": "Colombo",
    "commissionDetails": {
      "basePrice": 150,
      "commissionPerKg": 15,
      "finalPrice": 165,
      "totalCommission": "2250.00"
    }
  }
}
```

---

### 📌 BUYER ORDERS

#### Publish Buyer Order
```
POST /api/buyer/publish-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 50,
  "unit": "kg",
  "budgetPerUnit": 160,
  "location": "Hotel XYZ, Colombo",
  "quality": "premium",
  "description": "Need fresh tomatoes for daily restaurant orders",
  "deliveryDate": "2026-02-25"
}
```

**Response (201 Created):**
```json
{
  "message": "Order published successfully (Visible to Brokers)",
  "order": {
    "_id": "67b8d4c5e7f9a2b1c3d4e6d4",
    "orderNumber": "HBY-1708597500000-9012",
    "vegetable": {
      "_id": "67b8c4d5e7f9a2b1c3d4e5f6",
      "name": "Tomato",
      "basePrice": 150
    },
    "quantity": 50,
    "unit": "kg",
    "budgetPerUnit": 160,
    "totalBudget": 8000,
    "publishedBy": "67b8c4d5e7f9a2b1c3d4e5c3",
    "status": "active",
    "location": "Hotel XYZ, Colombo"
  }
}
```

---

### 📌 NOTIFICATION ENDPOINTS

#### Get User Notifications
```
GET /api/notifications?limit=10&skip=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 5,
  "unread": 2,
  "notifications": [
    {
      "_id": "67b8d4c5e7f9a2b1c3d4e6e5",
      "recipient": "67b8c4d5e7f9a2b1c3d4e5a1",
      "type": "order-published",
      "title": "Order Published Successfully",
      "message": "Your order for Tomato (100 kg) has been published",
      "relatedOrder": "67b8d4c5e7f9a2b1c3d4e6a1",
      "orderModel": "FarmerOrder",
      "isRead": false,
      "createdAt": "2026-02-23T11:20:00.000Z"
    }
  ]
}
```

#### Mark Notification as Read
```
PATCH /api/notifications/:notificationId/read
Authorization: Bearer <token>
```

#### Mark All Notifications as Read
```
PATCH /api/notifications/read-all
Authorization: Bearer <token>
```

#### Delete Notification
```
DELETE /api/notifications/:notificationId
Authorization: Bearer <token>
```

---

## 📧 Email Notifications

### Configuration (in .env):
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Email Types:

#### 1. Farmer Order Published Email
- **To:** Farmer's email
- **Includes:** Order #, Vegetable name, Quantity, Price
- **Subject:** "Order Published - {Vegetable} ({OrderNumber})"

#### 2. Broker Buying Order Email
- **To:** Broker's email
- **Includes:** Order #, Vegetable, Quantity, Price
- **Subject:** "Buy Order Published - {Vegetable} ({OrderNumber})"

#### 3. Broker Selling Order Email (WITH COMMISSION DETAILS)
- **To:** Broker's email
- **Includes:** Order #, Vegetable, Quantity, Base Price, Final Price (with commission), Commission Amount
- **Subject:** "Selling Order Published - {Vegetable} ({OrderNumber})"

#### 4. Buyer Order Email
- **To:** Buyer's email
- **Includes:** Order #, Vegetable, Quantity, Budget per unit, Total budget
- **Subject:** "Buyer Order Posted - {Vegetable} ({OrderNumber})"

---

## ✅ Validation Rules

### Farmer Order
- **Required:** `vegetableId`, `quantity`, `pricePerUnit`
- **Optional:** `unit`, `location`, `quality`, `description`, `deliveryDate`

### Broker Buying Order
- **Required:** `vegetableId`, `quantity`, `pricePerUnit`
- **Optional:** `unit`, `location`, `quality`, `description`, `deliveryDate`

### Broker Selling Order
- **Required:** `vegetableId`, `quantity`
- **Optional:** `unit`, `location`, `quality`, `description`, `deliveryDate`
- **Auto-calculated:** `basePricePerUnit` (from vegetable), `brokerCommissionPerKg` (10%), `finalPricePerUnit`

### Buyer Order
- **Required:** `vegetableId`, `quantity`, `budgetPerUnit`
- **Optional:** `unit`, `location`, `quality`, `description`, `deliveryDate`

---

## 🔄 Commission Calculation Example

**Broker Selling Order with 10% Commission:**

```
Base Vegetable Price: Rs. 150 per kg
Broker Commission: 10% = Rs. 15 per kg
Final Price to Buyer: Rs. 150 + Rs. 15 = Rs. 165 per kg

Order: 150 kg
Total Base Price: 150 kg × Rs. 150 = Rs. 22,500
Total Commission: 150 kg × Rs. 15 = Rs. 2,250
Total Final Price (visible to buyer): 150 kg × Rs. 165 = Rs. 24,750
```

**Broker Earns:** Rs. 2,250 (10% commission)

---

## 🎯 Frontend Integration Points

### 1. **Vegetable Selection & Auto-population**
When user selects a vegetable from dropdown:
```javascript
// Call GET /api/vegetables/:id
const vegetable = {
  _id: "67b8c4d5e7f9a2b1c3d4e5f6",
  name: "Tomato",
  averagePrice: 150,
  unit: "kg"
};

// Auto-fill form fields:
form.vegetableName.value = vegetable.name; // "Tomato"
form.basePrice.value = vegetable.averagePrice; // 150
form.unit.value = vegetable.unit; // "kg"
```

### 2. **Commission Display for Broker Selling Order**
```javascript
const basePrice = 150;
const commission = basePrice * 0.1; // 15
const finalPrice = basePrice + commission; // 165

// Display to buyer:
console.log(`Base Price: Rs. ${basePrice}`);
console.log(`Broker Commission (10%): Rs. ${commission}`);
console.log(`Final Price: Rs. ${finalPrice}`);
```

### 3. **Notification Display**
```javascript
// Fetch notifications when user logs in
GET /api/notifications?limit=10

// Display unread count badge
const { unread } = response;
document.getElementById('notificationBadge').innerText = unread;
```

---

## 🧪 Testing Checklist

### ✓ Farmer Order Testing
- [ ] Publish order with vegetable ID
- [ ] Verify vegetable name auto-populated
- [ ] Confirm order saved in FarmerOrder collection
- [ ] Check email sent to farmer
- [ ] Verify notification created
- [ ] Confirm order visible in `/api/farmer/get-orders`

### ✓ Broker Buying Order Testing
- [ ] Publish buying order
- [ ] Verify vegetable details embedded
- [ ] Confirm order in BrokerBuyingOrder collection
- [ ] Check notification sent

### ✓ Broker Selling Order Testing (WITH COMMISSION)
- [ ] Publish selling order
- [ ] Verify commission calculated: 10% = finalPrice - basePrice
- [ ] Confirm totalCommission = quantity × (finalPrice - basePrice)
- [ ] Check email includes commission details
- [ ] Verify notification shows earned commission
- [ ] Confirm order visible to buyers

### ✓ Buyer Order Testing
- [ ] Publish buyer order
- [ ] Verify vegetable details correct
- [ ] Confirm budgetPerUnit and totalBudget calculated
- [ ] Check email notification sent
- [ ] Verify visible to brokers

### ✓ Notification Testing
- [ ] Get all notifications for user
- [ ] Mark single notification as read
- [ ] Mark all as read
- [ ] Delete notification
- [ ] Verify unread count updates

---

## 📊 Error Responses

### 400 Bad Request
```json
{
  "message": "Missing required fields: vegetableId, quantity, pricePerUnit"
}
```

### 404 Not Found
```json
{
  "message": "Vegetable not found"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

### 500 Server Error
```json
{
  "message": "Error message here"
}
```

---

## 📚 Important Notes

1. **Commission is ONLY calculated for Broker Selling Orders** - 10% of base vegetable price
2. **Vegetable name and base price are embedded** in order documents (denormalized for performance)
3. **Notifications are created automatically** when order is published
4. **Emails are optional** - if EMAIL_SERVICE config is missing, they're skipped but order still publishes
5. **Each role sees different orders** through respective endpoints
6. **Commission benefits the broker**, not the farmer or buyer

---

**Last Updated:** February 23, 2026
**Version:** 2.0.0 (With Commission & Notifications)
