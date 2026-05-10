import { Router } from 'express';
import * as ctrl from '../controllers/orderController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateOrderSchema, UpdateOrderStatusSchema } from 'shared-types';

const router:Router = Router();

// Consumer routes
router.post('/', authenticate, validate(CreateOrderSchema), ctrl.createOrder);
router.get('/my-orders', authenticate, ctrl.getMyOrders);
router.get('/:id', authenticate, ctrl.getOrderById);

// Status update (merchant, courier)
router.patch('/:id/status', authenticate, requireRole('merchant', 'courier', 'admin'), validate(UpdateOrderStatusSchema), ctrl.updateStatus);

// Restaurant orders (merchant)
router.get('/restaurant/:id', authenticate, requireRole('merchant', 'admin'), ctrl.getRestaurantOrders);

// Courier routes
router.get('/courier/available', authenticate, requireRole('courier'), ctrl.getAvailableDeliveries);
router.post('/:id/accept-delivery', authenticate, requireRole('courier'), ctrl.acceptDelivery);

export default router;
