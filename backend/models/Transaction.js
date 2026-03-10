const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmerPost',
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
  quantityMarketKg: {
    type: Number,
    default: 0
  },
  quantityCustomKg: {
    type: Number,
    default: 0
  },
  totalQuantityKg: {
    type: Number,
    required: true
  },
  marketPricePerKg: {
    type: Number,
    default: 0
  },
  customPricePerKg: {
    type: Number,
    default: 0
  },
  subtotalMarket: {
    type: Number,
    default: 0
  },
  subtotalCustom: {
    type: Number,
    default: 0
  },
  totalBeforeDiscount: {
    type: Number,
    required: true
  },
  discountApplied: {
    type: Boolean,
    default: false
  },
  discountRate: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalTotal: {
    type: Number,
    required: true
  },
  brokerProfit: {
    type: Number,
    default: 0
  },
  brokerProfitRate: {
    type: Number,
    default: 0.10
  },
  farmerEarnings: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  buyFromFarmersPlace: {
    type: Boolean,
    default: false
  },
  // Wallet audit fields (negative wallet is allowed)
  previousWalletBalance: {
    type: Number,
    default: null
  },
  walletBalanceAfter: {
    type: Number,
    default: null
  },
  creditUsed: {
    type: Number,
    default: 0  // amount by which wallet went below zero (i.e. max(0, total - previousBalance))
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'completed'
  },
  transactionType: {
    type: String,
    enum: ['broker-to-buyer', 'broker-to-farmer'],
    default: 'broker-to-buyer'
  }
}, { timestamps: true });

transactionSchema.pre('save', function (next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema, 'transactions');
