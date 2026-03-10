const mongoose = require('mongoose');
const User = require('../models/User');
const { generateUserId } = require('../utils/idGenerator');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const assignIds = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({
            $or: [
                { userId: { $exists: false } },
                { userId: null },
                { userId: '' }
            ]
        }).sort({ registrationDate: 1, createdAt: 1 });

        console.log(`Found ${users.length} users without a custom ID.`);

        for (const user of users) {
            if (user.role === 'admin') {
                console.log(`Skipping admin user: ${user.email}`);
                continue;
            }

            const userId = await generateUserId(user.role);
            if (userId) {
                user.userId = userId;
                await user.save();
                console.log(`Assigned ${userId} to user ${user.email} (${user.role})`);
            }
        }

        console.log('Finished assigning IDs.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

assignIds();
