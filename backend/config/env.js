/**
 * Centralised environment variable loader & validator.
 *
 * Loads dotenv only in development and validates that every
 * required variable is present.  Import this file early in
 * the application lifecycle (before connecting to Mongo, etc.).
 */

// Always load .env file (works in both dev and production)
require('dotenv').config();

// ─── Required variables ──────────────────────────────────────────────────────
const REQUIRED = [
    'MONGO_URI',
    'JWT_SECRET',
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
    console.error(
        `\n❌ Missing required environment variables:\n` +
        missing.map((k) => `   • ${k}`).join('\n') +
        `\n\nCreate a .env file in the backend/ directory using .env.example as a template.\n`
    );
    process.exit(1);
}

// ─── Export typed config object ──────────────────────────────────────────────
module.exports = {
    PORT: parseInt(process.env.PORT, 10) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Email (optional)
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
};
