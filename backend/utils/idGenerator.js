const User = require('../models/User');

/**
 * Generates a custom User ID based on the role and existing users.
 * Farmer: FA001 -> FA999 -> FB000... (Prefix: F, Letter: A-Z, Digits: 3)
 * Broker: BA000 -> BA999 -> BB000... (Prefix: B, Letter: A-Z, Digits: 3)
 * Buyer:  BUA000 -> BUA999 -> BUB000... (Prefix: BU, Letter: A-Z, Digits: 3)
 * 
 * @param {string} role - The user role ('farmer', 'broker', 'buyer')
 * @returns {Promise<string>} - The generated user ID
 */
const generateUserId = async (role) => {
    let prefix = '';
    let defaultStart = '';

    switch (role) {
        case 'farmer':
            prefix = 'F';
            defaultStart = 'FA001';
            break;
        case 'broker':
            prefix = 'B';
            defaultStart = 'BA000';
            break;
        case 'buyer':
            prefix = 'BU';
            defaultStart = 'BUA000';
            break;
        case 'admin':
        case 'lite-admin':
            prefix = 'AD';
            defaultStart = 'AD001';
            break;
        default:
            return null;
    }

    // Find the latest user with this prefix pattern using a regex
    // The pattern matches Prefix + One Uppercase Letter + Three Digits
    const regex = new RegExp(`^${prefix}[A-Z]\\d{3}$`);

    // Sort by userId descending to get the highest one
    const lastUser = await User.findOne({ userId: regex }).sort({ userId: -1 });

    if (!lastUser || !lastUser.userId) {
        return defaultStart;
    }

    const currentId = lastUser.userId;
    const letterPos = prefix.length;
    const currentLetter = currentId[letterPos];
    const currentNumberStr = currentId.substring(letterPos + 1);
    let currentNumber = parseInt(currentNumberStr, 10);

    // Increment number
    currentNumber++;

    if (currentNumber > 999) {
        // Reset number to 000 and increment the letter
        currentNumber = 0;
        const nextLetterCode = currentLetter.charCodeAt(0) + 1;

        if (nextLetterCode > 90) { // 'Z' is 90
            throw new Error(`ID sequence exhausted for role: ${role}`);
        }

        const nextLetter = String.fromCharCode(nextLetterCode);
        return `${prefix}${nextLetter}000`;
    }

    // Pad the number with leading zeros
    const paddedNumber = currentNumber.toString().padStart(3, '0');
    return `${prefix}${currentLetter}${paddedNumber}`;
};

module.exports = { generateUserId };
