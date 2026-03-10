const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const nationalAnalyticsController = require('../controllers/nationalAnalyticsController');

router.get('/overview', authMiddleware, roleMiddleware(['admin']), nationalAnalyticsController.getOverview);

router.get('/vegetable/:id', authMiddleware, roleMiddleware(['admin']), nationalAnalyticsController.getVegetableAnalytics);

router.get('/date-range', authMiddleware, roleMiddleware(['admin']), nationalAnalyticsController.getDateRangeAnalytics);

router.get('/top-farmers', authMiddleware, roleMiddleware(['admin']), nationalAnalyticsController.getTopFarmers);

router.get('/market-activity', authMiddleware, roleMiddleware(['admin']), nationalAnalyticsController.getMarketActivityHeatmap);

module.exports = router;
