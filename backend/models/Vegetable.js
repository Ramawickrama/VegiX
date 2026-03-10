const mongoose = require('mongoose');

// Counter schema for auto-incrementing vegetable IDs
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: Number,
});

const Counter = mongoose.model('Counter', counterSchema);

const vegetableSchema = new mongoose.Schema({
  vegCode: {
    type: String,
    unique: true,
    required: true,
    // Format: VEG001, VEG002, etc.
  },
  // Keep vegetableId for backward compatibility if needed, but aim to migrate to vegCode
  vegetableId: {
    type: String,
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  nameSi: {
    type: String,
    trim: true,
  },
  nameTa: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Leafy', 'Root', 'Fruit', 'Other'],
    default: 'Other',
  },
  description: {
    type: String,
    default: '',
  },
  season: {
    type: String,
    enum: ['summer', 'winter', 'all-season'],
    default: 'all-season',
  },
  currentPrice: {
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
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  defaultUnit: {
    type: String,
    enum: ['kg', 'lb', 'dozen'],
    default: 'kg',
  },
  imageUrl: {
    type: String,
    default: null,
  },
  imageAlt: {
    type: String,
    default: null,
  },
  nutritionInfo: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Middleware to auto-generate vegCode before saving
vegetableSchema.pre('validate', async function (next) {
  if (!this.vegCode) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'vegetableId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.vegCode = `VEG${String(counter.seq).padStart(3, '0')}`;
      this.vegetableId = this.vegCode; // Keep both for now
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Vegetable', vegetableSchema);
