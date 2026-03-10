const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    senderEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    receiverEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    senderName: String,
    senderRole: String,
    message: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'location', 'image'],
        default: 'text'
    },
    location: {
        lat: {
            type: Number,
            min: -90,
            max: 90
        },
        lng: {
            type: Number,
            min: -180,
            max: 180
        },
        label: String
    },
    imageUrl: String,
    readStatus: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Index for faster queries
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderEmail: 1, receiverEmail: 1 });

module.exports = mongoose.model('Message', messageSchema);
