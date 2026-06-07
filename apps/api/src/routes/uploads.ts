import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/uploadController';
import { authenticate, requireRole } from '../middleware/auth';

const router: Router = Router();

// Memory storage — 5MB limit, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
    } else {
      cb(null, true);
    }
  },
});

// ─── Public: serve an image by its MongoDB _id ───
router.get('/images/:id', ctrl.serveImage);

// ─── Merchant: upload restaurant banner image ───
router.post(
  '/uploads/restaurant/:restaurantId/image',
  authenticate,
  requireRole('merchant', 'admin'),
  upload.single('image'),
  ctrl.uploadRestaurantImage
);

// ─── Merchant: upload menu-item food photo ───
router.post(
  '/uploads/restaurant/:restaurantId/menu/:itemId/image',
  authenticate,
  requireRole('merchant', 'admin'),
  upload.single('image'),
  ctrl.uploadMenuItemImage
);

// ─── Merchant: upload UPI QR code image ───
router.post(
  '/uploads/restaurant/:restaurantId/upi-qr',
  authenticate,
  requireRole('merchant', 'admin'),
  upload.single('image'),
  ctrl.uploadRestaurantUpiQr
);

export default router;
