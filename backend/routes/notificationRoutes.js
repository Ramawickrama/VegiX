const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../services/notificationService');

// Get all notifications for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    const result = await getUserNotifications(req.user.userId, parseInt(limit), parseInt(skip));

    res.status(200).json({
      ...result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark single notification as read
router.patch('/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await markAllAsRead(req.user.userId);

    res.status(200).json({
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete notification
router.delete('/:notificationId', authMiddleware, async (req, res) => {
  try {
    await deleteNotification(req.params.notificationId);

    res.status(200).json({
      message: 'Notification deleted',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
