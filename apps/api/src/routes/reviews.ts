import { Router } from 'express';
import * as ctrl from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateReviewSchema } from 'shared-types';

const router: Router = Router();

router.post('/', authenticate, validate(CreateReviewSchema), ctrl.submitReview);
router.get('/restaurant/:id', ctrl.getRestaurantReviews);
router.get('/ai-prompts/:orderId', authenticate, ctrl.getAiPrompts);
router.post('/preview-points', authenticate, ctrl.previewPoints);

export default router;
