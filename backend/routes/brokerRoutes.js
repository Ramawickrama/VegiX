const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const brokerController = require('../controllers/brokerController');
const cartController = require('../controllers/cartController');
const paymentController = require('../controllers/paymentController');

// Cart routes
router.get('/cart', authMiddleware, roleMiddleware(['broker']), cartController.getCart);
router.get('/cart/count', authMiddleware, roleMiddleware(['broker']), cartController.getCartCount);
router.post('/cart/:sellOrderId', authMiddleware, roleMiddleware(['broker']), cartController.addToCart);
router.delete('/cart/:sellOrderId', authMiddleware, roleMiddleware(['broker']), cartController.removeFromCart);

// Payment routes
router.get('/payment/:sellOrderId', authMiddleware, roleMiddleware(['broker']), paymentController.initiatePayment);
router.post('/payment/pay', authMiddleware, roleMiddleware(['broker']), paymentController.processPayment);

// Wallet routes
router.post('/wallet/add', authMiddleware, roleMiddleware(['broker']), async (req, res) => {
    try {
        const { amount } = req.body;
        const parsedAmount = parseFloat(amount);

        if (!parsedAmount || parsedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Please enter a valid amount' });
        }

        const User = require('../models/User');
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { $inc: { walletBalance: parsedAmount } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Wallet balance added successfully',
            walletBalance: updatedUser.walletBalance
        });
    } catch (error) {
        console.error('Error adding wallet balance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/wallet', authMiddleware, roleMiddleware(['broker']), async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user.userId).select('walletBalance');
        
        res.status(200).json({
            success: true,
            walletBalance: user.walletBalance || 0
        });
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Contact Farmer from farmer order post
router.post('/farmer-orders/:orderId/contact', authMiddleware, roleMiddleware(['broker']), async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }

        const FarmerOrder = require('../models/FarmerOrder');
        const FarmerPost = require('../models/FarmerPost');
        const User = require('../models/User');
        const Conversation = require('../models/Conversation');

        let order = await FarmerOrder.findById(orderId).populate('publishedBy', 'name email role');
        let farmer = order ? order.publishedBy : null;

        if (!order) {
            order = await FarmerPost.findById(orderId).populate('farmerId', 'name email role');
            if (order) {
                farmer = order.farmerId;
            }
        }

        if (!order) {
            return res.status(404).json({ success: false, message: 'Farmer order not found' });
        }

        if (!farmer) {
            return res.status(404).json({ success: false, message: 'Farmer not found' });
        }

        if (farmer.email.toLowerCase() === req.user.email.toLowerCase()) {
            return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
        }

        const chatService = require('../services/chatService');
        const conversation = await chatService.getOrCreateDirectConversation(req.user.userId, farmer._id);

        res.status(200).json({
            success: true,
            conversationId: conversation._id,
            otherUser: {
                _id: farmer._id,
                name: farmer.name,
                email: farmer.email,
                role: farmer.role,
                avatar: farmer.avatar || ''
            },
            conversation: {
                _id: conversation._id,
                type: conversation.type
            },
            order: {
                id: order._id,
                type: 'farmer',
                title: order.vegetable?.name || order.orderNumber || order.vegetableName,
                quantity: order.quantity,
                price: order.pricePerUnit || order.pricePerKg
            }
        });
    } catch (error) {
        console.error('Error contacting farmer:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Contact Buyer from buyer order post
router.post('/buyer-orders/:orderId/contact', authMiddleware, roleMiddleware(['broker']), async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }

        const BuyerOrder = require('../models/BuyerOrder');
        const User = require('../models/User');
        const Conversation = require('../models/Conversation');

        const order = await BuyerOrder.findById(orderId).populate('publishedBy', 'name email role');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Buyer order not found' });
        }

        const buyer = order.publishedBy;
        if (!buyer) {
            return res.status(404).json({ success: false, message: 'Buyer not found' });
        }

        if (buyer.email.toLowerCase() === req.user.email.toLowerCase()) {
            return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
        }

        const chatService = require('../services/chatService');
        const conversation = await chatService.getOrCreateDirectConversation(req.user.userId, buyer._id);

        res.status(200).json({
            success: true,
            conversationId: conversation._id,
            otherUser: {
                _id: buyer._id,
                name: buyer.name,
                email: buyer.email,
                role: buyer.role,
                avatar: buyer.avatar || ''
            },
            conversation: {
                _id: conversation._id,
                type: conversation.type
            },
            order: {
                id: order._id,
                type: 'buyer',
                title: order.vegetable?.name || order.orderNumber,
                quantity: order.quantity,
                price: order.budgetPerUnit
            }
        });
    } catch (error) {
        console.error('Error contacting buyer:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Contact Buyer from buyer demand post
router.post('/buyer-demands/:demandId/contact', authMiddleware, roleMiddleware(['broker']), async (req, res) => {
    try {
        const { demandId } = req.params;

        if (!demandId || !demandId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid demand ID' });
        }

        const BuyerDemand = require('../models/BuyerDemand');

        const demand = await BuyerDemand.findById(demandId).populate('buyerId', 'name email role');

        if (!demand) {
            return res.status(404).json({ success: false, message: 'Buyer demand not found' });
        }

        const buyer = demand.buyerId;
        if (!buyer) {
            return res.status(404).json({ success: false, message: 'Buyer not found' });
        }

        if (buyer.email.toLowerCase() === req.user.email.toLowerCase()) {
            return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
        }

        const chatService = require('../services/chatService');
        const conversation = await chatService.getOrCreateDirectConversation(req.user.userId, buyer._id);

        res.status(200).json({
            success: true,
            conversationId: conversation._id,
            otherUser: {
                _id: buyer._id,
                name: buyer.name,
                email: buyer.email,
                role: buyer.role,
                avatar: buyer.avatar || ''
            },
            conversation: {
                _id: conversation._id,
                type: conversation.type
            },
            demand: {
                id: demand._id,
                type: 'buyer-demand',
                title: demand.vegetableName,
                quantity: demand.quantity,
                price: demand.adminPriceSnapshot
            }
        });
    } catch (error) {
        console.error('Error contacting buyer:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Market Price Access
router.get('/market-prices/today', authMiddleware, roleMiddleware(['broker']), brokerController.getTodayMarketPrices);

// Buy Orders
router.post('/buy-orders', authMiddleware, roleMiddleware(['broker']), brokerController.createBuyOrder);
router.delete('/buy-orders/:orderId', authMiddleware, roleMiddleware(['broker']), brokerController.cancelBuyOrder);
router.delete('/buy-orders/:orderId/permanent', authMiddleware, roleMiddleware(['broker']), brokerController.deleteBrokerBuyOrder);
router.put('/buy-orders/:orderId/end', authMiddleware, roleMiddleware(['broker']), brokerController.endBuyOrder);
router.get('/buy-orders', authMiddleware, roleMiddleware(['broker']), brokerController.getBuyOrders);
router.get('/buy-orders/active-to-farmers', authMiddleware, roleMiddleware(['broker']), brokerController.getActiveBuyOrdersToFarmers);

// Sell Orders
router.post('/sell-orders', authMiddleware, roleMiddleware(['broker']), brokerController.createSellOrder);
router.get('/sell-orders', authMiddleware, roleMiddleware(['broker']), brokerController.getSellOrders);
router.patch('/sell-orders/:orderId', authMiddleware, roleMiddleware(['broker']), brokerController.updateSellOrder);
router.delete('/sell-orders/:orderId', authMiddleware, roleMiddleware(['broker']), brokerController.deleteSellOrder);

// Buy Orders - Update
router.patch('/buy-orders/:orderId', authMiddleware, roleMiddleware(['broker']), brokerController.updateBuyOrder);

// Notices/News
router.get('/notices', authMiddleware, roleMiddleware(['broker']), brokerController.getNotices);

// Dashboard / Data
router.get('/dashboard', authMiddleware, roleMiddleware(['broker']), brokerController.getBrokerDashboardData);
router.get('/buyer-demands', authMiddleware, roleMiddleware(['broker']), brokerController.getBuyerDemands);

// Buyer Orders (new endpoint)
router.get('/buyer-orders', authMiddleware, roleMiddleware(['broker']), brokerController.getBuyerOrders);

// Broker Marketplace - Combined Farmer Posts + Buyer Orders
router.get('/marketplace', authMiddleware, roleMiddleware(['broker']), brokerController.getMarketplace);

module.exports = router;
