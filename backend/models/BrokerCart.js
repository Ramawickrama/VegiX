const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  sellOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmerPost',
    required: true
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  quantity: {
    type: Number,
    required: true
  },
  pricePerKg: {
    type: Number,
    required: true
  },
  totalValue: {
    type: Number,
    required: true
  },
  location: {
    district: String,
    village: String
  },
  contactNumber: String,
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  brokerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('BrokerCart', cartSchema, 'broker_carts');
