const BuyerCart = require('../models/BuyerCart');
const BrokerSellOrder = require('../models/BrokerSellOrder');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

exports.addToCart = async (req, res) => {
  try {
    const { brokerSellOrderId } = req.params;
    const buyerId = req.user.userId;

    if (!brokerSellOrderId || !brokerSellOrderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const brokerSellOrder = await BrokerSellOrder.findById(brokerSellOrderId)
      .populate('brokerId', 'name email phone location');

    if (!brokerSellOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (brokerSellOrder.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This order is no longer available' });
    }

    if (brokerSellOrder.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'No quantity available' });
    }

    let cart = await BuyerCart.findOne({ buyerId });

    if (!cart) {
      cart = new BuyerCart({ buyerId, items: [] });
    }

    const existingItem = cart.items.find(
      item => item.brokerSellOrderId.toString() === brokerSellOrderId
    );

    if (existingItem) {
      return res.status(400).json({ success: false, message: 'Item already in cart' });
    }

    cart.items.push({
      brokerSellOrderId: brokerSellOrder._id,
      brokerId: brokerSellOrder.brokerId._id,
      vegetableName: brokerSellOrder.vegetableName,
      vegetableNameSi: brokerSellOrder.vegetableNameSi || '',
      vegetableNameTa: brokerSellOrder.vegetableNameTa || '',
      quantity: brokerSellOrder.quantity,
      pricePerKg: brokerSellOrder.sellingPrice,
      totalValue: brokerSellOrder.sellingPrice * brokerSellOrder.quantity,
      location: brokerSellOrder.location,
      contactNumber: brokerSellOrder.brokerId?.phone
    });

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Added to cart',
      cartCount: cart.items.length
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const buyerId = req.user.userId;

    const cart = await BuyerCart.findOne({ buyerId })
      .populate('items.brokerId', 'name email phone location');

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        items: [],
        cartCount: 0
      });
    }

    const items = cart.items.map(item => ({
      _id: item._id,
      brokerSellOrderId: item.brokerSellOrderId,
      brokerName: item.brokerId?.name || 'Unknown',
      brokerEmail: item.brokerId?.email || '',
      brokerPhone: item.brokerId?.phone || '',
      brokerLocation: item.brokerId?.location || item.location,
      vegetableName: item.vegetableName,
      vegetableNameSi: item.vegetableNameSi || '',
      vegetableNameTa: item.vegetableNameTa || '',
      quantity: item.quantity,
      pricePerKg: item.pricePerKg,
      totalValue: item.totalValue,
      location: item.location,
      contactNumber: item.contactNumber,
      addedAt: item.addedAt
    }));

    res.status(200).json({
      success: true,
      items,
      cartCount: items.length
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCartCount = async (req, res) => {
  try {
    const buyerId = req.user.userId;

    const cart = await BuyerCart.findOne({ buyerId });
    const count = cart ? cart.items.length : 0;

    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { brokerSellOrderId } = req.params;
    const buyerId = req.user.userId;

    if (!brokerSellOrderId || !brokerSellOrderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const cart = await BuyerCart.findOne({ buyerId });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.brokerSellOrderId.toString() === brokerSellOrderId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cartCount: cart.items.length
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.initiatePayment = async (req, res) => {
  try {
    const { brokerSellOrderId } = req.params;
    const buyerId = req.user.userId;

    if (!brokerSellOrderId || !brokerSellOrderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const cart = await BuyerCart.findOne({ buyerId })
      .populate('items.brokerId', 'name email phone location');

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const cartItem = cart.items.find(
      item => item.brokerSellOrderId.toString() === brokerSellOrderId
    );

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    const brokerSellOrder = await BrokerSellOrder.findById(brokerSellOrderId);

    if (!brokerSellOrder || brokerSellOrder.status !== 'open') {
      await BuyerCart.updateOne(
        { buyerId },
        { $pull: { items: { brokerSellOrderId } } }
      );
      return res.status(400).json({ success: false, message: 'This order is no longer available' });
    }

    const buyer = await User.findById(buyerId);

    res.status(200).json({
      success: true,
      paymentData: {
        cartItem: {
          _id: cartItem._id,
          brokerSellOrderId: cartItem.brokerSellOrderId,
          vegetableName: cartItem.vegetableName,
          quantity: cartItem.quantity,
          pricePerKg: cartItem.pricePerKg,
          totalValue: cartItem.totalValue,
          location: cartItem.location,
          contactNumber: cartItem.contactNumber
        },
        broker: {
          _id: cartItem.brokerId?._id,
          name: cartItem.brokerId?.name,
          email: cartItem.brokerId?.email,
          phone: cartItem.brokerId?.phone,
          location: cartItem.brokerId?.location || cartItem.location
        },
        buyer: {
          _id: buyer._id,
          name: buyer.name,
          email: buyer.email,
          phone: buyer.phone
        },
        basePrice: cartItem.pricePerKg,
        availableQuantity: cartItem.quantity
      }
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { brokerSellOrderId } = req.params;
    const { quantityKg } = req.body;
    const buyerId = req.user.userId;

    if (!brokerSellOrderId || !brokerSellOrderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const quantity = parseFloat(quantityKg);
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
    }

    const brokerSellOrder = await BrokerSellOrder.findById(brokerSellOrderId)
      .populate('brokerId', 'name email phone');

    if (!brokerSellOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (brokerSellOrder.status !== 'open') {
      await BuyerCart.updateOne(
        { buyerId },
        { $pull: { items: { brokerSellOrderId } } }
      );
      return res.status(400).json({ success: false, message: 'This order has already been purchased by someone else' });
    }

    if (quantity > brokerSellOrder.quantity) {
      return res.status(400).json({ success: false, message: 'Quantity exceeds available amount' });
    }

    const buyer = await User.findById(buyerId);
    const broker = brokerSellOrder.brokerId;

    const basePricePerKg = brokerSellOrder.sellingPrice;
    const priceWithMarkup = basePricePerKg;
    const total = quantity * priceWithMarkup;

    const transaction = new Transaction({
      transactionId: 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      sellerId: broker._id,
      buyerId: buyer._id,
      sellOrderId: brokerSellOrder._id,
      vegetableName: brokerSellOrder.vegetableName,
      totalQuantityKg: quantity,
      marketPricePerKg: basePricePerKg,
      customPricePerKg: priceWithMarkup,
      subtotalMarket: total,
      totalBeforeDiscount: total,
      finalTotal: total,
      totalPaid: total,
      brokerProfit: 0,
      brokerProfitRate: 0,
      farmerEarnings: 0,
      paymentStatus: 'completed',
      status: 'completed',
      transactionType: 'broker-to-buyer'
    });

    await transaction.save();

    const { getSocketIO, createNotification } = require('../services/notificationService');
    const io = getSocketIO();

    const updatedBroker = await User.findByIdAndUpdate(broker._id, {
      $inc: {
        totalIncome: total,
        walletBalance: total
      }
    }, { new: true });

    // Emit wallet update to broker if online
    if (io) {
      io.to(`broker:${broker._id}`).emit('walletUpdated', {
        walletBalance: updatedBroker.walletBalance,
        addedAmount: total,
        vegetableName: brokerSellOrder.vegetableName
      });
    }

    // Create notification for broker
    await createNotification({
      recipient: broker._id,
      type: 'order-fulfilled',
      title: 'Vegetable Sold! 💰',
      message: `You sold ${quantity}kg of ${brokerSellOrder.vegetableName} for Rs.${total.toFixed(2)}. Funds added to wallet.`,
      relatedOrder: transaction._id,
      orderModel: 'Transaction',
      priority: 'high'
    });

    if (quantity >= brokerSellOrder.quantity) {
      brokerSellOrder.status = 'sold';
      await brokerSellOrder.save();
    } else {
      brokerSellOrder.quantity = brokerSellOrder.quantity - quantity;
      await brokerSellOrder.save();
    }

    await BuyerCart.updateOne(
      { buyerId },
      { $pull: { items: { brokerSellOrderId } } }
    );

    const receiptData = {
      transactionId: transaction.transactionId,
      date: transaction.createdAt,
      buyer: {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone
      },
      seller: {
        name: broker.name,
        email: broker.email,
        phone: broker.phone
      },
      item: {
        vegetableName: brokerSellOrder.vegetableName,
        quantityKg: quantity,
        basePricePerKg: basePricePerKg,
        priceWithMarkup: priceWithMarkup,
        total: total
      }
    };

    res.status(200).json({
      success: true,
      message: 'Payment successful',
      receipt: receiptData
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
