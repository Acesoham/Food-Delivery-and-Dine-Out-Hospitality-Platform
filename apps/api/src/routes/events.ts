import { Router } from 'express';
import * as ctrl from '../controllers/eventController';
import { authenticate, requireRole } from '../middleware/auth';

const router: Router = Router();

// ── Public routes ──────────────────────────────────────────────
router.get('/browse', ctrl.browseEvents);
router.get('/locations', ctrl.getLocations);
router.get('/:id', ctrl.getEventById);

// ── Consumer routes ────────────────────────────────────────────
router.post('/:id/book', authenticate, requireRole('consumer', 'admin'), ctrl.bookEvent);
router.get('/bookings/mine', authenticate, requireRole('consumer', 'admin'), ctrl.getUserBookings);
router.patch('/bookings/:bookingId/cancel', authenticate, requireRole('consumer', 'admin'), ctrl.cancelBooking);

// ── Event organizer routes ─────────────────────────────────────
router.post('/', authenticate, requireRole('event_organizer', 'admin'), ctrl.createEvent);
router.get('/organizer/my-events', authenticate, requireRole('event_organizer', 'admin'), ctrl.getOrganizerEvents);
router.patch('/:id', authenticate, requireRole('event_organizer', 'admin'), ctrl.updateEvent);
router.patch('/:id/toggle', authenticate, requireRole('event_organizer', 'admin'), ctrl.toggleEvent);
router.get('/:id/bookings', authenticate, requireRole('event_organizer', 'admin'), ctrl.getEventBookings);

export default router;
