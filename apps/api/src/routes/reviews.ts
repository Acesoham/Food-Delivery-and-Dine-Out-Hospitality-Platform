import { Router } from 'express';
import * as ctrl from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateReviewSchema } from 'shared-types';

const router: Router = Router();

// Submit a review (order / reservation / event / delivery_person)
router.post('/', authenticate, validate(CreateReviewSchema), ctrl.submitReview);

// Get public reviews for a restaurant
router.get('/restaurant/:id', ctrl.getRestaurantReviews);

// AI-powered prompts + keyword suggestions for any entity type
// GET /reviews/ai-prompts/:entityId?type=order|reservation|event|delivery_person
router.get('/ai-prompts/:entityId', authenticate, ctrl.getAiPrompts);

// Live points preview while user types
router.post('/preview-points', authenticate, ctrl.previewPoints);

// Check if user has already reviewed an entity
// GET /reviews/my-status/:entityId?type=order|reservation|event|delivery_person
router.get('/my-status/:entityId', authenticate, ctrl.getMyReviewStatus);

// Get current user's loyalty points + tier info
router.get('/my-points', authenticate, ctrl.getUserPoints);

export default router;
