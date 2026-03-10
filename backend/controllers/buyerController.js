const BuyerDemand = require('../models/BuyerDemand');
const BrokerSellOrder = require('../models/BrokerSellOrder');
const MarketPrice = require('../models/MarketPrice');
const Vegetable = require('../models/Vegetable');

// 1. Buyer Demand Orders
exports.createDemand = async (req, res) => {
  try {
    const { vegetableId, quantity, deliveryDate, location } = req.body;

    const vegetable = await Vegetable.findById(vegetableId);
    if (!vegetable) return res.status(404).json({ message: 'Vegetable not found' });

    const newDemand = new BuyerDemand({
      vegetable: vegetableId,
      vegetableName: vegetable.name,
      vegetableNameSi: vegetable.nameSi || '',
      vegetableNameTa: vegetable.nameTa || '',
      adminPriceSnapshot: vegetable.currentPrice,
      quantity,
      deliveryDate,
      location,
      buyerId: req.user.userId
    });

    await newDemand.save();
    res.status(201).json(newDemand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Buyer Price Rule logic integrated in viewing orders
exports.getBrokerSellOrders = async (req, res) => {
  try {
    const { 
      vegetableId, 
      vegetableName,
      priceMin, 
      priceMax,
      district, 
      area, 
      village,
      minQuantity, 
      maxQuantity,
      date,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sort = 'newest'
    } = req.query;
    
    let query = { status: 'open' };
    
    // Filter by vegetable ID
    if (vegetableId) {
      query.vegetable = vegetableId;
    }
    
    // Filter by vegetable name (text search)
    if (vegetableName) {
      query.vegetableName = { $regex: vegetableName, $options: 'i' };
    }
    
    // Filter by price range
    if (priceMin || priceMax) {
      query.sellingPrice = {};
      if (priceMin) query.sellingPrice.$gte = Number(priceMin);
      if (priceMax) query.sellingPrice.$lte = Number(priceMax);
    }
    
    // Filter by location
    if (district) {
      query['location.district'] = { $regex: district, $options: 'i' };
    }
    if (area) {
      query['location.area'] = { $regex: area, $options: 'i' };
    }
    if (village) {
      query['location.village'] = { $regex: village, $options: 'i' };
    }
    
    // Filter by quantity range
    if (minQuantity || maxQuantity) {
      query.quantity = {};
      if (minQuantity) query.quantity.$gte = Number(minQuantity);
      if (maxQuantity) query.quantity.$lte = Number(maxQuantity);
    }

    // Filter by date (single date)
    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.createdAt = { $gte: targetDate, $lt: nextDate };
    }
    
    // Filter by date range (dateFrom - dateTo)
    if (dateFrom || dateTo) {
      query.createdAt = query.createdAt || {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort
    let sortOption = { createdAt: -1 }; // newest default
    if (sort === 'price_asc') sortOption = { sellingPrice: 1 };
    if (sort === 'price_desc') sortOption = { sellingPrice: -1 };

    const [orders, total] = await Promise.all([
      BrokerSellOrder.find(query)
        .populate('brokerId', 'name email avatar')
        .populate('vegetable', 'name nameSi nameTa')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BrokerSellOrder.countDocuments(query)
    ]);

    // Transform for buyer view
    const buyerVisibleOrders = orders.map(order => ({
      _id: order._id,
      vegetableId: order.vegetable?._id || order.vegetable,
      vegetableName: order.vegetable?.name || order.vegetableName,
      vegetableNameSi: order.vegetable?.nameSi || order.vegetableNameSi || '',
      vegetableNameTa: order.vegetable?.nameTa || order.vegetableNameTa || '',
      quantity: order.quantity,
      sellingPrice: order.sellingPrice,
      finalPrice: order.sellingPrice,
      brokerId: order.brokerId,
      broker: {
        _id: order.brokerId?._id,
        name: order.brokerId?.name,
        avatar: order.brokerId?.avatar
      },
      location: order.location,
      status: order.status,
      createdAt: order.createdAt
    }));

    res.status(200).json({
      posts: buyerVisibleOrders,
      count: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Marketplace Vegetables with Buyer Price Rule
exports.getMarketplaceVegetables = async (req, res) => {
  try {
    const vegetables = await Vegetable.find({ isActive: true }).select('name currentPrice defaultUnit');

    const marketplace = vegetables.map(v => ({
      vegetableId: v._id,
      vegetableName: v.name,
      unit: v.defaultUnit,
      buyerPrice: v.currentPrice * 1.10 // Admin Price + 10%
    }));

    res.status(200).json(marketplace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyDemands = async (req, res) => {
  try {
    const demands = await BuyerDemand.find({ buyerId: req.user.userId });
    res.status(200).json(demands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
