/**
 * Centralised environment variable loader & validator.
 * 
 * In development, loads from .env. In production (like Render), 
 * it uses system environment variables.
 */

// Always load dotenv - it won't override existing env vars
require('dotenv').config();

// Support both MONGO_URI and MONGODB_URI (standard for MongoDB Atlas on Render/Heroku)
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// ─── Required variables ──────────────────────────────────────────────────────
const REQUIRED = [
    { key: 'MONGO_URI', actual: MONGO_URI },
    { key: 'JWT_SECRET', actual: process.env.JWT_SECRET },
];

if (process.env.NODE_ENV === 'production') {
    REQUIRED.push({ key: 'CLIENT_URL', actual: process.env.CLIENT_URL });
}

const missing = REQUIRED.filter((item) => !item.actual);

if (missing.length > 0) {
    console.error(
        `\n❌ FATAL ERROR: Missing required environment variables:\n` +
        missing.map((item) => `   • ${item.key}`).join('\n') +
        `\n\nPlease set these in your environment or .env file.\n`
    );
    process.exit(1);
}

// ─── Export typed config object ──────────────────────────────────────────────
module.exports = {
    PORT: parseInt(process.env.PORT, 10) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGO_URI: MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    CLIENT_URL: process.env.NODE_ENV === 'production' 
        ? process.env.CLIENT_URL 
        : (process.env.CLIENT_URL || 'http://13.48.136.109:3000'),

    // Email (optional)
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
};
