const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
  vegetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vegetable',
    required: true,
  },
  // Ensure we store the string ID for unique indexing and easier cross-referencing
  vegetableId: {
    type: String,
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

// INDEX STRATEGY: Latest price per vegetable
// Using a partial filter expression to safely ignore nulls if any sneak in 
// (though 'required: true' above prevents new ones).
marketPriceSchema.index(
  { vegetableId: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { vegetableId: { $exists: true, $ne: null } } 
  }
);

// Performance indexes for queries
marketPriceSchema.index({ vegetable: 1, createdAt: -1 });
marketPriceSchema.index({ vegetable: 1, date: -1 });
marketPriceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
