import { Review } from '../models';
import { Order } from '../models';
import { Reservation } from '../models';
import { EventBooking } from '../models';
import { Restaurant } from '../models';
import { User } from '../models';
import type { CreateReviewInput, NlpAnalysis, PointsBreakdown, ReviewType } from 'shared-types';

// ─── Curated food/service keyword lists ─────────────────────────
const FOOD_KEYWORDS = [
  'delicious', 'tasty', 'fresh', 'crispy', 'spicy', 'tender', 'flavorful', 'juicy',
  'aromatic', 'savory', 'rich', 'light', 'heavy', 'bland', 'salty', 'sweet', 'bitter',
  'amazing', 'excellent', 'good', 'bad', 'cold', 'hot', 'warm', 'stale', 'soggy',
  'crunchy', 'soft', 'overcooked', 'undercooked', 'authentic', 'hygienic', 'clean',
];

const SERVICE_KEYWORDS = [
  'fast', 'quick', 'slow', 'prompt', 'friendly', 'rude', 'helpful', 'polite', 'attentive',
  'professional', 'courteous', 'responsive', 'efficient', 'delayed', 'timely',
];

const AMBIANCE_KEYWORDS = [
  'cozy', 'noisy', 'quiet', 'spacious', 'crowded', 'comfortable', 'beautiful', 'clean',
  'dirty', 'pleasant', 'relaxing', 'vibrant', 'atmospheric', 'elegant', 'casual',
];

const DELIVERY_KEYWORDS = [
  'packaging', 'sealed', 'intact', 'spilled', 'on-time', 'late', 'early', 'careful',
  'careful', 'professional', 'friendly', 'polite', 'rude', 'fast', 'slow',
];

const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'amazing', 'love', 'best', 'fresh', 'delicious',
  'wonderful', 'fantastic', 'perfect', 'tasty', 'awesome', 'outstanding', 'superb',
  'brilliant', 'fabulous', 'magnificent', 'terrific', 'lovely', 'splendid', 'exceptional',
  'recommend', 'worth', 'impressed', 'happy', 'satisfied', 'enjoyable', 'pleasant',
];

const NEGATIVE_WORDS = [
  'bad', 'terrible', 'worst', 'horrible', 'cold', 'stale', 'rude', 'slow', 'awful',
  'disgusting', 'disappointing', 'never', 'hate', 'poor', 'pathetic', 'unacceptable',
  'overpriced', 'soggy', 'bland', 'undercooked', 'overcooked', 'dirty', 'unprofessional',
];

// ─── Keyword Extraction via compromise.js ───────────────────────
const extractKeywords = async (text: string): Promise<string[]> => {
  try {
    const nlp = await import('compromise');
    const doc = nlp.default(text);

    const nouns = (doc.nouns().out('array') as string[]).map((s) => s.toLowerCase().trim());
    const adjectives = (doc.adjectives().out('array') as string[]).map((s) => s.toLowerCase().trim());
    const verbs = (doc.verbs().out('array') as string[]).map((s) => s.toLowerCase().trim());

    const allWords = text.toLowerCase().split(/\s+/);
    const domainMatches = allWords.filter((w) =>
      [...FOOD_KEYWORDS, ...SERVICE_KEYWORDS, ...AMBIANCE_KEYWORDS, ...DELIVERY_KEYWORDS].includes(w)
    );

    const combined = [...new Set([...domainMatches, ...nouns, ...adjectives, ...verbs])];
    // Filter to meaningful words (≥3 chars, not stopwords)
    const stopwords = new Set(['the', 'and', 'was', 'are', 'for', 'that', 'this', 'with', 'from', 'had', 'has', 'have', 'been', 'its', 'but', 'not', 'very']);
    return combined.filter((w) => w.length >= 3 && !stopwords.has(w)).slice(0, 15);
  } catch {
    // Fallback: simple domain keyword matching
    const words = text.toLowerCase().split(/\s+/);
    const allDomain = [...FOOD_KEYWORDS, ...SERVICE_KEYWORDS, ...AMBIANCE_KEYWORDS];
    return [...new Set(words.filter((w) => allDomain.includes(w)))];
  }
};

// ─── Sentiment Analysis (-1 to 1) ───────────────────────────────
const analyzeSentiment = (text: string): { score: number; label: 'positive' | 'neutral' | 'negative' } => {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  words.forEach((w) => {
    if (POSITIVE_WORDS.includes(w)) score += 1;
    if (NEGATIVE_WORDS.includes(w)) score -= 1;
  });

  const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(words.length * 0.1, 1)));
  const label = normalizedScore > 0.2 ? 'positive' : normalizedScore < -0.2 ? 'negative' : 'neutral';
  return { score: normalizedScore, label };
};

// ─── Enhanced Points Calculation (max 90 pts) ───────────────────
export const calculatePoints = (
  text: string,
  keywords: string[],
  hasMedia: boolean,
  rating = 3,
  sentimentScore = 0
): PointsBreakdown => {
  const wordCount = text.trim().split(/\s+/).length;

  const base = 10;
  let wordBonus = 0;
  let keywordBonus = 0;
  let mediaBonus = 0;
  let detailBonus = 0;
  let sentimentBonus = 0;
  let ratingBonus = 0;

  // Word count tiers
  if (wordCount >= 20) detailBonus = 5;
  if (wordCount >= 50) wordBonus += 15;
  if (wordCount >= 100) wordBonus += 15;

  // Keyword richness (max 20)
  keywordBonus = Math.min(keywords.length * 4, 20);

  // Media bonus
  if (hasMedia) mediaBonus = 15;

  // Positive sentiment bonus
  if (sentimentScore > 0.3) sentimentBonus = 5;

  // 5-star thoroughness bonus
  if (rating === 5) ratingBonus = 5;

  const total = Math.min(base + wordBonus + keywordBonus + mediaBonus + detailBonus + sentimentBonus + ratingBonus, 90);
  return { base, wordBonus, keywordBonus, mediaBonus, detailBonus, sentimentBonus, ratingBonus, total };
};

// ─── Fetch user's past review vocabulary ────────────────────────
const getUserReviewVocabulary = async (userId: string): Promise<string[]> => {
  try {
    const pastReviews = await Review.find({ consumerId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('nlpAnalysis.extractedKeywords')
      .lean();

    const vocab = pastReviews.flatMap((r) => (r as any).nlpAnalysis?.extractedKeywords || []);
    return [...new Set(vocab)].slice(0, 20);
  } catch {
    return [];
  }
};

// ─── Validate review entity ──────────────────────────────────────
const validateReviewEntity = async (input: CreateReviewInput, consumerId: string) => {
  switch (input.reviewType) {
    case 'order':
    case 'delivery_person': {
      if (!input.orderId) throw Object.assign(new Error('orderId required'), { statusCode: 400 });
      const order = await Order.findOne({ _id: input.orderId, consumerId, status: 'delivered' });
      if (!order) throw Object.assign(new Error('Order not found or not delivered yet'), { statusCode: 400 });
      // For delivery_person, check courier exists
      if (input.reviewType === 'delivery_person' && !order.courierId) {
        throw Object.assign(new Error('This order had no courier'), { statusCode: 400 });
      }
      return order;
    }
    case 'reservation': {
      if (!input.reservationId) throw Object.assign(new Error('reservationId required'), { statusCode: 400 });
      const res = await Reservation.findOne({ _id: input.reservationId, consumerId });
      if (!res) throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
      if (!['completed', 'confirmed'].includes(res.status)) {
        throw Object.assign(new Error('Reservation not yet completed'), { statusCode: 400 });
      }
      return res;
    }
    case 'event': {
      if (!input.eventBookingId) throw Object.assign(new Error('eventBookingId required'), { statusCode: 400 });
      const booking = await EventBooking.findOne({ _id: input.eventBookingId, userId: consumerId });
      if (!booking) throw Object.assign(new Error('Event booking not found'), { statusCode: 404 });
      return booking;
    }
    default:
      throw Object.assign(new Error('Invalid reviewType'), { statusCode: 400 });
  }
};

// ─── Check if entity already reviewed ───────────────────────────
const checkAlreadyReviewed = async (input: CreateReviewInput, consumerId: string) => {
  const query: any = { consumerId, reviewType: input.reviewType };
  if (input.reviewType === 'order' && input.orderId) query.orderId = input.orderId;
  if (input.reviewType === 'delivery_person' && input.orderId) {
    query.orderId = input.orderId;
  }
  if (input.reviewType === 'reservation' && input.reservationId) query.reservationId = input.reservationId;
  if (input.reviewType === 'event' && input.eventBookingId) query.eventBookingId = input.eventBookingId;

  const existing = await Review.findOne(query);
  if (existing) throw Object.assign(new Error('You have already reviewed this'), { statusCode: 409 });
};

// ─── Submit Review ───────────────────────────────────────────────
export const submitReview = async (consumerId: string, input: CreateReviewInput) => {
  const entity = await validateReviewEntity(input, consumerId);
  await checkAlreadyReviewed(input, consumerId);

  // NLP
  const keywords = await extractKeywords(input.text);
  const { score: sentimentScore, label: sentimentLabel } = analyzeSentiment(input.text);
  const wordCount = input.text.trim().split(/\s+/).length;
  const hasMedia = !!(input.media && input.media.length > 0);

  const nlpAnalysis: NlpAnalysis = {
    wordCount,
    keywordDensity: keywords.length / Math.max(wordCount, 1),
    sentimentScore,
    sentimentLabel,
    extractedKeywords: keywords,
    hasMedia,
  };

  const points = calculatePoints(input.text, keywords, hasMedia, input.rating, sentimentScore);

  // Build review doc
  const reviewDoc: any = {
    reviewType: input.reviewType || 'order',
    consumerId,
    rating: input.rating,
    text: input.text,
    media: input.media || [],
    nlpAnalysis,
    pointsAwarded: points.total,
    isVerified: true,
  };

  if (input.orderId) reviewDoc.orderId = input.orderId;
  if (input.reservationId) reviewDoc.reservationId = input.reservationId;
  if (input.eventBookingId) reviewDoc.eventBookingId = input.eventBookingId;
  if (input.restaurantId) reviewDoc.restaurantId = input.restaurantId;

  // For delivery_person reviews, get courierId from order
  if (input.reviewType === 'delivery_person' && input.orderId) {
    const order = entity as any;
    reviewDoc.deliveryPersonId = order.courierId;
  } else if (input.deliveryPersonId) {
    reviewDoc.deliveryPersonId = input.deliveryPersonId;
  }

  const review = await Review.create(reviewDoc);

  // Award loyalty points to reviewer
  await User.findByIdAndUpdate(consumerId, { $inc: { loyaltyPoints: points.total } });

  // Bonus: award 5 pts to delivery person for a delivery_person review
  if (input.reviewType === 'delivery_person' && reviewDoc.deliveryPersonId) {
    await User.findByIdAndUpdate(reviewDoc.deliveryPersonId, { $inc: { loyaltyPoints: 5 } });
  }

  // Update restaurant rating average for order / reservation reviews
  if (input.restaurantId) {
    const restaurant = await Restaurant.findById(input.restaurantId);
    if (restaurant) {
      const newCount = restaurant.rating.count + 1;
      const newAverage = (restaurant.rating.average * restaurant.rating.count + input.rating) / newCount;
      restaurant.rating = { average: Math.round(newAverage * 10) / 10, count: newCount };
      await restaurant.save();
    }
  }

  return { review, points };
};

// ─── Get Reviews for Restaurant ─────────────────────────────────
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
  return { data: reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

// ─── Get Review Status for Entity ────────────────────────────────
export const getMyReviewStatus = async (consumerId: string, entityId: string, type: ReviewType) => {
  const query: any = { consumerId, reviewType: type };
  if (type === 'order' || type === 'delivery_person') query.orderId = entityId;
  if (type === 'reservation') query.reservationId = entityId;
  if (type === 'event') query.eventBookingId = entityId;

  const existing = await Review.findOne(query).select('_id pointsAwarded createdAt');
  return { reviewed: !!existing, review: existing || null };
};

// ─── Get User Loyalty Info ────────────────────────────────────────
export const getUserLoyaltyInfo = async (userId: string) => {
  const user = await User.findById(userId).select('loyaltyPoints');
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  const totalPoints = user.loyaltyPoints || 0;

  // Tier thresholds: Bronze < 100, Silver < 500, Gold < 1500, Platinum >= 1500
  let tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  let tierProgress: number;
  let nextTierPoints: number;

  if (totalPoints < 100) {
    tier = 'Bronze';
    tierProgress = Math.round((totalPoints / 100) * 100);
    nextTierPoints = 100 - totalPoints;
  } else if (totalPoints < 500) {
    tier = 'Silver';
    tierProgress = Math.round(((totalPoints - 100) / 400) * 100);
    nextTierPoints = 500 - totalPoints;
  } else if (totalPoints < 1500) {
    tier = 'Gold';
    tierProgress = Math.round(((totalPoints - 500) / 1000) * 100);
    nextTierPoints = 1500 - totalPoints;
  } else {
    tier = 'Platinum';
    tierProgress = 100;
    nextTierPoints = 0;
  }

  // Recent point awards from reviews
  const recentReviews = await Review.find({ consumerId: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('pointsAwarded reviewType createdAt');

  const recentAwards = recentReviews.map((r) => ({
    points: r.pointsAwarded,
    reason: `${r.reviewType.replace('_', ' ')} review`,
    date: (r as any).createdAt,
  }));

  return { totalPoints, tier, tierProgress, nextTierPoints, recentAwards };
};

// ─── Generate AI Review Prompts (NLP-enriched) ──────────────────
export const generateReviewPrompts = async (
  entityId: string,
  consumerId: string,
  type: ReviewType = 'order'
) => {
  // Get user's past review vocabulary for personalization
  const userVocab = await getUserReviewVocabulary(consumerId);

  switch (type) {
    case 'order': {
      const order = await Order.findOne({ _id: entityId, consumerId });
      if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

      const itemNames = order.items.map((i) => i.name);
      const primaryItem = itemNames[0] || 'your meal';
      const itemList = itemNames.length > 1 ? 'these dishes' : `the ${primaryItem}`;

      // Extract topic words from item names using compromise
      let itemKeywords: string[] = [];
      try {
        const nlp = await import('compromise');
        itemNames.forEach((name) => {
          const doc = nlp.default(name);
          const words = (doc.nouns().out('array') as string[]).map((s) => s.toLowerCase());
          itemKeywords.push(...words);
        });
        itemKeywords = [...new Set(itemKeywords)];
      } catch {
        itemKeywords = itemNames.flatMap((n) => n.toLowerCase().split(' ')).slice(0, 5);
      }

      // Personalized keyword suggestions (user's most-used + domain)
      const suggestedKeywords = [
        ...new Set([
          ...itemKeywords,
          ...userVocab.slice(0, 5),
          'fresh', 'tasty', 'packaging', 'delivery', 'value',
        ]),
      ].slice(0, 10);

      return {
        prompts: [
          {
            question: `How was the ${primaryItem}? Was it fresh and well-prepared?`,
            category: 'food_quality' as const,
            keywords: [...new Set([...itemKeywords, 'fresh', 'prepared', 'quality', 'taste'])].slice(0, 6),
          },
          {
            question: 'How was the delivery speed and packaging condition?',
            category: 'service' as const,
            keywords: ['fast', 'packaging', 'delivery', 'condition', 'sealed', 'intact'],
          },
          {
            question: `Would you order ${itemList} again? What stood out?`,
            category: 'value' as const,
            keywords: ['value', 'price', 'worth', 'recommend', 'again', 'portion'],
          },
          {
            question: 'Describe the overall experience — what made it memorable?',
            category: 'ambiance' as const,
            keywords: ['experience', 'overall', 'recommend', 'impressed', 'satisfied'],
          },
        ],
        suggestedKeywords,
      };
    }

    case 'delivery_person': {
      const order = await Order.findOne({ _id: entityId, consumerId });
      if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
      const suggestedKeywords = [
        ...new Set([...userVocab.slice(0, 3), 'friendly', 'fast', 'professional', 'packaging', 'careful', 'polite', 'on-time']),
      ].slice(0, 10);
      return {
        prompts: [
          {
            question: 'How was the delivery partner — were they on time and professional?',
            category: 'delivery' as const,
            keywords: ['on-time', 'professional', 'friendly', 'fast', 'reliable'],
          },
          {
            question: 'Was the food packaging intact and well-maintained during delivery?',
            category: 'service' as const,
            keywords: ['packaging', 'intact', 'sealed', 'careful', 'condition'],
          },
          {
            question: 'How was your overall interaction with the delivery partner?',
            category: 'service' as const,
            keywords: ['polite', 'courteous', 'responsive', 'helpful', 'pleasant'],
          },
        ],
        suggestedKeywords,
      };
    }

    case 'reservation': {
      const reservation = await Reservation.findOne({ _id: entityId, consumerId });
      if (!reservation) throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
      const suggestedKeywords = [
        ...new Set([...userVocab.slice(0, 3), 'ambiance', 'service', 'attentive', 'cozy', 'spacious', 'quiet', 'clean']),
      ].slice(0, 10);
      return {
        prompts: [
          {
            question: `How was the table setup and ambiance for your dining experience?`,
            category: 'ambiance' as const,
            keywords: ['ambiance', 'cozy', 'comfortable', 'clean', 'decor', 'quiet'],
          },
          {
            question: 'How attentive was the staff and how was the service quality?',
            category: 'service' as const,
            keywords: ['attentive', 'friendly', 'helpful', 'prompt', 'professional', 'service'],
          },
          {
            question: 'Was the food quality up to the expectations for a dine-in experience?',
            category: 'food_quality' as const,
            keywords: ['fresh', 'flavorful', 'hot', 'presentation', 'portion', 'quality'],
          },
          {
            question: 'Would you recommend this restaurant for a dine-in occasion?',
            category: 'value' as const,
            keywords: ['value', 'worth', 'recommend', 'experience', 'occasion'],
          },
        ],
        suggestedKeywords,
      };
    }

    case 'event': {
      const booking = await EventBooking.findOne({ _id: entityId, userId: consumerId });
      if (!booking) throw Object.assign(new Error('Event booking not found'), { statusCode: 404 });
      const suggestedKeywords = [
        ...new Set([...userVocab.slice(0, 3), 'organised', 'venue', 'crowd', 'entertainment', 'fun', 'memorable']),
      ].slice(0, 10);
      return {
        prompts: [
          {
            question: 'How well was the event organized — logistics, timing, and management?',
            category: 'event' as const,
            keywords: ['organised', 'timing', 'management', 'smooth', 'schedule', 'staff'],
          },
          {
            question: 'How was the venue — space, décor, and overall atmosphere?',
            category: 'ambiance' as const,
            keywords: ['venue', 'spacious', 'decor', 'atmosphere', 'comfortable', 'clean'],
          },
          {
            question: 'Was the entertainment / content of the event engaging and worth attending?',
            category: 'event' as const,
            keywords: ['entertainment', 'engaging', 'fun', 'memorable', 'worthwhile', 'enjoyable'],
          },
          {
            question: 'Overall, how was your experience? Would you attend a similar event?',
            category: 'value' as const,
            keywords: ['overall', 'recommend', 'worth', 'attend', 'value', 'satisfied'],
          },
        ],
        suggestedKeywords,
      };
    }

    default:
      throw Object.assign(new Error('Invalid review type'), { statusCode: 400 });
  }
};
