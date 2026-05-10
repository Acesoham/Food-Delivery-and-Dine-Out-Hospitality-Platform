import mongoose, { Schema, Document } from 'mongoose';
import type { IUser } from 'shared-types';

export interface UserDocument extends Omit<IUser, '_id'>, Document {
  passwordHash: string;
  refreshToken?: string;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['consumer', 'merchant', 'courier', 'admin'],
      default: 'consumer',
    },
    profile: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      phone: { type: String, required: true },
      avatar: { type: String },
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] }, // [lng, lat]
      },
    },
    loyaltyPoints: { type: Number, default: 0 },
    refreshToken: { type: String },
    isVerified: { type: Boolean, default: false },
  } as any, {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.passwordHash;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes

userSchema.index({ 'address.location': '2dsphere' }, { sparse: true });

export const User = mongoose.model<UserDocument>('User', userSchema);
