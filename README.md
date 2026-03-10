# VegiX - Sri Lanka Vegetable Market System

A complete MERN stack (MongoDB, Express, React, Node.js) solution for a vegetable marketplace system in Sri Lanka. This platform connects farmers, brokers, and buyers in an efficient, transparent marketplace.

## 🌟 Features

### For Farmers
- ✅ Publish and manage selling orders
- ✅ View broker buying orders and negotiate prices
- ✅ Track order status and income
- ✅ Historical price tracking
- ✅ Real-time market updates

### For Brokers
- ✅ Publish buying orders from farmers
- ✅ Publish selling orders to buyers
- ✅ View and manage multiple orders
- ✅ Express interest in farmer orders
- ✅ Act as intermediary between farmers and buyers

### For Buyers (Hotels & Markets)
- ✅ Publish purchase orders (visible only to brokers)
- ✅ Browse broker offerings
- ✅ Track orders and delivery status
- ✅ Budget planning tools
- ✅ Quality preferences specification

### For Admins
- ✅ Manage all users (farmers, brokers, buyers, admins)
- ✅ Update and monitor market prices
- ✅ Demand and supply analysis
- ✅ Post notices and promotional offers with voucher codes
- ✅ Customer support and feedback management
- ✅ Published orders monitoring

## 📋 Tech Stack

- **Frontend:** React 18, React Router, Axios, Recharts, CSS3
- **Backend:** Node.js, Express.js, MongoDB, JWT Authentication, bcrypt
- **Database:** MongoDB (Atlas recommended)
- **Hosting:** AWS, Google Cloud, or DigitalOcean ready
- **Additional:** Vite (frontend bundler), Nodemon (backend dev)

## 📂 Project Structure

```
VegiX/
├── backend/
│   ├── models/           (MongoDB schemas)
│   │   ├── User.js
│   │   ├── Vegetable.js
│   │   ├── Order.js
│   │   ├── MarketPrice.js
│   │   ├── Notice.js
│   │   ├── Feedback.js
│   │   └── Demand.js
│   ├── controllers/      (Business logic)
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── farmerController.js
│   │   ├── brokerController.js
│   │   ├── buyerController.js
│   │   └── adminDashboardController.js
│   ├── routes/           (API endpoints)
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── farmerRoutes.js
│   │   ├── brokerRoutes.js
│   │   ├── buyerRoutes.js
│   │   └── feedbackRoutes.js
│   ├── middleware/       (Custom middleware)
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── server.js         (Main server file)
│   ├── .env              (Environment variables)
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── pages/        (All page components)
│   │   ├── components/   (Reusable components)
│   │   ├── services/     (API services)
│   │   ├── styles/       (CSS files)
│   │   ├── App.jsx       (Main app component)
│   │   ├── index.jsx     (Entry point)
│   │   └── App.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .gitignore
└── README.md             (This file)
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)
- npm or yarn

> ⚠️ **IMPORTANT:** Never commit `.env` files or secrets to git. All `.env` files are git-ignored. Use the `.env.example` templates to create your local `.env` files.

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create your environment file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `backend/.env` with your real values:
   ```
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vegix?retryWrites=true&w=majority
   JWT_SECRET=<a-strong-random-string>
   FRONTEND_URL=http://localhost:3000
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
  

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create your environment file:**
   ```bash
   cp .env.example .env
   ```
   Edit `frontend/.env`:
   ```


4. **Start the development server:**
   ```bash
   npm run dev
   ```
   


### Required Environment Variables

#### Backend (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT token signing |
| `PORT` | ❌ | Server port (default: 5000) |
| `NODE_ENV` | ❌ | Environment (default: development) |
| `FRONTEND_URL` | ❌ | Frontend origin for CORS (default: http://localhost:3000) |
| `EMAIL_SERVICE` | ❌ | Email provider (default: gmail) |
| `EMAIL_USER` | ❌ | Email sender address |
| `EMAIL_PASSWORD` | ❌ | Email app password |

#### Frontend (`frontend/.env`)
| Variable | Required | Description |
|---|---|---|


## 🔐 Authentication



## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user` - Get current user (protected)

### Admin Routes (Protected - Admin only)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users-by-role/:role` - Get users by role
- `GET /api/admin/user-stats` - Get user statistics
- `PUT /api/admin/user/:userId` - Update user
- `DELETE /api/admin/user/:userId` - Delete user
- `PUT /api/admin/market-price` - Update market price
- `GET /api/admin/market-prices` - Get all market prices
- `GET /api/admin/price-history/:vegetableId` - Get price history
- `POST /api/admin/notice` - Post notice
- `GET /api/admin/notices` - Get all notices
- `GET /api/admin/feedback` - Get all feedback
- `PUT /api/admin/feedback/:feedbackId` - Update feedback status
- `GET /api/admin/demand-analysis` - Get demand analysis
- `POST /api/admin/analyze-demand` - Analyze demand and supply
- `GET /api/admin/published-orders` - Get all published orders

### Farmer Routes (Protected - Farmer only)
- `POST /api/farmer/publish-order` - Publish selling order
- `GET /api/farmer/my-orders` - Get farmer's orders
- `GET /api/farmer/broker-orders` - View broker's orders
- `PUT /api/farmer/order-status/:orderId` - Update order status
- `DELETE /api/farmer/order/:orderId` - Delete order

### Broker Routes (Protected - Broker only)
- `POST /api/broker/publish-buy-order` - Publish buying order
- `POST /api/broker/publish-sell-order` - Publish selling order
- `GET /api/broker/my-orders` - Get broker's orders
- `GET /api/broker/farmer-orders` - View farmer orders
- `GET /api/broker/buyer-orders` - View buyer orders
- `POST /api/broker/show-interest/:orderId` - Show interest in order

### Buyer Routes (Protected - Buyer only)
- `POST /api/buyer/publish-order` - Publish purchase order
- `GET /api/buyer/my-orders` - Get buyer's orders
- `GET /api/buyer/broker-orders` - View broker's offerings

### Feedback Routes (Public)
- `POST /api/feedback/submit` - Submit customer feedback

### Test Routes
- `GET /api/ping` - Verify server is running
- `GET /` - API status

## 🗄️ MongoDB Connection

### Using MongoDB Atlas (Recommended)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Update `.env` in backend:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/VegiX?retryWrites=true&w=majority
   ```



## 🌐 Deployment

### Backend Deployment (Example: Heroku/Railway)

1. Push code to GitHub
2. Connect to deployment platform
3. Set environment variables
4. Deploy

### Frontend Deployment (Example: Vercel/Netlify)

1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder
3. Configure API endpoint for production

## 📊 Dashboard Features

### Admin Dashboard
- User statistics and management
- Market price updates and history
- Demand/supply analysis with visualizations
- Notice and voucher management
- Customer feedback tracking
- Published orders monitoring

### Farmer Dashboard
- My orders overview
- Income tracking
- Broker order browsing
- Order status management
- Historical price data

### Broker Dashboard
- Buy/Sell order management
- Active deals tracking
- Farmer and buyer order viewing
- Volume statistics
- Negotiation tools

### Buyer Dashboard
- Order management
- Budget planning
- Broker offering browsing
- Order history
- Delivery tracking

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Protected API routes
- ✅ Input validation
- ✅ CORS configuration
- ✅ Environment variable protection

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
- Check your MONGO_URI in .env
- Ensure MongoDB is running
- Verify network access in MongoDB Atlas

**Port Already in Use:**
```bash
# Kill process on port 5000
Windows: netstat -ano | findstr :5000
Linux/Mac: lsof -i :5000
```

### Frontend Issues

**White Screen:**
- Check browser console for errors
- Verify API endpoint in axios calls
- Ensure backend is running
- Clear browser cache

**Module Not Found:**
```bash
npm install
```

## 📈 Future Enhancements

- [ ] AI price prediction for vegetables
- [ ] Weather impact alerts
- [ ] Government price integration API
- [ ] Real-time GPS transport tracking
- [ ] Digital weighing scale integration
- [ ] QR-based delivery confirmation
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Email/SMS notifications
- [ ] Advanced analytics dashboard

## 💻 System Requirements

### Development
- Node.js v14+
- npm v6+ or yarn
- MongoDB v4+
- 2GB RAM minimum
- 500MB disk space

### Production
- Node.js v16+ LTS
- MongoDB v5+
- SSL certificate
- 4GB+ RAM recommended
- 10GB+ storage for database

## 📞 Support

For issues, questions, or contributions:
1. Check existing issues
2. Create a detailed bug report
3. Include steps to reproduce
4. Provide error logs/screenshots

## 📄 License

This project is open source and available under the MIT License.

## 👥 Contributors

- Development Team: VegiX Project

## 🎯 Project Status

- ✅ Backend: Complete
- ✅ Frontend: Complete
- ✅ Authentication: Complete
- ✅ Core Features: Complete
- 🔄 Testing: In Progress
- 📅 Deployment Ready: Yes

---

**Made with ❤️ for Sri Lanka's Agriculture Sector**

For more information, visit the project repository or contact the development team.
