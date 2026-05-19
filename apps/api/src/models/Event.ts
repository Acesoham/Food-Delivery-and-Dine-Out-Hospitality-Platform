import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent {
  _id: string;
  organizerId: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  date: Date;
  endDate?: Date;
  venue: {
    name: string;
    address: string;
    country: string;
    state: string;
    district: string;
    city: string;
    pincode?: string;
    location?: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat]
    };
  };
  ticketPrice: number;
  totalSeats: number;
  availableSeats: number;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventDocument extends Omit<IEvent, '_id'>, Document {}

const eventSchema = new Schema<EventDocument>(
  {
    organizerId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String },
    date: { type: Date, required: true },
    endDate: { type: Date },
    venue: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      country: { type: String, required: true },
      state: { type: String, required: true },
      district: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String },
      location: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] }, // [lng, lat]
      },
    },
    ticketPrice: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String }],
  } as any,
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

eventSchema.index({ 'venue.location': '2dsphere' }, { sparse: true });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ 'venue.country': 1, 'venue.state': 1, 'venue.district': 1, 'venue.city': 1 });
eventSchema.index({ date: 1, isActive: 1 });

export const Event = mongoose.model<EventDocument>('Event', eventSchema);
