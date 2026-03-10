const BrokerCart = require('../models/BrokerCart');
const FarmerPost = require('../models/FarmerPost');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const MarketPrice = require('../models/MarketPrice');
const Vegetable = require('../models/Vegetable');

exports.initiatePayment = async (req, res) => {
  try {
    const { sellOrderId } = req.params;
    const brokerId = req.user.userId;

    const cart = await BrokerCart.findOne({ brokerId })
      .populate('items.farmerId', 'name email phone');

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const cartItem = cart.items.find(item => item.sellOrderId.toString() === sellOrderId);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    const sellOrder = await FarmerPost.findById(sellOrderId);
    if (!sellOrder) {
      return res.status(404).json({ success: false, message: 'Sell order no longer exists' });
    }

    if (sellOrder.status !== 'bought') {
      return res.status(400).json({ success: false, message: 'This order is no longer available for purchase' });
    }

    const farmer = await User.findById(cartItem.farmerId);
    const broker = await User.findById(brokerId);

    const vegetable = await Vegetable.findOne({ name: cartItem.vegetableName });
    let marketPrice = 0;

    if (vegetable) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const priceDoc = await MarketPrice.findOne({
        vegetable: vegetable._id,
        createdAt: { $gte: today }
      });

      marketPrice = priceDoc ? priceDoc.pricePerKg : (vegetable.currentPrice || 0);
    }

    res.status(200).json({
      success: true,
      paymentData: {
        cartItem: {
          _id: cartItem._id,
          sellOrderId: cartItem.sellOrderId,
          vegetableName: cartItem.vegetableName,
          vegetableNameSi: cartItem.vegetableNameSi || '',
          vegetableNameTa: cartItem.vegetableNameTa || '',
          quantity: cartItem.quantity,
          pricePerKg: cartItem.pricePerKg,
          totalValue: cartItem.totalValue,
          location: cartItem.location,
          contactNumber: cartItem.contactNumber
        },
        farmer: {
          _id: farmer._id,
          name: farmer.name,
          email: farmer.email,
          phone: farmer.phone,
          location: farmer.location
        },
        broker: {
          _id: broker._id,
          name: broker.name,
          email: broker.email,
          phone: broker.phone
        },
        marketPrice: marketPrice,
        availableQuantity: sellOrder.quantity
      }
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const {
      sellOrderId,
      quantityMarketKg = 0,
      quantityCustomKg = 0,
      customPricePerKg = 0,
      buyFromFarmersPlace = false
    } = req.body;

    const brokerId = req.user.userId;

    if (!sellOrderId) {
      return res.status(400).json({ success: false, message: 'Sell order ID is required' });
    }

    const sellOrder = await FarmerPost.findById(sellOrderId);
    if (!sellOrder) {
      return res.status(404).json({ success: false, message: 'Sell order not found' });
    }

    if (sellOrder.status !== 'bought') {
      return res.status(400).json({ success: false, message: 'This order is no longer available for purchase' });
    }

    const farmer = await User.findById(sellOrder.farmerId);
    const broker = await User.findById(brokerId);

    const totalQuantity = (parseFloat(quantityMarketKg) || 0) + (parseFloat(quantityCustomKg) || 0);
    if (totalQuantity > sellOrder.quantity) {
      return res.status(400).json({ success: false, message: 'Total quantity exceeds available quantity' });
    }

    if (totalQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Total quantity must be greater than 0' });
    }

    const vegetable = await Vegetable.findOne({ name: sellOrder.vegetableName });
    let marketPrice = 0;

    if (vegetable) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const priceDoc = await MarketPrice.findOne({
        vegetable: vegetable._id,
        createdAt: { $gte: today }
      });

      marketPrice = priceDoc ? priceDoc.pricePerKg : (vegetable.currentPrice || 0);
    }

    const quantityMarket = parseFloat(quantityMarketKg) || 0;
    const quantityCustom = parseFloat(quantityCustomKg) || 0;
    const customPrice = parseFloat(customPricePerKg) || 0;

    const subtotalMarket = quantityMarket * marketPrice;
    const subtotalCustom = quantityCustom * customPrice;
    const totalBeforeDiscount = subtotalMarket + subtotalCustom;

    const discountRate = buyFromFarmersPlace ? 0.02 : 0;
    const discountAmount = totalBeforeDiscount * discountRate;
    const totalAfterDiscount = totalBeforeDiscount - discountAmount;

    // Farmer receives the FULL amount (no deduction for broker profit)
    const farmerEarnings = totalAfterDiscount;

    // Broker profit is recorded but comes from broker's selling to buyers, not from farmer
    const brokerProfitRate = 0.10;
    const brokerEstimatedProfit = 0; // Broker earns from selling to buyers, not from farmer

    // Wallet audit: capture balance before deduction; negative wallet is allowed
    const previousWalletBalance = broker.walletBalance || 0;
    const walletBalanceAfter = previousWalletBalance - totalAfterDiscount;
    const creditUsed = Math.max(0, totalAfterDiscount - previousWalletBalance);

    const transaction = new Transaction({
      transactionId: 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      sellerId: farmer._id,
      buyerId: broker._id,
      sellOrderId: sellOrder._id,
      vegetableName: sellOrder.vegetableName,
      vegetableNameSi: sellOrder.vegetableNameSi || '',
      vegetableNameTa: sellOrder.vegetableNameTa || '',
      quantityMarketKg: quantityMarket,
      quantityCustomKg: quantityCustom,
      totalQuantityKg: totalQuantity,
      marketPricePerKg: marketPrice,
      customPricePerKg: customPrice,
      subtotalMarket: subtotalMarket,
      subtotalCustom: subtotalCustom,
      totalBeforeDiscount: totalBeforeDiscount,
      discountApplied: buyFromFarmersPlace,
      discountRate: discountRate,
      discountAmount: discountAmount,
      finalTotal: farmerEarnings,
      brokerProfit: brokerEstimatedProfit,
      brokerProfitRate: brokerProfitRate,
      farmerEarnings: farmerEarnings,
      totalPaid: totalAfterDiscount,
      buyFromFarmersPlace: buyFromFarmersPlace,
      previousWalletBalance,
      walletBalanceAfter,
      creditUsed
    });

    await transaction.save();

    // Deduct from broker's wallet
    await User.findByIdAndUpdate(broker._id, {
      $inc: {
        walletBalance: -totalAfterDiscount
      }
    });

    // Add farmer's FULL earnings to farmer's totalIncome
    await User.findByIdAndUpdate(farmer._id, {
      $inc: {
        totalIncome: farmerEarnings,
        completedOrders: 1
      }
    });

    await FarmerPost.findByIdAndDelete(sellOrder._id);

    const cart = await BrokerCart.findOne({ brokerId });
    if (cart) {
      cart.items = cart.items.filter(item => item.sellOrderId.toString() !== sellOrderId);
      await cart.save();
    }

    const receiptData = {
      transactionId: transaction.transactionId,
      date: transaction.createdAt,
      buyer: {
        name: broker.name,
        email: broker.email,
        phone: broker.phone
      },
      seller: {
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone
      },
      item: {
        vegetableName: sellOrder.vegetableName,
        quantityMarketKg: quantityMarket,
        quantityCustomKg: quantityCustom,
        totalQuantityKg: totalQuantity,
        marketPricePerKg: marketPrice,
        customPricePerKg: customPrice,
        subtotalMarket: subtotalMarket,
        subtotalCustom: subtotalCustom,
        totalBeforeDiscount: totalBeforeDiscount,
        discountApplied: buyFromFarmersPlace,
        discountRate: discountRate,
        discountAmount: discountAmount,
        brokerProfit: brokerEstimatedProfit,
        brokerProfitRate: brokerProfitRate,
        farmerEarnings: farmerEarnings,
        totalPaid: totalAfterDiscount
      }
    };

    res.status(200).json({
      success: true,
      message: 'Payment successful',
      transactionId: transaction.transactionId,
      receipt: receiptData
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
