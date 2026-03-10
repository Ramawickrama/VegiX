const express = require('express');
const router = express.Router();
const {
  getPriceTrend,
  getFuturePrice,
  getHighDemandVegetables,
  getSupplyDemand,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Debug test route
router.get('/test', (req, res) => {
  res.json({ message: 'Analytics route working!' });
});

// Mount routes - supply-demand must come BEFORE parameterized routes
router.get('/supply-demand', getSupplyDemand);
router.get('/price-trend/:vegetableId', protect, getPriceTrend);
router.get('/future-price/:vegetableId', protect, getFuturePrice);
router.get('/high-demand', protect, getHighDemandVegetables);

module.exports = router;
