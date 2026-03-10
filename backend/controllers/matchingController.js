const matchingService = require('../services/matchingService');
const asyncHandler = require('express-async-handler');

exports.getSuggestions = asyncHandler(async (req, res) => {
  try {
    const suggestions = await matchingService.getAllSuggestions();
    
    res.status(200).json({
      success: true,
      data: suggestions,
      summary: {
        farmerMatchesCount: suggestions.farmerMatches.length,
        buyerMatchesCount: suggestions.buyerMatches.length,
        brokerMatchesCount: suggestions.brokerMatches.length
      }
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(200).json({
      success: false,
      message: error.message,
      data: { farmerMatches: [], buyerMatches: [], brokerMatches: [] }
    });
  }
});

exports.getFarmerMatches = asyncHandler(async (req, res) => {
  try {
    const { postId } = req.params;
    
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const FarmerPost = require('../models/FarmerPost');
    const post = await FarmerPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Farmer post not found'
      });
    }

    const matches = await matchingService.findMatchingOrders(post);

    res.status(200).json({
      success: true,
      postId,
      vegetable: post.vegetableName,
      matches: matches
    });
  } catch (error) {
    console.error('Error getting farmer matches:', error);
    res.status(200).json({
      success: false,
      message: error.message,
      matches: []
    });
  }
});

exports.getBuyerMatches = asyncHandler(async (req, res) => {
  try {
    const { demandId } = req.params;
    
    if (!demandId) {
      return res.status(400).json({
        success: false,
        message: 'Demand ID is required'
      });
    }

    const BuyerDemand = require('../models/BuyerDemand');
    const demand = await BuyerDemand.findById(demandId);
    
    if (!demand) {
      return res.status(404).json({
        success: false,
        message: 'Buyer demand not found'
      });
    }

    const matches = await matchingService.findMatchingFarmerPosts(demand);

    res.status(200).json({
      success: true,
      demandId,
      vegetable: demand.vegetableName,
      matches: matches
    });
  } catch (error) {
    console.error('Error getting buyer matches:', error);
    res.status(200).json({
      success: false,
      message: error.message,
      matches: []
    });
  }
});
