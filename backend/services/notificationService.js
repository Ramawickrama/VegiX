const Notification = require('../models/Notification');
const { sendNotificationToUser: socketSendNotification, getOnlineUsers } = require('./socketService');

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

const getSocketIO = () => ioInstance;

const createNotification = async (options) => {
  try {
    const notification = new Notification({
      recipient: options.recipient,
      type: options.type,
      title: options.title,
      message: options.message,
      relatedOrder: options.relatedOrder || null,
      orderModel: options.orderModel || null,
      relatedUser: options.relatedUser || null,
      priority: options.priority || 'medium',
    });

    await notification.save();

    if (ioInstance && options.recipient) {
      const notificationData = {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        createdAt: notification.createdAt,
        relatedOrder: options.relatedOrder,
      };

      socketSendNotification(options.recipient.toString(), notificationData);
    }

    console.log(`✓ Notification created for user ${options.recipient}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

const notifyOrderAccepted = async (recipientId, orderData) => {
  return createNotification({
    recipient: recipientId,
    type: 'order-accepted',
    title: 'Order Accepted! 🎉',
    message: `Your ${orderData.vegetableName} order has been accepted.`,
    relatedOrder: orderData.orderId,
    orderModel: orderData.orderModel,
    priority: 'high',
  });
};

const notifyOrderRejected = async (recipientId, orderData) => {
  return createNotification({
    recipient: recipientId,
    type: 'order-rejected',
    title: 'Order Rejected',
    message: `Your ${orderData.vegetableName} order has been rejected.`,
    relatedOrder: orderData.orderId,
    orderModel: orderData.orderModel,
    priority: 'medium',
  });
};

const notifyBrokerRequest = async (farmerId, brokerData) => {
  return createNotification({
    recipient: farmerId,
    type: 'broker-interested',
    title: 'New Broker Interest! 📢',
    message: `${brokerData.brokerName} is interested in your ${brokerData.vegetableName} produce.`,
    relatedOrder: brokerData.orderId,
    orderModel: brokerData.orderModel,
    relatedUser: brokerData.brokerId,
    priority: 'high',
  });
};

const notifyBuyerDemand = async (recipientId, demandData) => {
  return createNotification({
    recipient: recipientId,
    type: 'buyer-demand',
    title: 'New Buyer Demand 📥',
    message: `A buyer is looking for ${demandData.quantity}kg of ${demandData.vegetableName}.`,
    relatedOrder: demandData.demandId,
    orderModel: 'BuyerDemand',
    priority: 'medium',
  });
};

const notifyAdminNotice = async (recipientId, noticeData) => {
  return createNotification({
    recipient: recipientId,
    type: 'admin-notice',
    title: noticeData.title,
    message: noticeData.content,
    priority: noticeData.priority || 'medium',
  });
};

const notifyChatMessage = async (recipientId, messageData) => {
  return createNotification({
    recipient: recipientId,
    type: 'chat-message',
    title: `New message from ${messageData.senderName}`,
    message: messageData.message.substring(0, 50) + (messageData.message.length > 50 ? '...' : ''),
    priority: 'low',
  });
};

const notifyPriceAlert = async (recipientId, priceData) => {
  return createNotification({
    recipient: recipientId,
    type: 'price-alert',
    title: `Price Alert: ${priceData.vegetableName}`,
    message: `Price changed to Rs.${priceData.newPrice}/kg (${priceData.change > 0 ? '+' : ''}${priceData.change.toFixed(1)}%)`,
    priority: 'medium',
  });
};

const getUserNotifications = async (userId, limit = 10, skip = 0) => {
  try {
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('recipient', 'name email')
      .populate('relatedOrder');

    const total = await Notification.countDocuments({ recipient: userId });
    const unread = await Notification.countDocuments({ recipient: userId, isRead: false });

    return {
      total,
      notifications,
      unread,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    throw error;
  }
};

const markAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error.message);
    throw error;
  }
};

const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      }
    );
    console.log(`✓ All notifications marked as read for user ${userId}`);
  } catch (error) {
    console.error('Error marking all as read:', error.message);
    throw error;
  }
};

const deleteNotification = async (notificationId) => {
  try {
    await Notification.findByIdAndDelete(notificationId);
    console.log(`✓ Notification ${notificationId} deleted`);
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    throw error;
  }
};

module.exports = {
  setSocketIO,
  getSocketIO,
  createNotification,
  notifyOrderAccepted,
  notifyOrderRejected,
  notifyBrokerRequest,
  notifyBuyerDemand,
  notifyAdminNotice,
  notifyChatMessage,
  notifyPriceAlert,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
