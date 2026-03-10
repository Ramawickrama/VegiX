const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const priceEngineController = require('../controllers/priceEngineController');

router.get('/recommendation/:vegetableId', protect, priceEngineController.getPriceRecommendation);
router.get('/recommendations', protect, priceEngineController.getAllPriceRecommendations);
router.get('/insights/:vegetableId', protect, priceEngineController.getPriceInsights);

module.exports = router;
