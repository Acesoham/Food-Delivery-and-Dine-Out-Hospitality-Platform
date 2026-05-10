import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import { User, Restaurant, MenuItem } from '../models';

const SAMPLE_RESTAURANTS = [
  {
    name: 'Spice Garden',
    description: 'Authentic Indian cuisine with a modern twist. Fresh spices, traditional recipes.',
    cuisineTypes: ['Indian', 'North Indian', 'Mughlai'],
    priceRange: 2,
    coordinates: [77.5946, 12.9716], // Bangalore
    address: { street: '123 MG Road', city: 'Bangalore', state: 'Karnataka', zipCode: '560001' },
    items: [
      { name: 'Butter Chicken', description: 'Creamy tomato-based chicken curry', price: 320, category: 'Main Course', tags: ['non-veg', 'popular'] },
      { name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 250, category: 'Starters', tags: ['veg', 'popular'] },
      { name: 'Biryani', description: 'Fragrant basmati rice with spiced chicken', price: 280, category: 'Main Course', tags: ['non-veg', 'rice'] },
      { name: 'Garlic Naan', description: 'Soft bread with garlic butter', price: 60, category: 'Breads', tags: ['veg'] },
      { name: 'Gulab Jamun', description: 'Sweet milk dumplings in sugar syrup', price: 120, category: 'Desserts', tags: ['veg', 'sweet'] },
    ],
  },
  {
    name: 'Pizza Paradise',
    description: 'Wood-fired pizzas made with imported Italian ingredients.',
    cuisineTypes: ['Italian', 'Pizza', 'Pasta'],
    priceRange: 3,
    coordinates: [77.6101, 12.9352],
    address: { street: '456 Koramangala', city: 'Bangalore', state: 'Karnataka', zipCode: '560034' },
    items: [
      { name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, fresh basil', price: 350, category: 'Pizzas', tags: ['veg', 'classic'] },
      { name: 'Pepperoni Pizza', description: 'Loaded with pepperoni and cheese', price: 450, category: 'Pizzas', tags: ['non-veg', 'popular'] },
      { name: 'Pasta Alfredo', description: 'Creamy white sauce penne pasta', price: 280, category: 'Pasta', tags: ['veg'] },
      { name: 'Garlic Bread', description: 'Crispy bread with garlic butter and herbs', price: 150, category: 'Sides', tags: ['veg'] },
      { name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert', price: 220, category: 'Desserts', tags: ['veg'] },
    ],
  },
  {
    name: 'Dragon Wok',
    description: 'Premium Chinese and Pan-Asian cuisine. Szechuan specialties.',
    cuisineTypes: ['Chinese', 'Asian', 'Thai'],
    priceRange: 2,
    coordinates: [77.6245, 12.9698],
    address: { street: '789 Indiranagar', city: 'Bangalore', state: 'Karnataka', zipCode: '560038' },
    items: [
      { name: 'Kung Pao Chicken', description: 'Spicy stir-fried chicken with peanuts', price: 300, category: 'Main Course', tags: ['non-veg', 'spicy'] },
      { name: 'Veg Fried Rice', description: 'Wok-tossed rice with vegetables', price: 200, category: 'Rice', tags: ['veg'] },
      { name: 'Spring Rolls', description: 'Crispy rolls with vegetable filling', price: 180, category: 'Starters', tags: ['veg'] },
      { name: 'Dim Sum Platter', description: 'Assorted steamed dumplings', price: 350, category: 'Starters', tags: ['non-veg'] },
      { name: 'Mango Sticky Rice', description: 'Thai dessert with coconut cream', price: 200, category: 'Desserts', tags: ['veg'] },
    ],
  },
  {
    name: 'The Burger Joint',
    description: 'Gourmet burgers with hand-crafted patties and premium toppings.',
    cuisineTypes: ['American', 'Burgers', 'Fast Food'],
    priceRange: 2,
    coordinates: [77.5800, 12.9850],
    address: { street: '321 Brigade Road', city: 'Bangalore', state: 'Karnataka', zipCode: '560025' },
    items: [
      { name: 'Classic Smash Burger', description: 'Double patty with cheese, lettuce, tomato', price: 299, category: 'Burgers', tags: ['non-veg', 'popular'] },
      { name: 'Chicken BBQ Burger', description: 'Grilled chicken with BBQ sauce', price: 279, category: 'Burgers', tags: ['non-veg'] },
      { name: 'Loaded Fries', description: 'Fries with cheese, bacon, jalapeños', price: 199, category: 'Sides', tags: ['non-veg'] },
      { name: 'Oreo Milkshake', description: 'Thick shake with Oreo cookies', price: 179, category: 'Beverages', tags: ['veg'] },
    ],
  },
  {
    name: 'Sushi Zen',
    description: 'Authentic Japanese sushi and sashimi. Fresh fish daily.',
    cuisineTypes: ['Japanese', 'Sushi', 'Asian'],
    priceRange: 4,
    coordinates: [77.6350, 12.9550],
    address: { street: '555 HSR Layout', city: 'Bangalore', state: 'Karnataka', zipCode: '560102' },
    items: [
      { name: 'Salmon Nigiri Set', description: '6 pieces of fresh salmon nigiri', price: 550, category: 'Sushi', tags: ['non-veg', 'premium'] },
      { name: 'California Roll', description: 'Crab, avocado, cucumber roll', price: 420, category: 'Rolls', tags: ['non-veg'] },
      { name: 'Miso Soup', description: 'Traditional Japanese soybean soup', price: 150, category: 'Soups', tags: ['veg'] },
      { name: 'Tempura Prawns', description: 'Crispy battered prawns with dipping sauce', price: 480, category: 'Starters', tags: ['non-veg'] },
      { name: 'Matcha Ice Cream', description: 'Green tea flavored ice cream', price: 180, category: 'Desserts', tags: ['veg'] },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      MenuItem.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create demo users
    const passwordHash = await bcrypt.hash('password123', 12);

    const [consumer, merchant, courier] = await User.create([
      {
        email: 'consumer@demo.com',
        passwordHash,
        role: 'consumer',
        profile: { firstName: 'John', lastName: 'Doe', phone: '9876543210' },
        loyaltyPoints: 150,
        isVerified: true,
      },
      {
        email: 'merchant@demo.com',
        passwordHash,
        role: 'merchant',
        profile: { firstName: 'Jane', lastName: 'Smith', phone: '9876543211' },
        isVerified: true,
      },
      {
        email: 'courier@demo.com',
        passwordHash,
        role: 'courier',
        profile: { firstName: 'Alex', lastName: 'Rider', phone: '9876543212' },
        isVerified: true,
      },
    ]);
    console.log('👤 Created demo users');

    // Create restaurants with menu items
    for (const data of SAMPLE_RESTAURANTS) {
      const restaurant = await Restaurant.create({
        ownerId: merchant._id,
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36),
        description: data.description,
        cuisineTypes: data.cuisineTypes,
        priceRange: data.priceRange,
        location: { type: 'Point', coordinates: data.coordinates },
        address: data.address,
        contact: { phone: '9876543211', email: 'merchant@demo.com' },
        operatingHours: [
          { day: 1, open: '10:00', close: '22:00' },
          { day: 2, open: '10:00', close: '22:00' },
          { day: 3, open: '10:00', close: '22:00' },
          { day: 4, open: '10:00', close: '22:00' },
          { day: 5, open: '10:00', close: '23:00' },
          { day: 6, open: '10:00', close: '23:00' },
          { day: 0, open: '11:00', close: '22:00' },
        ],
        rating: { average: Math.round((3.5 + Math.random() * 1.5) * 10) / 10, count: Math.floor(50 + Math.random() * 200) },
        tables: [
          { tableId: 'T1', capacity: 2, isAvailable: true },
          { tableId: 'T2', capacity: 4, isAvailable: true },
          { tableId: 'T3', capacity: 6, isAvailable: true },
        ],
        isActive: true,
      });

      // Create menu items
      for (const item of data.items) {
        await MenuItem.create({
          restaurantId: restaurant._id,
          ...item,
          isAvailable: true,
          preparationTime: 15 + Math.floor(Math.random() * 15),
        });
      }

      console.log(`🏪 Created: ${data.name} with ${data.items.length} menu items`);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('📧 Demo logins (password: password123):');
    console.log('   Consumer: consumer@demo.com');
    console.log('   Merchant: merchant@demo.com');
    console.log('   Courier:  courier@demo.com');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
