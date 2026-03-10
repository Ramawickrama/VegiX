const mongoose = require('mongoose');
require('dotenv').config();
const Vegetable = require('../models/Vegetable');
const MarketPrice = require('../models/MarketPrice');
const FarmerPost = require('../models/FarmerPost');
const BrokerBuyOrder = require('../models/BrokerBuyOrder');
const BrokerSellOrder = require('../models/BrokerSellOrder');
const Order = require('../models/Order');
const BuyerDemand = require('../models/BuyerDemand');
const FarmerOrder = require('../models/FarmerOrder');

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ Connected');

        // 1. Ensure all Vegetables have vegCode set
        console.log('Refining Vegetable records...');
        const vegetables = await Vegetable.find();
        for (const veg of vegetables) {
            if (!veg.vegCode) {
                veg.vegCode = veg.vegetableId;
                await veg.save();
                console.log(`Updated ${veg.name} with vegCode: ${veg.vegCode}`);
            }
        }

        // Map of codes to ObjectIds for lookup
        const codeToIdMap = {};
        vegetables.forEach(v => {
            codeToIdMap[v.vegCode] = v._id;
            if (v.vegetableId) codeToIdMap[v.vegetableId] = v._id;
        });

        const collectionsToFix = [
            { model: MarketPrice, field: 'vegetable' },
            { model: FarmerPost, field: 'vegetable' },
            { model: BrokerBuyOrder, field: 'vegetable' },
            { model: BrokerSellOrder, field: 'vegetable' },
            { model: Order, field: 'vegetable' },
            { model: BuyerDemand, field: 'vegetable' },
        ];

        for (const { model, field } of collectionsToFix) {
            console.log(`Checking ${model.modelName} for bad references in ${field}...`);
            const docs = await model.find().lean();
            let fixCount = 0;

            for (const doc of docs) {
                const val = doc[field];
                if (typeof val === 'string' && (val.startsWith('VEG') || !mongoose.Types.ObjectId.isValid(val))) {
                    const correctId = codeToIdMap[val];
                    if (correctId) {
                        await model.updateOne({ _id: doc._id }, { [field]: correctId });
                        fixCount++;
                    } else {
                        console.warn(`Could not find vegetable for code: ${val} in ${model.modelName} ${doc._id}`);
                    }
                }
            }
            console.log(`✓ Fixed ${fixCount} records in ${model.modelName}`);
        }

        // Special case for FarmerOrder (nested field)
        console.log('Checking FarmerOrder for bad references...');
        const farmerOrders = await FarmerOrder.find().lean();
        let foFixCount = 0;
        for (const fo of farmerOrders) {
            const val = fo.vegetable?._id;
            if (typeof val === 'string' && (val.startsWith('VEG') || !mongoose.Types.ObjectId.isValid(val))) {
                const correctId = codeToIdMap[val];
                if (correctId) {
                    await FarmerOrder.updateOne({ _id: fo._id }, { 'vegetable._id': correctId });
                    foFixCount++;
                }
            }
        }
        console.log(`✓ Fixed ${foFixCount} records in FarmerOrder`);

        console.log('Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
