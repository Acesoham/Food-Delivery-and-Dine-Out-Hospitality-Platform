import { Router } from 'express';
import * as ctrl from '../controllers/restaurantController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateRestaurantSchema, CreateMenuItemSchema, DiscoverQuerySchema } from 'shared-types';

const router:Router = Router();

// Public routes
router.get('/discover', validate(DiscoverQuerySchema, 'query'), ctrl.discover);
router.get('/:id', ctrl.getById);
router.get('/:id/menu', ctrl.getMenu);

// Merchant routes
router.post('/', authenticate, requireRole('merchant', 'admin'), validate(CreateRestaurantSchema), ctrl.create);
router.patch('/:id', authenticate, requireRole('merchant', 'admin'), ctrl.update);
router.get('/merchant/my-restaurants', authenticate, requireRole('merchant', 'admin'), ctrl.getMyRestaurants);

// Menu management (merchant)
router.post('/:id/menu', authenticate, requireRole('merchant', 'admin'), validate(CreateMenuItemSchema), ctrl.addMenuItem);
router.patch('/:id/menu/:itemId', authenticate, requireRole('merchant', 'admin'), ctrl.updateMenuItem);
router.delete('/:id/menu/:itemId', authenticate, requireRole('merchant', 'admin'), ctrl.deleteMenuItem);

export default router;
