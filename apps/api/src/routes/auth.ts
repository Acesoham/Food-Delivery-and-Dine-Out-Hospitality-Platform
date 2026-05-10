import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { RegisterSchema, LoginSchema } from 'shared-types';

const router:Router = Router();

// Rate limit login/register attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, validate(RegisterSchema), authController.register);
router.post('/login', authLimiter, validate(LoginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
