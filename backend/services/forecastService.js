const MarketPrice = require('../models/MarketPrice');
const Vegetable = require('../models/Vegetable');
const Order = require('../models/Order');

async function getPriceForecast(vegetableId) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  
  const last14Days = new Date(today);
  last14Days.setDate(last14Days.getDate() - 14);

  const previousWeekStart = new Date(today);
  previousWeekStart.setDate(previousWeekStart.getDate() - 14);
  const previousWeekEnd = new Date(today);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

  const [currentPrices, previousPrices] = await Promise.all([
    MarketPrice.find({
      vegetable: vegetableId,
      createdAt: { $gte: last7Days, $lte: today },
    }).sort({ createdAt: -1 }).lean(),
    
    MarketPrice.find({
      vegetable: vegetableId,
      createdAt: { $gte: previousWeekStart, $lt: previousWeekEnd },
    }).sort({ createdAt: -1 }).lean(),
  ]);

  let avgPrice = 0;
  if (currentPrices && currentPrices.length > 0) {
    const total = currentPrices.reduce((sum, p) => sum + (p.pricePerKg || 0), 0);
    avgPrice = total / currentPrices.length;
  }

  let previousAvgPrice = 0;
  if (previousPrices && previousPrices.length > 0) {
    const total = previousPrices.reduce((sum, p) => sum + (p.pricePerKg || 0), 0);
    previousAvgPrice = total / previousPrices.length;
  }

  let priceTrend = 'Stable';
  if (avgPrice > previousAvgPrice * 1.05) {
    priceTrend = 'Increasing';
  } else if (avgPrice < previousAvgPrice * 0.95) {
    priceTrend = 'Decreasing';
  }

  return {
    forecastPrice: Math.round(avgPrice * 100) / 100,
    previousWeekPrice: Math.round(previousAvgPrice * 100) / 100,
    dataPoints: currentPrices?.length || 0,
    priceTrend,
  };
}

async function getDemandForecast(vegetableId) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);

  const previousWeekStart = new Date(today);
  previousWeekStart.setDate(previousWeekStart.getDate() - 14);
  const previousWeekEnd = new Date(today);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

  const [currentDemandData, previousDemandData] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          vegetable: vegetableId,
          createdAt: { $gte: last7Days, $lte: today },
          orderType: { $in: ['buyer-order', 'broker-buy'] }
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          orderCount: { $sum: 1 }
        }
      }
    ]),
    Order.aggregate([
      {
        $match: {
          vegetable: vegetableId,
          createdAt: { $gte: previousWeekStart, $lt: previousWeekEnd },
          orderType: { $in: ['buyer-order', 'broker-buy'] }
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          orderCount: { $sum: 1 }
        }
      }
    ])
  ]);

  const currentDemand = currentDemandData[0]?.totalQuantity || 0;
  const previousDemand = previousDemandData[0]?.totalQuantity || 0;
  const currentOrders = currentDemandData[0]?.orderCount || 0;
  const previousOrders = previousDemandData[0]?.orderCount || 0;

  let demandTrend = 'Stable';
  if (currentDemand > previousDemand * 1.2) {
    demandTrend = 'High Demand';
  } else if (currentDemand < previousDemand * 0.8) {
    demandTrend = 'Low Demand';
  }

  return {
    predictedDemand: Math.round(currentDemand),
    previousDemand: Math.round(previousDemand),
    orderCount: currentOrders,
    demandTrend,
  };
}

async function getAllPriceForecasts() {
  const vegetables = await Vegetable.find({ isActive: true }).lean();
  const results = [];

  for (const veg of vegetables || []) {
    try {
      const priceForecast = await getPriceForecast(veg._id);
      results.push({
        vegetableId: veg._id,
        vegetableName: veg.name,
        ...priceForecast,
      });
    } catch (error) {
      console.error(`Error getting forecast for ${veg.name}:`, error.message);
      results.push({
        vegetableId: veg._id,
        vegetableName: veg.name,
        forecastPrice: veg.currentPrice || 0,
        previousWeekPrice: veg.currentPrice || 0,
        dataPoints: 0,
        priceTrend: 'No Data',
      });
    }
  }

  return results;
}

async function getHistoricalPrices(vegetableId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const prices = await MarketPrice.find({
    vegetable: vegetableId,
    createdAt: { $gte: startDate },
  })
  .sort({ createdAt: 1 })
  .lean();

  return prices || [];
}

module.exports = {
  getPriceForecast,
  getDemandForecast,
  getAllPriceForecasts,
  getHistoricalPrices,
};
