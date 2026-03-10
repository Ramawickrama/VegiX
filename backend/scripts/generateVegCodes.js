/**
 * Migration Script: Generate vegCodes for existing vegetables
 * 
 * Usage: node scripts/generateVegCodes.js
 * 
 * This script assigns VEG001, VEG002, etc. to vegetables 
 * that don't have a vegetableId yet.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGO_URI;

async function generateVegCodes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully!\n');

        // Get Counter model
        const Counter = mongoose.model('Counter', new mongoose.Schema({
            _id: String,
            seq: Number
        }));

        // Get Vegetable model
        const Vegetable = mongoose.model('Vegetable');

        // Find vegetables without vegetableId
        const vegetablesWithoutId = await Vegetable.find({ vegetableId: { $exists: false } });

        console.log(`Found ${vegetablesWithoutId.length} vegetables without vegetableId\n`);

        if (vegetablesWithoutId.length === 0) {
            console.log('✅ All vegetables already have vegetableId!');
            console.log('\nSample vegetables:');
            const sample = await Vegetable.find({}).limit(5);
            sample.forEach(v => {
                console.log(`  ${v.vegetableId} - ${v.name}`);
            });
            process.exit(0);
        }

        // Get current counter or initialize
        let counter = await Counter.findById('vegetableId');
        let startSeq = counter ? counter.seq : 0;

        console.log(`Current counter: ${startSeq}`);
        console.log(`Starting from: VEG${String(startSeq + 1).padStart(3, '0')}\n`);

        // Update each vegetable
        for (const veg of vegetablesWithoutId) {
            startSeq++;
            const vegCode = `VEG${String(startSeq).padStart(3, '0')}`;

            veg.vegetableId = vegCode;
            await veg.save();

            console.log(`  ✅ Assigned ${vegCode} to "${veg.name}"`);
        }

        // Update counter
        await Counter.findByIdAndUpdate(
            { _id: 'vegetableId' },
            { $set: { seq: startSeq } },
            { upsert: true }
        );

        console.log('\n✅ Migration complete!');
        console.log(`\nTotal vegetables processed: ${vegetablesWithoutId.length}`);

        // Show summary
        console.log('\n📊 Summary:');
        const total = await Vegetable.countDocuments();
        const withId = await Vegetable.countDocuments({ vegetableId: { $exists: true, $ne: null } });
        console.log(`  Total vegetables: ${total}`);
        console.log(`  With vegetableId: ${withId}`);
        console.log(`  Without vegetableId: ${total - withId}`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
generateVegCodes();
