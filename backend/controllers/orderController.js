const Order = require("../models/Order");
const Vegetable = require("../models/Vegetable");
const socketManager = require("../services/socketManager");

// Get marketplace orders based on user role
const getMarketplaceOrders = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { search, vegetable, status, page = 1, limit = 50 } = req.query;

    let filter = { status: "active" };

    // Role-based visibility
    if (userRole === "farmer") {
      // Farmers see BROKER buy orders
      filter.orderType = "broker-buy";
    } else if (userRole === "broker") {
      // Brokers see farmer SELL orders and buyer BUY orders
      filter.$or = [
        { orderType: "farmer-sell" },
        { orderType: "buyer-order" }
      ];
    } else if (userRole === "buyer") {
      // Buyers see broker SELL orders and farmer SELL orders
      filter.$or = [
        { orderType: "farmer-sell" },
        { orderType: "broker-sell" }
      ];
    }

    // Search filters
    if (search) {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { vegetableName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      );
    }

    if (vegetable) {
      filter.vegetable = vegetable;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("vegetable", "name vegCode")
        .populate("publishedBy", "userId name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Transform orders
    const result = (orders || []).map(order => ({
      id: order._id,
      orderNumber: order.orderNumber,
      vegetableName: order.vegetableName,
      vegCode: order.vegetable?.vegCode || "VEG000",
      quantity: order.quantity,
      unit: order.unit,
      pricePerKg: order.pricePerUnit,
      totalPrice: order.totalPrice,
      location: order.location,
      deliveryDate: order.deliveryDate,
      orderType: order.orderType,
      status: order.status,
      createdBy: order.publishedBy?.name || "Unknown",
      creatorUserId: order.publishedBy?.userId || null,
      creatorEmail: order.publishedBy?.email || "",
      creatorRole: order.publishedBy?.role || "",
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      data: result || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error("Error fetching marketplace orders:", err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

// Create new order
const createOrder = async (req, res) => {
  try {
    const {
      vegetableId, vegetableName, quantity, unit,
      pricePerKg, pricePerUnit, location, deliveryDate, orderType, description
    } = req.body;

    const user = req.user;

    // Determine order type based on user role
    let finalOrderType = orderType || "farmer-sell";
    if (user.role === "buyer") {
      finalOrderType = "buyer-order";
    } else if (user.role === "broker" && orderType === "buy") {
      finalOrderType = "broker-buy";
    } else if (user.role === "broker" && orderType === "sell") {
      finalOrderType = "broker-sell";
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get vegetable details - handle both ID and name
    let veg = null;
    let vegCode = "VEG000";
    let finalVegName = vegetableName || "Unknown";
    let finalVegId = null;

    if (vegetableId) {
      // Try to find by ID first
      veg = await Vegetable.findById(vegetableId);
      if (!veg) {
        // Try to find by name (case insensitive)
        veg = await Vegetable.findOne({ name: { $regex: new RegExp(vegetableId, 'i') } });
      }
      if (veg) {
        vegCode = veg.vegCode || "VEG000";
        finalVegName = veg.name;
        finalVegId = veg._id;
      }
    }

    // Use pricePerKg if provided, otherwise fall back to pricePerUnit
    const finalPrice = pricePerKg || pricePerUnit || 0;

    // Calculate total
    const totalPrice = (quantity || 0) * finalPrice;

    const order = new Order({
      orderNumber,
      vegetable: finalVegId,
      vegetableName: finalVegName,
      adminPriceSnapshot: finalPrice,
      quantity,
      unit: unit || "kg",
      pricePerUnit: finalPrice,
      totalPrice,
      orderType: finalOrderType,
      publishedBy: user.userId,
      location: location || "",
      deliveryDate: deliveryDate || null,
      description: description || "",
      status: "active"
    });

    await order.save();

    // Populate for response
    await order.populate("vegetable", "name vegCode");
    await order.populate("publishedBy", "userId name email role");

    // Emit realtime event
    if (socketManager.io) {
      const orderData = {
        id: order._id,
        orderNumber: order.orderNumber,
        vegetableName: order.vegetableName,
        vegCode: order.vegetable?.vegCode || vegCode,
        quantity: order.quantity,
        unit: order.unit,
        pricePerKg: order.pricePerUnit,
        totalPrice: order.totalPrice,
        location: order.location,
        deliveryDate: order.deliveryDate,
        orderType: order.orderType,
        status: order.status,
        createdBy: order.publishedBy?.name || user.name,
        creatorUserId: order.publishedBy?.userId || user.userId,
        creatorEmail: order.publishedBy?.email || user.email,
        creatorRole: user.role,
        createdAt: order.createdAt
      };

      // Emit general marketplace event
      socketManager.io.emit("marketplace:new-order", orderData);

      // Emit buyer-order-created specifically for broker BuyerOrders page
      if (finalOrderType === "buyer-order") {
        socketManager.io.emit("buyer-order-created", orderData);
        console.log(`[BuyerOrder] New buyer order emitted: ${order.orderNumber}`);
      }
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order
    });

  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("vegetable", "name vegCode")
      .populate("publishedBy", "userId name email role");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Emit realtime update
    if (socketManager.io) {
      const orderData = {
        id: order._id,
        orderNumber: order.orderNumber,
        vegetableName: order.vegetableName,
        vegCode: order.vegetable?.vegCode || "VEG000",
        quantity: order.quantity,
        unit: order.unit,
        pricePerKg: order.pricePerUnit,
        totalPrice: order.totalPrice,
        location: order.location,
        deliveryDate: order.deliveryDate,
        orderType: order.orderType,
        status: order.status,
        createdBy: order.publishedBy?.name || "Unknown",
        creatorUserId: order.publishedBy?.userId || null,
        creatorEmail: order.publishedBy?.email || "",
        creatorRole: order.publishedBy?.role || "",
        createdAt: order.createdAt
      };

      socketManager.io.emit("order:update", orderData);
      console.log(`[Order] Status updated: ${order.orderNumber} -> ${status}`);
    }

    res.json({
      success: true,
      message: "Order status updated",
      data: order
    });

  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const { status, orderType, page = 1, limit = 50 } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("vegetable", "name vegCode")
        .populate("publishedBy", "userId name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

// Get single order
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("vegetable", "name vegCode")
      .populate("publishedBy", "userId name email role");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });

  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get buyer marketplace orders (for brokers)
const getBuyerMarketplaceOrders = async (req, res) => {
  try {
    const { vegetable, district, city, date, search, page = 1, limit = 50 } = req.query;

    // Filter by orderType: "buyer-order" instead of creatorRole
    let filter = {
      orderType: "buyer-order",
      status: "active"
    };

    // Filter by vegetable name
    if (vegetable) {
      filter.vegetableName = { $regex: vegetable, $options: "i" };
    }

    // Filter by location (district or city)
    if (district || city) {
      filter.location = { $regex: district || city, $options: "i" };
    }

    // Filter by delivery date
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.deliveryDate = { $gte: start, $lte: end };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { vegetableName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("vegetable", "name vegCode")
        .populate("publishedBy", "userId name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Transform orders
    const result = (orders || []).map(order => ({
      id: order._id,
      orderNumber: order.orderNumber,
      vegetableName: order.vegetableName,
      vegCode: order.vegetable?.vegCode || "VEG000",
      quantity: order.quantity,
      unit: order.unit,
      pricePerKg: order.pricePerUnit,
      totalPrice: order.totalPrice,
      location: order.location,
      district: order.location,
      city: "",
      deliveryDate: order.deliveryDate,
      orderType: order.orderType,
      status: order.status,
      createdBy: order.publishedBy?.name || "Unknown",
      creatorUserId: order.publishedBy?.userId || null,
      creatorEmail: order.publishedBy?.email || "",
      creatorRole: order.publishedBy?.role || "buyer",
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      data: result || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error("Error fetching buyer marketplace:", err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

// Get buyer orders for broker (used by BuyerOrders page)
const getBuyerOrders = async (req, res) => {
  try {
    console.log('[BuyerOrders] Fetching buyer orders, user role:', req.user.role);

    const { vegetable, district, city, date, search, page = 1, limit = 50 } = req.query;

    // Filter by orderType: "buyer-order" (NOT creatorRole)
    let filter = {
      orderType: "buyer-order",
      status: "active"
    };

    // Filter by vegetable (ObjectId or name search)
    if (vegetable) {
      // Check if it's a valid ObjectId
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(vegetable)) {
        filter.vegetable = vegetable;
      } else {
        // Search by vegetable name
        filter.vegetableName = { $regex: vegetable, $options: "i" };
      }
    }

    // Filter by location (simple string field)
    if (district || city) {
      filter.location = { $regex: district || city, $options: "i" };
    }

    // Filter by delivery date
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.deliveryDate = { $gte: start, $lte: end };
    }

    // General search filter
    if (search) {
      filter.$or = [
        { vegetableName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    console.log('[BuyerOrders] Filter:', JSON.stringify(filter));

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("vegetable", "name vegCode")
        .populate("publishedBy", "userId name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    console.log('[BuyerOrders] Found orders:', orders.length);

    // Transform orders - handle all possible field variations
    const result = (orders || []).map(order => ({
      id: order._id,
      _id: order._id,
      orderNumber: order.orderNumber,
      vegetableId: order.vegetable?._id || null,
      vegetableName: order.vegetableName || order.vegetable?.name || "Unknown",
      vegCode: order.vegetable?.vegCode || "VEG000",
      quantity: order.quantity || 0,
      unit: order.unit || "kg",
      pricePerKg: order.pricePerUnit || 0,
      pricePerUnit: order.pricePerUnit || 0,
      totalPrice: order.totalPrice || 0,
      location: order.location || "",
      district: order.location || "",
      city: "",
      deliveryDate: order.deliveryDate,
      orderType: order.orderType,
      status: order.status,
      createdBy: order.publishedBy?.name || "Unknown",
      creatorUserId: order.publishedBy?.userId || null,
      creatorEmail: order.publishedBy?.email || "",
      creatorRole: order.publishedBy?.role || "buyer",
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      data: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error("[BuyerOrders] Error:", err.message);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

module.exports = {
  getMarketplaceOrders,
  getBuyerMarketplaceOrders,
  getBuyerOrders,
  createOrder,
  updateOrderStatus,
  getAllOrders,
  getOrderById
};
