const express = require('express');
const router = express.Router();
const liveMarketController = require('../controllers/liveMarketController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/latest', authMiddleware, liveMarketController.getLatestMarketPrices);

router.get('/vegetables', authMiddleware, liveMarketController.getVegetables);

router.get('/markets', authMiddleware, liveMarketController.getMarkets);

router.get('/history', authMiddleware, liveMarketController.getPriceHistory);

router.post('/refresh', authMiddleware, adminMiddleware, liveMarketController.refreshMarketPrices);

module.exports = router;
