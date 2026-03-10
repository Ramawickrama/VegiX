const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const buyerController = require('../controllers/buyerController');
const buyerCartController = require('../controllers/buyerCartController');
const orderController = require('../controllers/orderController');

// Publish buyer order (uses unified createOrder)
router.post('/publish-order', authMiddleware, roleMiddleware(['buyer']), orderController.createOrder);

// Demand Orders
router.post('/demand', authMiddleware, roleMiddleware(['buyer']), buyerController.createDemand);
router.get('/my-demands', authMiddleware, roleMiddleware(['buyer']), buyerController.getMyDemands);
router.put('/demand/:id', authMiddleware, roleMiddleware(['buyer']), async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, deliveryDate, status } = req.body;

        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid demand ID' });
        }

        const BuyerDemand = require('../models/BuyerDemand');
        const demand = await BuyerDemand.findById(id);

        if (!demand) {
            return res.status(404).json({ success: false, message: 'Demand not found' });
        }

        // Verify ownership
        if (demand.buyerId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this demand' });
        }

        // Update fields
        if (quantity) demand.quantity = quantity;
        if (deliveryDate) demand.deliveryDate = deliveryDate;
        if (status && ['open', 'fulfilled', 'cancelled'].includes(status)) {
            demand.status = status;
        }

        await demand.save();

        res.status(200).json({ success: true, demand });
    } catch (error) {
        console.error('Error updating demand:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/demand/:id', authMiddleware, roleMiddleware(['buyer']), async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid demand ID' });
        }

        const BuyerDemand = require('../models/BuyerDemand');
        const demand = await BuyerDemand.findById(id);

        if (!demand) {
            return res.status(404).json({ success: false, message: 'Demand not found' });
        }

        // Verify ownership
        if (demand.buyerId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this demand' });
        }

        await BuyerDemand.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Demand deleted successfully' });
    } catch (error) {
        console.error('Error deleting demand:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Viewing Orders (with price rule)
router.get('/market-orders', authMiddleware, roleMiddleware(['buyer']), buyerController.getBrokerSellOrders);
router.get('/marketplace', authMiddleware, roleMiddleware(['buyer']), buyerController.getMarketplaceVegetables);

// Contact broker from market order
router.post('/market-orders/:orderId/contact', authMiddleware, roleMiddleware(['buyer']), async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }

        const BrokerSellOrder = require('../models/BrokerSellOrder');

        const order = await BrokerSellOrder.findById(orderId).populate('brokerId', 'name email role');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const broker = order.brokerId;
        if (!broker) {
            return res.status(404).json({ success: false, message: 'Broker not found' });
        }

        if (broker.email.toLowerCase() === req.user.email.toLowerCase()) {
            return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
        }

        const chatService = require('../services/chatService');
        const conversation = await chatService.getOrCreateDirectConversation(req.user.userId, broker._id);

        res.status(200).json({
            success: true,
            conversationId: conversation._id,
            otherUser: {
                _id: broker._id,
                name: broker.name,
                email: broker.email,
                role: broker.role,
                avatar: broker.avatar || ''
            },
            conversation: {
                _id: conversation._id,
                type: conversation.type
            }
        });
    } catch (error) {
        console.error('Error contacting broker:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Buyer Cart Routes
router.get('/cart', authMiddleware, roleMiddleware(['buyer']), buyerCartController.getCart);
router.get('/cart/count', authMiddleware, roleMiddleware(['buyer']), buyerCartController.getCartCount);
router.post('/cart/:brokerSellOrderId', authMiddleware, roleMiddleware(['buyer']), buyerCartController.addToCart);
router.delete('/cart/:brokerSellOrderId', authMiddleware, roleMiddleware(['buyer']), buyerCartController.removeFromCart);

// Buyer Payment Routes
router.get('/payment/:brokerSellOrderId', authMiddleware, roleMiddleware(['buyer']), buyerCartController.initiatePayment);
router.post('/payment/pay', authMiddleware, roleMiddleware(['buyer']), (req, res) => {
    const brokerSellOrderId = req.body.brokerSellOrderId;
    req.params = { brokerSellOrderId };
    buyerCartController.processPayment(req, res);
});

module.exports = router;
