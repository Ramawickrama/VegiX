const mongoose = require('mongoose');
const Vegetable = require('./models/Vegetable');
require('dotenv').config();

const sampleVegetables = [
  { name: 'Tomato', category: 'Fruit', currentPrice: 120, minPrice: 100, maxPrice: 150, defaultUnit: 'kg' },
  { name: 'Potato', category: 'Root', currentPrice: 80, minPrice: 60, maxPrice: 100, defaultUnit: 'kg' },
  { name: 'Beans', category: 'Other', currentPrice: 200, minPrice: 180, maxPrice: 250, defaultUnit: 'kg' },
  { name: 'Cucumber', category: 'Fruit', currentPrice: 70, minPrice: 50, maxPrice: 90, defaultUnit: 'kg' },
  { name: 'Bell Pepper', category: 'Fruit', currentPrice: 350, minPrice: 300, maxPrice: 450, defaultUnit: 'kg' },
  { name: 'Carrot', category: 'Root', currentPrice: 180, minPrice: 150, maxPrice: 220, defaultUnit: 'kg' },
  { name: 'Cabbage', category: 'Leafy', currentPrice: 100, minPrice: 80, maxPrice: 130, defaultUnit: 'kg' },
  { name: 'Brinjal', category: 'Fruit', currentPrice: 110, minPrice: 90, maxPrice: 140, defaultUnit: 'kg' },
  { name: 'Pumpkin', category: 'Other', currentPrice: 60, minPrice: 40, maxPrice: 90, defaultUnit: 'kg' },
  { name: 'Onion', category: 'Root', currentPrice: 150, minPrice: 120, maxPrice: 200, defaultUnit: 'kg' },
];

const seedVegetables = async () => {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing vegetables and counter
    await Vegetable.deleteMany({});
    console.log('Cleared existing vegetables');

    // Reset counter for IDs
    const Counter = mongoose.model('Counter');
    await Counter.deleteOne({ _id: 'vegetableId' });
    console.log('Reset vegetableId counter');

    // Insert sample vegetables
    // We use a loop or proper save to trigger the pre-validate middleware for vegetableId
    for (const veg of sampleVegetables) {
      const newVeg = new Vegetable(veg);
      await newVeg.save();
      console.log(`Seeded: ${veg.name} (${newVeg.vegetableId})`);
    }

    console.log('\nAll vegetables seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding vegetables:', error);
    process.exit(1);
  }
};

seedVegetables();
