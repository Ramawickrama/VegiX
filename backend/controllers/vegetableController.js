const Vegetable = require('../models/Vegetable');
const socketManager = require('../services/socketManager');
const path = require('path');
const fs = require('fs');
const FarmerPost = require('../models/FarmerPost');
const FarmerOrder = require('../models/FarmerOrder');
const BrokerOrder = require('../models/BrokerOrder');
const BrokerBuyingOrder = require('../models/BrokerBuyingOrder');
const BrokerSellingOrder = require('../models/BrokerSellingOrder');
const BrokerBuyOrder = require('../models/BrokerBuyOrder');
const BrokerSellOrder = require('../models/BrokerSellOrder');
const Order = require('../models/Order');
const BuyerDemand = require('../models/BuyerDemand');
const MarketPrice = require('../models/MarketPrice');

/**
 * Get all vegetables
 * Public endpoint - available to all authenticated users
 */
exports.getAllVegetables = async (req, res) => {
  try {
    const vegetables = await Vegetable.find({ isActive: true })
      .select('vegetableId name nameSi nameTa category defaultUnit currentPrice minPrice maxPrice lastUpdated imageUrl imageAlt')
      .sort({ vegetableId: 1 });

    res.status(200).json({
      success: true,
      count: vegetables.length,
      data: vegetables,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const mongoose = require('mongoose');

/**
 * Get single vegetable by ID or Code
 */
exports.getVegetableById = async (req, res) => {
  try {
    const { id } = req.params;

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { $or: [{ vegCode: id }, { vegetableId: id }] };
    }

    const vegetable = await Vegetable.findOne(query);

    if (!vegetable) {
      return res.status(404).json({ success: false, message: 'Vegetable not found' });
    }

    res.status(200).json({ success: true, data: vegetable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create new vegetable (Admin only)
 */
exports.createVegetable = async (req, res) => {
  try {
    const { name, nameSi, nameTa, category, currentPrice, minPrice, maxPrice, defaultUnit } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name (English) and category are required' });
    }

    const exists = await Vegetable.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (exists) {
      return res.status(409).json({ success: false, message: `Vegetable "${name}" already exists` });
    }

    const vegetable = new Vegetable({
      name,
      nameSi,
      nameTa,
      category,
      currentPrice: currentPrice || 0,
      minPrice: minPrice || 0,
      maxPrice: maxPrice || 0,
      defaultUnit: defaultUnit || 'kg'
    });

    await vegetable.save();

    // Create initial MarketPrice record
    const marketPrice = new MarketPrice({
      vegetable: vegetable._id,
      vegetableName: vegetable.name,
      pricePerKg: vegetable.currentPrice,
      minPrice: vegetable.minPrice,
      maxPrice: vegetable.maxPrice,
      historicalData: [{ price: vegetable.currentPrice, date: new Date() }]
    });
    await marketPrice.save();

    // Notify all about new vegetable/market update
    const allVegetables = await Vegetable.find({ isActive: true });
    socketManager.emitMarketPriceUpdated(allVegetables);

    res.status(201).json({ success: true, message: 'Vegetable created successfully', data: vegetable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update vegetable individual price (Admin only)
 */
exports.updatePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPrice, minPrice, maxPrice } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Vegetable ID format' });
    }

    const vegetable = await Vegetable.findById(id);

    if (!vegetable) {
      return res.status(404).json({ success: false, message: 'Vegetable not found' });
    }

    if (currentPrice !== undefined) vegetable.currentPrice = currentPrice;
    if (minPrice !== undefined) vegetable.minPrice = minPrice;
    if (maxPrice !== undefined) vegetable.maxPrice = maxPrice;
    vegetable.lastUpdated = Date.now();

    await vegetable.save();

    // ✅ Update/Create MarketPrice record for history/tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let marketPrice = await MarketPrice.findOne({
      vegetable: vegetable._id,
      createdAt: { $gte: today }
    });

    if (marketPrice) {
      marketPrice.previousPrice = marketPrice.pricePerKg;
      marketPrice.pricePerKg = vegetable.currentPrice;
      marketPrice.minPrice = vegetable.minPrice;
      marketPrice.maxPrice = vegetable.maxPrice;
      marketPrice.priceChange = marketPrice.pricePerKg - marketPrice.previousPrice;
      if (marketPrice.previousPrice > 0) {
        marketPrice.priceChangePercentage = (marketPrice.priceChange / marketPrice.previousPrice) * 100;
      }
      marketPrice.historicalData.push({ price: vegetable.currentPrice, date: new Date() });
      await marketPrice.save();
    } else {
      // Find previous record for change calculation
      const prevRecord = await MarketPrice.findOne({
        vegetable: vegetable._id,
        createdAt: { $lt: today }
      }).sort({ createdAt: -1 });

      marketPrice = new MarketPrice({
        vegetable: vegetable._id,
        vegetableName: vegetable.name,
        pricePerKg: vegetable.currentPrice,
        previousPrice: prevRecord ? prevRecord.pricePerKg : vegetable.currentPrice,
        minPrice: vegetable.minPrice,
        maxPrice: vegetable.maxPrice,
        historicalData: [{ price: vegetable.currentPrice, date: new Date() }]
      });
      if (marketPrice.previousPrice > 0) {
        marketPrice.priceChange = marketPrice.pricePerKg - marketPrice.previousPrice;
        marketPrice.priceChangePercentage = (marketPrice.priceChange / marketPrice.previousPrice) * 100;
      }
      await marketPrice.save();
    }

    // ✅ Update all related models prices automatically
    const price = currentPrice;

    // 1. Update Broker Buy Orders
    await BrokerBuyOrder.updateMany(
      { vegetable: vegetable._id, status: 'open' },
      { adminPrice: price }
    );

    // 2. Update Broker Sell Orders (markup price)
    await BrokerSellOrder.updateMany(
      { vegetable: vegetable._id, status: 'open' },
      {
        adminPrice: price,
        sellingPrice: price * 1.10,
        profitPerKg: price * 0.10
      }
    );

    // 3. Update Farmer Posts (Update snapshot and actual price)
    // Include 'bought' status
    await FarmerPost.updateMany(
      { vegetable: vegetable._id, status: { $in: ['active', 'bought'] } },
      [
        {
          $set: {
            adminPriceSnapshot: price,
            pricePerKg: price,
            totalValue: { $multiply: ["$quantity", price] },
            brokerCommission: { $multiply: ["$quantity", price, 0.10] },
            farmerProfit: { $subtract: [{ $multiply: ["$quantity", price] }, { $multiply: ["$quantity", price, 0.10] }] }
          }
        }
      ]
    );

    // 4. Update Farmer Orders (Custom Farmer Order model)
    // Include 'in-progress'
    await FarmerOrder.updateMany(
      { "vegetable._id": vegetable._id, status: { $in: ['active', 'in-progress'] } },
      [
        {
          $set: {
            "vegetable.basePrice": price,
            pricePerUnit: price,
            totalPrice: { $multiply: ["$quantity", price] }
          }
        }
      ]
    );

    // 5. Update Broker Orders (Generic Broker Order model)
    await BrokerOrder.updateMany(
      { vegetable: vegetable._id, status: 'open' },
      {
        offeredPrice: price,
        adminPriceSnapshot: price
      }
    );

    // 5.1 Update Broker Buying Orders
    await BrokerBuyingOrder.updateMany(
      { "vegetable._id": vegetable._id, status: { $in: ['active', 'in-progress'] } },
      [
        {
          $set: {
            "vegetable.basePrice": price,
            pricePerUnit: price,
            totalPrice: { $multiply: ["$quantity", price] }
          }
        }
      ]
    );

    // 5.2 Update Broker Selling Orders
    await BrokerSellingOrder.updateMany(
      { "vegetable._id": vegetable._id, status: { $in: ['active', 'in-progress'] } },
      [
        {
          $set: {
            "vegetable.basePrice": price,
            basePricePerUnit: price,
            finalPricePerUnit: { $multiply: [price, 1.10] },
            totalBasePrice: { $multiply: ["$quantity", price] },
            totalCommission: { $multiply: ["$quantity", price, 0.10] },
            totalFinalPrice: { $multiply: ["$quantity", price, 1.10] }
          }
        }
      ]
    );

    // 6. Update main Order collection (covers direct broker offers and buyer orders)
    await Order.updateMany(
      { vegetable: vegetable._id, status: { $in: ['active', 'pending', 'in-progress', 'accepted'] } },
      [
        {
          $set: {
            adminPriceSnapshot: price,
            pricePerUnit: price,
            totalPrice: { $multiply: ["$quantity", price] }
          }
        }
      ]
    );

    // 7. Update Buyer Demands
    await BuyerDemand.updateMany(
      { vegetable: vegetable._id, status: 'open' },
      { adminPriceSnapshot: price }
    );

    const allVegetables = await Vegetable.find({ isActive: true });
    socketManager.emitMarketPriceUpdated(allVegetables);

    res.status(200).json({
      success: true,
      message: 'Price updated successfully',
      data: vegetable
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update vegetable details (Admin only)
 */
exports.updateVegetable = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Vegetable ID format. Please use ObjectId.' });
    }

    // Explicitly prevent _id or vegCode from being updated manually via this route if desired
    delete updateData._id;

    const vegetable = await Vegetable.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!vegetable) {
      return res.status(404).json({ success: false, message: 'Vegetable not found' });
    }

    res.status(200).json({ success: true, message: 'Vegetable updated successfully', data: vegetable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update vegetable by Code (Special route)
 */
exports.updateVegetableByCode = async (req, res) => {
  try {
    const { vegCode } = req.params;
    const updateData = req.body;

    delete updateData._id;

    const vegetable = await Vegetable.findOneAndUpdate(
      { $or: [{ vegCode }, { vegetableId: vegCode }] },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!vegetable) {
      return res.status(404).json({ success: false, message: 'Vegetable not found with that code' });
    }

    res.status(200).json({ success: true, message: 'Vegetable updated successfully', data: vegetable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete vegetable (Admin only)
 */
exports.deleteVegetable = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Vegetable ID' });
    }

    const vegetable = await Vegetable.findById(id);

    if (!vegetable) {
      return res.status(404).json({ success: false, message: 'Vegetable not found' });
    }

    vegetable.isActive = false;
    await vegetable.save();

    res.status(200).json({ success: true, message: 'Vegetable deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Search vegetables by name or category
 */
exports.searchVegetables = async (req, res) => {
  try {
    const { query, category } = req.query;

    console.log(`GET /api/vegetables/search?query=${query}&category=${category}`);

    let filter = { isActive: true };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { nameSi: { $regex: query, $options: 'i' } },
        { nameTa: { $regex: query, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    const vegetables = await Vegetable.find(filter)
      .select('vegetableId name category defaultUnit averagePrice')
      .sort({ vegetableId: 1 });

    console.log(`✓ Search found ${vegetables.length} vegetables`);

    res.status(200).json({
      success: true,
      count: vegetables.length,
      data: vegetables,
    });
  } catch (error) {
    console.error('✗ Error searching vegetables:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error searching vegetables',
      error: error.message,
    });
  }
};

/**
 * Upload vegetable image by ID (Admin only)
 * POST /api/vegetables/:id/image
 */
exports.uploadImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Vegetable ID format' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const vegetable = await Vegetable.findById(id);
    if (!vegetable) {
      return res.status(404).json({ success: false, message: 'Vegetable not found' });
    }

    const imageUrl = `/uploads/vegetables/${req.file.filename}`;
    vegetable.imageUrl = imageUrl;
    await vegetable.save();

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: vegetable
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload vegetable image by vegCode (Admin only)
 * POST /api/vegetables/by-code/:vegCode/image
 */
exports.uploadImageByCode = async (req, res) => {
  try {
    const { vegCode } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const vegetable = await Vegetable.findOne({ $or: [{ vegCode }, { vegetableId: vegCode }] });
    if (!vegetable) {
      return res.status(404).json({ success: false, message: 'Vegetable not found with that code' });
    }

    const imageUrl = `/uploads/vegetables/${req.file.filename}`;
    vegetable.imageUrl = imageUrl;
    await vegetable.save();

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: vegetable
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
