const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

// Future Demand Prediction for Farmers
router.get('/future/:vegetableId', authMiddleware, analyticsController.getFutureDemand);

module.exports = router;
