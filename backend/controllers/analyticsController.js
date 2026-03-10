const MarketPrice = require('../models/MarketPrice');
const FarmerPost = require('../models/FarmerPost');
const BuyerOrder = require('../models/BuyerOrder');
const Vegetable = require('../models/Vegetable');
const Demand = require('../models/Demand');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get price trend for a vegetable
// @route   GET /api/analytics/price-trend/:vegetableId
// @access  Private
const getPriceTrend = asyncHandler(async (req, res) => {
  const { vegetableId } = req.params;
  const { days = 7 } = req.query;

  let vegetable = await Vegetable.findOne({ vegetableId: vegetableId });
  if (!vegetable) {
    vegetable = await Vegetable.findById(vegetableId);
  }

  if (!vegetable) {
    return res.status(404).json({ message: 'Vegetable not found' });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const prices = await MarketPrice.find({ 
    vegetable: vegetable._id,
    createdAt: { $gte: startDate }
  })
    .sort({ createdAt: 1 })
    .select('createdAt pricePerKg');

  const trend = prices.map(p => ({
    date: p.createdAt,
    price: p.pricePerKg
  }));

  res.status(200).json(trend);
});

// @desc    Get future price for a vegetable
// @route   GET /api/analytics/future-price/:vegetableId
// @access  Private
const getFuturePrice = asyncHandler(async (req, res) => {
  const { vegetableId } = req.params;

  let vegetable = await Vegetable.findOne({ vegetableId: vegetableId });
  if (!vegetable) {
    vegetable = await Vegetable.findById(vegetableId);
  }

  if (!vegetable) {
    return res.status(404).json({ message: 'Vegetable not found' });
  }

  const last7Prices = await MarketPrice.find({ vegetable: vegetable._id })
    .sort({ date: -1 })
    .limit(7)
    .select('pricePerKg');

  if (last7Prices.length === 0) {
    return res.status(200).json({
      vegetable: vegetable.name,
      predictedPrice: vegetable.currentPrice || 0,
      confidenceLevel: 'Low (No historical data)'
    });
  }

  const sum = last7Prices.reduce((acc, p) => acc + p.pricePerKg, 0);
  const predictedPrice = sum / last7Prices.length;

  res.status(200).json({
    vegetable: vegetable.name,
    predictedPrice: Math.round(predictedPrice * 100) / 100,
    confidenceLevel: last7Prices.length >= 7 ? 'High' : 'Medium'
  });
});

// @desc    Get high demand vegetables
// @route   GET /api/analytics/high-demand
// @access  Private
const getHighDemandVegetables = asyncHandler(async (req, res) => {
  // Demand from BuyerOrder
  const demandData = await BuyerOrder.aggregate([
    {
      $group: {
        _id: '$vegetable._id',
        name: { $first: '$vegetable.name' },
        totalDemand: { $sum: '$quantity' }
      }
    }
  ]);

  // Supply from FarmerPost
  const supplyData = await FarmerPost.aggregate([
    {
      $group: {
        _id: '$vegetable',
        name: { $first: '$vegetableName' },
        totalSupply: { $sum: '$quantity' }
      }
    }
  ]);

  // Merge and calculate index
  const vegetables = await Vegetable.find({ isActive: true }).select('name _id');

  const results = vegetables.map(veg => {
    const demand = demandData.find(d => d._id && d._id.toString() === veg._id.toString())?.totalDemand || 0;
    const supply = supplyData.find(s => s._id && s._id.toString() === veg._id.toString())?.totalSupply || 0;

    // Calculate index, avoid division by zero
    const demandIndex = supply === 0 ? (demand > 0 ? demand : 0) : (demand / supply);

    return {
      vegetableName: veg.name,
      demand,
      supply,
      demandIndex: Math.round(demandIndex * 100) / 100
    };
  });

  // Sort by demandIndex descending and take top 5
  const top5 = results
    .sort((a, b) => b.demandIndex - a.demandIndex)
    .slice(0, 5);

  res.status(200).json(top5);
});

// @desc    Get future demand prediction for a vegetable
// @route   GET /api/demand/future/:vegetableId
// @access  Private
const getFutureDemand = asyncHandler(async (req, res) => {
  const { vegetableId } = req.params;

  let vegetable = await Vegetable.findOne({ vegetableId: vegetableId });
  if (!vegetable) {
    vegetable = await Vegetable.findById(vegetableId);
  }

  if (!vegetable) {
    return res.status(404).json({ message: 'Vegetable not found' });
  }

  const demandRecord = await Demand.findOne({ vegetable: vegetable._id })
    .populate('vegetable', 'name');

  if (!demandRecord) {
    return res.status(200).json({
      vegetableName: vegetable.name,
      predictedDemand: 0,
      trend: 'stable',
      suggestion: 'Insufficient data for demand forecasting'
    });
  }

  res.status(200).json({
    vegetableName: demandRecord.vegetable.name,
    predictedDemand: demandRecord.forecastedDemand,
    trend: demandRecord.demandTrend === 'increasing' ? 'Increasing' : 'Stable',
    suggestion: demandRecord.demandTrend === 'increasing'
      ? 'High market demand expected. Good time to harvest.'
      : 'Market demand is stable. Plan harvest as usual.'
  });
});

// @desc    Get supply and demand for a vegetable
// @route   GET /api/analytics/supply-demand?vegetableId=xxx&date=2024-01-15
// @access  Private
const getSupplyDemand = asyncHandler(async (req, res) => {
  const { vegetableId, date } = req.query;
  
  if (!vegetableId) {
    return res.status(400).json({ message: 'vegetableId is required' });
  }

  let targetDate;
  if (date) {
    targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);
  } else {
    targetDate = new Date();
    targetDate.setUTCHours(0, 0, 0, 0);
  }

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  let vegetable = await Vegetable.findOne({ vegetableId: vegetableId });
  if (!vegetable) {
    vegetable = await Vegetable.findById(vegetableId);
  }

  if (!vegetable) {
    return res.status(404).json({ message: 'Vegetable not found' });
  }

  try {
    const [supplyData, demandData] = await Promise.all([
      FarmerPost.aggregate([
        {
          $match: {
            vegetable: vegetable._id,
            createdAt: { $gte: targetDate, $lt: nextDay },
            status: { $in: ['active', 'completed', 'sold'] }
          }
        },
        {
          $group: {
            _id: null,
            totalSupply: { $sum: '$quantity' }
          }
        }
      ]),
      Promise.all([
        require('../models/Order').find({
          vegetable: vegetable._id,
          createdAt: { $gte: targetDate, $lt: nextDay },
          orderType: { $in: ['buyer-order', 'broker-buy'] }
        }).select('quantity'),
        require('../models/BuyerDemand').find({
          vegetable: vegetable._id,
          createdAt: { $gte: targetDate, $lt: nextDay }
        }).select('quantity'),
        require('../models/BrokerBuyOrder').find({
          vegetable: vegetable._id,
          createdAt: { $gte: targetDate, $lt: nextDay }
        }).select('quantity')
      ])
    ]);

    const totalSupply = supplyData[0]?.totalSupply || 0;
    
    const buyerOrderDemand = demandData[0]?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
    const buyerDemand = demandData[1]?.reduce((sum, demand) => sum + (demand.quantity || 0), 0) || 0;
    const brokerBuyDemand = demandData[2]?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
    const totalDemand = buyerOrderDemand + buyerDemand + brokerBuyDemand;

    const total = totalSupply + totalDemand || 1;

    res.status(200).json({
      vegetableId: vegetable._id,
      vegetableName: vegetable.name,
      date: targetDate.toISOString().split('T')[0],
      supply: totalSupply,
      demand: totalDemand,
      supplyPercent: Math.round((totalSupply / total) * 100),
      demandPercent: Math.round((totalDemand / total) * 100)
    });
  } catch (error) {
    console.error('Error in getSupplyDemand:', error);
    res.status(200).json({
      vegetableId: vegetable._id,
      vegetableName: vegetable.name,
      date: targetDate.toISOString().split('T')[0],
      supply: 0,
      demand: 0,
      supplyPercent: 0,
      demandPercent: 0
    });
  }
});

module.exports = {
  getPriceTrend,
  getFuturePrice,
  getHighDemandVegetables,
  getFutureDemand,
  getSupplyDemand
};
