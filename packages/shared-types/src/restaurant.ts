import { z } from 'zod';
import { GeoPointSchema } from './user';

// ─── Operating Hours ───
export const OperatingHoursSchema = z.object({
  day: z.number().min(0).max(6), // 0=Sun..6=Sat
  open: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  close: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
});

// ─── Table Schema ───
export const TableSchema = z.object({
  tableId: z.string(),
  capacity: z.number().min(1).max(20),
  isAvailable: z.boolean().default(true),
});

// ─── Create Restaurant ───
export const CreateRestaurantSchema = z.object({
  name: z.string().min(2, 'Restaurant name required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  cuisineTypes: z.array(z.string()).min(1, 'At least one cuisine type'),
  priceRange: z.number().min(1).max(4),
  location: GeoPointSchema,
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
  }),
  contact: z.object({
    phone: z.string().min(10),
    email: z.string().email(),
  }),
  operatingHours: z.array(OperatingHoursSchema).min(1),
  deliveryRadius: z.number().min(500).max(50000).default(5000), // meters
  tables: z.array(TableSchema).optional(),
});
export type CreateRestaurantInput = z.infer<typeof CreateRestaurantSchema>;

// ─── Restaurant Response ───
export interface IRestaurant {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  cuisineTypes: string[];
  priceRange: number;
  location: { type: 'Point'; coordinates: [number, number] };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contact: { phone: string; email: string };
  operatingHours: Array<{ day: number; open: string; close: string }>;
  images: string[];
  rating: { average: number; count: number };
  tables: Array<{ tableId: string; capacity: number; isAvailable: boolean }>;
  deliveryRadius: number;
  isActive: boolean;
  distanceInKm?: number; // added by $geoNear
  createdAt: string;
  updatedAt: string;
}

// ─── Menu Item ───
export const CreateMenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1),
  image: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
  preparationTime: z.number().min(1).max(120).default(15), // minutes
});
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;

export interface IMenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  tags: string[];
  isAvailable: boolean;
  preparationTime: number;
  createdAt: string;
}

// ─── Discovery Query ───
export const DiscoverQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(500).max(50000).default(5000),
  cuisine: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  priceRange: z.coerce.number().min(1).max(4).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  search: z.string().optional(),
});
export type DiscoverQuery = z.infer<typeof DiscoverQuerySchema>;
