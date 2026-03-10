const FarmerPost = require('../models/FarmerPost');
const BrokerBuyOrder = require('../models/BrokerBuyOrder');
const BrokerSellOrder = require('../models/BrokerSellOrder');
const BuyerDemand = require('../models/BuyerDemand');
const MarketPrice = require('../models/MarketPrice');
const Order = require('../models/Order');
const Vegetable = require('../models/Vegetable');

async function calculateLocationScore(farmerDistrict, orderDistrict) {
  if (!farmerDistrict || !orderDistrict) return 50;
  const normalizedFarmer = farmerDistrict.toLowerCase().trim();
  const normalizedOrder = orderDistrict.toLowerCase().trim();
  if (normalizedFarmer === normalizedOrder) return 100;
  if (normalizedFarmer.includes(normalizedOrder) || normalizedOrder.includes(normalizedFarmer)) return 80;
  return 40;
}

async function calculatePriceScore(farmerPrice, marketPrice) {
  if (!farmerPrice || !marketPrice || marketPrice === 0) return 50;
  const diff = Math.abs(farmerPrice - marketPrice) / marketPrice;
  if (diff <= 0.05) return 100;
  if (diff <= 0.1) return 80;
  if (diff <= 0.2) return 60;
  return 40;
}

async function calculateQuantityScore(farmerQty, orderQty) {
  if (!farmerQty || !orderQty) return 50;
  const ratio = farmerQty / orderQty;
  if (ratio >= 0.9 && ratio <= 1.1) return 100;
  if (ratio >= 0.7 && ratio <= 1.3) return 80;
  if (ratio >= 0.5 && ratio <= 1.5) return 60;
  return 40;
}

async function findMatchingOrders(farmerPost) {
  const matches = [];
  const vegetable = farmerPost.vegetable;
  const farmerDistrict = farmerPost.location?.district;

  const currentPrice = await MarketPrice.findOne({ vegetable })
    .sort({ createdAt: -1 })
    .lean();

  const marketPrice = currentPrice?.pricePerKg || farmerPost.pricePerKg;

  try {
    const brokerBuyOrders = await BrokerBuyOrder.find({
      vegetable: vegetable,
      status: 'open',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).lean();

    for (const order of brokerBuyOrders || []) {
      const locationScore = await calculateLocationScore(farmerDistrict, order.location?.district);
      const priceScore = await calculatePriceScore(farmerPost.pricePerKg, marketPrice);
      const quantityScore = await calculateQuantityScore(farmerPost.quantity, order.quantityRequired);

      const totalScore = (locationScore * 0.4) + (priceScore * 0.3) + (quantityScore * 0.3);

      if (totalScore >= 50) {
        matches.push({
          type: 'broker-buy',
          orderId: order._id,
          orderType: 'Broker Buy Order',
          requestedBy: order.brokerId,
          vegetable: order.vegetableName,
          quantity: order.quantityRequired,
          targetPrice: order.targetPrice,
          location: order.location,
          scores: {
            location: locationScore,
            price: priceScore,
            quantity: quantityScore,
            total: Math.round(totalScore)
          },
          matchPercentage: Math.round(totalScore)
        });
      }
    }

    const buyerDemands = await BuyerDemand.find({
      vegetable: vegetable,
      status: 'open',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).lean();

    for (const demand of buyerDemands || []) {
      const locationScore = await calculateLocationScore(farmerDistrict, demand.location);
      const priceScore = await calculatePriceScore(farmerPost.pricePerKg, marketPrice);
      const quantityScore = await calculateQuantityScore(farmerPost.quantity, demand.quantity);

      const totalScore = (locationScore * 0.4) + (priceScore * 0.3) + (quantityScore * 0.3);

      if (totalScore >= 50) {
        matches.push({
          type: 'buyer-demand',
          orderId: demand._id,
          orderType: 'Buyer Demand',
          requestedBy: demand.buyerId,
          vegetable: demand.vegetableName,
          quantity: demand.quantity,
          targetPrice: demand.adminPriceSnapshot,
          location: demand.location,
          scores: {
            location: locationScore,
            price: priceScore,
            quantity: quantityScore,
            total: Math.round(totalScore)
          },
          matchPercentage: Math.round(totalScore)
        });
      }
    }

    return matches.sort((a, b) => b.scores.total - a.scores.total);
  } catch (error) {
    console.error('Error finding matching orders:', error);
    return [];
  }
}

async function findMatchingFarmerPosts(buyerDemand) {
  const matches = [];
  const vegetable = buyerDemand.vegetable;
  const buyerLocation = buyerDemand.location;

  const currentPrice = await MarketPrice.findOne({ vegetable })
    .sort({ createdAt: -1 })
    .lean();

  const marketPrice = currentPrice?.pricePerKg || buyerDemand.adminPriceSnapshot || 100;

  try {
    const farmerPosts = await FarmerPost.find({
      vegetable: vegetable,
      status: { $in: ['active', 'pending'] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).lean();

    for (const post of farmerPosts || []) {
      const locationScore = await calculateLocationScore(post.location?.district, buyerLocation);
      const priceScore = await calculatePriceScore(post.pricePerKg, marketPrice);
      const quantityScore = await calculateQuantityScore(post.quantity, buyerDemand.quantity);

      const totalScore = (locationScore * 0.4) + (priceScore * 0.3) + (quantityScore * 0.3);

      if (totalScore >= 50) {
        matches.push({
          type: 'farmer-post',
          postId: post._id,
          postType: 'Farmer Post',
          farmerId: post.farmerId,
          vegetable: post.vegetableName,
          quantity: post.quantity,
          pricePerKg: post.pricePerKg,
          location: post.location,
          scores: {
            location: locationScore,
            price: priceScore,
            quantity: quantityScore,
            total: Math.round(totalScore)
          },
          matchPercentage: Math.round(totalScore)
        });
      }
    }

    return matches.sort((a, b) => b.scores.total - a.scores.total);
  } catch (error) {
    console.error('Error finding matching farmer posts:', error);
    return [];
  }
}

async function getAllSuggestions() {
  const suggestions = {
    farmerMatches: [],
    buyerMatches: [],
    brokerMatches: []
  };

  try {
    const activeFarmerPosts = await FarmerPost.find({
      status: { $in: ['active', 'pending'] }
    }).lean();

    for (const post of activeFarmerPosts || []) {
      const matches = await findMatchingOrders(post);
      if (matches.length > 0) {
        suggestions.farmerMatches.push({
          postId: post._id,
          vegetable: post.vegetableName,
          quantity: post.quantity,
          pricePerKg: post.pricePerKg,
          location: post.location,
          suggestedMatches: matches.slice(0, 3)
        });
      }
    }

    const activeDemands = await BuyerDemand.find({ status: 'open' }).lean();

    for (const demand of activeDemands || []) {
      const matches = await findMatchingFarmerPosts(demand);
      if (matches.length > 0) {
        suggestions.buyerMatches.push({
          demandId: demand._id,
          vegetable: demand.vegetableName,
          quantity: demand.quantity,
          location: demand.location,
          suggestedMatches: matches.slice(0, 3)
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting all suggestions:', error);
    return suggestions;
  }
}

module.exports = {
  findMatchingOrders,
  findMatchingFarmerPosts,
  getAllSuggestions,
  calculateLocationScore,
  calculatePriceScore,
  calculateQuantityScore
};
