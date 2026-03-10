const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
  vegetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vegetable',
    required: true,
  },
  vegetableName: {
    type: String,
    required: true,
  },
  pricePerKg: {
    type: Number,
    required: true,
  },
  previousPrice: {
    type: Number,
    default: 0,
  },
  minPrice: {
    type: Number,
    default: 0,
  },
  maxPrice: {
    type: Number,
    default: 0,
  },
  priceChange: {
    type: Number,
    default: 0,
  },
  priceChangePercentage: {
    type: Number,
    default: 0,
  },
  location: {
    type: String,
    default: 'Sri Lanka',
  },
  unit: {
    type: String,
    enum: ['kg', 'lb', 'dozen'],
    default: 'kg',
  },
  updatedBy: {
    type: String,
    default: 'admin',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  historicalData: [{
    price: Number,
    date: {
      type: Date,
      default: Date.now,
    },
  }],
}, { timestamps: true });

marketPriceSchema.index({ vegetable: 1, createdAt: -1 });
marketPriceSchema.index({ vegetable: 1, date: -1 });
marketPriceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
