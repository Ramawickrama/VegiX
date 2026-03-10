const Conversation = require('../models/Conversation');
const User = require('../models/User');

exports.getOrCreateDirectConversation = async (userId1, userId2) => {
    try {
        if (!userId1 || !userId2) throw new Error('Both user IDs are required');

        const id1 = String(userId1);
        const id2 = String(userId2);

        if (id1 === id2) throw new Error('Cannot chat with yourself');

        const ids = [id1, id2].sort();
        const directKey = `${ids[0]}:${ids[1]}`;

        const user1 = await User.findById(id1);
        const user2 = await User.findById(id2);

        if (!user1 || !user2) throw new Error('One or both users not found');

        const update = {
            $setOnInsert: {
                type: 'direct',
                directKey: directKey,
                participants: ids,
                participantDetails: [
                    {
                        email: user1.email.toLowerCase(),
                        name: user1.name || 'Unknown',
                        role: user1.role || 'unknown',
                        userId: user1._id
                    },
                    {
                        email: user2.email.toLowerCase(),
                        name: user2.name || 'Unknown',
                        role: user2.role || 'unknown',
                        userId: user2._id
                    }
                ],
                lastMessage: 'Conversation started',
                lastMessageAt: Date.now()
            }
        };

        let result;
        try {
            result = await Conversation.findOneAndUpdate(
                { type: 'direct', directKey: directKey },
                update,
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        } catch (error) {
            if (error.code === 11000) {
                result = await Conversation.findOne({ directKey: directKey });
                if (!result) {
                    result = await Conversation.findOne({ participants: { $all: ids } });
                }
                if (!result) {
                    throw new Error(`Duplicate key error. Could not find directKey=${directKey} or participants=${JSON.stringify(ids)}.`);
                }

                // Self-heal the document
                if (!result.directKey || result.type !== 'direct') {
                    result.directKey = directKey;
                    result.type = 'direct';
                    await result.save();
                }
            } else {
                throw error;
            }
        }

        if (!result) {
            throw new Error('Could not create or retrieve direct conversation.');
        }

        return result;
    } catch (error) {
        throw error;
    }
};
