const MarketPrice = require('../models/MarketPrice');
const Vegetable = require('../models/Vegetable');

const SRI_LANKAN_MARKETS = [
  { name: 'Pettah', district: 'Colombo' },
  { name: 'Dambulla', district: 'Matale' },
  { name: 'Thambuttegama', district: 'Anuradhapura' },
  { name: 'Nuwara Eliya', district: 'Nuwara Eliya' },
  { name: 'Kandy', district: 'Kandy' },
  { name: 'Peliyagoda', district: 'Gampaha' },
  { name: 'Meegoda', district: 'Colombo' },
  { name: 'Kappetipola', district: 'Nuwara Eliya' },
];

const BASE_PRICES = {
  'Tomato': { min: 80, max: 200, avg: 140 },
  'Potato': { min: 100, max: 180, avg: 140 },
  'Cucumber': { min: 60, max: 150, avg: 100 },
  'Bell Pepper': { min: 200, max: 400, avg: 300 },
  'Beans': { min: 180, max: 350, avg: 260 },
  'Carrot': { min: 150, max: 280, avg: 210 },
  'Cabbage': { min: 70, max: 150, avg: 110 },
  'Onion': { min: 120, max: 250, avg: 180 },
  'Brinjal': { min: 100, max: 200, avg: 150 },
  'Pumpkin': { min: 50, max: 120, avg: 80 },
};

const normalizeVegetableName = (name) => {
  const nameMap = {
    'tomato': 'Tomato',
    'potato': 'Potato',
    'cucumber': 'Cucumber',
    'bell pepper': 'Bell Pepper',
    'capsicum': 'Bell Pepper',
    'beans': 'Beans',
    'carrot': 'Carrot',
    'cabbage': 'Cabbage',
    'onion': 'Onion',
    'red onion': 'Onion',
    'brinjal': 'Brinjal',
    'eggplant': 'Brinjal',
    'pumpkin': 'Pumpkin',
    'bitter gourd': 'Bitter Gourd',
    'snake gourd': 'Snake Gourd',
    'ladi': 'Snake Gourd',
    'green chili': 'Green Chilli',
    'lime': 'Lime',
    'gotukola': 'Gotukola',
    'mukunuwenna': 'Mukunuwenna',
    'kankun': 'Kankun',
  };
  return nameMap[name.toLowerCase()] || name;
};

const generateRealisticPrice = (basePrice) => {
  const variation = (Math.random() - 0.5) * 0.3;
  const newPrice = Math.round(basePrice * (1 + variation));
  return {
    min: Math.round(newPrice * 0.7),
    max: Math.round(newPrice * 1.3),
    avg: newPrice
  };
};

/**
 * Fetches and updates market prices.
 * Uses atomic upsert to prevent duplicates and ensure latest data is stored.
 */
const fetchMarketPrices = async () => {
  console.log('[MarketPrice] Starting market price collection...');

  try {
    const vegetables = await Vegetable.find({ isActive: true }).limit(50);
    const results = [];
    const now = new Date();

    for (const veg of vegetables) {
      try {
        // 1. VALIDATION: Ensure vegetableId exists and is valid
        const vegId = veg.vegetableId || veg.vegCode;
        if (!vegId || typeof vegId !== 'string') {
          console.warn(`[MarketPrice] Skipping ${veg.name}: No valid unique identifier (vegCode/vegetableId) found.`);
          continue;
        }

        // Check for duplicate vegetableId in database before upsert
        const existing = await MarketPrice.findOne({ vegetableId: vegId });
        if (existing && existing.vegetable && !existing.vegetable.equals(veg._id)) {
          console.warn(`[MarketPrice] Skipping ${veg.name}: vegetableId ${vegId} already used by another vegetable.`);
          continue;
        }

        const basePrices = BASE_PRICES[veg.name] || { min: 100, max: 200, avg: 150 };
        const marketIndex = Math.floor(Math.random() * SRI_LANKAN_MARKETS.length);
        const market = SRI_LANKAN_MARKETS[marketIndex];

        const prices = generateRealisticPrice(basePrices.avg);

        // 2. UPSERT STRATEGY: Update the latest record for this vegetable
        const updateData = {
          $set: {
            vegetable: veg._id,
            vegetableId: vegId,
            vegetableName: veg.name,
            pricePerKg: prices.avg,
            minPrice: prices.min,
            maxPrice: prices.max,
            previousPrice: basePrices.avg,
            priceChange: prices.avg - basePrices.avg,
            priceChangePercentage: ((prices.avg - basePrices.avg) / basePrices.avg * 100).toFixed(2),
            location: market.name,
            unit: veg.defaultUnit || 'kg',
            date: now,
            updatedBy: 'system'
          },
          // 3. Keep a window of historical data in the same document for performance
          $push: {
            historicalData: {
              $each: [{ price: prices.avg, date: now }],
              $slice: -30 // Keep last 30 snapshots
            }
          }
        };

        const result = await MarketPrice.findOneAndUpdate(
          { vegetableId: vegId }, // Unique key
          updateData,
          { 
            upsert: true, 
            new: true, 
            runValidators: true,
            setDefaultsOnInsert: true 
          }
        );

        results.push(result);
      } catch (err) {
        // 4. PER-RECORD ERROR HANDLING: Don't crash the whole loop
        if (err.code === 11000) {
          console.error(`[MarketPrice] Duplicate key error for ${veg.name}: ${err.message}`);
        } else {
          console.error(`[MarketPrice] Failed to process ${veg.name}:`, err.message);
        }
      }
    }

    console.log(`[MarketPrice] Successfully processed ${results.length} market prices.`);
    return results;
  } catch (error) {
    console.error('[MarketPrice] Fatal error in collection job:', error.message);
    // In a scheduler, we log but don't strictly re-throw if we want common logic to continue
    throw error;
  }
};

const getLatestPrices = async (options = {}) => {
  const { vegetable, market, limit = 50, page = 1 } = options;

  try {
    const filter = {};
    if (vegetable) {
      filter.vegetableName = { $regex: vegetable, $options: 'i' };
    }
    if (market) {
      filter.location = { $regex: market, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const prices = await MarketPrice.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MarketPrice.countDocuments(filter);

    return {
      success: true,
      data: prices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('[MarketPrice] Error getting latest prices:', error);
    throw error;
  }
};

const getPriceHistory = async (vegetableId, days = 7) => {
  try {
    const priceDoc = await MarketPrice.findOne({ vegetableId });
    
    if (!priceDoc) {
      return { success: false, message: 'Vegetable not found' };
    }

    return {
      success: true,
      data: priceDoc.historicalData
    };
  } catch (error) {
    console.error('[MarketPrice] Error getting price history:', error);
    throw error;
  }
};

const getAvailableVegetables = async () => {
  try {
    const vegetables = await MarketPrice.distinct('vegetableName');
    return {
      success: true,
      data: vegetables.map(name => ({ name }))
    };
  } catch (error) {
    console.error('[MarketPrice] Error getting available vegetables:', error);
    throw error;
  }
};

const getAvailableMarkets = async () => {
  try {
    const markets = await MarketPrice.distinct('location');
    return {
      success: true,
      data: markets.map(name => ({ name, district: 'Sri Lanka' }))
    };
  } catch (error) {
    console.error('[MarketPrice] Error getting available markets:', error);
    throw error;
  }
};

module.exports = {
  fetchMarketPrices,
  getLatestPrices,
  getPriceHistory,
  getAvailableVegetables,
  getAvailableMarkets,
  SRI_LANKAN_MARKETS
};
