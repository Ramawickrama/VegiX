const FarmerOrder = require('../models/FarmerOrder');
const FarmerPost = require('../models/FarmerPost');
const BrokerOrder = require('../models/BrokerOrder');
const Order = require('../models/Order');
const Vegetable = require('../models/Vegetable');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Notice = require('../models/Notice');
const MarketPrice = require('../models/MarketPrice');
const { sendOrderPublishedEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

// ✅ 1. GET TODAY'S MARKET PRICES - Farmers see latest prices
exports.getMarketPrices = async (req, res) => {
  try {
    console.log('[Farmer] Fetching vegetable prices for today');
    const vegetables = await Vegetable.find({ isActive: true })
      .select('vegetableId name currentPrice minPrice maxPrice lastUpdated defaultUnit')
      .sort({ vegetableId: 1 })
      .lean();

    res.status(200).json({
      message: 'Market prices retrieved',
      total: vegetables.length,
      prices: vegetables.map(v => ({
        _id: v._id,
        vegCode: v.vegetableId,  // Returns VEG001, VEG002, etc.
        vegetableId: v.vegetableId,
        vegetableName: v.name,
        currentPrice: v.currentPrice,
        minPrice: v.minPrice,
        maxPrice: v.maxPrice,
        unit: v.defaultUnit || 'kg',
        updatedDate: v.lastUpdated,
      })),
    });
  } catch (error) {
    console.error('Error fetching market prices:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 2. GET NOTICES (Admin news) - Display in dashboard
exports.getNotices = async (req, res) => {
  try {
    console.log('[Farmer] Fetching notices');
    const notices = await Notice.find({
      visibility: { $in: ['farmer', 'all'] },
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ]
    })
      .populate('postedBy', 'userId name')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      total: notices.length,
      notices,
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 3. PUBLISH SELLING ORDER - Auto-fetch market price, auto-calculate total
exports.publishOrder = async (req, res) => {
  try {
    const { vegetableId, quantity, unit, location, quality, description, deliveryDate } = req.body;

    console.log(`[Farmer ${req.user.userId}] Publishing order for vegetableId ${vegetableId}, quantity ${quantity}`);

    // Validate required fields
    if (!vegetableId || !quantity) {
      return res.status(400).json({ message: 'Missing required fields: vegetableId, quantity' });
    }

    // Get vegetable details directly (Source of truth for price)
    const vegetable = await Vegetable.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(vegetableId) ? vegetableId : null },
        { vegetableId: vegetableId }
      ].filter(q => q._id !== null || q.vegetableId)
    });

    if (!vegetable) {
      return res.status(404).json({ message: 'Vegetable not found' });
    }

    const unitPrice = vegetable.currentPrice;

    if (unitPrice <= 0) {
      return res.status(400).json({
        message: 'No market price available for this vegetable. Admin must set price first.'
      });
    }

    // Get user details for email
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${req.user.userId.toString().slice(-4)}`;
    const totalPrice = quantity * unitPrice;

    // ✅ Create farmer selling order with AUTO-FILLED price
    const farmerOrder = new FarmerOrder({
      orderNumber,
      vegetable: {
        _id: vegetable._id,
        name: vegetable.name,
        basePrice: unitPrice, // ✅ Auto-filled from market price
      },
      quantity,
      unit: unit || vegetable.unit,
      pricePerUnit: unitPrice, // ✅ Auto-filled from market price
      totalPrice, // ✅ Auto-calculated
      publishedBy: req.user.userId,
      status: 'active',
      location,
      quality: quality || 'standard',
      description,
      deliveryDate,
      interestedBrokers: [],
    });

    await farmerOrder.save();
    console.log(`[Order Published] ${orderNumber} - ${quantity} ${unit} of ${vegetable.name} @ ${unitPrice}/unit = ${totalPrice} total`);

    // Send email notification
    if (user.email) {
      await sendOrderPublishedEmail({
        email: user.email,
        userName: user.name,
        vegetableName: vegetable.name,
        quantity,
        unit: unit || vegetable.unit,
        pricePerUnit: unitPrice,
        totalPrice,
        orderNumber,
        orderType: 'Farmer Selling Order'
      });
    }

    // Create in-app notification for farmer
    await createNotification({
      recipient: req.user.userId,
      title: 'Order Published',
      message: `Your selling post for ${quantity} ${unit || vegetable.unit} of ${vegetable.name} is now active at ${unitPrice}/kg`,
      type: 'order-published',
      relatedOrder: farmerOrder._id,
      orderModel: 'FarmerOrder'
    });

    res.status(201).json({
      message: 'Order published successfully',
      order: {
        _id: farmerOrder._id,
        orderNumber: farmerOrder.orderNumber,
        vegetableName: vegetable.name,
        quantity: farmerOrder.quantity,
        unit: farmerOrder.unit,
        pricePerUnit: farmerOrder.pricePerUnit,
        totalPrice: farmerOrder.totalPrice,
        status: farmerOrder.status,
        createdAt: farmerOrder.createdAt,
      },
    });
  } catch (error) {
    console.error('Error publishing order:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 4. GET FARMER'S OWN SELLING POSTS
exports.getFarmerOrders = async (req, res) => {
  try {
    console.log(`[Farmer ${req.user.userId}] Fetching own selling posts`);
    const orders = await FarmerOrder.find({ publishedBy: req.user.userId })
      .populate('vegetable', 'name nameSi nameTa')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      total: orders.length,
      orders: orders.map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        vegetableName: o.vegetable?.name || o.vegetableName,
        vegetableNameSi: o.vegetable?.nameSi || '',
        vegetableNameTa: o.vegetable?.nameTa || '',
        quantity: o.quantity,
        unit: o.unit,
        pricePerUnit: o.pricePerUnit,
        totalPrice: o.totalPrice,
        status: o.status,
        interestedBrokers: o.interestedBrokers?.length || 0,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching farmer orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 5. GET BROKER OFFERS ON FARMER'S POSTS
exports.viewBrokerOrders = async (req, res) => {
  try {
    console.log(`[Farmer ${req.user.userId}] Fetching broker offers`);

    // Get all farmer's selling posts
    const myPosts = await FarmerOrder.find({ publishedBy: req.user.userId }).select('_id');
    const postIds = myPosts.map(p => p._id);

    // Get all Orders (broker buy orders) related to farmer's posts
    const brokerOffers = await Order.find({
      relatedPostId: { $in: postIds },
      status: { $in: ['pending', 'accepted', 'completed'] }
    })
      .populate('vegetable', 'name nameSi nameTa')
      .populate('publishedBy', 'userId name email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      total: brokerOffers.length,
      offers: brokerOffers.map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        brokerId: {
          _id: o.publishedBy?._id,
          userId: o.publishedBy?.userId,
          name: o.publishedBy?.name,
          email: o.publishedBy?.email,
          phone: o.publishedBy?.phone
        },
        vegetableName: o.vegetable?.name || o.vegetableName,
        vegetableNameSi: o.vegetable?.nameSi || '',
        vegetableNameTa: o.vegetable?.nameTa || '',
        requiredQuantity: o.quantity,
        offeredPrice: o.pricePerUnit,
        totalPrice: o.totalPrice,
        status: o.status,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching broker orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 5B. GET BROKER BUYING REQUESTS (Visible to all farmers)
exports.viewBrokerBuyingRequests = async (req, res) => {
  try {
    console.log(`[Farmer ${req.user.userId}] Fetching broker buying requests`);

    const BrokerBuyOrder = require('../models/BrokerBuyOrder');
    // Fetch from BrokerBuyOrder model (the correct model for broker buy orders)
    const brokerBuyingRequests = await BrokerBuyOrder.find({ status: 'open' })
      .populate('vegetable', 'name nameSi nameTa')
      .populate('brokerId', 'userId name email phone location company')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      total: brokerBuyingRequests.length,
      requests: brokerBuyingRequests.map(o => ({
        _id: o._id,
        orderNumber: o._id.toString().slice(-8).toUpperCase(),
        brokerId: {
          _id: o.brokerId?._id,
          userId: o.brokerId?.userId,
          name: o.brokerId?.name || 'Unknown Broker',
          email: o.brokerId?.email,
          phone: o.brokerId?.phone,
          company: o.brokerId?.company || 'N/A',
          location: o.collectionLocation || o.brokerId?.location || 'N/A',
          city: 'N/A'
        },
        vegetableName: o.vegetable?.name || o.vegetableName || 'Unknown',
        vegetableNameSi: o.vegetable?.nameSi || '',
        vegetableNameTa: o.vegetable?.nameTa || '',
        requiredQuantity: o.quantityRequired,
        unit: 'kg',
        offeredPrice: o.adminPrice,
        totalPrice: ((o.adminPrice || 0) * (o.quantityRequired || 0)),
        deliveryDate: o.createdAt || null,
        status: o.status === 'open' ? 'active' : o.status,
        createdAt: o.createdAt,
        district: o.collectionLocation,
        village: ''
      })),
    });
  } catch (error) {
    console.error('Error fetching broker buying requests:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 6. UPDATE ORDER STATUS (Farmer updates their own post status)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`[Farmer ${req.user.userId}] Updating order ${orderId} status to ${status}`);

    if (!['active', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await FarmerOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.publishedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized: not your order' });
    }

    order.status = status;
    await order.save();

    // ✅ If order completed, update farmer's total income and completed orders count
    if (status === 'completed') {
      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        {
          $inc: {
            totalIncome: order.totalPrice,
            completedOrders: 1
          }
        },
        { new: true }
      );
      console.log(`[Income Update] Farmer ${req.user.userId} earned ${order.totalPrice}. Total income: ${updatedUser.totalIncome}`);
    }

    res.status(200).json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 7. DELETE FARMER'S SELLING POST
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`[Farmer ${req.user.userId}] Attempting to delete order ${orderId}`);

    const order = await FarmerOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.publishedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized: not your order' });
    }

    // Only allow deletion of active orders
    if (order.status !== 'active') {
      return res.status(400).json({ message: `Cannot delete ${order.status} order` });
    }

    await FarmerOrder.deleteOne({ _id: orderId });
    console.log(`[Order Deleted] Farmer ${req.user.userId} deleted selling post ${orderId}`);

    res.status(200).json({ message: 'Selling post deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 8. GET FARMER'S NOTIFICATIONS
exports.getNotifications = async (req, res) => {
  try {
    console.log(`[Farmer ${req.user.userId}] Fetching notifications`);

    const notifications = await Notification.find({
      recipient: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      total: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 9. MARK NOTIFICATION AS READ
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    console.log(`[Farmer ${req.user.userId}] Marking notification ${notificationId} as read`);

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 10. GET FARMER DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
  try {
    console.log(`[Farmer ${req.user.userId}] Fetching dashboard stats`);

    const user = await User.findById(req.user.userId).select('totalIncome completedOrders');
    const activeOrders = await FarmerOrder.countDocuments({
      publishedBy: req.user.userId,
      status: 'active'
    });
    // Get farmer's active order IDs to find directed broker offers
    const myPostDocs = await FarmerOrder.find({ publishedBy: req.user.userId }).select('_id');
    const myPostIds = myPostDocs.map(p => p._id);

    const pendingOffers = await Order.countDocuments({
      relatedPostId: { $in: myPostIds },
      status: 'pending'
    });
    const unreadNotifications = await Notification.countDocuments({
      recipient: req.user.userId,
      isRead: false
    });

    res.status(200).json({
      totalIncome: user?.totalIncome || 0,
      completedOrders: user?.completedOrders || 0,
      activeSellingPosts: activeOrders,
      pendingBrokerOffers: pendingOffers,
      unreadNotifications,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 11. GET COMPLETE FARMER DASHBOARD WITH PRICE TRENDS, DEMAND ANALYTICS, AND NOTICES
exports.getDashboard = async (req, res) => {
  try {
    console.log(`[Farmer ${req.user.userId}] Fetching complete dashboard`);

    // Get user stats
    const user = await User.findById(req.user.userId).select('totalIncome completedOrders');
    const activeOrders = await FarmerOrder.countDocuments({
      publishedBy: req.user.userId,
      status: 'active'
    });
    const myPostDocs = await FarmerOrder.find({ publishedBy: req.user.userId }).select('_id');
    const myPostIds = myPostDocs.map(p => p._id);
    const pendingOffers = await Order.countDocuments({
      relatedPostId: { $in: myPostIds },
      status: 'pending'
    });
    const unreadNotifications = await Notification.countDocuments({
      recipient: req.user.userId,
      isRead: false
    });

    // ============ PART 1: MARKET PRICES WITH PERCENTAGE CHANGE ============
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let vegetables = [];
    try {
      vegetables = await Vegetable.find({ isActive: true }).lean() || [];
    } catch (vegError) {
      console.error('Error fetching vegetables:', vegError);
      vegetables = [];
    }

    const marketPrices = [];
    if (vegetables && vegetables.length > 0) {
      for (const veg of vegetables) {
        try {
          const marketPriceDoc = await MarketPrice.findOne({
            vegetable: veg._id
          }).lean();

          const currentPrice = marketPriceDoc?.pricePerKg || veg.currentPrice || 0;

          // Get the start of today
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);

          // Find the most recent price in historicalData BEFORE today
          let prevPrice = currentPrice;
          const history = marketPriceDoc?.historicalData || [];

          if (history.length > 0) {
            // Sort history by date descending
            const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
            // Find the FIRST record that is strictly from a PREVIOUS day
            const previousDayRecord = sortedHistory.find(h => {
              const hDate = new Date(h.date);
              hDate.setHours(0, 0, 0, 0);
              return hDate < startOfToday;
            });

            if (previousDayRecord) {
              prevPrice = previousDayRecord.price;
            } else if (marketPriceDoc.previousPrice && marketPriceDoc.previousPrice !== currentPrice) {
              // Fallback to previousPrice field if no history entry before today found but field exists
              prevPrice = marketPriceDoc.previousPrice;
            }
          }

          let percentageChange = 0;
          if (prevPrice > 0 && currentPrice > 0 && currentPrice !== prevPrice) {
            percentageChange = ((currentPrice - prevPrice) / prevPrice) * 100;
          }

          marketPrices.push({
            _id: veg._id,
            vegetableId: veg._id,
            vegetableName: veg?.name || 'Unknown',
            nameSi: veg?.nameSi || '',
            nameTa: veg?.nameTa || '',
            currentPrice: Number(currentPrice) || 0,
            previousPrice: Number(prevPrice) || 0,
            minPrice: Number(todayPrice?.minPrice || veg?.minPrice || 0),
            maxPrice: Number(todayPrice?.maxPrice || veg?.maxPrice || 0),
            percentageChange: Math.round(percentageChange * 100) / 100,
            unit: veg?.defaultUnit || 'kg',
            updatedDate: todayPrice?.createdAt || veg?.lastUpdated || new Date()
          });
        } catch (priceError) {
          console.error(`Error fetching price for ${veg?.name}:`, priceError);
          marketPrices.push({
            _id: veg._id,
            vegetableId: veg._id,
            vegetableName: veg?.name || 'Unknown',
            nameSi: veg?.nameSi || '',
            nameTa: veg?.nameTa || '',
            currentPrice: Number(veg?.currentPrice) || 0,
            previousPrice: Number(veg?.currentPrice) || 0,
            minPrice: Number(veg?.minPrice) || 0,
            maxPrice: Number(veg?.maxPrice) || 0,
            percentageChange: 0,
            unit: veg?.defaultUnit || 'kg',
            updatedDate: new Date()
          });
        }
      }
    }

    // ============ PART 2: DEMAND ANALYTICS (HARVEST HELPER) ============
    let demandWithVegetables = [];

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const demandAnalytics = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
            orderType: { $in: ['buyer-order', 'broker-buy'] }
          }
        },
        {
          $group: {
            _id: '$vegetable',
            totalQuantity: { $sum: '$quantity' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalQuantity: -1 } }
      ]) || [];

      for (const demand of demandAnalytics || []) {
        try {
          const veg = await Vegetable.findById(demand._id).lean();
          if (veg) {
            const previousWeekAgo = new Date();
            previousWeekAgo.setDate(previousWeekAgo.getDate() - 14);

            const previousWeekDemand = await Order.aggregate([
              {
                $match: {
                  vegetable: veg._id,
                  createdAt: { $gte: previousWeekAgo, $lt: sevenDaysAgo },
                  orderType: { $in: ['buyer-order', 'broker-buy'] }
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$quantity' }
                }
              }
            ]) || [];

            const prevDemand = previousWeekDemand[0]?.total || 0;
            const currentDemand = demand.totalQuantity;

            let trend = 'Stable';
            if (currentDemand > prevDemand * 1.2) {
              trend = 'High Demand';
            } else if (currentDemand < prevDemand * 0.8) {
              trend = 'Low Demand';
            }

            let suggestedAction = '';
            if (trend === 'High Demand') {
              suggestedAction = 'Good time to harvest and sell!';
            } else if (trend === 'Low Demand') {
              suggestedAction = 'Consider storing or alternative markets';
            } else {
              suggestedAction = 'Continue normal harvest planning';
            }

            demandWithVegetables.push({
              vegetable: veg?.name || 'Unknown',
              vegetableId: veg._id,
              predictedDemand: Math.round(currentDemand) || 0,
              previousDemand: prevDemand || 0,
              trend: trend,
              suggestedAction: suggestedAction,
              orderCount: demand.orderCount || 0
            });
          }
        } catch (demandError) {
          console.error('Error processing demand item:', demandError);
        }
      }

      // Add vegetables with no demand data
      const demandVegIds = demandWithVegetables.map(d => d.vegetableId?.toString());
      for (const veg of vegetables || []) {
        if (veg && !demandVegIds.includes(veg._id.toString())) {
          demandWithVegetables.push({
            vegetable: veg?.name || 'Unknown',
            vegetableId: veg._id,
            predictedDemand: 0,
            previousDemand: 0,
            trend: 'No Data',
            suggestedAction: 'Insufficient data for prediction',
            orderCount: 0
          });
        }
      }
    } catch (demandError) {
      console.error('Error fetching demand analytics:', demandError);
      demandWithVegetables = [];
    }

    // ============ PART 3: ADMIN NOTICES ============
    let notices = [];
    try {
      notices = await Notice.find({
        $or: [
          { visibility: { $in: ['farmer', 'all'] } },
          { visibility: { $exists: false } },
          { visibility: { $size: 0 } }
        ],
        $or: [
          { expiryDate: null },
          { expiryDate: { $gte: new Date() } },
          { expiryDate: { $exists: false } }
        ]
      })
        .populate('postedBy', 'userId name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    } catch (noticeError) {
      console.error('Error fetching notices:', noticeError);
      notices = [];
    }

    // ============ PART 4: HIGH DEMAND VEGETABLES ============
    const highDemandVegs = (demandWithVegetables || [])
      .filter(d => d.trend === 'High Demand')
      .slice(0, 5);

    res.status(200).json({
      success: true,
      stats: {
        totalIncome: Number(user?.totalIncome) || 0,
        completedOrders: Number(user?.completedOrders) || 0,
        activeSellingPosts: Number(activeOrders) || 0,
        pendingBrokerOffers: Number(pendingOffers) || 0,
        unreadNotifications: Number(unreadNotifications) || 0
      },
      marketPrices: marketPrices || [],
      demandAnalytics: demandWithVegetables || [],
      highDemandVegetables: highDemandVegs || [],
      notices: notices || []
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stats: {},
      marketPrices: [],
      demandAnalytics: [],
      highDemandVegetables: [],
      notices: []
    });
  }
};
