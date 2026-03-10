const FarmerPost = require('../models/FarmerPost');
const BuyerDemand = require('../models/BuyerDemand');
const BrokerBuyOrder = require('../models/BrokerBuyOrder');
const BrokerSellOrder = require('../models/BrokerSellOrder');
const Vegetable = require('../models/Vegetable');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.getOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayFarmerPosts,
      todayBuyerDemands,
      todayBrokerBuys,
      todayBrokerSells,
      totalFarmers,
      totalBrokers,
      totalBuyers,
      totalVegetables,
      recentConversations,
    ] = await Promise.all([
      FarmerPost.find({ createdAt: { $gte: today, $lt: tomorrow } }),
      BuyerDemand.find({ createdAt: { $gte: today, $lt: tomorrow } }),
      BrokerBuyOrder.find({ createdAt: { $gte: today, $lt: tomorrow } }),
      BrokerSellOrder.find({ createdAt: { $gte: today, $lt: tomorrow } }),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'broker' }),
      User.countDocuments({ role: 'buyer' }),
      Vegetable.countDocuments({ isActive: true }),
      Conversation.find().sort({ updatedAt: -1 }).limit(10),
    ]);

    const totalSupplyToday = todayFarmerPosts.reduce((sum, p) => sum + (p.quantity || 0), 0) +
      todayBrokerSells.reduce((sum, s) => sum + (s.quantity || 0), 0);

    const totalDemandToday = todayBuyerDemands.reduce((sum, d) => sum + (d.quantity || 0), 0) +
      todayBrokerBuys.reduce((sum, b) => sum + (b.quantityRequired || 0), 0);

    const topVegetables = await getTopVegetables();

    const farmerParticipation = await getFarmerParticipation();

    const brokerTransactions = await getBrokerTransactions();

    const buyerRequests = todayBuyerDemands.length;

    res.status(200).json({
      totalSupplyToday,
      totalDemandToday,
      topVegetables,
      farmerParticipation,
      brokerTransactions,
      buyerRequests,
      totalFarmers,
      totalBrokers,
      totalBuyers,
      totalVegetables,
      recentConversations,
      marketStatus: totalDemandToday > totalSupplyToday ? 'High Demand' : totalSupplyToday > totalDemandToday ? 'Oversupply' : 'Balanced',
    });
  } catch (error) {
    console.error('Error getting overview:', error);
    res.status(500).json({ message: error.message || 'Failed to get overview' });
  }
};

async function getTopVegetables() {
  const vegetables = await Vegetable.find({ isActive: true });
  const results = [];

  for (const veg of vegetables) {
    const [supply, demand] = await Promise.all([
      FarmerPost.aggregate([
        { $match: { vegetable: veg._id } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]),
      BuyerDemand.aggregate([
        { $match: { vegetable: veg._id } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]),
    ]);

    results.push({
      vegetableId: veg._id,
      vegetableName: veg.name,
      category: veg.category,
      totalSupply: supply[0]?.total || 0,
      totalDemand: demand[0]?.total || 0,
    });
  }

  return results.sort((a, b) => (b.totalDemand + b.totalSupply) - (a.totalDemand + a.totalSupply)).slice(0, 10);
}

async function getFarmerParticipation() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const farmers = await User.find({ role: 'farmer' });
  const participatingFarmers = await FarmerPost.distinct('farmerId', { createdAt: { $gte: thirtyDaysAgo } });

  const byDay = await FarmerPost.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    totalFarmers: farmers.length,
    activeFarmers: participatingFarmers.length,
    participationRate: farmers.length > 0 ? ((participatingFarmers.length / farmers.length) * 100).toFixed(1) : 0,
    byDay,
  };
}

async function getBrokerTransactions() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const buyOrders = await BrokerBuyOrder.find({ createdAt: { $gte: thirtyDaysAgo } });
  const sellOrders = await BrokerSellOrder.find({ createdAt: { $gte: thirtyDaysAgo } });

  const byDay = await BrokerBuyOrder.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        buyCount: { $sum: 1 },
        sellCount: { $sum: 0 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const sellByDay = await BrokerSellOrder.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        buyCount: { $sum: 0 },
        sellCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const mergedByDay = {};
  byDay.forEach(d => { mergedByDay[d._id] = d; });
  sellByDay.forEach(d => {
    if (mergedByDay[d._id]) {
      mergedByDay[d._id].sellCount += d.sellCount;
    } else {
      mergedByDay[d._id] = d;
    }
  });

  return {
    totalBuyOrders: buyOrders.length,
    totalSellOrders: sellOrders.length,
    totalVolume: buyOrders.reduce((sum, o) => sum + (o.quantityRequired || 0), 0),
    byDay: Object.values(mergedByDay).sort((a, b) => a._id.localeCompare(b._id)),
  };
}

exports.getVegetableAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const vegetable = await Vegetable.findById(id);
    if (!vegetable) {
      return res.status(404).json({ message: 'Vegetable not found' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [supplyHistory, demandHistory, priceHistory] = await Promise.all([
      FarmerPost.aggregate([
        { $match: { vegetable: id, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalQuantity: { $sum: '$quantity' },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      BuyerDemand.aggregate([
        { $match: { vegetable: id, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalQuantity: { $sum: '$quantity' },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      vegetable: { _id: vegetable._id, name: vegetable.name, category: vegetable.category },
      supplyHistory,
      demandHistory,
    });
  } catch (error) {
    console.error('Error getting vegetable analytics:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDateRangeAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [farmerPosts, buyerDemands, brokerBuys, brokerSells] = await Promise.all([
      FarmerPost.find({ createdAt: { $gte: start, $lte: end } }),
      BuyerDemand.find({ createdAt: { $gte: start, $lte: end } }),
      BrokerBuyOrder.find({ createdAt: { $gte: start, $lte: end } }),
      BrokerSellOrder.find({ createdAt: { $gte: start, $lte: end } }),
    ]);

    const dailyData = {};

    farmerPosts.forEach(post => {
      const dateKey = new Date(post.createdAt).toISOString().split('T')[0];
      if (!dailyData[dateKey]) dailyData[dateKey] = { date: dateKey, supply: 0, demand: 0, orders: 0 };
      dailyData[dateKey].supply += post.quantity || 0;
      dailyData[dateKey].orders += 1;
    });

    buyerDemands.forEach(demand => {
      const dateKey = new Date(demand.createdAt).toISOString().split('T')[0];
      if (!dailyData[dateKey]) dailyData[dateKey] = { date: dateKey, supply: 0, demand: 0, orders: 0 };
      dailyData[dateKey].demand += demand.quantity || 0;
      dailyData[dateKey].orders += 1;
    });

    brokerBuys.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (!dailyData[dateKey]) dailyData[dateKey] = { date: dateKey, supply: 0, demand: 0, orders: 0 };
      dailyData[dateKey].demand += order.quantityRequired || 0;
      dailyData[dateKey].orders += 1;
    });

    brokerSells.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (!dailyData[dateKey]) dailyData[dateKey] = { date: dateKey, supply: 0, demand: 0, orders: 0 };
      dailyData[dateKey].supply += order.quantity || 0;
      dailyData[dateKey].orders += 1;
    });

    const totalSupply = farmerPosts.reduce((sum, p) => sum + (p.quantity || 0), 0) +
      brokerSells.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalDemand = buyerDemands.reduce((sum, d) => sum + (d.quantity || 0), 0) +
      brokerBuys.reduce((sum, b) => sum + (b.quantityRequired || 0), 0);

    res.status(200).json({
      totalSupply,
      totalDemand,
      dailyData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      summary: {
        totalOrders: farmerPosts.length + buyerDemands.length + brokerBuys.length + brokerSells.length,
        avgDailySupply: totalSupply / Math.max(Object.keys(dailyData).length, 1),
        avgDailyDemand: totalDemand / Math.max(Object.keys(dailyData).length, 1),
      },
    });
  } catch (error) {
    console.error('Error getting date range analytics:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTopFarmers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topFarmers = await FarmerPost.aggregate([
      {
        $group: {
          _id: '$farmerId',
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$pricePerKg'] } },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'farmer',
        },
      },
      { $unwind: '$farmer' },
      {
        $project: {
          farmerId: '$_id',
          farmerName: '$farmer.name',
          farmerUserId: '$farmer.userId',
          farmerLocation: '$farmer.location',
          totalOrders: 1,
          totalQuantity: 1,
          totalValue: 1,
        },
      },
    ]);

    res.status(200).json(topFarmers);
  } catch (error) {
    console.error('Error getting top farmers:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMarketActivityHeatmap = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const [postsByHour, demandsByHour] = await Promise.all([
      FarmerPost.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { hour: { $hour: '$createdAt' }, dayOfWeek: { $dayOfWeek: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      BuyerDemand.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { hour: { $hour: '$createdAt' }, dayOfWeek: { $dayOfWeek: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const heatmapData = {};
    for (let day = 1; day <= 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmapData[`${day}-${hour}`] = 0;
      }
    }

    postsByHour.forEach(item => {
      const key = `${item._id.dayOfWeek}-${item._id.hour}`;
      heatmapData[key] = (heatmapData[key] || 0) + item.count;
    });

    demandsByHour.forEach(item => {
      const key = `${item._id.dayOfWeek}-${item._id.hour}`;
      heatmapData[key] = (heatmapData[key] || 0) + item.count;
    });

    const formattedData = Object.entries(heatmapData).map(([key, value]) => {
      const [dayOfWeek, hour] = key.split('-').map(Number);
      return { dayOfWeek, hour, activity: value };
    });

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error getting market activity heatmap:', error);
    res.status(500).json({ message: error.message });
  }
};
