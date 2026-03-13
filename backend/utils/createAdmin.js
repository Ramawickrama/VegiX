const User = require('../models/User');
const { generateUserId } = require('../utils/idGenerator');

const createAdminUser = async () => {
    const adminEmail = 'admin@vegix.lk';
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
        console.log('[ADMIN] Admin user already exists — skipping creation.');
        if (!existing.userId) {
            const adminUserId = await generateUserId('admin');
            existing.userId = adminUserId;
            await existing.save();
            console.log('[ADMIN] ✓ Updated admin userId:', adminUserId);
        }
        return;
    }

    try {
        const adminUserId = await generateUserId('admin');
        await User.updateOne(
            { email: adminEmail },
            {
                $setOnInsert: {
                    name: 'System Admin',
                    email: adminEmail,
                    phone: '0770000000',
                    password: 'admin123',
                    role: 'admin',
                    userId: adminUserId,
                    location: 'Colombo',
                    isActive: true,
                }
            },
            { upsert: true }
        );
        console.log('[ADMIN] ✓ Created admin user: admin@vegix.lk');
    } catch (error) {
        if (error.code === 11000) {
            console.log('[ADMIN] Admin user already exists — skipping creation.');
        } else {
            throw error;
        }
    }
};

const createLiteAdminUser = async () => {
    const liteAdminEmail = 'liteadmin@gmail.com';
    const existing = await User.findOne({ email: liteAdminEmail });

    if (existing) {
        console.log('[LITE-ADMIN] Lite-admin user already exists — skipping creation.');
        if (!existing.userId) {
            const liteAdminUserId = await generateUserId('lite-admin');
            existing.userId = liteAdminUserId;
            await existing.save();
            console.log('[LITE-ADMIN] ✓ Updated lite-admin userId:', liteAdminUserId);
        }
        return;
    }

    try {
        const liteAdminUserId = await generateUserId('lite-admin');
        await User.updateOne(
            { email: liteAdminEmail },
            {
                $setOnInsert: {
                    name: 'Lite Admin',
                    email: liteAdminEmail,
                    phone: '0771000000',
                    password: 'liteadmin@1234',
                    role: 'lite-admin',
                    userId: liteAdminUserId,
                    location: 'Colombo',
                    isActive: true,
                }
            },
            { upsert: true }
        );
        console.log('[LITE-ADMIN] ✓ Created lite-admin user: liteadmin@gmail.com');
    } catch (error) {
        if (error.code === 11000) {
            console.log('[LITE-ADMIN] Lite-admin user already exists — skipping creation.');
        } else {
            throw error;
        }
    }
};

module.exports = async () => {
    try {
        await createAdminUser();
        await createLiteAdminUser();
    } catch (error) {
        console.error('[ADMIN] ✗ Error:', error.message);
    }
};
