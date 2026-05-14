import { Router } from 'express';
import * as ctrl from '../controllers/reservationController';
import { authenticate, requireRole } from '../middleware/auth';

const router: Router = Router();

// Consumer routes - must be authenticated
router.post('/', authenticate, ctrl.createReservation);
router.get('/my-reservations', authenticate, ctrl.getMyReservations);
router.get('/:id', authenticate, ctrl.getReservationById);
router.patch('/:id/cancel', authenticate, ctrl.cancelReservation);

// Merchant routes
router.get('/restaurant/:restaurantId', authenticate, requireRole('merchant', 'admin'), ctrl.getRestaurantReservations);
router.patch('/:id/status', authenticate, requireRole('merchant', 'admin'), ctrl.updateReservationStatus);

export default router;
