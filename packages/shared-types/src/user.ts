import { z } from 'zod';

// ─── GeoJSON Point Schema ───
export const GeoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

// ─── User Roles ───
export const UserRole = z.enum(['consumer', 'merchant', 'courier', 'admin']);
export type UserRole = z.infer<typeof UserRole>;

// ─── Address Schema ───
export const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  location: GeoPointSchema.optional(),
});
export type Address = z.infer<typeof AddressSchema>;

// ─── User Profile ───
export const UserProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  avatar: z.string().url().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ─── Registration ───
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: UserRole.default('consumer'),
  profile: UserProfileSchema,
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─── Login ───
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ─── User Response (safe, no password) ───
export interface IUser {
  _id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  address?: Address;
  loyaltyPoints: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth Response ───
export interface AuthResponse {
  user: IUser;
  accessToken: string;
}
