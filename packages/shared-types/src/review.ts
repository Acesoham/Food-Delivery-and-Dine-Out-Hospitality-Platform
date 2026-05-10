import { z } from 'zod';

// ─── Create Review ───
export const CreateReviewSchema = z.object({
  orderId: z.string(),
  restaurantId: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10, 'Review must be at least 10 characters'),
  media: z.array(z.string().url()).max(5).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ─── NLP Analysis Result ───
export interface NlpAnalysis {
  wordCount: number;
  keywordDensity: number;
  sentimentScore: number; // -1 to 1
  extractedKeywords: string[];
  hasMedia: boolean;
}

// ─── Review Response ───
export interface IReview {
  _id: string;
  orderId: string;
  consumerId: string;
  restaurantId: string;
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
  category: 'food_quality' | 'service' | 'ambiance' | 'value';
  keywords: string[];
}

// ─── Points Breakdown (for UI preview) ───
export interface PointsBreakdown {
  base: number;
  wordBonus: number;
  keywordBonus: number;
  mediaBonus: number;
  detailBonus: number;
  total: number;
}
