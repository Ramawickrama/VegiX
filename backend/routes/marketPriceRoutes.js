const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const marketPriceController = require('../controllers/marketPriceController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public for authenticated users: list all market prices
router.get('/', authMiddleware, adminDashboardController.getMarketPrices);

// Farmer/User specific price snapshots
router.get('/today', authMiddleware, marketPriceController.getTodayMarketPrices);
router.get('/by-date', authMiddleware, adminDashboardController.getPricesByDate);
router.get('/farmer', authMiddleware, marketPriceController.getFarmerPrices);

// Get price history / current price for a specific vegetableId
router.get('/:vegetableId', authMiddleware, adminDashboardController.getPriceHistory);

module.exports = router;
