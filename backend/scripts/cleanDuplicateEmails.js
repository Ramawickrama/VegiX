/**
 * VegiX — One-time duplicate-email cleanup script.
 *
 * Scans the users collection for duplicate emails.
 * Keeps the OLDEST account (smallest _id) and removes the rest.
 *
 * Usage:  node scripts/cleanDuplicateEmails.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const cleanDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ Connected to MongoDB\n');

        // Aggregate to find emails that appear more than once
        const duplicates = await User.aggregate([
            { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 } } },
        ]);

        if (duplicates.length === 0) {
            console.log('✓ No duplicate emails found — database is clean.');
        } else {
            console.log(`⚠  Found ${duplicates.length} duplicate email(s):\n`);

            let totalRemoved = 0;

            for (const dup of duplicates) {
                // Sort IDs ascending — keep the first (oldest)
                const sortedIds = dup.ids.sort((a, b) => a.toString().localeCompare(b.toString()));
                const keepId = sortedIds[0];
                const removeIds = sortedIds.slice(1);

                console.log(`  Email: ${dup._id}`);
                console.log(`    Keeping : ${keepId}`);
                console.log(`    Removing: ${removeIds.join(', ')}`);

                const result = await User.deleteMany({ _id: { $in: removeIds } });
                totalRemoved += result.deletedCount;
            }

            console.log(`\n✓ Removed ${totalRemoved} duplicate user(s).`);
        }

        // Rebuild unique index to make sure it's enforced
        try {
            await User.collection.dropIndex('email_1');
        } catch (_) { /* index may not exist yet */ }
        await User.collection.createIndex({ email: 1 }, { unique: true });
        console.log('✓ Unique index on email ensured.');

    } catch (error) {
        console.error('✗ Cleanup failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('✓ MongoDB connection closed');
        process.exit(0);
    }
};

cleanDuplicates();
