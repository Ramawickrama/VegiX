const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const marketIntelligenceController = require('../controllers/marketIntelligenceController');

router.get('/demand-index', protect, marketIntelligenceController.getDemandIndex);
router.get('/seasonal-forecast', protect, marketIntelligenceController.getSeasonalForecast);
router.get('/national-overview', protect, marketIntelligenceController.getNationalMarketOverview);
router.post('/calculate-profit', protect, marketIntelligenceController.calculateFarmerProfit);

module.exports = router;
