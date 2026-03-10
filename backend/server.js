const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const config = require('./config/env');           // validates env vars & loads dotenv for local dev
const createAdmin = require('./utils/createAdmin');
const seedVegetables = require('./seeds/seedVegetables');
const socketManager = require('./services/socketManager');
const { setSocketIO } = require('./services/notificationService');
const { startForecastScheduler, startMarketPriceScheduler, runInitialForecast, runInitialMarketPrices } = require('./services/schedulerService');
const responseMiddleware = require('./middleware/responseMiddleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');


// Allowed frontend origins (cover Vite defaults + project-specific port)
const ALLOWED_ORIGINS = [
  config.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin Nginx proxy)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

const path = require('path');

// Middleware
app.options('*', cors(corsOptions)); // Handle preflight for all routes
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Response Middleware
app.use(responseMiddleware);

// Initialize Socket.io with authentication
socketManager.initialize(io);
setSocketIO(io);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✓ MongoDB connected successfully');
    createAdmin();
    seedVegetables();
    runInitialForecast();
    runInitialMarketPrices();
    startForecastScheduler();
    startMarketPriceScheduler();
  })
  .catch((err) => console.error('✗ MongoDB connection failed:', err.message));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/farmer', require('./routes/farmerRoutes'));
app.use('/api/broker', require('./routes/brokerRoutes'));
app.use('/api/buyer', require('./routes/buyerRoutes'));
app.use('/api/buyer-orders', require('./routes/buyerOrderRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/market-prices', require('./routes/marketPriceRoutes'));
app.use('/api/live-market', require('./routes/liveMarketRoutes'));
app.use('/api/vegetables', require('./routes/vegetableRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/market', require('./routes/nationalAnalyticsRoutes'));
app.use('/api/demand', require('./routes/demandRoutes'));
app.use('/api/intelligence', require('./routes/intelligenceRoutes'));
app.use('/api/matching', require('./routes/matchingRoutes'));
app.use('/api/pricing', require('./routes/priceEngineRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/farmer/posts', require('./routes/farmerPostRoutes'));
app.use('/api/broker/orders', require('./routes/brokerOrderRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

// Test ping route
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    message: '✓ VegiX Backend Server is running successfully',
    timestamp: new Date().toISOString(),
    status: 'active',
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'VegiX - Sri Lanka Vegetable Market System' });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

const startServer = (port) => {
  server.listen(port, () => {
    console.log(`\n╔════════════════════════════════════╗`);
    console.log(`║   VegiX Backend Server Running     ║`);
    console.log(`║   URL: http://localhost:${port}     ║`);
    console.log(`║   WebSocket: Enabled               ║`);
    console.log(`╚════════════════════════════════════╝\n`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is already in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Server startup error:', error.message);
    }
  });

  const shutdown = () => {
    console.log(`⚠️  Shutdown signal received: closing server on port ${port}`);
    server.close(() => {
      console.log('✓ HTTP server closed');
      if (mongoose.connection.readyState !== 0) {
        mongoose.connection.close().then(() => {
          console.log('✓ MongoDB connection closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  };

  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('SIGINT');
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

const initialPort = config.PORT;
startServer(initialPort);

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
