require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected.');

        console.log('Syncing Conversation indexes...');
        // syncIndexes will drop all indexes not defined in the schema and build the ones that are
        await Conversation.syncIndexes();
        console.log('Successfully synchronized Conversation indexes. Old stray indexes have been dropped.');

        process.exit(0);
    } catch (err) {
        console.error('Error synchronizing indexes:', err);
        process.exit(1);
    }
}

run();
