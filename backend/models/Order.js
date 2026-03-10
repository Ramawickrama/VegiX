const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  vegetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vegetable',
    required: true,
  },
  vegetableName: {
    type: String,
    required: true,
  },
  adminPriceSnapshot: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    enum: ['kg', 'lb', 'dozen'],
    default: 'kg',
  },
  pricePerUnit: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  orderType: {
    type: String,
    enum: ['farmer-sell', 'broker-buy', 'broker-sell', 'buyer-order'],
    required: true,
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // ✅ Added for broker-farmer transactions
  brokerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  relatedPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmerOrder',
  },
  status: {
    type: String,
    enum: ['active', 'in-progress', 'completed', 'cancelled'],
    default: 'active',
  },
  location: {
    type: String,
    default: '',
  },
  deliveryDate: {
    type: Date,
    default: null,
  },
  quality: {
    type: String,
    enum: ['premium', 'standard', 'economy'],
    default: 'standard',
  },
  description: {
    type: String,
    default: '',
  },
  visibleTo: {
    type: [String],
    enum: ['admin', 'farmer', 'broker', 'buyer'],
    default: [],
  },
  interestedBrokers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  publishedDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

orderSchema.index({ vegetable: 1, createdAt: -1 });
orderSchema.index({ publishedBy: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderType: 1, status: 1 });
orderSchema.index({ vegetable: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
