const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    participantDetails: [{
        email: { type: String, lowercase: true },
        name: String,
        role: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    lastSenderEmail: String,
    isActive: {
        type: Boolean,
        default: true
    },
    type: {
        type: String,
        enum: ['direct', 'group'],
        default: 'direct'
    },
    directKey: {
        type: String,
        sparse: true
    }
}, { timestamps: true });

// Ensure unique index for direct conversations
conversationSchema.index({ type: 1, directKey: 1 }, { unique: true, sparse: true });

// Index for faster queries
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
