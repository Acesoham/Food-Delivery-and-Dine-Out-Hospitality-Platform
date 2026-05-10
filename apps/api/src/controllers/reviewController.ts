import { Request, Response, NextFunction } from 'express';
import * as reviewService from '../services/reviewService';

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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await reviewService.getRestaurantReviews((req.params.id as string), page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getAiPrompts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompts = await reviewService.generateReviewPrompts(
      (req.params.orderId as string),
      req.user!._id.toString()
    );
    res.json({ success: true, data: prompts });
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
    const { text, media } = req.body;
    if (!text) {
      res.status(400).json({ success: false, error: 'Review text required' });
      return;
    }
    const keywords = text.split(/\s+/).slice(0, 10); // Simple preview
    const points = reviewService.calculatePoints(text, keywords, !!(media?.length));
    res.json({ success: true, data: points });
  } catch (error) {
    next(error);
  }
};
