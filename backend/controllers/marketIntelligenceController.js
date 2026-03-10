const Vegetable = require('../models/Vegetable');
const Order = require('../models/Order');
const FarmerPost = require('../models/FarmerPost');
const MarketPrice = require('../models/MarketPrice');
const asyncHandler = require('express-async-handler');

// Demand Index Calculation Constants
const PRICE_ELASTICITY = -0.5; // Price elasticity coefficient

exports.getDemandIndex = asyncHandler(async (req, res) => {
  try {
    const vegetables = await Vegetable.find({ isActive: true }).lean();
    const results = [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // Last year same period
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const oneYearThirtyDaysAgo = new Date(oneYearAgo.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const veg of vegetables || []) {
      try {
        // Current period (last 30 days)
        const currentPeriodData = await Promise.all([
          FarmerPost.aggregate([
            {
              $match: {
                vegetable: veg._id,
                createdAt: { $gte: thirtyDaysAgo },
                status: { $in: ['active', 'completed'] }
              }
            },
            {
              $group: {
                _id: null,
                totalSupply: { $sum: '$quantity' },
                orderCount: { $sum: 1 }
              }
            }
          ]),
          Order.aggregate([
            {
              $match: {
                vegetable: veg._id,
                createdAt: { $gte: thirtyDaysAgo },
                orderType: { $in: ['buyer-order', 'broker-buy'] }
              }
            },
            {
              $group: {
                _id: null,
                totalDemand: { $sum: '$quantity' },
                orderCount: { $sum: 1 },
                avgPrice: { $avg: '$price' }
              }
            }
          ]),
          MarketPrice.findOne({ vegetable: veg._id })
            .sort({ createdAt: -1 })
            .lean()
        ]);

        // Base period (90 days ago - previous 30 days as benchmark)
        const basePeriodData = await Promise.all([
          FarmerPost.aggregate([
            {
              $match: {
                vegetable: veg._id,
                createdAt: { $gte: ninetyDaysAgo, $lt: sixtyDaysAgo },
                status: { $in: ['active', 'completed'] }
              }
            },
            {
              $group: {
                _id: null,
                totalSupply: { $sum: '$quantity' }
              }
            }
          ]),
          Order.aggregate([
            {
              $match: {
                vegetable: veg._id,
                createdAt: { $gte: ninetyDaysAgo, $lt: sixtyDaysAgo },
                orderType: { $in: ['buyer-order', 'broker-buy'] }
              }
            },
            {
              $group: {
                _id: null,
                totalDemand: { $sum: '$quantity' },
                avgPrice: { $avg: '$price' }
              }
            }
          ])
        ]);

        // Last year same period (seasonality filter)
        const lastYearData = await Promise.all([
          FarmerPost.aggregate([
            {
              $match: {
                vegetable: veg._id,
                createdAt: { $gte: oneYearThirtyDaysAgo, $lt: oneYearAgo },
                status: { $in: ['active', 'completed'] }
              }
            },
            {
              $group: {
                _id: null,
                totalSupply: { $sum: '$quantity' }
              }
            }
          ]),
          Order.aggregate([
            {
              $match: {
                vegetable: veg._id,
                createdAt: { $gte: oneYearThirtyDaysAgo, $lt: oneYearAgo },
                orderType: { $in: ['buyer-order', 'broker-buy'] }
              }
            },
            {
              $group: {
                _id: null,
                totalDemand: { $sum: '$quantity' }
              }
            }
          ])
        ]);

        // Extract values
        const currentSupply = currentPeriodData[0][0]?.totalSupply || 0;
        const currentDemand = currentPeriodData[1][0]?.totalDemand || 0;
        const currentAvgPrice = currentPeriodData[1][0]?.avgPrice || 0;
        
        const baseSupply = basePeriodData[0][0]?.totalSupply || 0;
        const baseDemand = basePeriodData[1][0]?.totalDemand || 0;
        const baseAvgPrice = basePeriodData[1][0]?.avgPrice || 0;
        
        const lastYearSupply = lastYearData[0][0]?.totalSupply || 0;
        const lastYearDemand = lastYearData[1][0]?.totalDemand || 0;

        // Simple Demand Index: Id = (Qt / Qb) × 100
        // Using demand quantity relative to base period
        let demandIndex = 0;
        if (baseDemand > 0) {
          demandIndex = Math.round((currentDemand / baseDemand) * 100);
        } else if (currentDemand > 0) {
          // If no base data, treat as high demand
          demandIndex = 150;
        }

        // Price-Adjusted Demand Index
        // Adjusts for price changes using elasticity
        // Adjusted Demand = Base Demand × (1 + elasticity × (priceChange% / 100))
        let priceAdjustedIndex = demandIndex;
        if (baseAvgPrice > 0 && currentAvgPrice > 0) {
          const priceChangePercent = ((currentAvgPrice - baseAvgPrice) / baseAvgPrice) * 100;
          const priceAdjustment = 1 + (PRICE_ELASTICITY * (priceChangePercent / 100));
          priceAdjustedIndex = Math.round(demandIndex * priceAdjustment);
        }

        // Seasonality Index (Compare to same period last year)
        let seasonalityIndex = 0;
        if (lastYearDemand > 0) {
          seasonalityIndex = Math.round((currentDemand / lastYearDemand) * 100);
        }

        // Determine status based on indices
        let demandStatus = 'Normal Demand';
        if (demandIndex >= 120 || priceAdjustedIndex >= 120) {
          demandStatus = 'High Demand';
        } else if (demandIndex <= 70 || priceAdjustedIndex <= 70) {
          demandStatus = 'Low Demand';
        }

        // Seasonal status
        let seasonalStatus = 'Normal Season';
        if (seasonalityIndex >= 120) {
          seasonalStatus = 'Seasonal High';
        } else if (seasonalityIndex <= 70) {
          seasonalStatus = 'Seasonal Low';
        }

        const currentPrice = currentPeriodData[2];

        results.push({
          vegetableId: veg._id,
          vegetableName: veg.name,
          demandIndex,
          priceAdjustedIndex,
          seasonalityIndex,
          demandStatus,
          seasonalStatus,
          currentPeriod: {
            demand: currentDemand,
            supply: currentSupply,
            avgPrice: currentAvgPrice
          },
          basePeriod: {
            demand: baseDemand,
            supply: baseSupply,
            avgPrice: baseAvgPrice
          },
          lastYearPeriod: {
            demand: lastYearDemand,
            supply: lastYearSupply
          },
          currentPrice: currentPrice?.pricePerKg || veg.currentPrice || 0,
          priceChangePercent: baseAvgPrice > 0 ? Math.round(((currentAvgPrice - baseAvgPrice) / baseAvgPrice) * 100) : 0,
          elasticity: PRICE_ELASTICITY
        });
      } catch (vegError) {
        console.error(`Error processing ${veg.name}:`, vegError.message);
        results.push({
          vegetableId: veg._id,
          vegetableName: veg.name,
          demandIndex: 0,
          priceAdjustedIndex: 0,
          seasonalityIndex: 0,
          demandStatus: 'No Data',
          seasonalStatus: 'No Data',
          currentPeriod: { demand: 0, supply: 0, avgPrice: 0 },
          basePeriod: { demand: 0, supply: 0, avgPrice: 0 },
          lastYearPeriod: { demand: 0, supply: 0 },
          currentPrice: veg.currentPrice || 0,
          priceChangePercent: 0,
          elasticity: PRICE_ELASTICITY
        });
      }
    }

    const sortedByDemand = [...results].sort((a, b) => b.demandIndex - a.demandIndex);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
      topDemand: sortedByDemand.slice(0, 5),
      summary: {
        totalVegetables: results.length,
        highDemandCount: results.filter(r => r.demandStatus === 'High Demand').length,
        lowDemandCount: results.filter(r => r.demandStatus === 'Low Demand').length,
        normalDemandCount: results.filter(r => r.demandStatus === 'Normal Demand').length,
        seasonalHighCount: results.filter(r => r.seasonalStatus === 'Seasonal High').length
      },
      methodology: {
        simpleDemandIndex: 'Id = (Qt / Qb) × 100',
        priceAdjusted: `Elasticity = ${PRICE_ELASTICITY}`,
        seasonality: 'Current vs Same Period Last Year'
      }
    });
  } catch (error) {
    console.error('Error getting demand index:', error);
    res.status(200).json({
      success: false,
      message: error.message || 'Failed to get demand index',
      data: []
    });
  }
});

exports.getSeasonalForecast = asyncHandler(async (req, res) => {
  try {
    const vegetables = await Vegetable.find({ isActive: true }).lean();
    const results = [];

    const currentMonth = new Date().getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];

    for (const veg of vegetables || []) {
      try {
        const seasonalData = await MarketPrice.aggregate([
          {
            $match: {
              vegetable: veg._id
            }
          },
          {
            $group: {
              _id: { $month: '$createdAt' },
              avgPrice: { $avg: '$pricePerKg' },
              count: { $sum: 1 }
            }
          },
          { $sort: { avgPrice: -1 } }
        ]);

        let bestMonth = null;
        let seasonalStatus = 'Normal Season';
        
        if (seasonalData && seasonalData.length > 0) {
          const highestMonth = seasonalData[0];
          bestMonth = monthNames[highestMonth._id - 1];
          
          if (highestMonth._id === currentMonth + 1) {
            seasonalStatus = 'Seasonal High';
          }
        }

        const currentPrice = await MarketPrice.findOne({ vegetable: veg._id })
          .sort({ createdAt: -1 })
          .lean();

        results.push({
          vegetable: veg.name,
          vegetableId: veg._id,
          bestMonth,
          seasonalStatus,
          seasonalData: (seasonalData || []).map(s => ({
            month: monthNames[s._id - 1],
            avgPrice: Math.round(s.avgPrice * 100) / 100,
            dataPoints: s.count
          })),
          currentPrice: currentPrice?.pricePerKg || veg.currentPrice || 0
        });
      } catch (vegError) {
        console.error(`Error processing ${veg.name}:`, vegError.message);
        results.push({
          vegetable: veg.name,
          vegetableId: veg._id,
          bestMonth: null,
          seasonalStatus: 'No Data',
          seasonalData: [],
          currentPrice: veg.currentPrice || 0
        });
      }
    }

    const seasonalHigh = results.filter(r => r.seasonalStatus === 'Seasonal High');
    const upcomingHigh = results.filter(r => {
      const nextMonth = (currentMonth + 2) % 12 + 1;
      return r.seasonalData.some(s => s.month === monthNames[nextMonth - 1]);
    });

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
      seasonalHighlights: {
        currentlyHigh: seasonalHigh,
        upcomingHigh: upcomingHigh.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('Error getting seasonal forecast:', error);
    res.status(200).json({
      success: false,
      message: error.message || 'Failed to get seasonal forecast',
      data: []
    });
  }
});

exports.getNationalMarketOverview = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [supplyData, demandData, priceData, orderStats] = await Promise.all([
      FarmerPost.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: { $in: ['active', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            totalSupply: { $sum: '$quantity' },
            postCount: { $sum: 1 }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            orderType: { $in: ['buyer-order', 'broker-buy'] }
          }
        },
        {
          $group: {
            _id: null,
            totalDemand: { $sum: '$quantity' },
            orderCount: { $sum: 1 }
          }
        }
      ]),
      MarketPrice.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$vegetable',
            avgPrice: { $avg: '$pricePerKg' },
            latestPrice: { $last: '$pricePerKg' }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const totalSupply = supplyData[0]?.totalSupply || 0;
    const totalDemand = demandData[0]?.totalDemand || 0;
    const totalPosts = supplyData[0]?.postCount || 0;
    const totalOrders = demandData[0]?.orderCount || 0;

    let demandIndex = 0;
    if (totalSupply > 0) {
      demandIndex = Math.round((totalDemand / totalSupply) * 100);
    }

    const orderByStatus = {};
    (orderStats || []).forEach(stat => {
      orderByStatus[stat._id] = stat.count;
    });

    const vegetables = await Vegetable.find({ isActive: true }).lean();
    const topVegetables = [];

    for (const veg of (vegetables || []).slice(0, 5)) {
      const vegPrice = priceData.find(p => p._id?.toString() === veg._id?.toString());
      topVegetables.push({
        name: veg.name,
        currentPrice: vegPrice?.latestPrice || veg.currentPrice || 0,
        avgPrice: Math.round((vegPrice?.avgPrice || 0) * 100) / 100
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalSupply,
        totalDemand,
        demandIndex,
        totalPosts,
        totalOrders,
        orderByStatus,
        topVegetables,
        priceCount: priceData.length,
        lastUpdated: now
      }
    });
  } catch (error) {
    console.error('Error getting national overview:', error);
    res.status(200).json({
      success: false,
      message: error.message || 'Failed to get national overview',
      data: {}
    });
  }
});

exports.calculateFarmerProfit = asyncHandler(async (req, res) => {
  try {
    const { vegetableId, quantity, pricePerKg } = req.body;

    if (!vegetableId || !quantity || !pricePerKg) {
      return res.status(400).json({
        success: false,
        message: 'vegetableId, quantity, and pricePerKg are required'
      });
    }

    const vegetable = await Vegetable.findById(vegetableId);
    if (!vegetable) {
      return res.status(404).json({
        success: false,
        message: 'Vegetable not found'
      });
    }

    const totalValue = quantity * pricePerKg;
    const brokerCommission = totalValue * 0.10;
    const farmerProfit = totalValue - brokerCommission;

    res.status(200).json({
      success: true,
      calculation: {
        vegetableName: vegetable.name,
        quantity,
        pricePerKg,
        totalValue: Math.round(totalValue * 100) / 100,
        brokerCommission: Math.round(brokerCommission * 100) / 100,
        farmerProfit: Math.round(farmerProfit * 100) / 100,
        commissionRate: '10%'
      }
    });
  } catch (error) {
    console.error('Error calculating profit:', error);
    res.status(200).json({
      success: false,
      message: error.message || 'Failed to calculate profit'
    });
  }
});
