import { z } from 'zod';

// ─── Review Type Discriminator ───
export type ReviewType = 'order' | 'reservation' | 'event' | 'delivery_person';

// ─── Create Review ───
export const CreateReviewSchema = z.object({
  reviewType: z.enum(['order', 'reservation', 'event', 'delivery_person']).default('order'),
  // Entity references — only the relevant one is required depending on reviewType
  orderId: z.string().optional(),
  reservationId: z.string().optional(),
  eventBookingId: z.string().optional(),
  deliveryPersonId: z.string().optional(),
  restaurantId: z.string().optional(),
  restaurantName: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10, 'Review must be at least 10 characters'),
  media: z.array(z.string()).max(5).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ─── NLP Analysis Result ───
export interface NlpAnalysis {
  wordCount: number;
  keywordDensity: number;
  sentimentScore: number; // -1 to 1
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  extractedKeywords: string[];
  hasMedia: boolean;
}

// ─── Review Response ───
export interface IReview {
  _id: string;
  reviewType: ReviewType;
  orderId?: string;
  reservationId?: string;
  eventBookingId?: string;
  deliveryPersonId?: string;
  consumerId: string;
  restaurantId?: string;
  rating: number;
  text: string;
  media?: string[];
  nlpAnalysis: NlpAnalysis;
  pointsAwarded: number;
  isVerified: boolean;
  createdAt: string;
}

// ─── AI Review Prompt ───
export interface ReviewPrompt {
  question: string;
  category: 'food_quality' | 'service' | 'ambiance' | 'value' | 'delivery' | 'event';
  keywords: string[];
}

// ─── Points Breakdown (for UI preview) ───
export interface PointsBreakdown {
  base: number;
  wordBonus: number;
  keywordBonus: number;
  mediaBonus: number;
  detailBonus: number;
  sentimentBonus: number;
  ratingBonus: number;
  total: number;
}

// ─── User Loyalty Points Info ───
export interface LoyaltyInfo {
  totalPoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tierProgress: number; // 0-100%
  nextTierPoints: number;
  recentAwards: Array<{
    points: number;
    reason: string;
    date: string;
  }>;
}
