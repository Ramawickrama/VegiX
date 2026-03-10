const mongoose = require('mongoose');

const brokerSellingOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  vegetable: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vegetable',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
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
  basePricePerUnit: {
    type: Number,
    required: true,
  },
  brokerCommissionPerKg: {
    type: Number,
    required: true,
    default: 0.1, // 10% = 0.1
  },
  finalPricePerUnit: {
    type: Number,
    required: true,
  },
  totalBasePrice: {
    type: Number,
    required: true,
  },
  totalCommission: {
    type: Number,
    required: true,
  },
  totalFinalPrice: {
    type: Number,
    required: true,
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  interestedBuyers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  publishedDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('BrokerSellingOrder', brokerSellingOrderSchema);
