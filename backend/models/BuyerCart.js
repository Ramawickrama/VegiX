const mongoose = require('mongoose');

const buyerCartItemSchema = new mongoose.Schema({
  brokerSellOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrokerSellOrder',
    required: true
  },
  brokerId: {
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

const buyerCartSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [buyerCartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

buyerCartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('BuyerCart', buyerCartSchema, 'buyer_carts');
