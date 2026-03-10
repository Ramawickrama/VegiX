const BrokerBuyOrder = require('../models/BrokerBuyOrder');
const BrokerSellOrder = require('../models/BrokerSellOrder');
const BuyerDemand = require('../models/BuyerDemand');
const BuyerOrder = require('../models/BuyerOrder');
const FarmerPost = require('../models/FarmerPost');
const MarketPrice = require('../models/MarketPrice');
const Vegetable = require('../models/Vegetable');
const Notice = require('../models/Notice');
const User = require('../models/User');
const socketManager = require('../services/socketManager');
const mongoose = require('mongoose');

let io;
try {
  io = require('../server').io;
} catch (e) {
  console.log('IO not available in this context');
}

// 1. Market Price Access
exports.getTodayMarketPrices = async (req, res) => {
  try {
    const vegetables = await Vegetable.find({ isActive: true })
      .select('vegetableId name nameSi nameTa currentPrice minPrice maxPrice lastUpdated');
    res.status(200).json(vegetables.map(v => ({
      vegCode: v.vegetableId,
      vegetableName: v.name,
      vegetableNameSi: v.nameSi || '',
      vegetableNameTa: v.nameTa || '',
      price: v.currentPrice,
      minPrice: v.minPrice,
      maxPrice: v.maxPrice,
      lastUpdated: v.lastUpdated
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Broker BUY ORDER -> Farmer
exports.createBrokerBuyOrder = exports.createBuyOrder = async (req, res) => {
  try {
    const { vegetableId, quantityRequired, collectionLocation } = req.body;

    const vegetable = await Vegetable.findById(vegetableId);
    if (!vegetable) return res.status(404).json({ message: 'Vegetable not found' });

    if (vegetable.currentPrice <= 0) return res.status(400).json({ message: 'Market price not set for this vegetable' });

    const newOrder = new BrokerBuyOrder({
      vegetable: vegetableId,
      vegetableName: vegetable.name,
      vegetableNameSi: vegetable.nameSi || '',
      vegetableNameTa: vegetable.nameTa || '',
      adminPrice: vegetable.currentPrice,
      quantityRequired,
      collectionLocation,
      brokerId: req.user.userId
    });

    await newOrder.save();

    const orderResponse = {
      _id: newOrder._id,
      vegetableName: newOrder.vegetableName,
      vegetableNameSi: newOrder.vegetableNameSi || '',
      vegetableNameTa: newOrder.vegetableNameTa || '',
      quantityRequired: newOrder.quantityRequired,
      adminPrice: newOrder.adminPrice,
      collectionLocation: newOrder.collectionLocation,
      status: newOrder.status,
      brokerId: newOrder.brokerId,
      createdAt: newOrder.createdAt,
      updatedAt: newOrder.updatedAt
    };

    // Emit socket event to global orders room
    socketManager.emitToRoom('orders', 'buy_order_created', {
      orderId: newOrder._id,
      vegetableName: newOrder.vegetableName,
      quantityRequired: newOrder.quantityRequired,
      adminPrice: newOrder.adminPrice,
      status: newOrder.status,
      createdAt: newOrder.createdAt,
      createdByBrokerId: newOrder.brokerId,
      target: 'farmers'
    });

    // Emit broker-specific event
    socketManager.emitToRoom(`broker:${newOrder.brokerId}`, 'buy_order_created', {
      orderId: newOrder._id,
      vegetableName: newOrder.vegetableName,
      quantityRequired: newOrder.quantityRequired,
      adminPrice: newOrder.adminPrice,
      status: newOrder.status,
      createdAt: newOrder.createdAt,
      createdByBrokerId: newOrder.brokerId,
      target: 'farmers'
    });

    // Emit brokerOrderCreated event as specified
    if (io) {
      io.emit("brokerOrderCreated", orderResponse);
    }

    res.status(201).json(orderResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Broker SUPPLY / SELL ORDER -> Buyer
exports.createSellOrder = async (req, res) => {
  try {
    const { vegetableId, quantity, district, area, village } = req.body;

    const vegetable = await Vegetable.findById(vegetableId);
    if (!vegetable) return res.status(404).json({ message: 'Vegetable not found' });

    if (vegetable.currentPrice <= 0) return res.status(400).json({ message: 'Market price not set for this vegetable' });

    const price = vegetable.currentPrice;
    const sellingPrice = price * 1.10;
    const profitPerKg = price * 0.10;

    const newOrder = new BrokerSellOrder({
      vegetable: vegetableId,
      vegetableName: vegetable.name,
      vegetableNameSi: vegetable.nameSi || '',
      vegetableNameTa: vegetable.nameTa || '',
      adminPrice: sellingPrice,
      sellingPrice: sellingPrice,
      profitPerKg,
      quantity,
      brokerId: req.user.userId,
      location: {
        district: district || '',
        area: area || '',
        village: village || ''
      }
    });

    await newOrder.save();

    const orderResponse = {
      _id: newOrder._id,
      vegetableName: newOrder.vegetableName,
      vegetableNameSi: newOrder.vegetableNameSi || '',
      vegetableNameTa: newOrder.vegetableNameTa || '',
      adminPrice: newOrder.adminPrice,
      sellingPrice: newOrder.sellingPrice,
      profitPerKg: newOrder.profitPerKg,
      quantity: newOrder.quantity,
      status: newOrder.status,
      brokerId: newOrder.brokerId,
      location: newOrder.location,
      createdAt: newOrder.createdAt,
      updatedAt: newOrder.updatedAt
    };

    if (io) {
      io.emit("brokerSellOrderCreated", orderResponse);
    }

    res.status(201).json(orderResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all broker sell orders with optional status filter
exports.getSellOrders = async (req, res) => {
  try {
    const brokerId = req.user.userId;
    const { status } = req.query;

    const filter = { brokerId: brokerId };

    if (status) {
      filter.status = status;
    }

    const orders = await BrokerSellOrder.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const count = orders.length;

    res.status(200).json({
      count,
      orders: orders.map(order => ({
        _id: order._id,
        vegetableName: order.vegetableName,
        vegetableNameSi: order.vegetableNameSi || '',
        vegetableNameTa: order.vegetableNameTa || '',
        adminPrice: order.adminPrice,
        sellingPrice: order.sellingPrice,
        profitPerKg: order.profitPerKg,
        quantity: order.quantity,
        status: order.status,
        brokerId: order.brokerId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching sell orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update broker sell order
exports.updateSellOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { quantity, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await BrokerSellOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.brokerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not authorized to update this order' });
    }

    // Validate status if provided
    if (status && !['open', 'sold', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Update allowed fields
    if (quantity !== undefined) {
      order.quantity = quantity;
    }
    if (status) {
      order.status = status;
    }

    await order.save();

    const updatedOrder = {
      _id: order._id,
      vegetableName: order.vegetableName,
      adminPrice: order.adminPrice,
      sellingPrice: order.sellingPrice,
      profitPerKg: order.profitPerKg,
      quantity: order.quantity,
      status: order.status,
      brokerId: order.brokerId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    if (io) {
      io.emit("brokerSellOrderUpdated", updatedOrder);
    }

    res.status(200).json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete broker sell order (permanent)
exports.deleteSellOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await BrokerSellOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.brokerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this order' });
    }

    const orderIdString = order._id.toString();
    await BrokerSellOrder.findByIdAndDelete(orderId);

    if (io) {
      io.emit("brokerSellOrderDeleted", orderIdString);
    }

    res.status(200).json({ message: 'Order deleted successfully', orderId: orderIdString });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update broker buy order (PATCH)
exports.updateBuyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { quantityRequired, collectionLocation, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await BrokerBuyOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.brokerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not authorized to update this order' });
    }

    // Validate status if provided
    if (status && !['open', 'fulfilled', 'cancelled', 'ended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Update allowed fields
    if (quantityRequired !== undefined) {
      order.quantityRequired = quantityRequired;
    }
    if (collectionLocation !== undefined) {
      order.collectionLocation = collectionLocation;
    }
    if (status) {
      order.status = status;
    }

    await order.save();

    const updatedOrder = {
      _id: order._id,
      vegetableName: order.vegetableName,
      quantityRequired: order.quantityRequired,
      adminPrice: order.adminPrice,
      collectionLocation: order.collectionLocation,
      status: order.status,
      brokerId: order.brokerId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    if (io) {
      io.emit("brokerOrderUpdated", updatedOrder);
    }

    res.status(200).json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelBrokerBuyOrder = exports.cancelBuyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await BrokerBuyOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.brokerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not authorized to cancel this order' });
    }

    order.status = 'cancelled';
    await order.save();

    const updatedOrder = {
      _id: order._id,
      vegetableName: order.vegetableName,
      quantityRequired: order.quantityRequired,
      adminPrice: order.adminPrice,
      collectionLocation: order.collectionLocation,
      status: order.status,
      brokerId: order.brokerId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    socketManager.emitToRoom('orders', 'buy_order_cancelled', {
      orderId: order._id,
      brokerId: order.brokerId
    });

    socketManager.emitToRoom(`broker:${order.brokerId}`, 'buy_order_cancelled', {
      orderId: order._id,
      brokerId: order.brokerId
    });

    // Emit brokerOrderUpdated event as specified
    if (io) {
      io.emit("brokerOrderUpdated", updatedOrder);
    }

    res.status(200).json({ message: 'Order cancelled successfully', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBrokerBuyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await BrokerBuyOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.brokerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this order' });
    }

    const orderIdString = order._id.toString();
    await BrokerBuyOrder.findByIdAndDelete(orderId);

    // Emit brokerOrderDeleted event as specified
    if (io) {
      io.emit("brokerOrderDeleted", orderIdString);
    }

    res.status(200).json({ message: 'Order deleted successfully', orderId: orderIdString });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.endBuyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await BrokerBuyOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.brokerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not authorized to end this order' });
    }

    order.status = 'ended';
    await order.save();

    const updatedOrder = {
      _id: order._id,
      vegetableName: order.vegetableName,
      quantityRequired: order.quantityRequired,
      adminPrice: order.adminPrice,
      collectionLocation: order.collectionLocation,
      status: order.status,
      brokerId: order.brokerId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    // Emit brokerOrderUpdated event as specified
    if (io) {
      io.emit("brokerOrderUpdated", updatedOrder);
    }

    res.status(200).json({ message: 'Order ended successfully', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Broker News Access
exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({
      visibility: { $in: ['broker', 'all'] }
    }).sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper for dashboard to see existing orders
exports.getBrokerDashboardData = async (req, res) => {
  try {
    const buyOrders = await BrokerBuyOrder.find({ brokerId: req.user.userId, status: 'open' });
    const sellOrders = await BrokerSellOrder.find({ brokerId: req.user.userId, status: 'open' });
    const activeBuyOrdersCount = await BrokerBuyOrder.countDocuments({ brokerId: req.user.userId, status: 'open' });

    res.status(200).json({
      buyOrders,
      sellOrders,
      activeBuyOrdersCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NEW: Dedicated endpoint for Active Buy Orders to Farmers (single source of truth)
exports.getActiveBuyOrdersToFarmers = async (req, res) => {
  try {
    const brokerId = req.user.userId;

    // Canonical filter: broker's orders with status 'open'
    // These are inherently "to farmers" since brokers create them to buy from farmers
    const filter = {
      brokerId: brokerId,
      status: 'open'
    };

    const orders = await BrokerBuyOrder.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const count = orders.length;

    res.status(200).json({
      count,
      orders: orders.map(order => ({
        _id: order._id,
        vegetableName: order.vegetableName,
        quantityRequired: order.quantityRequired,
        adminPrice: order.adminPrice,
        collectionLocation: order.collectionLocation,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching active buy orders to farmers:', error);
    res.status(500).json({ message: error.message });
  }
};

// NEW: Get all broker buy orders with optional status filter
exports.getBuyOrders = async (req, res) => {
  try {
    const brokerId = req.user.userId;
    const { status } = req.query;

    console.log('[getBuyOrders] Fetching for brokerId:', brokerId);

    const filter = { brokerId: brokerId };

    // Allow filtering by status (open, fulfilled, cancelled)
    if (status) {
      filter.status = status;
    }

    const orders = await BrokerBuyOrder.find(filter)
      .populate('brokerId', 'company name')
      .sort({ createdAt: -1 })
      .lean();

    console.log('[getBuyOrders] Found orders:', orders.length);

    const count = orders.length;

    console.log('[getBuyOrders] Returning orders for broker:', brokerId);

    res.status(200).json({
      count,
      brokerId: brokerId,
      orders: orders.map(order => ({
        _id: order._id,
        vegetableName: order.vegetableName,
        quantityRequired: order.quantityRequired,
        adminPrice: order.adminPrice,
        collectionLocation: order.collectionLocation,
        status: order.status,
        brokerId: order.brokerId,
        company: order.brokerId?.company || '',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching buy orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// Fetch Buyer Demands (visible to brokers)
exports.getBuyerDemands = async (req, res) => {
  try {
    const { vegetableId, district, village, minQuantity, maxQuantity } = req.query;

    let query = { status: 'open' };

    // Filter by vegetable ID
    if (vegetableId) {
      query.vegetable = vegetableId;
    }

    // Filter by district (in location field)
    if (district) {
      query.location = { $regex: district, $options: 'i' };
    }

    // Filter by village/area (in location field)
    if (village) {
      if (query.location) {
        query.location = { $regex: `${district}.*${village}|${village}`, $options: 'i' };
      } else {
        query.location = { $regex: village, $options: 'i' };
      }
    }

    // Filter by quantity range
    if (minQuantity || maxQuantity) {
      query.quantity = {};
      if (minQuantity) query.quantity.$gte = Number(minQuantity);
      if (maxQuantity) query.quantity.$lte = Number(maxQuantity);
    }

    const demands = await BuyerDemand.find(query)
      .populate('buyerId', 'userId name company')
      .populate('vegetable', 'name nameSi nameTa')
      .sort({ createdAt: -1 });

    const demandsWithLocalizedNames = demands.map(d => ({
      ...d.toObject(),
      vegetableName: d.vegetable?.name || d.vegetableName,
      vegetableNameSi: d.vegetable?.nameSi || d.vegetableNameSi || '',
      vegetableNameTa: d.vegetable?.nameTa || d.vegetableNameTa || ''
    }));

    res.status(200).json(demandsWithLocalizedNames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch Buyer Orders (visible to brokers)
exports.getBuyerOrders = async (req, res) => {
  try {
    const { vegetableId, vegetable, district, minQuantity, maxQuantity, deliveryDate } = req.query;

    let query = { status: 'active' };

    // Filter by vegetable ID (exact match from dropdown)
    if (vegetableId) {
      query['vegetable._id'] = vegetableId;
    }

    // Filter by vegetable name (text search fallback)
    if (vegetable && !vegetableId) {
      query['vegetable.name'] = { $regex: vegetable, $options: 'i' };
    }

    // Filter by delivery date
    if (deliveryDate) {
      const date = new Date(deliveryDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      query.deliveryDate = {
        $gte: date,
        $lt: nextDay
      };
    }

    if (district) {
      query.location = { $regex: district, $options: 'i' };
    }

    if (minQuantity || maxQuantity) {
      query.quantity = {};
      if (minQuantity) query.quantity.$gte = Number(minQuantity);
      if (maxQuantity) query.quantity.$lte = Number(maxQuantity);
    }

    const orders = await BuyerOrder.find(query)
      .populate('publishedBy', 'userId name email role')
      .populate('vegetable._id', 'name vegCode')
      .sort({ createdAt: -1 });

    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      vegetable: {
        _id: order.vegetable?._id,
        name: order.vegetable?.name || order.vegetable?.name,
        vegCode: order.vegetable?.vegCode || 'VEG000'
      },
      quantity: order.quantity,
      unit: order.unit,
      budgetPerUnit: order.budgetPerUnit,
      totalBudget: order.totalBudget,
      location: order.location,
      deliveryDate: order.deliveryDate,
      quality: order.quality,
      description: order.description,
      status: order.status,
      buyerId: order.publishedBy?._id,
      buyerUserId: order.publishedBy?.userId,
      buyerName: order.publishedBy?.name || 'Unknown',
      buyerEmail: order.publishedBy?.email || '',
      publishedDate: order.createdAt
    }));

    res.status(200).json({ orders: transformedOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. Broker Marketplace - Combined Farmer Posts + Buyer Orders
exports.getMarketplace = async (req, res) => {
  try {
    const { vegetableId, district, city, minQuantity, maxQuantity, date } = req.query;

    const orders = [];

    // Get Farmer Posts (Selling)
    let farmerFilter = { status: 'active' };
    if (vegetableId) farmerFilter.vegetable = vegetableId;
    if (district) farmerFilter['location.district'] = { $regex: district, $options: 'i' };
    if (city) farmerFilter['location.village'] = { $regex: city, $options: 'i' };
    if (minQuantity || maxQuantity) {
      farmerFilter.quantity = {};
      if (minQuantity) farmerFilter.quantity.$gte = Number(minQuantity);
      if (maxQuantity) farmerFilter.quantity.$lte = Number(maxQuantity);
    }

    const farmerPosts = await FarmerPost.find(farmerFilter)
      .populate('farmerId', 'userId name email')
      .populate('vegetable', 'name vegCode')
      .sort({ createdAt: -1 });

    farmerPosts.forEach(post => {
      orders.push({
        id: post._id,
        vegetableName: post.vegetableName || post.vegetable?.name || 'Unknown',
        vegCode: post.vegetable?.vegCode || 'VEG000',
        quantity: post.quantity,
        price: post.pricePerKg,
        totalPrice: post.totalValue,
        location: post.location?.district && post.location?.village
          ? `${post.location.district} | ${post.location.nearCity || ''} | ${post.location.village}`.replace(/\s\|\s\|/, ' | ').replace(/\| $/, '')
          : post.location?.district || 'Not specified',
        district: post.location?.district || '',
        city: post.location?.village || '',
        postedBy: post.farmerId?.name || 'Unknown Farmer',
        postedByUserId: post.farmerId?.userId,
        userEmail: post.farmerId?.email || '',
        role: 'farmer',
        orderType: 'Farmer Selling',
        postedDate: post.createdAt,
        description: post.description
      });
    });

    // Get Buyer Orders (Purchase Requests)
    let buyerFilter = { status: 'active' };
    if (vegetableId) buyerFilter['vegetable._id'] = vegetableId;
    if (district || city) {
      buyerFilter.location = {};
      if (district) buyerFilter.location.$regex = new RegExp(district, 'i');
    }
    if (minQuantity || maxQuantity) {
      buyerFilter.quantity = {};
      if (minQuantity) buyerFilter.quantity.$gte = Number(minQuantity);
      if (maxQuantity) buyerFilter.quantity.$lte = Number(maxQuantity);
    }
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      buyerFilter.deliveryDate = { $gte: start, $lte: end };
    }

    const buyerOrders = await BuyerOrder.find(buyerFilter)
      .populate('publishedBy', 'userId name email')
      .populate('vegetable._id', 'name vegCode')
      .sort({ createdAt: -1 });

    buyerOrders.forEach(order => {
      orders.push({
        id: order._id,
        vegetableName: order.vegetable?.name || 'Unknown',
        vegCode: order.vegetable?.vegCode || 'VEG000',
        quantity: order.quantity,
        price: order.budgetPerUnit,
        totalPrice: order.totalBudget,
        location: order.location || 'Not specified',
        district: order.location || '',
        city: '',
        postedBy: order.publishedBy?.name || 'Unknown Buyer',
        postedByUserId: order.publishedBy?.userId,
        userEmail: order.publishedBy?.email || '',
        role: 'buyer',
        orderType: 'Buyer Request',
        postedDate: order.createdAt,
        description: order.description
      });
    });

    // Sort by posted date (newest first)
    orders.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));

    res.status(200).json({ orders: orders || [] });
  } catch (error) {
    console.error('Error fetching marketplace:', error);
    res.status(500).json({ message: error.message, orders: [] });
  }
};
