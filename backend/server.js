const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const config = require('./config/env');           // validates env vars & loads dotenv for local dev
const createAdmin = require('./utils/createAdmin');
const seedVegetables = require('./seeds/seedVegetables');
const socketManager = require('./services/socketManager');
const { setSocketIO } = require('./services/notificationService');
const {
  startForecastScheduler,
  startMarketPriceScheduler,
  runInitialForecast,
  runInitialMarketPrices
} = require('./services/schedulerService');
const responseMiddleware = require('./middleware/responseMiddleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// ─── CORS Configuration ──────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [config.FRONTEND_URL];

// In development, allow various localhost ports
if (config.NODE_ENV !== 'production') {
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://13.60.95.84:3001', // Assuming these are dev/test IPs
    'http://13.60.87.168',
  ];
  devOrigins.forEach(origin => {
    if (!ALLOWED_ORIGINS.includes(origin)) ALLOWED_ORIGINS.push(origin);
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
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

// Apply CORS to Express
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Socket.IO Initialization ───────────────────────────────────────────────
const io = socketio(server, {
  cors: {
    origin: (origin, callback) => {
      // Match Express CORS logic
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(responseMiddleware);

// Initialize Socket.io services
socketManager.initialize(io);
setSocketIO(io);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/ping', (req, res) => {
  res.status(200).json({
    message: '✓ VegiX Backend Server is running successfully',
    timestamp: new Date().toISOString(),
    status: 'active',
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'VegiX - Sri Lanka Vegetable Market System API' });
});

// Mounted API routes
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

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server Startup ─────────────────────────────────────────────────────────
const startServer = (port) => {
  const instance = server.listen(port, () => {
    console.log(`\n╔════════════════════════════════════╗`);
    console.log(`║   VegiX Backend Server Running     ║`);
    console.log(`║   PORT: ${port}                       ║`);
    console.log(`║   ENV:  ${config.NODE_ENV}                ║`);
    console.log(`║   WebSocket: Enabled               ║`);
    console.log(`╚════════════════════════════════════╝\n`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      if (config.NODE_ENV === 'production') {
        console.error(`❌ FATAL: Port ${port} is already in use in production. Exiting.`);
        process.exit(1);
      } else {
        console.log(`⚠️  Port ${port} is already in use. Trying port ${port + 1}...`);
        startServer(port + 1);
      }
    } else {
      console.error('❌ Server startup error:', error.message);
      process.exit(1);
    }
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log(`\n⚠️  Shutdown signal received: closing server...`);
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

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

// ─── Database & Services Initialization ─────────────────────────────────────
mongoose.connect(config.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('✓ MongoDB connected successfully');

    // Background Services & Initializers (wrapped to prevent crash)
    try {
      await createAdmin();
      await seedVegetables();

      // Schedulers (wrapped individually to ensure partial success)
      const safeRun = async (taskName, taskFn) => {
        try {
          await taskFn();
          console.log(`✓ Initialized: ${taskName}`);
        } catch (e) {
          console.error(`✗ Failed to initialize ${taskName}:`, e.message);
        }
      };

      await safeRun('Initial Forecast', runInitialForecast);
      await safeRun('Initial Market Prices', runInitialMarketPrices);
      await safeRun('Forecast Scheduler', startForecastScheduler);
      await safeRun('Market Price Scheduler', startMarketPriceScheduler);

    } catch (err) {
      console.error('⚠️  Warning: Error during initial data/scheduler setup:', err.message);
    }

    // Start server only after DB is ready
    startServer(config.PORT);
  })
  .catch((err) => {
    console.error('❌ FATAL: MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ─── Global Error Events ────────────────────────────────────────────────────
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
