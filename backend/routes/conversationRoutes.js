const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const conversationController = require('../controllers/conversationController');

router.post('/start', authMiddleware, conversationController.startConversation);
router.get('/:userId', authMiddleware, conversationController.getUserConversations);
router.get('/messages/:conversationId', authMiddleware, conversationController.getMessages);
router.post('/message', authMiddleware, conversationController.sendMessage);

module.exports = router;
