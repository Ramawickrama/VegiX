const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const socketManager = require('../services/socketManager');

// Get or create conversation based on emails (NOT order/post)
exports.getOrCreateConversation = async (req, res) => {
    try {
        const { receiverEmail } = req.body;
        const senderEmail = req.user.email;

        if (!receiverEmail) {
            return res.status(400).json({ success: false, message: 'Receiver email is required' });
        }

        if (!senderEmail) {
            return res.status(400).json({ success: false, message: 'Sender email not found in token' });
        }

        if (senderEmail.toLowerCase() === receiverEmail.toLowerCase()) {
            return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
        }

        // Get receiver user details
        const receiver = await User.findOne({ email: receiverEmail.toLowerCase() });
        if (!receiver) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const chatService = require('../services/chatService');
        const conversation = await chatService.getOrCreateDirectConversation(req.user.userId, receiver._id);

        res.status(200).json({
            success: true,
            conversation: {
                _id: conversation._id,
                participantEmail: receiverEmail.toLowerCase(),
                participantName: receiver.name,
                participantRole: receiver.role,
                lastMessage: conversation.lastMessage,
                lastMessageAt: conversation.lastMessageAt,
                createdAt: conversation.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all unique conversations for current user (grouped by user, not by post)
exports.getUserConversations = async (req, res) => {
    try {
        const userEmail = req.user.email;

        const conversations = await Conversation.find({
            participants: req.user.userId,
            isActive: true
        })
            .populate('participantDetails.userId', 'name role')
            .sort({ lastMessageAt: -1 });

        const conversationIds = conversations.map(c => c._id);

        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    conversationId: { $in: conversationIds },
                    receiverEmail: userEmail.toLowerCase(),
                    readStatus: false
                }
            },
            {
                $group: {
                    _id: '$conversationId',
                    count: { $sum: 1 }
                }
            }
        ]);

        const unreadMap = {};
        unreadCounts.forEach(item => {
            unreadMap[item._id.toString()] = item.count;
        });

        // Transform to show other participant info
        const transformed = conversations.map(conv => {
            const otherParticipant = conv.participantDetails.find(
                p => p.email !== userEmail.toLowerCase()
            );
            return {
                _id: conv._id,
                participantEmail: otherParticipant?.email || '',
                participantName: otherParticipant?.name || 'Unknown',
                participantRole: otherParticipant?.role || 'unknown',
                lastMessage: conv.lastMessage || '',
                lastMessageAt: conv.lastMessageAt,
                lastSenderEmail: conv.lastSenderEmail,
                createdAt: conv.createdAt,
                unreadCount: unreadMap[conv._id.toString()] || 0
            };
        });

        res.status(200).json({ success: true, conversations: transformed });
    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, message, receiverEmail, messageType, location } = req.body;
        const senderEmail = req.user.email;
        const sender = await User.findById(req.user.userId);

        // Validate location messages
        if (messageType === 'location') {
            if (!location || location.lat === undefined || location.lng === undefined) {
                return res.status(400).json({ success: false, message: 'Invalid location coordinates' });
            }
            if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
                return res.status(400).json({ success: false, message: 'Invalid latitude or longitude values' });
            }
        } else {
            if (!message || message.trim() === '') {
                return res.status(400).json({ success: false, message: 'Message cannot be empty' });
            }
        }

        let conversation;

        if (conversationId) {
            // Use existing conversation
            conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }
        } else if (receiverEmail) {
            const receiver = await User.findOne({ email: receiverEmail.toLowerCase() });
            if (!receiver) {
                return res.status(404).json({ success: false, message: 'Receiver user not found' });
            }
            const chatService = require('../services/chatService');
            conversation = await chatService.getOrCreateDirectConversation(req.user.userId, receiver._id);
        } else {
            return res.status(400).json({ success: false, message: 'Conversation ID or receiver email required' });
        }

        // Create message
        const newMessage = new Message({
            conversationId: conversation._id,
            senderEmail: senderEmail.toLowerCase(),
            receiverEmail: receiverEmail ? receiverEmail.toLowerCase() :
                conversation.participantDetails.find(p => p.email !== senderEmail.toLowerCase())?.email,
            senderName: sender?.name || 'Unknown',
            senderRole: sender?.role || 'unknown',
            message: messageType === 'location' ? 'Shared location' : message.trim(),
            messageType: messageType || 'text',
            location: messageType === 'location' ? {
                lat: location.lat,
                lng: location.lng,
                label: location.label || ''
            } : undefined
        });

        await newMessage.save();

        // Update conversation
        const lastMessageText = messageType === 'location' 
            ? '📍 Shared location' 
            : message.substring(0, 50) + (message.length > 50 ? '...' : '');
        await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: lastMessageText,
            lastMessageAt: Date.now(),
            lastSenderEmail: senderEmail.toLowerCase()
        });

        // Emit real-time message to receiver
        const receiverEmailLower = newMessage.receiverEmail;
        const messageData = {
            _id: newMessage._id,
            conversationId: conversation._id.toString(),
            senderEmail: newMessage.senderEmail,
            senderName: newMessage.senderName,
            senderRole: newMessage.senderRole,
            message: newMessage.message,
            messageType: newMessage.messageType,
            location: newMessage.location,
            createdAt: newMessage.createdAt,
            readStatus: false,
            delivered: socketManager.isUserOnline(receiverEmailLower)
        };

        socketManager.emitNewMessage(receiverEmailLower, messageData);
        console.log(`[Chat] Real-time message emitted to ${receiverEmailLower}`);

        res.status(201).json({
            success: true,
            message: newMessage,
            conversationId: conversation._id
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userEmail = req.user.email;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Verify user is part of conversation
        if (!conversation.participants.includes(req.user.userId)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 });

        // Get other participant info
        const otherParticipant = conversation.participantDetails.find(
            p => p.email !== userEmail.toLowerCase()
        );

        // Mark messages as read
        await Message.updateMany(
            {
                conversationId,
                receiverEmail: userEmail.toLowerCase(),
                readStatus: false
            },
            {
                readStatus: true,
                readAt: Date.now()
            }
        );

        res.status(200).json({ 
            success: true, 
            messages,
            conversation: {
                _id: conversation._id,
                participantEmail: otherParticipant?.email || '',
                participantName: otherParticipant?.name || 'Unknown',
                participantRole: otherParticipant?.role || 'unknown'
            }
        });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        const userEmail = req.user.email;

        const conversations = await Conversation.find({
            participants: req.user.userId
        });

        const conversationIds = conversations.map(c => c._id);

        const unreadCount = await Message.countDocuments({
            conversationId: { $in: conversationIds },
            receiverEmail: userEmail.toLowerCase(),
            readStatus: false
        });

        res.status(200).json({ success: true, unreadCount });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Start a new chat with a user by email
exports.startChat = async (req, res) => {
    try {
        const { receiverEmail } = req.body;
        const senderEmail = req.user.email;

        if (!receiverEmail) {
            return res.status(400).json({ success: false, message: 'Receiver email is required' });
        }

        // Find receiver
        const receiver = await User.findOne({ email: receiverEmail.toLowerCase() });
        if (!receiver) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const chatService = require('../services/chatService');
        let conversation = await chatService.getOrCreateDirectConversation(req.user.userId, receiver._id);

        // Get the other participant's info for the response
        const otherParticipant = conversation.participantDetails.find(
            p => p.email !== senderEmail.toLowerCase()
        );

        res.status(200).json({
            success: true,
            conversation: {
                _id: conversation._id,
                participantEmail: otherParticipant?.email,
                participantName: otherParticipant?.name,
                participantRole: otherParticipant?.role
            }
        });
    } catch (error) {
        console.error('Error starting chat:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark conversation as read
exports.markConversationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user.email;

        const result = await Message.updateMany(
            {
                conversationId: id,
                receiverEmail: userEmail.toLowerCase(),
                readStatus: false
            },
            {
                readStatus: true,
                readAt: Date.now()
            }
        );

        res.status(200).json({ 
            success: true, 
            markedCount: result.modifiedCount 
        });
    } catch (error) {
        console.error('Error marking conversation as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send image message
exports.sendImageMessage = async (req, res) => {
    try {
        const { conversationId } = req.body;
        const senderEmail = req.user.email;
        const sender = await User.findById(req.user.userId);

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Conversation ID required' });
        }

        const receiverParticipant = conversation.participantDetails.find(
            p => p.email !== senderEmail.toLowerCase()
        );

        const newMessage = new Message({
            conversationId: conversation._id,
            senderEmail: senderEmail.toLowerCase(),
            receiverEmail: receiverParticipant?.email,
            senderName: sender?.name || 'Unknown',
            senderRole: sender?.role || 'unknown',
            message: req.file.filename,
            messageType: 'image',
            imageUrl: `/uploads/chat/${req.file.filename}`
        });

        await newMessage.save();

        await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: '📷 Shared an image',
            lastMessageAt: Date.now(),
            lastSenderEmail: senderEmail.toLowerCase()
        });

        const messageData = {
            _id: newMessage._id,
            conversationId: conversation._id.toString(),
            senderEmail: newMessage.senderEmail,
            senderName: newMessage.senderName,
            senderRole: newMessage.senderRole,
            message: newMessage.message,
            messageType: newMessage.messageType,
            imageUrl: newMessage.imageUrl,
            createdAt: newMessage.createdAt,
            readStatus: false
        };

        socketManager.emitNewMessage(receiverParticipant?.email, messageData);

        res.status(201).json({
            success: true,
            message: newMessage
        });
    } catch (error) {
        console.error('Error sending image message:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Call signaling - start call
exports.startCall = async (req, res) => {
    try {
        const { conversationId, receiverEmail } = req.body;
        const senderEmail = req.user.email;
        const sender = await User.findById(req.user.userId);

        const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const callData = {
            callId,
            callerEmail: senderEmail.toLowerCase(),
            callerName: sender?.name || 'Unknown',
            conversationId,
            timestamp: Date.now()
        };

        socketManager.emitCallRequest(receiverEmail.toLowerCase(), callData);

        res.status(200).json({ success: true, callData });
    } catch (error) {
        console.error('Error starting call:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Call signaling - accept call
exports.acceptCall = async (req, res) => {
    try {
        const { conversationId, callerEmail } = req.body;
        const acceptorEmail = req.user.email;

        socketManager.emitCallAccepted(callerEmail, {
            conversationId,
            acceptorEmail
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error accepting call:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Call signaling - reject call
exports.rejectCall = async (req, res) => {
    try {
        const { conversationId, callerEmail } = req.body;
        const rejectorEmail = req.user.email;

        socketManager.emitCallRejected(callerEmail, {
            conversationId,
            rejectorEmail
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error rejecting call:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Call signaling - end call
exports.endCall = async (req, res) => {
    try {
        const { conversationId, receiverEmail, callerEmail, callId } = req.body;
        const senderEmail = req.user.email;

        const endData = {
            callId: callId || `call-${Date.now()}`,
            conversationId,
            endedBy: senderEmail.toLowerCase()
        };

        socketManager.emitCallEnded(receiverEmail, endData);
        socketManager.emitCallEnded(callerEmail, endData);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error ending call:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
