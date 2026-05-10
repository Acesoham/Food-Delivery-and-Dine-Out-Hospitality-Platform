import mongoose, { Schema, Document } from 'mongoose';
import type { IReservation } from 'shared-types';

export interface ReservationDocument extends Omit<IReservation, '_id'>, Document {}

const reservationSchema = new Schema<ReservationDocument>(
  {
    consumerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableId: { type: String, required: true },
    reservationDate: { type: Date, required: true },
    partySize: { type: Number, required: true, min: 1, max: 20 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
      default: 'pending',
    },
    specialRequests: { type: String, maxlength: 500 },
  } as any, {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

// Indexes
reservationSchema.index({ restaurantId: 1, reservationDate: 1 });
reservationSchema.index({ consumerId: 1, createdAt: -1 });

export const Reservation = mongoose.model<ReservationDocument>('Reservation', reservationSchema);
