import mongoose, { Schema, Document } from 'mongoose';
import type { IReview } from 'shared-types';

export interface ReviewDocument extends Omit<IReview, '_id'>, Document {}

const reviewSchema = new Schema<ReviewDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    consumerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, minlength: 10 },
    media: [{ type: String }],
    nlpAnalysis: {
      wordCount: { type: Number, default: 0 },
      keywordDensity: { type: Number, default: 0 },
      sentimentScore: { type: Number, default: 0 },
      extractedKeywords: [{ type: String }],
      hasMedia: { type: Boolean, default: false },
    },
    pointsAwarded: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
  } as any, {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

// Indexes
reviewSchema.index({ restaurantId: 1, createdAt: -1 });
reviewSchema.index({ consumerId: 1 });


export const Review = mongoose.model<ReviewDocument>('Review', reviewSchema);
