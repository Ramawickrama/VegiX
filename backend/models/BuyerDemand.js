const mongoose = require('mongoose');

const buyerDemandSchema = new mongoose.Schema({
    vegetable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vegetable',
        required: true
    },
    vegetableName: {
        type: String,
        required: true
    },
    vegetableNameSi: {
        type: String,
        default: ''
    },
    vegetableNameTa: {
        type: String,
        default: ''
    },
    adminPriceSnapshot: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    deliveryDate: {
        type: Date,
        required: true
    },
    location: {
        district: { type: String, required: true },
        city: { type: String, required: true },
        area: { type: String, required: true }
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'fulfilled', 'cancelled'],
        default: 'open'
    }
}, { timestamps: true });

module.exports = mongoose.model('BuyerDemand', buyerDemandSchema);
