require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // Drop existing indexes on Conversation to clear out any old unique indexes.
        const indexes = await Conversation.collection.getIndexes();
        console.log("Existing indexes:", Object.keys(indexes));
        await Conversation.collection.dropIndexes();
        console.log("Dropped indexes.");

        // Re-create indexes from the schema, ensuring {type:1, directKey:1} is the unique one.
        await Conversation.syncIndexes();
        console.log("Indexes re-synced from schema.");

        const convos = await Conversation.find({});
        console.log(`Checking ${convos.length} conversations for migration.`);

        let migrated = 0;
        let deleted = 0;

        for (let c of convos) {
            // Check if participants array contains Strings instead of ObjectIds
            // Even if Mongoose tries to cast, the underlying data might be an email string
            // Let's force load raw from DB
            const raw = await Conversation.collection.findOne({ _id: c._id });
            if (raw && raw.participants && raw.participants.length >= 2) {
                const p1 = String(raw.participants[0]);
                const p2 = String(raw.participants[1]);
                if (p1.includes('@') || p2.includes('@')) {
                    // Needs migration
                    console.log(`Migrating conversation ${c._id}...`);
                    const user1 = await User.findOne({ email: p1.toLowerCase() });
                    const user2 = await User.findOne({ email: p2.toLowerCase() });

                    if (user1 && user2) {
                        const id1 = String(user1._id);
                        const id2 = String(user2._id);
                        const ids = [id1, id2].sort();
                        const directKey = `${ids[0]}:${ids[1]}`;

                        // Bypass mongoose validation just in case during migration
                        await Conversation.collection.updateOne(
                            { _id: c._id },
                            { $set: { participants: [user1._id, user2._id], directKey: directKey, type: 'direct' } }
                        );
                        migrated++;
                    } else {
                        console.log(`Users not found for ${p1} and ${p2}, deleting orphan convo ${c._id}.`);
                        await Conversation.collection.deleteOne({ _id: c._id });
                        deleted++;
                    }
                }
            }
        }

        console.log(`Migration complete. Migrated: ${migrated}, Deleted: ${deleted}`);
        process.exit(0);
    } catch (err) {
        console.error("Migration fatal error:", err);
        process.exit(1);
    }
}

migrate();
