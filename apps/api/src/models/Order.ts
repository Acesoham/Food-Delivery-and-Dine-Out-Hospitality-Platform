import mongoose, { Schema, Document } from 'mongoose';
import type { IOrder } from 'shared-types';

export interface OrderDocument extends Omit<IOrder, '_id'>, Document {}

const orderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    consumerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    courierId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['delivery', 'dine-in'], required: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'preparing', 'ready', 'courier_assigned', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    payment: {
      stripeSessionId: String,
      stripePaymentIntentId: String,
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      method: {
        type: String,
        enum: ['card', 'mock'],
        default: 'card',
      },
    },
    deliveryAddress: {
      street: String,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
      },
    },
    tableReservation: {
      tableId: String,
      reservationDate: Date,
      partySize: Number,
    },
    courierLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number],
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    estimatedDeliveryTime: Date,
  } as any, {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

// Indexes

orderSchema.index({ consumerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ courierId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.model<OrderDocument>('Order', orderSchema);
