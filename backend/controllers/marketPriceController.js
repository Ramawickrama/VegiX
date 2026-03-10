const MarketPrice = require('../models/MarketPrice');
const Vegetable = require('../models/Vegetable');

exports.getFarmerPrices = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setUTCHours(0, 0, 0, 0);

    const vegetableIds = req.query.vegetables ? req.query.vegetables.split(',') : [];

    if (vegetableIds.length === 0) {
      return res.json([]);
    }

    const vegetables = await Vegetable.find({ vegetableId: { $in: vegetableIds } });
    const vegetableObjectIds = vegetables.map(v => v._id);

    const prices = await MarketPrice.find({
      vegetable: { $in: vegetableObjectIds },
      date: date
    }).populate('vegetable', 'name nameSi nameTa');

    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTodayMarketPrices = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prices = await MarketPrice.find({
      createdAt: { $gte: today }
    })
      .populate('vegetable', 'name nameSi nameTa vegetableId')
      .sort({ createdAt: -1 })
      .lean();

    // If no prices found today, get latest prices from vegetables collection
    if (!prices || prices.length === 0) {
      const vegetables = await Vegetable.find({ isActive: true }).lean();

      const fallbackPrices = vegetables.map(veg => ({
        _id: veg._id,
        vegetable: {
          _id: veg._id,
          name: veg.name,
          nameSi: veg.nameSi,
          nameTa: veg.nameTa,
          vegetableId: veg.vegetableId
        },
        vegetableName: veg.name,
        nameSi: veg.nameSi,
        nameTa: veg.nameTa,
        vegetableId: veg.vegetableId,
        pricePerKg: veg.currentPrice || 0,
        minPrice: veg.minPrice || 0,
        maxPrice: veg.maxPrice || 0,
        createdAt: veg.lastUpdated || new Date()
      }));

      return res.status(200).json({
        success: true,
        prices: fallbackPrices
      });
    }

    // Transform prices to include vegetableName for easier frontend handling
    const transformedPrices = prices.map(price => ({
      _id: price._id,
      vegetable: price.vegetable,
      vegetableName: price.vegetable?.name || 'Unknown',
      nameSi: price.vegetable?.nameSi || '',
      nameTa: price.vegetable?.nameTa || '',
      vegetableId: price.vegetable?.vegetableId || '',
      pricePerKg: price.pricePerKg,
      minPrice: price.minPrice || 0,
      maxPrice: price.maxPrice || 0,
      createdAt: price.createdAt,
      updatedAt: price.updatedAt || price.createdAt
    }));

    res.status(200).json({
      success: true,
      prices: transformedPrices
    });
  } catch (error) {
    console.error('Error getting today market prices:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      prices: []
    });
  }
};
