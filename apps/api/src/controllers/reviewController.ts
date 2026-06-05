import { Request, Response, NextFunction } from 'express';
import * as reviewService from '../services/reviewService';
import type { ReviewType } from 'shared-types';

export const submitReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await reviewService.submitReview(req.user!._id.toString(), req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const getRestaurantReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const result = await reviewService.getRestaurantReviews(String(req.params.id), page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};


export const getAiPrompts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = (Array.isArray(req.query.type) ? req.query.type[0] : req.query.type as ReviewType) || 'order';
    const result = await reviewService.generateReviewPrompts(
      req.params.entityId as string,
      req.user!._id.toString(),
      type as ReviewType
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const previewPoints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, media, rating } = req.body;
    if (!text) {
      res.status(400).json({ success: false, error: 'Review text required' });
      return;
    }
    // Quick keyword extraction (sync fallback)
    const words = text.toLowerCase().split(/\s+/);
    const FOOD_KW = ['delicious', 'tasty', 'fresh', 'crispy', 'spicy', 'tender', 'flavorful', 'juicy', 'amazing', 'excellent', 'good', 'bad', 'cold', 'hot', 'warm', 'fast', 'slow', 'friendly', 'rude', 'clean', 'packaging', 'sealed', 'on-time'];
    const keywords = [...new Set(words.filter((w: string) => FOOD_KW.includes(w)))] as string[];
    const hasMedia = !!(media?.length);

    const sentimentPos = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'fresh', 'delicious', 'wonderful', 'perfect', 'tasty', 'awesome'];
    const sentimentNeg = ['bad', 'terrible', 'worst', 'horrible', 'cold', 'stale', 'rude', 'slow', 'awful'];
    let sentimentRaw = 0;
    words.forEach((w: string) => {
      if (sentimentPos.includes(w)) sentimentRaw++;
      if (sentimentNeg.includes(w)) sentimentRaw--;
    });
    const sentimentScore = Math.max(-1, Math.min(1, sentimentRaw / Math.max(words.length * 0.1, 1)));

    const points = reviewService.calculatePoints(text, keywords, hasMedia, rating || 3, sentimentScore);
    res.json({ success: true, data: points });
  } catch (error) {
    next(error);
  }
};

export const getMyReviewStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = (Array.isArray(req.query.type) ? req.query.type[0] : req.query.type as string) as ReviewType || 'order';
    const result = await reviewService.getMyReviewStatus(
      req.user!._id.toString(),
      req.params.entityId as string,
      type
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const getUserPoints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await reviewService.getUserLoyaltyInfo(req.user!._id.toString());
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};
