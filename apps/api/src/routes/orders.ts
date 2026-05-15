import { Router } from 'express';
import * as ctrl from '../controllers/orderController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateOrderSchema, UpdateOrderStatusSchema } from 'shared-types';

const router: Router = Router();

// Consumer routes
router.post('/', authenticate, validate(CreateOrderSchema), ctrl.createOrder);
router.get('/my-orders', authenticate, ctrl.getMyOrders);

// Courier routes  ← MUST be before /:id to avoid Express matching 'courier' as an ID
router.get('/courier/available', authenticate, requireRole('courier'), ctrl.getAvailableDeliveries);
router.get('/courier/my-deliveries', authenticate, requireRole('courier'), ctrl.getMyCourierOrders);
router.post('/:id/accept-delivery', authenticate, requireRole('courier'), ctrl.acceptDelivery);

// Restaurant orders (merchant)
router.get('/restaurant/:id', authenticate, requireRole('merchant', 'admin'), ctrl.getRestaurantOrders);

// Status update (merchant, courier)
router.patch('/:id/status', authenticate, requireRole('merchant', 'courier', 'admin'), validate(UpdateOrderStatusSchema), ctrl.updateStatus);

// Generic order by ID — must be LAST among GET routes
router.get('/:id', authenticate, ctrl.getOrderById);

export default router;
