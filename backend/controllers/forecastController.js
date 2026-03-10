const asyncHandler = require('express-async-handler');
const forecastService = require('../services/forecastService');
const Vegetable = require('../models/Vegetable');

const getForecast = asyncHandler(async (req, res) => {
  const { vegetableId } = req.params;

  if (!vegetableId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Vegetable ID is required',
      forecast: null
    });
  }

  try {
    let vegetable = await Vegetable.findOne({ vegetableId: vegetableId });
    if (!vegetable) {
      vegetable = await Vegetable.findById(vegetableId);
    }

    if (!vegetable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vegetable not found',
        forecast: null
      });
    }

    const [priceForecast, demandForecast] = await Promise.all([
      forecastService.getPriceForecast(vegetable._id),
      forecastService.getDemandForecast(vegetable._id)
    ]);

    res.status(200).json({
      success: true,
      vegetable: {
        _id: vegetable._id,
        name: vegetable.name,
        currentPrice: vegetable.currentPrice
      },
      priceForecast,
      demandForecast
    });
  } catch (error) {
    console.error('Error getting forecast:', error);
    res.status(200).json({
      success: false,
      message: error.message || 'Failed to get forecast',
      forecast: null
    });
  }
});

const getAllForecasts = asyncHandler(async (req, res) => {
  try {
    const forecasts = await forecastService.getAllPriceForecasts();
    res.status(200).json({
      success: true,
      count: forecasts.length || 0,
      data: forecasts || []
    });
  } catch (error) {
    console.error('Error getting all forecasts:', error);
    res.status(200).json({
      success: false,
      message: error.message || 'Failed to get forecasts',
      count: 0,
      data: []
    });
  }
});

const generateForecast = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Forecasts based on historical data - no generation needed'
  });
});

const getForecastByDate = asyncHandler(async (req, res) => {
  const { vegetableId } = req.params;
  const { days = 30 } = req.query;

  if (!vegetableId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Vegetable ID is required',
      data: []
    });
  }

  try {
    const prices = await forecastService.getHistoricalPrices(vegetableId, parseInt(days));
    
    res.status(200).json({
      success: true,
      count: prices.length || 0,
      data: prices || []
    });
  } catch (error) {
    console.error('Error getting forecast by date:', error);
    res.status(200).json({
      success: false,
      message: error.message || 'Failed to get forecast',
      data: []
    });
  }
});

const getNationalForecast = asyncHandler(async (req, res) => {
  try {
    const forecasts = await forecastService.getAllPriceForecasts();

    res.status(200).json({
      success: true,
      count: forecasts.length || 0,
      data: forecasts || []
    });
  } catch (error) {
    console.error('Error getting national forecast:', error);
    res.status(200).json({
      success: false,
      message: error.message || 'Failed to get national forecast',
      data: []
    });
  }
});

module.exports = {
  getForecast,
  getAllForecasts,
  generateForecast,
  getForecastByDate,
  getNationalForecast
};
