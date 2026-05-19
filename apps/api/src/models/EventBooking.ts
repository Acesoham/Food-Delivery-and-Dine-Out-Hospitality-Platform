import mongoose, { Schema, Document } from 'mongoose';

export interface IEventBooking {
  _id: string;
  eventId: string;
  userId: string;
  tickets: number;
  totalAmount: number;
  status: 'confirmed' | 'cancelled';
  paymentMethod: 'online' | 'cod';
  paymentStatus: 'pending' | 'completed';
  bookingRef: string;
  createdAt: Date;
}

export interface EventBookingDocument extends Omit<IEventBooking, '_id'>, Document {}

const eventBookingSchema = new Schema<EventBookingDocument>(
  {
    eventId: { type: Schema.Types.ObjectId as any, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
    tickets: { type: Number, required: true, min: 1, max: 10 },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    paymentMethod: { type: String, enum: ['online', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    bookingRef: { type: String, required: true, unique: true },
  } as any,
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

eventBookingSchema.index({ userId: 1, eventId: 1 });
eventBookingSchema.index({ eventId: 1, status: 1 });

export const EventBooking = mongoose.model<EventBookingDocument>('EventBooking', eventBookingSchema);
