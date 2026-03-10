const BrokerOrder = require('../models/BrokerOrder');
const Vegetable = require('../models/Vegetable');
const FarmerPost = require('../models/FarmerPost');

// Create a broker order (called by brokers)
exports.createOrder = async (req, res) => {
    try {
        const { vegetableId, requiredQuantity, offeredPrice, district, village, contactNumber } = req.body;

        const vegetable = await Vegetable.findById(vegetableId);
        if (!vegetable) {
            return res.status(404).json({ success: false, message: 'Vegetable not found' });
        }

        const newOrder = new BrokerOrder({
            brokerId: req.user.userId,
            vegetable: vegetableId,
            vegetableName: vegetable.name,
            requiredQuantity,
            offeredPrice,
            location: { district, village },
            contactNumber,
            adminPriceSnapshot: vegetable.currentPrice
        });

        await newOrder.save();
        res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get broker orders (optionally filtered for relevance to a farmer)
exports.getAllOrders = async (req, res) => {
    try {
        const { farmerId } = req.query;
        let filter = { status: 'open' };

        // If farmerId is provided, only show orders for vegetables the farmer has active posts for
        if (farmerId) {
            const activeFarmerPosts = await FarmerPost.find({ farmerId, status: 'active' }).select('vegetableId');
            const vegetableIds = activeFarmerPosts.map(p => p.vegetableId);

            if (vegetableIds.length > 0) {
                filter.vegetable = { $in: vegetableIds };
            }
        }

        const orders = await BrokerOrder.find(filter)
            .populate('brokerId', 'name contactNumber')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
