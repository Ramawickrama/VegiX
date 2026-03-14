# VegiX API Reference Guide

## 🌐 Base URL
```
http://localhost:5000
```

## 🔐 Authentication Header (Protected Routes)
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📌 Public Routes

### 1. Ping Test
```
GET /api/ping
Response: Server status
```

### 2. Root Info
```
GET /
Response: API endpoints listing
```

---

## 👤 Authentication Routes (`/api/auth`)

### Register User
```
POST /api/auth/register

Request Body:
{
  "name": "John Farmer",
  "email": "john@example.com",
  "phone": "0712345678",
  "password": "password123",
  "role": "farmer|broker|buyer",
  "location": "Colombo",
  "company": "John's Farm"
}

Response (201):
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Farmer",
    "email": "john@example.com",
    "role": "farmer"
  }
}
```

### Login User
```
POST /api/auth/login

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Farmer",
    "email": "john@example.com",
    "role": "farmer",
    "phone": "0712345678",
    "location": "Colombo"
  }
}
```

### Get Current User
```
GET /api/auth/user
Protected: Yes

Response (200):
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Farmer",
    "email": "john@example.com",
    "role": "farmer",
    "phone": "0712345678",
    "location": "Colombo",
    "company": "John's Farm"
  }
}
```

---

## 👨‍💼 Admin Routes (`/api/admin`)
**Protected: Yes | Role Required: admin**

### Get All Users
```
GET /api/admin/users

Response (200):
{
  "total": 50,
  "users": [
    {
      "id": "...",
      "name": "User Name",
      "email": "user@example.com",
      "role": "farmer",
      "location": "Colombo",
      "registrationDate": "2024-02-20T10:30:00Z",
      "isActive": true
    }
  ]
}
```

### Get Users by Role
```
GET /api/admin/users-by-role/{role}

Roles: farmer, broker, buyer, admin

Response (200):
{
  "role": "farmer",
  "total": 25,
  "users": [...]
}
```

### Get User Statistics
```
GET /api/admin/user-stats

Response (200):
{
  "totalUsers": 100,
  "farmers": 40,
  "brokers": 30,
  "buyers": 25,
  "admins": 5
}
```

### Update User
```
PUT /api/admin/user/{userId}

Request Body:
{
  "name": "Updated Name",
  "phone": "0712345678",
  "location": "Colombo",
  "company": "New Farm",
  "isActive": true
}

Response (200):
{
  "message": "User updated successfully",
  "user": {...}
}
```

### Delete User
```
DELETE /api/admin/user/{userId}

Response (200):
{
  "message": "User deleted successfully"
}
```

### Update Market Price
```
PUT /api/admin/market-price

Request Body:
{
  "vegetableId": "507f1f77bcf86cd799439011",
  "currentPrice": 150,
  "minPrice": 100,
  "maxPrice": 200
}

Response (200):
{
  "message": "Market price updated successfully",
  "marketPrice": {
    "vegetable": {
      "_id": "...",
      "name": "Tomato",
      "unit": "kg"
    },
    "currentPrice": 150,
    "priceChange": 10,
    "priceChangePercentage": 7.14,
    "historicalData": [...]
  }
}
```

### Get All Market Prices
```
GET /api/admin/market-prices

Response (200):
{
  "total": 15,
  "prices": [
    {
      "vegetable": {...},
      "currentPrice": 150,
      "minPrice": 100,
      "maxPrice": 200,
      "priceChangePercentage": 7.14
    }
  ]
}
```

### Get Price History
```
GET /api/admin/price-history/{vegetableId}

Response (200):
{
  "vegetable": "Tomato",
  "currentPrice": 150,
  "historicalData": [
    {
      "price": 140,
      "date": "2024-02-22T10:30:00Z"
    }
  ]
}
```

### Post Notice
```
POST /api/admin/notice

Request Body:
{
  "title": "Special Offer",
  "content": "Get 20% off on tomatoes",
  "priority": "high",
  "visibility": ["farmer", "broker", "buyer"],
  "voucher": {
    "code": "VEGIX20",
    "discount": 20,
    "expiryDate": "2024-03-31"
  },
  "expiryDate": "2024-03-31"
}

Response (201):
{
  "message": "Notice posted successfully",
  "notice": {...}
}
```

### Get All Notices
```
GET /api/admin/notices

Response (200):
{
  "total": 10,
  "notices": [...]
}
```

### Get All Feedback
```
GET /api/admin/feedback

Response (200):
{
  "total": 25,
  "feedback": [
    {
      "id": "...",
      "name": "John User",
      "email": "john@example.com",
      "subject": "Bug Report",
      "message": "Found an issue...",
      "rating": 4,
      "category": "bug",
      "status": "new"
    }
  ]
}
```

### Update Feedback Status
```
PUT /api/admin/feedback/{feedbackId}

Request Body:
{
  "status": "resolved"
}

Status Options: new, in-progress, resolved, closed

Response (200):
{
  "message": "Feedback status updated",
  "feedback": {...}
}
```

### Get Demand Analysis
```
GET /api/admin/demand-analysis

Response (200):
{
  "total": 15,
  "demands": [
    {
      "vegetable": {...},
      "demandQuantity": 500,
      "supplyQuantity": 450,
      "demandTrend": "increasing",
      "forecastedDemand": 550
    }
  ]
}
```

### Analyze Demand & Supply
```
POST /api/admin/analyze-demand

Response (200):
{
  "message": "Demand and supply analysis completed"
}
```

### Get Published Orders
```
GET /api/admin/published-orders

Response (200):
{
  "total": 50,
  "orders": [
    {
      "orderNumber": "ORD-1708594200000-8901",
      "vegetable": {...},
      "quantity": 100,
      "pricePerUnit": 150,
      "totalPrice": 15000,
      "orderType": "farmer-sell",
      "publishedBy": {...},
      "status": "active",
      "location": "Colombo"
    }
  ]
}
```

---

## 🚜 Farmer Routes (`/api/farmer`)
**Protected: Yes | Role Required: farmer**

### Publish Order (Sell)
```
POST /api/farmer/publish-order

Request Body:
{
  "vegetableId": "507f1f77bcf86cd799439011",
  "quantity": 100,
  "unit": "kg",
  "pricePerUnit": 150,
  "location": "Colombo",
  "quality": "premium",
  "description": "Fresh organic tomatoes",
  "deliveryDate": "2024-02-25"
}

Response (201):
{
  "message": "Order published successfully",
  "order": {...}
}
```

### Get My Orders
```
GET /api/farmer/my-orders

Response (200):
{
  "total": 5,
  "orders": [...]
}
```

### View Broker Orders
```
GET /api/farmer/broker-orders

Response (200):
{
  "total": 15,
  "orders": [...]
}
```

### Update Order Status
```
PUT /api/farmer/order-status/{orderId}

Request Body:
{
  "status": "in-progress"
}

Status Options: active, in-progress, completed, cancelled

Response (200):
{
  "message": "Order status updated",
  "order": {...}
}
```

### Delete Order
```
DELETE /api/farmer/order/{orderId}

Response (200):
{
  "message": "Order deleted successfully"
}
```

---

## 🤝 Broker Routes (`/api/broker`)
**Protected: Yes | Role Required: broker**

### Publish Buy Order
```
POST /api/broker/publish-buy-order

Request Body:
{
  "vegetableId": "507f1f77bcf86cd799439011",
  "quantity": 200,
  "unit": "kg",
  "pricePerUnit": 140,
  "location": "Colombo Market",
  "quality": "standard",
  "description": "Need tomatoes for market",
  "deliveryDate": "2024-02-25"
}

Response (201):
{
  "message": "Buy order published successfully",
  "order": {...}
}
```

### Publish Sell Order
```
POST /api/broker/publish-sell-order

Request Body: (Same as buy order)

Response (201):
{
  "message": "Sell order published successfully",
  "order": {...}
}
```

### Get My Orders
```
GET /api/broker/my-orders

Response (200):
{
  "total": 10,
  "orders": [...]
}
```

### View Farmer Orders
```
GET /api/broker/farmer-orders

Response (200):
{
  "total": 20,
  "orders": [...]
}
```

### View Buyer Orders
```
GET /api/broker/buyer-orders

Response (200):
{
  "total": 15,
  "orders": [...]
}
```

### Show Interest in Order
```
POST /api/broker/show-interest/{orderId}

Response (200):
{
  "message": "Interest registered",
  "order": {...}
}
```

---

## 🏪 Buyer Routes (`/api/buyer`)
**Protected: Yes | Role Required: buyer**

### Publish Order (Purchase)
```
POST /api/buyer/publish-order

Request Body:
{
  "vegetableId": "507f1f77bcf86cd799439011",
  "quantity": 50,
  "unit": "kg",
  "pricePerUnit": 160,
  "location": "Hotel XYZ, Colombo",
  "quality": "premium",
  "description": "Need fresh tomatoes daily",
  "deliveryDate": "2024-02-25"
}

Response (201):
{
  "message": "Order published successfully (Visible to Brokers)",
  "order": {...}
}
```

### Get My Orders
```
GET /api/buyer/my-orders

Response (200):
{
  "total": 5,
  "orders": [...]
}
```

### View Broker Orders
```
GET /api/buyer/broker-orders

Response (200):
{
  "total": 30,
  "orders": [...]
}
```

---

## 💬 Feedback Routes (`/api/feedback`)

### Submit Feedback
```
POST /api/feedback/submit

Request Body:
{
  "name": "John User",
  "email": "john@example.com",
  "subject": "Found a bug",
  "message": "The order button doesn't work",
  "rating": 3,
  "category": "bug"
}

Categories: bug, feature-request, complaint, suggestion, other

Response (201):
{
  "message": "Feedback submitted successfully",
  "feedback": {...}
}
```

---

## 🔄 Common Response Formats

### Success Response (200/201)
```json
{
  "message": "Operation successful",
  "data": {...}
}
```

### Error Response (400/401/403/500)
```json
{
  "message": "Error description",
  "status": 400
}
```

### List Response
```json
{
  "total": 10,
  "items": [...]
}
```

---

## 🔑 JWT Token Format

```
Header: Authorization: Bearer <token>

Token contains:
- userId: User's database ID
- email: User's email
- role: User's role (admin, farmer, broker, buyer)
- expiresIn: 7 days
```

---

## 📊 Order Types

1. **farmer-sell**: Farmer selling vegetables
2. **broker-buy**: Broker buying from farmers
3. **broker-sell**: Broker selling to buyers
4. **buyer-order**: Buyer placing order (private to brokers)

---

## 🎯 Status Values

### Order Status
- `active`: Active and open for transactions
- `in-progress`: Being negotiated or in process
- `completed`: Transaction completed
- `cancelled`: Order cancelled

### Feedback Status
- `new`: Just received
- `in-progress`: Being handled
- `resolved`: Issue resolved
- `closed`: No further action

---

## 🚦 HTTP Status Codes

- `200`: OK - Request successful
- `201`: Created - Resource created
- `400`: Bad Request - Invalid data
- `401`: Unauthorized - Need authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Server Error - Internal error

---

## 📝 Notes

- All requests should use `Content-Type: application/json`
- Dates should be in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
- Prices are in Sri Lankan Rupees (₨)
- All protected routes require valid JWT token
- Role-based access is enforced on backend

---

## 🧪 Testing Tips

1. **Test with Postman** or any HTTP client
2. **Copy token from login** and use in Authorization header
3. **Use correct role** for role-protected endpoints
4. **Validate request body** before sending
5. **Check response** for errors and data

---

For more details, check the README.md and source code documentation.
