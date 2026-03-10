const mongoose = require('mongoose');

const demandSchema = new mongoose.Schema({
  vegetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vegetable',
    required: true,
  },
  demandQuantity: {
    type: Number,
    required: true,
  },
  supplyQuantity: {
    type: Number,
    required: true,
  },
  demandOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  }],
  supplyOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  }],
  forecastedDemand: {
    type: Number,
    default: 0,
  },
  demandTrend: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable'],
    default: 'stable',
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },
  location: {
    type: String,
    default: 'Sri Lanka',
  },
  analysisDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Demand', demandSchema);
