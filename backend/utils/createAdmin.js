const User = require('../models/User');
const { generateUserId } = require('../utils/idGenerator');

module.exports = async () => {
    try {
        const existing = await User.findOne({ email: 'admin@vegix.lk' });

        if (existing) {
            console.log('[ADMIN] Admin user already exists — skipping creation.');
            // Ensure admin has userId
            if (!existing.userId) {
                const adminUserId = await generateUserId('admin');
                existing.userId = adminUserId;
                await existing.save();
                console.log('[ADMIN] ✓ Updated admin userId:', adminUserId);
            }
        } else {
            const adminUserId = await generateUserId('admin');
            const admin = new User({
                name: 'System Admin',
                email: 'admin@vegix.lk',
                phone: '0770000000',
                password: 'admin123',
                role: 'admin',
                userId: adminUserId,
                location: 'Colombo',
                isActive: true,
            });

            await admin.save();
            console.log('[ADMIN] ✓ Created admin user: admin@vegix.lk / admin123');
        }

        // Create lite-admin user
        const liteAdminExists = await User.findOne({ email: 'liteadmin@gmail.com' });
        if (liteAdminExists) {
            console.log('[LITE-ADMIN] Lite-admin user already exists — skipping creation.');
            // Ensure lite-admin has userId
            if (!liteAdminExists.userId) {
                const liteAdminUserId = await generateUserId('lite-admin');
                liteAdminExists.userId = liteAdminUserId;
                await liteAdminExists.save();
                console.log('[LITE-ADMIN] ✓ Updated lite-admin userId:', liteAdminUserId);
            }
        } else {
            const liteAdminUserId = await generateUserId('lite-admin');
            const liteAdmin = new User({
                name: 'Lite Admin',
                email: 'liteadmin@gmail.com',
                phone: '0771000000',
                password: 'liteadmin@1234',
                role: 'lite-admin',
                userId: liteAdminUserId,
                location: 'Colombo',
                isActive: true,
            });

            await liteAdmin.save();
            console.log('[LITE-ADMIN] ✓ Created lite-admin user: liteadmin@gmail.com / liteadmin@1234');
        }
    } catch (error) {
        console.error('[ADMIN] ✗ Error creating admin user:', error.message);
    }
};
