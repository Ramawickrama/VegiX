const mongoose = require('mongoose');
const Vegetable = require('../models/Vegetable');

const defaultVegetables = [
  { name: 'Tomato', category: 'Fruit', currentPrice: 150, minPrice: 140, maxPrice: 160 },
  { name: 'Potato', category: 'Root', currentPrice: 120, minPrice: 110, maxPrice: 130 },
  { name: 'Cucumber', category: 'Fruit', currentPrice: 80, minPrice: 70, maxPrice: 90 },
  { name: 'Bell Pepper', category: 'Fruit', currentPrice: 250, minPrice: 230, maxPrice: 270 },
  { name: 'Beans', category: 'Fruit', currentPrice: 300, minPrice: 280, maxPrice: 320 },
  { name: 'Carrot', category: 'Root', currentPrice: 180, minPrice: 160, maxPrice: 200 },
  { name: 'Cabbage', category: 'Leafy', currentPrice: 100, minPrice: 90, maxPrice: 110 },
  { name: 'Onion', category: 'Root', currentPrice: 200, minPrice: 180, maxPrice: 220 }
];

async function seedVegetables() {
  try {
    const existingCount = await Vegetable.countDocuments();
    if (existingCount > 0) {
      console.log(`✓ Vegetables already seeded (${existingCount} found).`);
      return;
    }

    console.log('Seeding vegetables individually to ensure ID generation hooks run...');
    for (const veg of defaultVegetables) {
      const newVeg = new Vegetable(veg);
      await newVeg.save();
    }

    const count = await Vegetable.countDocuments();
    console.log(`✓ Successfully seeded ${count} vegetables`);
  } catch (error) {
    console.error('✗ Error seeding vegetables:', error.message);
  }
}

module.exports = seedVegetables;
