# 📝 Order Publishing - Request & Response Examples

## 🎯 Real-World Testing Examples

All examples use actual structure and data types. Copy these directly to test!

---

## 1️⃣ FARMER ORDER PUBLISHING

### Request

```
POST http://localhost:5000/api/farmer/publish-order
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

### Response (201 Created)

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
    "status": "active",
    "location": "Colombo",
    "deliveryDate": "2026-02-28T00:00:00.000Z",
    "quality": "premium",
    "description": "Fresh organic tomatoes from my farm",
    "visibleTo": [
      "broker",
      "admin"
    ],
    "interestedBrokers": [],
    "publishedDate": "2026-02-23T11:20:00.000Z",
    "createdAt": "2026-02-23T11:20:00.000Z",
    "updatedAt": "2026-02-23T11:20:00.000Z",
    "__v": 0
  }
}
```

---

## 2️⃣ BROKER BUYING ORDER

### Request

```
POST http://localhost:5000/api/broker/publish-buy-order
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

### Response (201 Created)

```json
{
  "message": "Buy order published successfully",
  "order": {
    "_id": "67b8d4c5e7f9a2b1c3d4e6b2",
    "orderNumber": "BUY-1708597300000-5678",
    "vegetable": {
      "_id": "67b8c4d5e7f9a2b1c3d4e5f6",
      "name": "Tomato"
    },
    "quantity": 200,
    "unit": "kg",
    "pricePerUnit": 140,
    "totalPrice": 28000,
    "orderType": "broker-buy",
    "publishedBy": "67b8c4d5e7f9a2b1c3d4e5b2",
    "status": "active",
    "location": "Colombo Market",
    "deliveryDate": "2026-02-25T00:00:00.000Z",
    "quality": "standard",
    "description": "Buying from farmers for market supply",
    "visibleTo": [
      "farmer",
      "admin"
    ],
    "interestedBrokers": [],
    "publishedDate": "2026-02-23T11:25:00.000Z",
    "createdAt": "2026-02-23T11:25:00.000Z",
    "updatedAt": "2026-02-23T11:25:00.000Z",
    "__v": 0
  }
}
```

---

## 3️⃣ BROKER SELLING ORDER

### Request

```
POST http://localhost:5000/api/broker/publish-sell-order
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

### Response (201 Created)

```json
{
  "message": "Sell order published successfully",
  "order": {
    "_id": "67b8d4c5e7f9a2b1c3d4e6c3",
    "orderNumber": "SELL-1708597400000-5678",
    "vegetable": {
      "_id": "67b8c4d5e7f9a2b1c3d4e5f6",
      "name": "Tomato"
    },
    "quantity": 150,
    "unit": "kg",
    "pricePerUnit": 180,
    "totalPrice": 27000,
    "orderType": "broker-sell",
    "publishedBy": "67b8c4d5e7f9a2b1c3d4e5b2",
    "status": "active",
    "location": "Colombo",
    "deliveryDate": "2026-02-26T00:00:00.000Z",
    "quality": "premium",
    "description": "Fresh tomatoes available for bulk orders",
    "visibleTo": [
      "buyer",
      "admin"
    ],
    "interestedBrokers": [],
    "publishedDate": "2026-02-23T11:30:00.000Z",
    "createdAt": "2026-02-23T11:30:00.000Z",
    "updatedAt": "2026-02-23T11:30:00.000Z",
    "__v": 0
  }
}
```

---

## 4️⃣ BUYER ORDER PUBLISHING

### Request

```
POST http://localhost:5000/api/buyer/publish-order
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

### Response (201 Created)

```json
{
  "message": "Order published successfully (Visible to Brokers)",
  "order": {
    "_id": "67b8d4c5e7f9a2b1c3d4e6d4",
    "orderNumber": "HBY-1708597500000-9012",
    "vegetable": {
      "_id": "67b8c4d5e7f9a2b1c3d4e5f6",
      "name": "Tomato"
    },
    "quantity": 50,
    "unit": "kg",
    "pricePerUnit": 160,
    "totalPrice": 8000,
    "orderType": "buyer-order",
    "publishedBy": "67b8c4d5e7f9a2b1c3d4e5c3",
    "status": "active",
    "location": "Hotel XYZ, Colombo",
    "deliveryDate": "2026-02-25T00:00:00.000Z",
    "quality": "premium",
    "description": "Need fresh tomatoes for daily restaurant orders",
    "visibleTo": [
      "broker",
      "admin"
    ],
    "interestedBrokers": [],
    "publishedDate": "2026-02-23T11:35:00.000Z",
    "createdAt": "2026-02-23T11:35:00.000Z",
    "updatedAt": "2026-02-23T11:35:00.000Z",
    "__v": 0
  }
}
```

---

## 📊 Response Comparison

| Aspect | Farmer | Broker Buy | Broker Sell | Buyer |
|--------|--------|-----------|------------|-------|
| **orderType** | farmer-sell | broker-buy | broker-sell | buyer-order |
| **visibleTo** | [broker, admin] | [farmer, admin] | [buyer, admin] | [broker, admin] |
| **orderNumber** | ORD-... | BUY-... | SELL-... | HBY-... |
| **Message** | Order published successfully | Buy order published successfully | Sell order published successfully | Order published successfully (Visible to Brokers) |

---

## ❌ ERROR RESPONSES

### Missing Required Fields

**Request:**
```json
{
  "quantity": 100,
  "pricePerUnit": 150
  // Missing vegetableId!
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Missing required fields"
}
```

---

### Invalid Vegetable ID

**Request:**
```json
{
  "vegetableId": "invalid-id",
  "quantity": 100,
  "pricePerUnit": 150
}
```

**Response (404 Not Found):**
```json
{
  "message": "Vegetable not found"
}
```

---

### No Authentication Token

**Request (missing Authorization header):**
```
POST /api/farmer/publish-order
Content-Type: application/json

{ ... order data ... }
```

**Response (401 Unauthorized):**
```json
{
  "message": "No token provided"
}
```

---

### Invalid Token

**Request:**
```
Authorization: Bearer invalid.token.here
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid token",
  "error": "jwt malformed"
}
```

---

### Wrong Role

**Request (farmer trying to access broker endpoint):**
```
POST /api/broker/publish-buy-order
Authorization: Bearer <farmer-token>
```

**Response (403 Forbidden):**
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

---

## ✅ Validation Rules

### Required Fields (all endpoints)
- `vegetableId` - Must be valid MongoDB ObjectId from Vegetables collection
- `quantity` - Must be a positive number
- `pricePerUnit` - Must be a positive number

### Optional Fields (all endpoints)
- `unit` - Must be one of: "kg", "lb", "dozen" (defaults to "kg")
- `location` - String, any value allowed
- `quality` - Must be one of: "premium", "standard", "economy" (defaults to "standard")
- `description` - String, any value allowed
- `deliveryDate` - ISO 8601 date string (e.g., "2026-02-28")

### Automatic Fields (set by server)
- `orderNumber` - Generated from timestamp and user ID
- `totalPrice` - Calculated as quantity × pricePerUnit
- `status` - Always starts as "active"
- `publishedDate` - Set to current timestamp
- `createdAt` - Automatically set
- `updatedAt` - Automatically set
- `interestedBrokers` - Initialized as empty array

---

## 🧪 Quick Copy-Paste Examples

### Farmer Order (Minimal)
```json
{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 100,
  "pricePerUnit": 150
}
```

### Farmer Order (Full)
```json
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

### Broker Buy Order
```json
{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f7",
  "quantity": 200,
  "unit": "kg",
  "pricePerUnit": 140,
  "location": "Colombo Market",
  "quality": "standard",
  "description": "Buying tomatoes for market",
  "deliveryDate": "2026-02-25"
}
```

### Broker Sell Order
```json
{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f8",
  "quantity": 150,
  "unit": "kg",
  "pricePerUnit": 180,
  "location": "Colombo",
  "quality": "premium",
  "description": "Fresh tomatoes for bulk orders",
  "deliveryDate": "2026-02-26"
}
```

### Buyer Order
```json
{
  "vegetableId": "67b8c4d5e7f9a2b1c3d4e5f6",
  "quantity": 50,
  "unit": "kg",
  "pricePerUnit": 160,
  "location": "Hotel XYZ, Colombo",
  "quality": "premium",
  "description": "Daily restaurant supply",
  "deliveryDate": "2026-02-25"
}
```

---

## 🎯 HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 201 | Created | Order published successfully |
| 400 | Bad Request | Missing/invalid required fields |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Wrong user role |
| 404 | Not Found | Vegetable doesn't exist |
| 500 | Server Error | Database or unexpected error |

---

**Use these examples to test your API!** 🚀

Copy the request/response examples into Postman or your API client and verify they work exactly as shown.
