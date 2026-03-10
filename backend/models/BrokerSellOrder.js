const mongoose = require('mongoose');

const brokerSellOrderSchema = new mongoose.Schema({
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
    adminPrice: {
        type: Number,
        required: true
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    profitPerKg: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    brokerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        district: { type: String, default: '' },
        area: { type: String, default: '' },
        village: { type: String, default: '' }
    },
    status: {
        type: String,
        enum: ['open', 'sold', 'cancelled'],
        default: 'open'
    }
}, { timestamps: true });

brokerSellOrderSchema.index({ vegetable: 1, status: 1 });
brokerSellOrderSchema.index({ 'location.district': 1 });
brokerSellOrderSchema.index({ 'location.area': 1 });
brokerSellOrderSchema.index({ 'location.village': 1 });
brokerSellOrderSchema.index({ sellingPrice: 1 });
brokerSellOrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('BrokerSellOrder', brokerSellOrderSchema);
