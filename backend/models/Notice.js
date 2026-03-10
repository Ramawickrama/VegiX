const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  images: {
    type: [{
      url: String,
      filename: String
    }],
    default: [],
  },
  youtubeUrl: {
    type: String,
    default: '',
  },
  youtubeVideoId: {
    type: String,
    default: '',
  },
  voucher: {
    code: String,
    discount: Number,
    expiryDate: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  visibility: {
    type: [String],
    enum: ['admin', 'farmer', 'broker', 'buyer'],
    default: ['farmer', 'broker', 'buyer'],
  },
  postedDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
