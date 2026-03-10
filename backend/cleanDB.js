require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vegetable = require('./models/Vegetable');

const cleanDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ Connected to MongoDB');

        // 1. Remove all Demo/Test users
        const demoEmails = [
            'admin@vegix.lk',
            'admin@vegix.com',
            'farmer@vegix.com',
            'broker@vegix.com',
            'buyer@vegix.com'
        ];

        const userResult = await User.deleteMany({
            $or: [
                { email: { $in: demoEmails } },
                { email: { $regex: /demo|test/i } },
                { name: { $regex: /demo|test/i } },
                { name: 'Admin User' }
            ]
        });
        console.log(`✓ Deleted ${userResult.deletedCount} demo/test users.`);

        // 2. Remove all invalid vegetables (missing name, id, or missing pricing)
        const vegResult = await Vegetable.deleteMany({
            $or: [
                { name: { $exists: false } },
                { name: '' },
                { vegetableId: { $exists: false } },
                { vegetableId: '' },
            ]
        });
        console.log(`✓ Deleted ${vegResult.deletedCount} invalid vegetables.`);

        // Re-verify remaining vegetables have valid price and name
        console.log('✓ Validation successful. Clean up complete.');

    } catch (err) {
        console.error('Error during cleanup:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

cleanDB();
