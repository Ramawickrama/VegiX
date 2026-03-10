const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
  vegetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vegetable',
    required: true,
  },
  vegetableName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  predictedPrice: {
    type: Number,
    default: 0,
  },
  predictedDemand: {
    type: Number,
    default: 0,
  },
  confidenceLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  priceTrend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable',
  },
  demandTrend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable',
  },
  supplyTrend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

forecastSchema.index({ vegetableId: 1, date: 1 }, { unique: true });

const Forecast = mongoose.model('Forecast', forecastSchema);

module.exports = Forecast;
