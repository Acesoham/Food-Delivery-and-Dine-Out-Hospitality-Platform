import { Review } from '../models';
import { Order } from '../models';
import { Restaurant } from '../models';
import { User } from '../models';
import type { CreateReviewInput, NlpAnalysis, PointsBreakdown } from 'shared-types';

/**
 * Extract keywords from review text using simple NLP
 * Uses compromise.js for noun/adjective extraction
 */
const extractKeywords = async (text: string): Promise<string[]> => {
  try {
    const nlp = await import('compromise');
    const doc = nlp.default(text);
    const nouns = doc.nouns().out('array') as string[];
    const adjectives = doc.adjectives().out('array') as string[];
    // Combine and deduplicate
    return [...new Set([...nouns, ...adjectives])].slice(0, 15);
  } catch {
    // Fallback: simple word extraction
    const words = text.toLowerCase().split(/\s+/);
    const foodKeywords = [
      'delicious', 'tasty', 'fresh', 'crispy', 'spicy', 'tender',
      'flavorful', 'amazing', 'excellent', 'good', 'bad', 'cold',
      'hot', 'warm', 'slow', 'fast', 'friendly', 'rude', 'clean',
    ];
    return words.filter((w) => foodKeywords.includes(w));
  }
};

/**
 * Simple sentiment analysis (-1 to 1)
 */
const analyzeSentiment = (text: string): number => {
  const positive = [
    'good', 'great', 'excellent', 'amazing', 'love', 'best', 'fresh',
    'delicious', 'wonderful', 'fantastic', 'perfect', 'tasty', 'awesome',
  ];
  const negative = [
    'bad', 'terrible', 'worst', 'horrible', 'cold', 'stale', 'rude',
    'slow', 'awful', 'disgusting', 'disappointing', 'never',
  ];

  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  words.forEach((w) => {
    if (positive.includes(w)) score += 1;
    if (negative.includes(w)) score -= 1;
  });

  return Math.max(-1, Math.min(1, score / Math.max(words.length * 0.1, 1)));
};

/**
 * Calculate gamified review points
 */
export const calculatePoints = (text: string, keywords: string[], hasMedia: boolean): PointsBreakdown => {
  const wordCount = text.split(/\s+/).length;

  let base = 10;
  let wordBonus = 0;
  let keywordBonus = 0;
  let mediaBonus = 0;
  let detailBonus = 0;

  // Word count bonus (max 30)
  if (wordCount >= 50) wordBonus += 15;
  if (wordCount >= 100) wordBonus += 15;

  // Keyword relevance (max 20)
  keywordBonus = Math.min(keywords.length * 4, 20);

  // Media bonus (max 15)
  if (hasMedia) mediaBonus = 15;

  // Detail bonus (5 if > 20 words)
  if (wordCount >= 20) detailBonus = 5;

  const total = Math.min(base + wordBonus + keywordBonus + mediaBonus + detailBonus, 80);

  return { base, wordBonus, keywordBonus, mediaBonus, detailBonus, total };
};

/**
 * Submit a review with NLP analysis and gamification
 */
export const submitReview = async (consumerId: string, input: CreateReviewInput) => {
  // Check order belongs to consumer and is delivered
  const order = await Order.findOne({
    _id: input.orderId,
    consumerId,
    status: 'delivered',
  });
  if (!order) {
    throw Object.assign(new Error('Order not found or not delivered yet'), { statusCode: 400 });
  }

  // Check if already reviewed
  const existingReview = await Review.findOne({ orderId: input.orderId });
  if (existingReview) {
    throw Object.assign(new Error('Order already reviewed'), { statusCode: 409 });
  }

  // NLP Analysis
  const keywords = await extractKeywords(input.text);
  const sentiment = analyzeSentiment(input.text);
  const wordCount = input.text.split(/\s+/).length;
  const hasMedia = !!(input.media && input.media.length > 0);

  const nlpAnalysis: NlpAnalysis = {
    wordCount,
    keywordDensity: keywords.length / Math.max(wordCount, 1),
    sentimentScore: sentiment,
    extractedKeywords: keywords,
    hasMedia,
  };

  // Calculate points
  const points = calculatePoints(input.text, keywords, hasMedia);

  // Create review
  const review = await Review.create({
    orderId: input.orderId,
    consumerId,
    restaurantId: input.restaurantId,
    rating: input.rating,
    text: input.text,
    media: input.media || [],
    nlpAnalysis,
    pointsAwarded: points.total,
    isVerified: true,
  });

  // Award loyalty points to user
  await User.findByIdAndUpdate(consumerId, {
    $inc: { loyaltyPoints: points.total },
  });

  // Update restaurant's rolling average rating
  const restaurant = await Restaurant.findById(input.restaurantId);
  if (restaurant) {
    const newCount = restaurant.rating.count + 1;
    const newAverage =
      (restaurant.rating.average * restaurant.rating.count + input.rating) / newCount;
    restaurant.rating = {
      average: Math.round(newAverage * 10) / 10,
      count: newCount,
    };
    await restaurant.save();
  }

  return { review, points };
};

/**
 * Get reviews for a restaurant
 */
export const getRestaurantReviews = async (restaurantId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ restaurantId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('consumerId', 'profile.firstName profile.lastName profile.avatar'),
    Review.countDocuments({ restaurantId }),
  ]);

  return {
    data: reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Generate AI review prompts based on order items
 */
export const generateReviewPrompts = async (orderId: string, consumerId: string) => {
  const order = await Order.findOne({ _id: orderId, consumerId });
  if (!order) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  const itemNames = order.items.map((i) => i.name);

  // Template-based prompts (fallback, always available)
  const prompts = [
    {
      question: `How was the ${itemNames[0]}? Was it fresh and well-prepared?`,
      category: 'food_quality' as const,
      keywords: ['fresh', 'prepared', 'taste', 'quality'],
    },
    {
      question: 'How was the delivery speed and packaging?',
      category: 'service' as const,
      keywords: ['fast', 'packaging', 'delivery', 'condition'],
    },
    {
      question: `Would you order ${itemNames.length > 1 ? 'these items' : itemNames[0]} again? Why?`,
      category: 'value' as const,
      keywords: ['value', 'price', 'worth', 'recommend'],
    },
    {
      question: 'Describe the overall dining experience in your own words.',
      category: 'ambiance' as const,
      keywords: ['experience', 'atmosphere', 'vibe', 'overall'],
    },
  ];

  return prompts;
};
