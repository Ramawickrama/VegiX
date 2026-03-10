const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'order-published',
      'order-accepted',
      'order-rejected',
      'order-completed',
      'broker-interested',
      'order-cancelled',
      'buyer-demand',
      'admin-notice',
      'chat-message',
      'price-alert',
      'demand-forecast'
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'orderModel',
    default: null,
  },
  orderModel: {
    type: String,
    enum: ['FarmerOrder', 'BrokerBuyingOrder', 'BrokerSellingOrder', 'BuyerOrder', 'FarmerPost', 'BrokerOrder'],
    default: null,
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
