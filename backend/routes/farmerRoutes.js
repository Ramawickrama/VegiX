const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const farmerController = require('../controllers/farmerController');

// ✅ Market prices endpoint
router.get('/market-prices', authMiddleware, roleMiddleware(['farmer']), farmerController.getMarketPrices);

// ✅ Contact Broker - Create/find conversation with broker
router.post('/broker-orders/:orderId/contact-broker', authMiddleware, roleMiddleware(['farmer']), async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }

        const User = require('../models/User');
        const Conversation = require('../models/Conversation');

        let order = await require('../models/Order').findById(orderId).populate('publishedBy', 'name email role');
        let broker = order?.publishedBy;
        let orderTitle = order?.vegetable?.name || order?.orderNumber;

        if (!order || !broker) {
            order = await require('../models/BrokerOrder').findById(orderId).populate('brokerId', 'name email role');
            broker = order?.brokerId;
            orderTitle = order?.vegetableName;
        }

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

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
            },
            order: {
                id: order._id,
                title: orderTitle,
                quantity: order.quantity || order.requiredQuantity,
                price: order.pricePerUnit || order.offeredPrice
            }
        });
    } catch (error) {
        console.error('Error contacting broker:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Notices endpoint (admin announcements for farmers)
router.get('/notices', authMiddleware, roleMiddleware(['farmer']), farmerController.getNotices);

// ✅ Farmer selling posts (CRUD)
router.post('/publish-order', authMiddleware, roleMiddleware(['farmer']), farmerController.publishOrder);
router.get('/my-orders', authMiddleware, roleMiddleware(['farmer']), farmerController.getFarmerOrders);
router.get('/broker-orders', authMiddleware, roleMiddleware(['farmer']), farmerController.viewBrokerOrders);
router.get('/broker-buying-requests', authMiddleware, roleMiddleware(['farmer']), farmerController.viewBrokerBuyingRequests);
router.put('/order-status/:orderId', authMiddleware, roleMiddleware(['farmer']), farmerController.updateOrderStatus);
router.delete('/order/:orderId', authMiddleware, roleMiddleware(['farmer']), farmerController.deleteOrder);

// ✅ Notifications
router.get('/notifications', authMiddleware, roleMiddleware(['farmer']), farmerController.getNotifications);
router.put('/notification/:notificationId/read', authMiddleware, roleMiddleware(['farmer']), farmerController.markNotificationRead);

// ✅ Dashboard stats
router.get('/dashboard-stats', authMiddleware, roleMiddleware(['farmer']), farmerController.getDashboardStats);

// ✅ Complete Dashboard with Price Trends, Demand Analytics, and Notices
router.get('/dashboard', authMiddleware, roleMiddleware(['farmer']), farmerController.getDashboard);

module.exports = router;
