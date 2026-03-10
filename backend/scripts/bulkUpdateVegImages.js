const mongoose = require('mongoose');
require('dotenv').config();
const Vegetable = require('../models/Vegetable');
const path = require('path');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI;

const vegetableImageLibrary = {
    'Carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
    'Tomato': 'https://images.unsplash.com/photo-1546470427-227c7369a9b5?w=400',
    'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82ber?w=400',
    'Onion': 'https://images.unsplash.com/photo-1593159355404-8cb3a9d7b2bf?w=400',
    'Cabbage': 'https://images.unsplash.com/photo-1594282486756-576b93e19e89?w=400',
    'Lettuce': 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400',
    'Spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
    'Broccoli': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
    'Cauliflower': 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400',
    'Cucumber': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400',
    'Bell Pepper': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
    'Chili': 'https://images.unsplash.com/photo-1588252915241-824d1fa6df6a?w=400',
    'Garlic': 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2f85?w=400',
    'Ginger': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
    'Radish': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
    'Beetroot': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400',
    'Pumpkin': 'https://images.unsplash.com/photo-1509622905150-fa66d3906e09?w=400',
    'Eggplant': 'https://images.unsplash.com/photo-1528826007177-f38517ce9a8e?w=400',
    'Okra': 'https://images.unsplash.com/photo-1596561173661-d779032646c7?w=400',
    'Bitter Gourd': 'https://images.unsplash.com/photo-1596561173661-d779032646c7?w=400',
    'Snake Gourd': 'https://images.unsplash.com/photo-1596561173661-d779032646c7?w=400',
    'Bottle Gourd': 'https://images.unsplash.com/photo-1596561173661-d779032646c7?w=400',
    'Ash Gourd': 'https://images.unsplash.com/photo-1596561173661-d779032646c7?w=400',
    'Mushroom': 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=400',
    'Sweet Potato': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
    'Corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400',
    'Green Beans': 'https://images.unsplash.com/photo-1567375698348-5d9d5ae589d5?w=400',
    'Peas': 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400',
    'Bean Sprouts': 'https://images.unsplash.com/photo-1603833665858-e61d17a86279?w=400',
    'Celery': 'https://images.unsplash.com/photo-1595596636646-5f7a2fb24a83?w=400',
    'Parsley': 'https://images.unsplash.com/photo-1600541266322-6c7d3a6b3c8d?w=400',
    'Coriander': 'https://images.unsplash.com/photo-1593098158128-8e5c4381c9c8?w=400',
    'Mint': 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400',
    'Kale': 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=400',
    'Arugula': 'https://images.unsplash.com/photo-1603729849135-bb2c235c6741?w=400',
    'Zucchini': 'https://images.unsplash.com/photo-1596162954151-cdcb4c0f70a8?w=400',
    'Celery': 'https://images.unsplash.com/photo-1595596636646-5f7a2fb24a83?w=400',
};

const normalizedNameMap = {};

function normalizeName(name) {
    if (!name) return '';
    return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function findBestMatch(vegName) {
    const normalized = normalizeName(vegName);

    if (normalizedNameMap[normalized]) {
        return normalizedNameMap[normalized];
    }

    for (const [libraryName, url] of Object.entries(vegetableImageLibrary)) {
        const libNormalized = normalizeName(libraryName);
        if (normalized.includes(libNormalized) || libNormalized.includes(normalized)) {
            normalizedNameMap[normalized] = url;
            return url;
        }
    }

    return null;
}

async function downloadImage(url, vegName) {
    try {
        const https = require('https');
        const http = require('http');

        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;

            protocol.get(url, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    downloadImage(response.headers.location, vegName).then(resolve).catch(reject);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                    return;
                }

                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer);
                });
            }).on('error', reject);
        });
    } catch (error) {
        throw error;
    }
}

async function bulkUpdateImages() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ Connected\n');

        const vegetables = await Vegetable.find({ isActive: true });
        console.log(`Found ${vegetables.length} vegetables\n`);

        const results = {
            updated_count: 0,
            skipped_count: 0,
            error_count: 0,
            missing_images: []
        };

        const uploadDir = path.join(__dirname, '../uploads/vegetables');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const veg of vegetables) {
            console.log(`Processing: ${veg.name}...`);

            if (veg.imageUrl) {
                console.log(`  → Skipping (already has image): ${veg.name}`);
                results.skipped_count++;
                continue;
            }

            const imageUrl = findBestMatch(veg.name);

            if (!imageUrl) {
                console.log(`  → No matching image found for: ${veg.name}`);
                results.missing_images.push({
                    name: veg.name,
                    vegCode: veg.vegCode,
                    reason: 'No matching image in library'
                });
                results.error_count++;
                continue;
            }

            try {
                const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
                const filename = `veg-${veg.vegCode}${ext}`;
                const filepath = path.join(uploadDir, filename);

                const imageBuffer = await downloadImage(imageUrl, veg.name);
                fs.writeFileSync(filepath, imageBuffer);

                veg.imageUrl = `/uploads/vegetables/${filename}`;
                await veg.save();

                console.log(`  → Updated: ${veg.name} → ${veg.imageUrl}`);
                results.updated_count++;
            } catch (err) {
                console.log(`  → Error downloading image for ${veg.name}: ${err.message}`);
                results.missing_images.push({
                    name: veg.name,
                    vegCode: veg.vegCode,
                    reason: err.message
                });
                results.error_count++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('BULK IMAGE UPDATE RESULTS');
        console.log('='.repeat(50));
        console.log(`Updated:        ${results.updated_count}`);
        console.log(`Skipped:        ${results.skipped_count}`);
        console.log(`Errors:         ${results.error_count}`);

        if (results.missing_images.length > 0) {
            console.log('\nMissing Images Report:');
            console.log('-'.repeat(50));
            results.missing_images.forEach(item => {
                console.log(`  - ${item.name} (${item.vegCode}): ${item.reason}`);
            });
        }

        const reportPath = path.join(__dirname, 'bulk_image_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`\nReport saved to: ${reportPath}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

if (require.main === module) {
    bulkUpdateImages();
}

module.exports = { bulkUpdateImages, findBestMatch };
