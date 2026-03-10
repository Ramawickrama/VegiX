const marketPriceService = require('../services/marketPriceService');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const getLatestMarketPrices = async (req, res) => {
  try {
    const { vegetable, market, limit = 50, page = 1 } = req.query;
    
    const result = await marketPriceService.getLatestPrices({
      vegetable,
      market,
      limit: parseInt(limit),
      page: parseInt(page)
    });
    
    res.success(result);
  } catch (error) {
    console.error('[LiveMarket] Error getting latest prices:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const refreshMarketPrices = async (req, res) => {
  try {
    console.log('[LiveMarket] Manual refresh triggered by admin');
    const result = await marketPriceService.fetchMarketPrices();
    
    res.success({
      success: true,
      message: 'Market prices refreshed successfully',
      count: result.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[LiveMarket] Error refreshing prices:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVegetables = async (req, res) => {
  try {
    const result = await marketPriceService.getAvailableVegetables();
    res.success(result);
  } catch (error) {
    console.error('[LiveMarket] Error getting vegetables:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMarkets = async (req, res) => {
  try {
    const result = await marketPriceService.getAvailableMarkets();
    res.success(result);
  } catch (error) {
    console.error('[LiveMarket] Error getting markets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPriceHistory = async (req, res) => {
  try {
    const { vegetable, days = 7 } = req.query;
    
    if (!vegetable) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vegetable name is required' 
      });
    }
    
    const result = await marketPriceService.getPriceHistory(
      vegetable, 
      parseInt(days)
    );
    
    res.success(result);
  } catch (error) {
    console.error('[LiveMarket] Error getting price history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLatestMarketPrices,
  refreshMarketPrices,
  getVegetables,
  getMarkets,
  getPriceHistory
};
