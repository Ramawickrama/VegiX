const FarmerPost = require('../models/FarmerPost');
const Vegetable = require('../models/Vegetable');
const socketManager = require('../services/socketManager');

// Create a new post
exports.createPost = async (req, res) => {
    try {
        const { vegetableId, quantity, pricePerKg, district, village, contactNumber, description } = req.body;
        // Support both nearCity (preferred) and city (legacy alias)
        const nearCity = (req.body.nearCity || req.body.city || '').trim();
        const locationDistrict = (district || req.body['location.district'] || '').trim();
        const locationVillage = (village || req.body.areaVillage || '').trim();

        // Validate required location fields early for a clear error message
        if (!locationDistrict || !nearCity || !locationVillage) {
            return res.status(400).json({
                success: false,
                message: `Missing required location fields: ${[
                    !locationDistrict && 'district',
                    !nearCity && 'nearCity',
                    !locationVillage && 'village/area'
                ].filter(Boolean).join(', ')}`
            });
        }

        // Check if vegetable exists
        const vegetable = await Vegetable.findById(vegetableId);
        if (!vegetable) {
            return res.status(404).json({ success: false, message: 'Vegetable not found' });
        }

        const totalValue = (quantity || 0) * (pricePerKg || 0);
        const brokerCommission = totalValue * 0.10;
        const farmerProfit = totalValue - brokerCommission;

        const newPost = new FarmerPost({
            vegetable: vegetableId,
            vegetableName: vegetable.name,
            vegetableNameSi: vegetable.nameSi || '',
            vegetableNameTa: vegetable.nameTa || '',
            quantity,
            pricePerKg,
            location: { district: locationDistrict, nearCity, village: locationVillage },
            contactNumber,
            description,
            farmerId: req.user.userId,
            adminPriceSnapshot: vegetable.currentPrice,
            totalValue: Math.round(totalValue * 100) / 100,
            brokerCommission: Math.round(brokerCommission * 100) / 100,
            farmerProfit: Math.round(farmerProfit * 100) / 100,
            commissionRate: '10%'
        });

        await newPost.save();

        const populatedPost = await FarmerPost.findById(newPost._id).populate('farmerId', 'name email');
        socketManager.emitOrderCreated(populatedPost);

        res.status(201).json({ success: true, post: newPost });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get current farmer's posts
exports.getMyPosts = async (req, res) => {
    try {
        const posts = await FarmerPost.find({ farmerId: req.user.userId })
            .populate('vegetable', 'name nameSi nameTa')
            .sort({ createdAt: -1 });

        const postsWithLocalizedNames = posts.map(post => ({
            ...post.toObject(),
            vegetableName: post.vegetable?.name || post.vegetableName,
            vegetableNameSi: post.vegetable?.nameSi || '',
            vegetableNameTa: post.vegetable?.nameTa || ''
        }));

        res.status(200).json({ success: true, posts: postsWithLocalizedNames });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all farmer posts (could be useful for brokers)
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await FarmerPost.find()
            .populate('farmerId', 'name')
            .populate('vegetable', 'name nameSi nameTa')
            .sort({ createdAt: -1 });

        const postsWithLocalizedNames = posts.map(post => ({
            ...post.toObject(),
            vegetableName: post.vegetable?.name || post.vegetableName,
            vegetableNameSi: post.vegetable?.nameSi || '',
            vegetableNameTa: post.vegetable?.nameTa || ''
        }));

        res.status(200).json({ success: true, posts: postsWithLocalizedNames });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a post
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { vegetableId, quantity, pricePerKg, district, nearCity, village, contactNumber, description, deliveryDate } = req.body;

        const post = await FarmerPost.findOne({ _id: id, farmerId: req.user.userId });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (vegetableId) {
            const vegetable = await Vegetable.findById(vegetableId);
            if (!vegetable) {
                return res.status(404).json({ success: false, message: 'Vegetable not found' });
            }
            post.vegetable = vegetableId;
            post.vegetableName = vegetable.name;
            post.vegetableNameSi = vegetable.nameSi || '';
            post.vegetableNameTa = vegetable.nameTa || '';
            post.adminPriceSnapshot = vegetable.currentPrice;
        }

        if (quantity) post.quantity = quantity;
        if (pricePerKg) post.pricePerKg = pricePerKg;
        if (district || nearCity || village) {
            const mergedLocation = {
                district: (district || '').trim() || post.location?.district,
                nearCity: (nearCity || '').trim() || post.location?.nearCity,
                village: (village || '').trim() || post.location?.village
            };
            if (!mergedLocation.nearCity) {
                return res.status(400).json({ success: false, message: 'Near City is required' });
            }
            post.location = mergedLocation;
        }
        if (contactNumber) post.contactNumber = contactNumber;
        if (description !== undefined) post.description = description;
        if (deliveryDate) post.deliveryDate = deliveryDate;

        // Recalculate profit fields
        const totalValue = (post.quantity || 0) * (post.pricePerKg || 0);
        post.totalValue = Math.round(totalValue * 100) / 100;
        post.brokerCommission = Math.round(totalValue * 0.10 * 100) / 100;
        post.farmerProfit = Math.round((totalValue - totalValue * 0.10) * 100) / 100;

        await post.save();

        const populatedPost = await FarmerPost.findById(post._id).populate('farmerId', 'name email');
        socketManager.emitOrderUpdated(populatedPost);

        res.status(200).json({ success: true, post });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a post
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await FarmerPost.findOne({ _id: id, farmerId: req.user.userId });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        await FarmerPost.deleteOne({ _id: id });

        socketManager.emitOrderDeleted(id);

        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Broker delete a farmer's post
exports.brokerDeletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await FarmerPost.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        await FarmerPost.deleteOne({ _id: id });

        socketManager.emitOrderDeleted(id);

        res.status(200).json({ success: true, message: 'Post deleted successfully by broker' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update post status
exports.updatePostStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['active', 'sold', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const post = await FarmerPost.findOne({ _id: id, farmerId: req.user.userId });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const oldStatus = post.status;
        post.status = status;
        await post.save();

        const populatedPost = await FarmerPost.findById(post._id).populate('farmerId', 'name email');

        if (status === 'sold') {
            socketManager.emitOrderSold(populatedPost);
        } else {
            socketManager.emitOrderUpdated(populatedPost);
        }

        res.status(200).json({ success: true, post });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
