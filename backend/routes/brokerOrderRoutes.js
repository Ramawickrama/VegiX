const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const brokerOrderController = require('../controllers/brokerOrderController');

router.post('/create', authMiddleware, roleMiddleware(['broker']), brokerOrderController.createOrder);
router.get('/', authMiddleware, brokerOrderController.getAllOrders);

module.exports = router;
