const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type } = req.query;

    const query = {
      $or: [
        { sellerId: userId },
        { buyerId: userId }
      ]
    };

    if (type === 'sold') {
      query.sellerId = userId;
    } else if (type === 'bought') {
      query.buyerId = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .populate('sellerId', 'userId name email phone location')
      .populate('buyerId', 'userId name email phone location')
      .populate('sellOrderId', 'vegetableName quantity')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Transaction.countDocuments(query);

    const formattedTransactions = transactions.map(t => ({
      _id: t._id,
      transactionId: t.transactionId,
      type: t.sellerId._id?.toString() === userId ? 'sold' : 'bought',
      vegetableName: t.vegetableName,
      quantityKg: t.totalQuantityKg,
      pricePerKg: t.marketPricePerKg,
      totalAmount: t.totalBeforeDiscount,
      discount: t.discountAmount,
      finalAmount: t.finalTotal,
      farmerEarnings: t.farmerEarnings,
      totalPaid: t.totalPaid,
      brokerProfit: t.brokerProfit,
      status: t.status,
      paymentStatus: t.paymentStatus,
      createdAt: t.createdAt,
      otherParty: t.sellerId._id?.toString() === userId
        ? {
          _id: t.buyerId?._id,
          userId: t.buyerId?.userId,
          name: t.buyerId?.name,
          role: 'broker'
        }
        : {
          _id: t.sellerId?._id,
          userId: t.sellerId?.userId,
          name: t.sellerId?.name,
          role: 'farmer'
        }
    }));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const soldTransactions = await Transaction.find({ sellerId: userId }).lean();
    const boughtTransactions = await Transaction.find({ buyerId: userId }).lean();

    const totalSold = soldTransactions.reduce((sum, t) => sum + (t.farmerEarnings || 0), 0);
    const totalBought = boughtTransactions.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
    const totalSoldCount = soldTransactions.length;
    const totalBoughtCount = boughtTransactions.length;

    res.status(200).json({
      success: true,
      summary: {
        totalSold,
        totalBought,
        totalSoldCount,
        totalBoughtCount,
        netEarnings: totalSold - totalBought
      }
    });
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
