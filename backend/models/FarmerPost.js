const mongoose = require('mongoose');

const farmerPostSchema = new mongoose.Schema({
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
    quantity: {
        type: Number,
        required: true
    },
    pricePerKg: {
        type: Number,
        required: true
    },
    location: {
        district: { type: String, required: true },
        nearCity: { type: String, required: true },
        village: { type: String, required: true }
    },
    contactNumber: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminPriceSnapshot: {
        type: Number,
        required: false
    },
    totalValue: {
        type: Number,
        default: function() {
            return (this.quantity || 0) * (this.pricePerKg || 0);
        }
    },
    brokerCommission: {
        type: Number,
        default: function() {
            return ((this.quantity || 0) * (this.pricePerKg || 0)) * 0.10;
        }
    },
    farmerProfit: {
        type: Number,
        default: function() {
            const total = (this.quantity || 0) * (this.pricePerKg || 0);
            return total - (total * 0.10);
        }
    },
    commissionRate: {
        type: String,
        default: '10%'
    },
    status: {
        type: String,
        enum: ['active', 'bought', 'sold', 'cancelled'],
        default: 'active'
    },
    deliveryDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

farmerPostSchema.index({ farmerId: 1, createdAt: -1 });
farmerPostSchema.index({ status: 1 });

module.exports = mongoose.model('FarmerPost', farmerPostSchema, 'farmer_posts');
