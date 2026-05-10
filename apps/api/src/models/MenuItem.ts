import mongoose, { Schema, Document } from 'mongoose';
import type { IMenuItem } from 'shared-types';

export interface MenuItemDocument extends Omit<IMenuItem, '_id'>, Document {}

const menuItemSchema = new Schema<MenuItemDocument>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    image: { type: String },
    tags: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, default: 15, min: 1 },
  } as any, {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

// Indexes
menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
menuItemSchema.index({ restaurantId: 1, category: 1 });

export const MenuItem = mongoose.model<MenuItemDocument>('MenuItem', menuItemSchema);
