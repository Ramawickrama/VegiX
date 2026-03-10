const BrokerCart = require('../models/BrokerCart');
const FarmerPost = require('../models/FarmerPost');
const User = require('../models/User');
const MarketPrice = require('../models/MarketPrice');
const Vegetable = require('../models/Vegetable');

exports.addToCart = async (req, res) => {
  try {
    const { sellOrderId } = req.params;
    const brokerId = req.user.userId;

    if (!sellOrderId || !sellOrderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const sellOrder = await FarmerPost.findById(sellOrderId);
    if (!sellOrder) {
      return res.status(404).json({ success: false, message: 'Sell order not found' });
    }

    if (sellOrder.status !== 'active') {
      return res.status(400).json({ success: false, message: `Cannot add order with status '${sellOrder.status}' to cart` });
    }

    let cart = await BrokerCart.findOne({ brokerId });
    
    if (cart) {
      const existingItem = cart.items.find(item => item.sellOrderId.toString() === sellOrderId);
      if (existingItem) {
        return res.status(400).json({ success: false, message: 'This order is already in your cart' });
      }

      cart.items.push({
        sellOrderId: sellOrder._id,
        farmerId: sellOrder.farmerId,
        vegetableName: sellOrder.vegetableName,
        vegetableNameSi: sellOrder.vegetableNameSi || '',
        vegetableNameTa: sellOrder.vegetableNameTa || '',
        quantity: sellOrder.quantity,
        pricePerKg: sellOrder.pricePerKg,
        totalValue: sellOrder.totalValue,
        location: sellOrder.location,
        contactNumber: sellOrder.contactNumber
      });
    } else {
      cart = new BrokerCart({
        brokerId,
        items: [{
          sellOrderId: sellOrder._id,
          farmerId: sellOrder.farmerId,
          vegetableName: sellOrder.vegetableName,
          vegetableNameSi: sellOrder.vegetableNameSi || '',
          vegetableNameTa: sellOrder.vegetableNameTa || '',
          quantity: sellOrder.quantity,
          pricePerKg: sellOrder.pricePerKg,
          totalValue: sellOrder.totalValue,
          location: sellOrder.location,
          contactNumber: sellOrder.contactNumber
        }]
      });
    }

    await cart.save();

    sellOrder.status = 'bought';
    await sellOrder.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      cart: cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const brokerId = req.user.userId;

    const cart = await BrokerCart.findOne({ brokerId })
      .populate('items.farmerId', 'name email phone location company');

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { items: [] },
        itemCount: 0
      });
    }

    res.status(200).json({
      success: true,
      cart: cart,
      itemCount: cart.items.length
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { sellOrderId } = req.params;
    const brokerId = req.user.userId;

    const cart = await BrokerCart.findOne({ brokerId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.sellOrderId.toString() === sellOrderId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    const sellOrder = await FarmerPost.findById(sellOrderId);
    if (sellOrder && sellOrder.status === 'bought') {
      const otherCarts = await BrokerCart.find({
        'items.sellOrderId': sellOrderId,
        brokerId: { $ne: brokerId }
      });
      
      if (otherCarts.length === 0) {
        sellOrder.status = 'active';
        await sellOrder.save();
      }
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: cart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCartCount = async (req, res) => {
  try {
    const brokerId = req.user.userId;

    const cart = await BrokerCart.findOne({ brokerId });
    const count = cart ? cart.items.length : 0;

    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
