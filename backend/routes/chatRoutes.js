const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');
const socketManager = require('../services/socketManager');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/chat/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

router.post('/conversations/start', authMiddleware, chatController.getOrCreateConversation);

router.get('/conversations', authMiddleware, chatController.getUserConversations);

router.post('/conversations/:id/read', authMiddleware, chatController.markConversationRead);

router.post('/chat/start', authMiddleware, chatController.startChat);

router.post('/messages/send', authMiddleware, chatController.sendMessage);

router.post('/messages/image', authMiddleware, upload.single('image'), chatController.sendImageMessage);

router.get('/messages/:conversationId', authMiddleware, chatController.getMessages);

router.get('/unread', authMiddleware, chatController.getUnreadCount);

router.get('/online-users', authMiddleware, (req, res) => {
    const users = socketManager.getOnlineUsersList();
    res.status(200).json({ success: true, users });
});

router.get('/online-status/:email', authMiddleware, (req, res) => {
    const { email } = req.params;
    const online = socketManager.isUserOnline(email);
    res.status(200).json({ success: true, online, email });
});

// Call signaling routes
router.post('/call/start', authMiddleware, chatController.startCall);
router.post('/call/accept', authMiddleware, chatController.acceptCall);
router.post('/call/reject', authMiddleware, chatController.rejectCall);
router.post('/call/end', authMiddleware, chatController.endCall);

module.exports = router;
