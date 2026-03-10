/**
 * VegiX - User Seed Script
 * Creates all demo accounts for login testing.
 *
 * Usage (from backend/ directory):
 *   node seeds/seedUsers.js
 *
 * Accounts created:
 *   admin@vegix.lk   / 123456      ← primary test admin
 *   admin@vegix.com  / password123
 *   farmer@vegix.com / password123
 *   broker@vegix.com / password123
 *   buyer@vegix.com  / password123
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const demoUsers = [
    // ── Primary test admin (new credentials) ──────────────────────
    {
        name: 'Admin (Primary)',
        email: 'admin@vegix.lk',
        phone: '0770000001',
        password: '123456',
        role: 'admin',
        location: 'Colombo',
    },
    // ── Original demo accounts ─────────────────────────────────────
    {
        name: 'Admin User',
        email: 'admin@vegix.com',
        phone: '0771234567',
        password: 'password123',
        role: 'admin',
        location: 'Colombo',
    },
    {
        name: 'Demo Farmer',
        email: 'farmer@vegix.com',
        phone: '0772345678',
        password: 'password123',
        role: 'farmer',
        location: 'Kandy',
    },
    {
        name: 'Demo Broker',
        email: 'broker@vegix.com',
        phone: '0773456789',
        password: 'password123',
        role: 'broker',
        location: 'Gampaha',
        company: 'VegiBrokers Ltd',
    },
    {
        name: 'Demo Buyer',
        email: 'buyer@vegix.com',
        phone: '0774567890',
        password: 'password123',
        role: 'buyer',
        location: 'Matara',
    },
];

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ Connected to MongoDB\n');

        for (const userData of demoUsers) {
            const existing = await User.findOne({ email: userData.email });

            if (existing) {
                console.log(`⚠  Already exists (skipped): ${userData.email}`);
                continue;
            }

            // Password is hashed automatically by the User model pre-save hook
            const user = new User(userData);
            await user.save();
            console.log(`✓ Created [${userData.role.padEnd(6)}] ${userData.email}  (password: ${userData.password})`);
        }

        console.log('\n✅ Seeding complete! You can now log in with:');
        console.log('─'.repeat(55));
        demoUsers.forEach(u =>
            console.log(`  ${u.role.padEnd(8)} │ ${u.email.padEnd(24)} │ ${u.password}`)
        );
        console.log('─'.repeat(55));

    } catch (error) {
        console.error('\n✗ Seeding failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ MongoDB connection closed');
        process.exit(process.exitCode || 0);
    }
};

seedUsers();
