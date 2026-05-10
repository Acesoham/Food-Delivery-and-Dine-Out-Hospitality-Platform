import mongoose, { Schema, Document } from 'mongoose';
import type { IRestaurant } from 'shared-types';

export interface RestaurantDocument extends Omit<IRestaurant, '_id'>, Document {}

const restaurantSchema = new Schema<RestaurantDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    cuisineTypes: [{ type: String, required: true }],
    priceRange: { type: Number, required: true, min: 1, max: 4 },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point', required: true },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    operatingHours: [
      {
        day: { type: Number, min: 0, max: 6 },
        open: String,
        close: String,
      },
    ],
    images: [{ type: String }],
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    tables: [
      {
        tableId: String,
        capacity: { type: Number, min: 1 },
        isAvailable: { type: Boolean, default: true },
      },
    ],
    deliveryRadius: { type: Number, default: 5000 }, // meters
    isActive: { type: Boolean, default: true },
  } as any, {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
  }
);

// Indexes
restaurantSchema.index({ location: '2dsphere' });

restaurantSchema.index({ cuisineTypes: 1, 'rating.average': -1 });
restaurantSchema.index({ ownerId: 1 });
restaurantSchema.index({ isActive: 1 });

export const Restaurant = mongoose.model<RestaurantDocument>('Restaurant', restaurantSchema);
