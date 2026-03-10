# VegiX - Complete Setup Guide

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js v14+ installed
- [ ] npm or yarn package manager
- [ ] MongoDB account (create at https://www.mongodb.com/cloud/atlas)
- [ ] Git installed
- [ ] Text editor (VS Code recommended)
- [ ] 2GB+ RAM available
- [ ] Good internet connection

## 🔧 Installation Steps

### Step 1: Clone/Download Project

```bash
# If cloning from GitHub
git clone <repository-url>
cd VegiX_1197
```

### Step 2: Backend Setup

#### 2.1 Install Backend Dependencies
```bash
cd backend
npm install
```

**Expected output:** Similar to:
```
added XXX packages in X.XXs
```

#### 2.2 Configure MongoDB

1. Visit https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster
4. Create database user (remember username and password)
5. Get connection string (click "Connect" → "Connect your application")
6. Copy string like: `mongodb+srv://username:password@cluster.mongodb.net/VegiX?retryWrites=true&w=majority`

#### 2.3 Update Environment Variables

Edit `backend/.env`:
```
MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/VegiX?retryWrites=true&w=majority
JWT_SECRET=vegix_jwt_secret_key_2024_secure_token
PORT=5000
NODE_ENV=development
```

⚠️ **Important:** Replace placeholders with your actual MongoDB credentials

#### 2.4 Test Backend

```bash
npm run dev
```

**Expected output:**
```
╔════════════════════════════════════╗
║   VegiX Backend Server Running     ║
║   URL: http://localhost:5000       ║
╚════════════════════════════════════╝

✓ MongoDB connected successfully
```

**Test the server:**
Open browser → http://localhost:5000/api/ping

Should see:
```json
{
  "message": "✓ VegiX Backend Server is running successfully",
  "timestamp": "2024-02-23T...",
  "status": "active"
}
```

✅ **Backend is ready!** Keep terminal running.

---

### Step 3: Frontend Setup

#### 3.1 Install Frontend Dependencies

Open **new terminal** and navigate to frontend:
```bash
cd frontend
npm install
```

**Expected output:**
```
added XXX packages in X.XXs
```

#### 3.2 Start Frontend Development Server

```bash
npm run dev
```

**Expected output:**
```
VITE v4.2.0 ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

#### 3.3 Verify Frontend

Open browser → http://localhost:3000

You should see the VegiX Login page ✅

---

## 🔑 Login to Application

### Demo Accounts Available:

1. **Admin Account**
   - Email: `admin@vegix.com`
   - Password: `password123`
   - Access: Full platform control

2. **Farmer Account**
   - Email: `farmer@vegix.com`
   - Password: `password123`
   - Access: Publish orders, view broker offers

3. **Broker Account**
   - Email: `broker@vegix.com`
   - Password: `password123`
   - Access: Buy/Sell orders, manage deals

4. **Buyer Account**
   - Email: `buyer@vegix.com`
   - Password: `password123`
   - Access: Place purchase orders

### First Time Login Steps:

1. Go to http://localhost:3000
2. Click "Login"
3. Enter demo credentials
4. Click "Login" button
5. Dashboard will load based on your role ✅

---

## 🚀 Testing Each Feature

### Admin Features to Test:
- [ ] User Management - View all users, delete a user
- [ ] Market Prices - Update a vegetable price
- [ ] Demand Analysis - Click "Refresh Analysis"
- [ ] Notice Management - Post a notice with voucher
- [ ] Customer Support - View feedback (submit one first)
- [ ] Published Orders - View all orders

### Farmer Features to Test:
- [ ] Publish Order - Create a selling order
- [ ] View My Orders - See published orders
- [ ] View Broker Orders - Browse broker offers

### Broker Features to Test:
- [ ] Publish Buy Order - Create buying order from farmers
- [ ] Publish Sell Order - Create selling offer for buyers
- [ ] View Farmer Orders - Browse farmer orders
- [ ] View Buyer Orders - Browse buyer requests

### Buyer Features to Test:
- [ ] Publish Order - Place a purchase request
- [ ] View My Orders - Track your requests
- [ ] View Broker Orders - Browse available offerings

---

## 📱 Creating New Users

1. Go to http://localhost:3000/register
2. Fill in the form:
   - Full Name
   - Email
   - Phone
   - Select Role (Farmer/Broker/Buyer)
   - Location
   - Password
3. Click "Register"
4. Login with new credentials

---

## 🐛 Troubleshooting

### Problem: "MongoDB connection failed"
**Solution:**
```
1. Check MONGO_URI in .env is correct
2. Ensure MongoDB Atlas IP whitelist includes your IP
3. Verify database user exists in MongoDB
4. Try connection in MongoDB Compass
```

### Problem: "Cannot find module 'express'"
**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Problem: Frontend shows white screen
**Solution:**
```
1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify backend is running (http://localhost:5000/api/ping)
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try different browser
```

### Problem: "Port 5000 already in use"
**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process-id> /F

# Linux/Mac
lsof -i :5000
kill -9 <process-id>
```

### Problem: "Cannot GET /api/ping"
**Solution:**
```
1. Ensure backend is running (npm run dev in backend folder)
2. Check terminal for error messages
3. Verify MONGO_URI is correct
4. Restart backend with npm run dev
```

---

## 📊 API Testing with Postman

1. Download Postman: https://www.postman.com/downloads/
2. Test endpoints:

**Register:**
```
POST http://localhost:5000/api/auth/register
Body (JSON):
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "0712345678",
  "password": "password123",
  "role": "farmer"
}
```

**Login:**
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "email": "admin@vegix.com",
  "password": "password123"
}
```

Copy the token from response for protected routes.

**Get User Stats (Protected):**
```
GET http://localhost:5000/api/admin/user-stats
Headers:
Authorization: Bearer <your-token-here>
```

---

## 🌐 Production Deployment

### Backend Deployment (Example: Railway.app)

1. Push code to GitHub
2. Create account at https://railway.app
3. Connect GitHub repository
4. Add environment variables
5. Deploy

### Frontend Deployment (Example: Vercel)

```bash
# Build frontend
npm run build

# Output in dist/ folder
# Upload dist/ to Vercel or any static hosting
```

---

## 📞 Support & Help

### Check These First:
- [ ] Is backend running? (Check terminal)
- [ ] Is MongoDB connected? (Check console)
- [ ] Are ports 3000 and 5000 open?
- [ ] Is .env configured correctly?

### Common Commands

```bash
# Restart backend
npm run dev

# Reinstall packages
npm install

# Check Node version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force
```

---

## ✅ Verification Checklist

- [ ] Backend server running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] MongoDB connected successfully
- [ ] Can login with demo credentials
- [ ] Can navigate different dashboards
- [ ] Can publish orders
- [ ] Can view orders
- [ ] Admin can update market prices
- [ ] Customer feedback works

---

## 🎉 You're All Set!

The VegiX platform is now fully operational. Start exploring and testing all features!

**Next Steps:**
1. Create test accounts for each role
2. Publish test orders
3. Test inter-role interactions
4. Review API documentation
5. Plan customizations if needed

**For Production:**
1. Setup proper MongoDB backup
2. Configure HTTPS/SSL
3. Setup CI/CD pipeline
4. Configure monitoring and logging
5. Plan scaling strategy

---

**Questions? Issues? Refer to the main README.md or check documentation.**

Happy Vegetable Marketing! 🥬🥕🍅
