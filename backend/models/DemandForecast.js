const mongoose = require('mongoose');

const demandForecastSchema = new mongoose.Schema({
  vegetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vegetable',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  predictedDemand: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

demandForecastSchema.index({ vegetableId: 1, date: 1 }, { unique: true });

const DemandForecast = mongoose.model('DemandForecast', demandForecastSchema);

module.exports = DemandForecast;
