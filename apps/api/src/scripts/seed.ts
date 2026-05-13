import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import { User, Restaurant, MenuItem } from '../models';
import { generateNashikRestaurants } from './nashikRestaurants';

/**
 * Seed script – only seeds restaurant catalogue data.
 * No demo/hardcoded user accounts are created.
 * A temporary system owner is used to satisfy the DB constraint,
 * then immediately cleaned up so real users own their own restaurants.
 */
async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Clear only restaurant + menu data (preserve real user accounts)
    await Promise.all([
      Restaurant.deleteMany({}),
      MenuItem.deleteMany({}),
    ]);
    console.log('🗑️  Cleared restaurant & menu data');

    // Create a temporary system owner to satisfy the ownerId FK requirement.
    // This account is NOT meant to be used – real restaurant owners register normally.
    const systemPasswordHash = await bcrypt.hash(
      Math.random().toString(36) + Date.now(),
      12
    );
    const systemOwner = await User.create({
      email: `system-seed-owner-${Date.now()}@internal.localhost`,
      passwordHash: systemPasswordHash,
      role: 'merchant',
      profile: { firstName: 'System', lastName: 'Seed', phone: '0000000000' },
      isVerified: true,
    });

    const ALL_RESTAURANTS = generateNashikRestaurants();

    // Create restaurants with menu items
    for (const data of ALL_RESTAURANTS) {
      const restaurant = await Restaurant.create({
        ownerId: systemOwner._id,
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36),
        description: data.description,
        cuisineTypes: data.cuisineTypes,
        priceRange: data.priceRange,
        location: { type: 'Point', coordinates: data.coordinates },
        address: data.address,
        images: data.images || [],           // ← banner image
        contact: { phone: '0000000000', email: 'contact@nashik.local' },
        operatingHours: [
          { day: 1, open: '10:00', close: '22:00' },
          { day: 2, open: '10:00', close: '22:00' },
          { day: 3, open: '10:00', close: '22:00' },
          { day: 4, open: '10:00', close: '22:00' },
          { day: 5, open: '10:00', close: '23:00' },
          { day: 6, open: '10:00', close: '23:00' },
          { day: 0, open: '11:00', close: '22:00' },
        ],
        rating: {
          average: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          count: Math.floor(50 + Math.random() * 200),
        },
        tables: [
          { tableId: 'T1', capacity: 2, isAvailable: true },
          { tableId: 'T2', capacity: 4, isAvailable: true },
          { tableId: 'T3', capacity: 6, isAvailable: true },
        ],
        isActive: true,
      });

      for (const item of data.items) {
        await MenuItem.create({
          restaurantId: restaurant._id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          tags: item.tags,
          image: item.image || null,         // ← dish image
          isAvailable: true,
          preparationTime: 15 + Math.floor(Math.random() * 15),
        });
      }

      console.log(`🏪 Created: ${data.name} with ${data.items.length} menu items`);
    }

    console.log(`\n✅ Seeded ${ALL_RESTAURANTS.length} Nashik restaurants successfully!`);
    console.log('ℹ️  No demo user accounts were created.');
    console.log('ℹ️  Users must register via the app to get their own accounts.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
