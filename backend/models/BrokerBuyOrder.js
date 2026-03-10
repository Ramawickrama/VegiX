const mongoose = require('mongoose');

const brokerBuyOrderSchema = new mongoose.Schema({
  vegetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vegetable',
    required: true
  },
  vegetableName: {
    type: String,
    required: true
  },
  vegetableNameSi: {
    type: String,
    default: ''
  },
  vegetableNameTa: {
    type: String,
    default: ''
  },
  adminPrice: {
    type: Number,
    required: true
  },
  quantityRequired: {
    type: Number,
    required: true
  },
  collectionLocation: {
    type: String,
    required: true
  },
  brokerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'fulfilled', 'cancelled', 'ended'],
    default: 'open'
  }
}, { timestamps: true });

module.exports = mongoose.model('BrokerBuyOrder', brokerBuyOrderSchema);
