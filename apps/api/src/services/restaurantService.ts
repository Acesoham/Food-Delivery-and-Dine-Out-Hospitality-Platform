import slugify from 'slugify';
import { Restaurant } from '../models';
import { MenuItem } from '../models';
import type { CreateRestaurantInput, CreateMenuItemInput, DiscoverQuery } from 'shared-types';

/**
 * Create a new restaurant
 */
export const createRestaurant = async (ownerId: string, input: CreateRestaurantInput) => {
  const slug = slugify(input.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);

  const restaurant = await Restaurant.create({
    ...input,
    ownerId,
    slug,
    images: [],
    rating: { average: 0, count: 0 },
    isActive: true,
  });

  return restaurant;
};

/**
 * Geospatial discovery using $geoNear aggregation pipeline
 * Sorts by weighted combination: 0.7 distance + 0.3 rating
 */
export const discoverRestaurants = async (query: DiscoverQuery) => {
  const { lat, lng, radius, cuisine, minRating, priceRange, page, limit, search } = query;
  const skip = (page - 1) * limit;

  // Build match filter for inside $geoNear query
  const matchFilter: Record<string, any> = { isActive: true };
  if (cuisine) matchFilter.cuisineTypes = cuisine;
  if (priceRange) matchFilter.priceRange = priceRange;
  if (minRating) matchFilter['rating.average'] = { $gte: minRating };

  // Build pipeline
  const pipeline: any[] = [
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceInMeters',
        maxDistance: radius,
        query: matchFilter,
        spherical: true,
      },
    },
    {
      $addFields: {
        distanceInKm: { $round: [{ $divide: ['$distanceInMeters', 1000] }, 2] },
      },
    },
  ];

  // Text search filter (post $geoNear)
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { cuisineTypes: { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  // Sort by weighted score: closer + higher rated = better
  pipeline.push({
    $addFields: {
      sortScore: {
        $add: [
          { $multiply: [{ $divide: [1, { $add: ['$distanceInKm', 0.1] }] }, 0.7] },
          { $multiply: [{ $ifNull: ['$rating.average', 0] }, 0.3] },
        ],
      },
    },
  });
  pipeline.push({ $sort: { sortScore: -1 } });

  // Count total before pagination
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await Restaurant.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  // Apply pagination
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  // Remove internal fields
  pipeline.push({
    $project: {
      sortScore: 0,
      distanceInMeters: 0,
      __v: 0,
    },
  });

  const restaurants = await Restaurant.aggregate(pipeline);

  return {
    data: restaurants,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get restaurant by ID with menu items
 */
export const getRestaurantById = async (id: string) => {
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });
  }

  const menuItems = await MenuItem.find({
    restaurantId: id,
    isAvailable: true,
  }).sort({ category: 1, name: 1 });

  return { restaurant, menuItems };
};

/**
 * Update restaurant (owner only)
 */
export const updateRestaurant = async (id: string, ownerId: string, updates: Partial<CreateRestaurantInput>) => {
  const restaurant = await Restaurant.findOne({ _id: id, ownerId });
  if (!restaurant) {
    throw Object.assign(new Error('Restaurant not found or unauthorized'), { statusCode: 404 });
  }

  Object.assign(restaurant, updates);
  await restaurant.save();
  return restaurant;
};

/**
 * Add a menu item to a restaurant
 */
export const addMenuItem = async (restaurantId: string, ownerId: string, input: CreateMenuItemInput) => {
  const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
  if (!restaurant) {
    throw Object.assign(new Error('Restaurant not found or unauthorized'), { statusCode: 404 });
  }

  const menuItem = await MenuItem.create({ ...input, restaurantId });
  return menuItem;
};

/**
 * Update a menu item
 */
export const updateMenuItem = async (
  restaurantId: string,
  itemId: string,
  ownerId: string,
  updates: Partial<CreateMenuItemInput>
) => {
  const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
  if (!restaurant) {
    throw Object.assign(new Error('Restaurant not found or unauthorized'), { statusCode: 404 });
  }

  const menuItem = await MenuItem.findOneAndUpdate(
    { _id: itemId, restaurantId },
    updates,
    { new: true }
  );
  if (!menuItem) {
    throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
  }

  return menuItem;
};

/**
 * Delete a menu item
 */
export const deleteMenuItem = async (restaurantId: string, itemId: string, ownerId: string) => {
  const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
  if (!restaurant) {
    throw Object.assign(new Error('Restaurant not found or unauthorized'), { statusCode: 404 });
  }

  const menuItem = await MenuItem.findOneAndDelete({ _id: itemId, restaurantId });
  if (!menuItem) {
    throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
  }

  return menuItem;
};

/**
 * Get all restaurants for a merchant
 */
export const getMerchantRestaurants = async (ownerId: string) => {
  return Restaurant.find({ ownerId }).sort({ createdAt: -1 });
};
