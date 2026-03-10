const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.startConversation = async (req, res) => {
    try {
        const { participantId, orderId, orderModel, initialMessage } = req.body;

        if (!participantId) return res.status(400).json({ message: 'Participant ID is required' });

        // Check if conversation already exists for this order between these participants
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.userId, participantId] },
            orderId: orderId
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [req.user.userId, participantId],
                orderId,
                orderModel,
                lastMessage: initialMessage || 'Conversation started'
            });
            await conversation.save();
        }

        if (initialMessage) {
            const message = new Message({
                conversationId: conversation._id,
                sender: req.user.userId,
                content: initialMessage
            });
            await message.save();

            conversation.lastMessage = initialMessage;
            await conversation.save();
        }

        res.status(201).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.userId
        }).populate('participants', 'name role').sort({ updatedAt: -1 });

        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body;

        const message = new Message({
            conversationId,
            sender: req.user.userId,
            content
        });

        await message.save();

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: content
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
