const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const matchingController = require('../controllers/matchingController');

router.get('/suggestions', protect, matchingController.getSuggestions);
router.get('/farmer/:postId', protect, matchingController.getFarmerMatches);
router.get('/buyer/:demandId', protect, matchingController.getBuyerMatches);

module.exports = router;
