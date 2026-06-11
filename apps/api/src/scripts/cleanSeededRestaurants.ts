/**
 * cleanSeededRestaurants.ts
 * ─────────────────────────
 * Deletes all seeded (fake) restaurants and their menu items from MongoDB.
 * Only restaurants whose owner email ends with "@internal.localhost" are removed.
 * Restaurants owned by real registered users are left untouched.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register src/scripts/cleanSeededRestaurants.ts
 */

import mongoose from 'mongoose';
import { config } from '../config/env';
import { User, Restaurant, MenuItem } from '../models';

async function cleanSeededRestaurants() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // 1. Find all system seed owner accounts
    const seedOwners = await User.find({
      email: { $regex: /@internal\.localhost$/ },
    }).select('_id email');

    if (seedOwners.length === 0) {
      console.log('ℹ️  No seeded system owners found. Database is already clean.');
      process.exit(0);
    }

    console.log(`🔍 Found ${seedOwners.length} seed owner account(s):`);
    seedOwners.forEach((u) => console.log(`   • ${u.email}`));

    const ownerIds = seedOwners.map((u) => u._id);

    // 2. Find seeded restaurants owned by those accounts
    const seededRestaurants = await Restaurant.find({
      ownerId: { $in: ownerIds },
    }).select('_id name');

    console.log(`\n🏪 Found ${seededRestaurants.length} seeded restaurant(s) to remove.`);

    if (seededRestaurants.length > 0) {
      const restaurantIds = seededRestaurants.map((r) => r._id);

      // 3. Delete menu items for those restaurants
      const menuResult = await MenuItem.deleteMany({
        restaurantId: { $in: restaurantIds },
      });
      console.log(`🍽️  Deleted ${menuResult.deletedCount} menu item(s).`);

      // 4. Delete the restaurants themselves
      const restResult = await Restaurant.deleteMany({
        _id: { $in: restaurantIds },
      });
      console.log(`🗑️  Deleted ${restResult.deletedCount} restaurant(s).`);
    }

    // 5. Delete the system seed owner accounts
    const userResult = await User.deleteMany({
      email: { $regex: /@internal\.localhost$/ },
    });
    console.log(`👤 Deleted ${userResult.deletedCount} system seed user(s).`);

    console.log('\n✅ Cleanup complete! Only real registered restaurants remain.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanSeededRestaurants();
