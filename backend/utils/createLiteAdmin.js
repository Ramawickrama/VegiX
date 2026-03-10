const User = require('../models/User');

module.exports = async () => {
    try {
        const existing = await User.findOne({ email: 'liteadmin@gmail.com' });

        if (existing) {
            console.log('[LITE-ADMIN] Lite-admin user already exists — skipping creation.');
            return;
        }

        const liteAdmin = new User({
            name: 'Lite Admin',
            email: 'liteadmin@gmail.com',
            phone: '0771000000',
            password: 'liteadmin@1234',
            role: 'lite-admin',
            location: 'Colombo',
            isActive: true,
        });

        await liteAdmin.save();
        console.log('[LITE-ADMIN] ✓ Created lite-admin user: liteadmin@gmail.com / liteadmin@1234');
    } catch (error) {
        console.error('[LITE-ADMIN] ✗ Error creating lite-admin user:', error.message);
    }
};
