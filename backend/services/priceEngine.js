const MarketPrice = require('../models/MarketPrice');
const Vegetable = require('../models/Vegetable');
const FarmerPost = require('../models/FarmerPost');
const Order = require('../models/Order');

async function getPriceRecommendation(vegetableId) {
  try {
    const vegetable = await Vegetable.findById(vegetableId).lean();
    if (!vegetable) {
      return null;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [currentPrice, lastWeekPrices, lastWeekOrders, lastWeekSupply] = await Promise.all([
      MarketPrice.findOne({ vegetable: vegetableId })
        .sort({ createdAt: -1 })
        .lean(),
      MarketPrice.find({
        vegetable: vegetableId,
        createdAt: { $gte: sevenDaysAgo }
      }).lean(),
      Order.aggregate([
        {
          $match: {
            vegetable: vegetableId,
            createdAt: { $gte: sevenDaysAgo },
            orderType: { $in: ['buyer-order', 'broker-buy'] }
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]),
      FarmerPost.aggregate([
        {
          $match: {
            vegetable: vegetableId,
            createdAt: { $gte: sevenDaysAgo },
            status: { $in: ['active', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ])
    ]);

    let sevenDayAvgPrice = 0;
    if (lastWeekPrices && lastWeekPrices.length > 0) {
      const sum = lastWeekPrices.reduce((acc, p) => acc + (p.pricePerKg || 0), 0);
      sevenDayAvgPrice = sum / lastWeekPrices.length;
    }

    const previousWeekPrices = await MarketPrice.find({
      vegetable: vegetableId,
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    }).lean();

    let previousWeekAvgPrice = 0;
    if (previousWeekPrices && previousWeekPrices.length > 0) {
      const sum = previousWeekPrices.reduce((acc, p) => acc + (p.pricePerKg || 0), 0);
      previousWeekAvgPrice = sum / previousWeekPrices.length;
    }

    const totalDemand = lastWeekOrders[0]?.totalQuantity || 0;
    const totalSupply = lastWeekSupply[0]?.totalQuantity || 0;

    let demandIndex = 100;
    if (totalSupply > 0) {
      demandIndex = (totalDemand / totalSupply) * 100;
    }

    let supplyRatio = 1;
    if (totalSupply > 0 && totalDemand > 0) {
      supplyRatio = totalDemand / totalSupply;
    } else if (totalSupply > 0) {
      supplyRatio = 0.5;
    }

    const sevenDayWeight = 0.5;
    const demandWeight = 0.3;
    const supplyWeight = 0.2;

    const recommendedPrice = (
      (sevenDayAvgPrice * sevenDayWeight) +
      (demandIndex * supplyRatio * demandWeight) +
      (sevenDayAvgPrice * supplyRatio * supplyWeight)
    );

    let marketTrend = 'Stable';
    if (previousWeekAvgPrice > 0) {
      const priceChange = ((sevenDayAvgPrice - previousWeekAvgPrice) / previousWeekAvgPrice) * 100;
      if (priceChange > 5) {
        marketTrend = 'Rising';
      } else if (priceChange < -5) {
        marketTrend = 'Falling';
      }
    } else if (demandIndex > 120) {
      marketTrend = 'Rising';
    } else if (demandIndex < 70) {
      marketTrend = 'Falling';
    }

    return {
      vegetable: vegetable.name,
      vegetableId: vegetable._id,
      todayPrice: currentPrice?.pricePerKg || vegetable.currentPrice || 0,
      sevenDayAvgPrice: Math.round(sevenDayAvgPrice * 100) / 100,
      recommendedPrice: Math.round(recommendedPrice * 100) / 100,
      marketTrend,
      demandIndex: Math.round(demandIndex),
      totalDemand: totalDemand,
      totalSupply: totalSupply,
      priceChange: previousWeekAvgPrice > 0 
        ? Math.round(((sevenDayAvgPrice - previousWeekAvgPrice) / previousWeekAvgPrice) * 100) 
        : 0,
      dataPoints: lastWeekPrices?.length || 0
    };
  } catch (error) {
    console.error('Error calculating price recommendation:', error);
    return null;
  }
}

async function getAllPriceRecommendations() {
  try {
    const vegetables = await Vegetable.find({ isActive: true }).lean();
    const recommendations = [];

    for (const veg of vegetables || []) {
      const rec = await getPriceRecommendation(veg._id);
      if (rec) {
        recommendations.push(rec);
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error getting all price recommendations:', error);
    return [];
  }
}

async function getPriceInsights(vegetableId) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const priceHistory = await MarketPrice.find({
      vegetable: vegetableId,
      createdAt: { $gte: thirtyDaysAgo }
    })
    .sort({ createdAt: 1 })
    .limit(30)
    .lean();

    const prices = priceHistory?.map(p => p.pricePerKg) || [];
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const currentPrice = priceHistory?.length > 0 ? priceHistory[priceHistory.length - 1].pricePerKg : avgPrice;
    
    let trend = 'Stable';
    if (prices.length >= 7) {
      const recentAvg = prices.slice(-7).reduce((a, b) => a + b, 0) / 7;
      const olderAvg = prices.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
      if (recentAvg > olderAvg * 1.05) trend = 'Rising';
      else if (recentAvg < olderAvg * 0.95) trend = 'Falling';
    }

    return {
      priceHistory: priceHistory?.map(p => ({
        date: p.createdAt,
        price: p.pricePerKg
      })) || [],
      statistics: {
        average: Math.round(avgPrice * 100) / 100,
        minimum: Math.round(minPrice * 100) / 100,
        maximum: Math.round(maxPrice * 100) / 100,
        current: Math.round(currentPrice * 100) / 100,
        trend
      }
    };
  } catch (error) {
    console.error('Error getting price insights:', error);
    return null;
  }
}

module.exports = {
  getPriceRecommendation,
  getAllPriceRecommendations,
  getPriceInsights
};
