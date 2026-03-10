const priceEngine = require('../services/priceEngine');
const asyncHandler = require('express-async-handler');

exports.getPriceRecommendation = asyncHandler(async (req, res) => {
  try {
    const { vegetableId } = req.params;
    
    if (!vegetableId) {
      return res.status(400).json({
        success: false,
        message: 'Vegetable ID is required'
      });
    }

    const recommendation = await priceEngine.getPriceRecommendation(vegetableId);
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Vegetable not found'
      });
    }

    res.status(200).json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    console.error('Error getting price recommendation:', error);
    res.status(200).json({
      success: false,
      message: error.message
    });
  }
});

exports.getAllPriceRecommendations = asyncHandler(async (req, res) => {
  try {
    const recommendations = await priceEngine.getAllPriceRecommendations();
    
    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting all price recommendations:', error);
    res.status(200).json({
      success: false,
      message: error.message,
      data: []
    });
  }
});

exports.getPriceInsights = asyncHandler(async (req, res) => {
  try {
    const { vegetableId } = req.params;
    
    if (!vegetableId) {
      return res.status(400).json({
        success: false,
        message: 'Vegetable ID is required'
      });
    }

    const insights = await priceEngine.getPriceInsights(vegetableId);
    
    if (!insights) {
      return res.status(404).json({
        success: false,
        message: 'Vegetable not found or no data available'
      });
    }

    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting price insights:', error);
    res.status(200).json({
      success: false,
      message: error.message
    });
  }
});
