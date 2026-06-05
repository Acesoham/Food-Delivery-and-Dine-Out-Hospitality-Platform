import mongoose, { Schema, Document } from 'mongoose';
import type { IReview, ReviewType } from 'shared-types';

export interface ReviewDocument extends Omit<IReview, '_id'>, Document {}

const reviewSchema = new Schema<ReviewDocument>(
  {
    reviewType: {
      type: String,
      enum: ['order', 'reservation', 'event', 'delivery_person'],
      default: 'order',
    },
    // Entity references — indexes defined explicitly below via reviewSchema.index()
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation' },
    eventBookingId: { type: Schema.Types.ObjectId, ref: 'EventBooking' },
    deliveryPersonId: { type: Schema.Types.ObjectId, ref: 'User' },
    consumerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', sparse: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, minlength: 10 },
    media: [{ type: String }],
    nlpAnalysis: {
      wordCount: { type: Number, default: 0 },
      keywordDensity: { type: Number, default: 0 },
      sentimentScore: { type: Number, default: 0 },
      sentimentLabel: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
      extractedKeywords: [{ type: String }],
      hasMedia: { type: Boolean, default: false },
    },
    pointsAwarded: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
  } as any,
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

// Indexes
reviewSchema.index({ restaurantId: 1, createdAt: -1 });
reviewSchema.index({ consumerId: 1 });
// orderId is NOT globally unique — same order can have 'order' + 'delivery_person' reviews.
// Uniqueness per (consumerId + reviewType + orderId) is enforced at service level.
reviewSchema.index({ orderId: 1 }, { sparse: true });
reviewSchema.index({ reservationId: 1 }, { sparse: true });
reviewSchema.index({ eventBookingId: 1 }, { sparse: true });
reviewSchema.index({ deliveryPersonId: 1 }, { sparse: true });
// Compound index for fast "already reviewed?" checks
reviewSchema.index({ consumerId: 1, reviewType: 1, orderId: 1 }, { sparse: true });
reviewSchema.index({ consumerId: 1, reviewType: 1, reservationId: 1 }, { sparse: true });
reviewSchema.index({ consumerId: 1, reviewType: 1, eventBookingId: 1 }, { sparse: true });


export const Review = mongoose.model<ReviewDocument>('Review', reviewSchema);
