const mongoose = require('mongoose');

const brokerOrderSchema = new mongoose.Schema({
    brokerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vegetable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vegetable',
        required: true
    },
    vegetableName: {
        type: String,
        required: true
    },
    requiredQuantity: {
        type: Number,
        required: true
    },
    offeredPrice: {
        type: Number,
        required: true
    },
    location: {
        district: { type: String, required: true },
        village: { type: String, required: true }
    },
    contactNumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'fulfilled', 'cancelled'],
        default: 'open'
    },
    adminPriceSnapshot: {
        type: Number,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('BrokerOrder', brokerOrderSchema, 'broker_orders');
