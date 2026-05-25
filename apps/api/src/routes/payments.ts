import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createPaymentOrder, verifyPayment, simulateUpiPayment } from '../controllers/paymentController';

const router: Router = Router();

// Create a Razorpay order (returns razorpay_order_id, amount, key_id)
router.post('/create-order', authenticate, createPaymentOrder);

// Verify Razorpay payment signature and mark as paid
router.post('/verify', authenticate, verifyPayment);

// TEST MODE ONLY: Simulate a UPI payment (marks order/booking as paid without real Razorpay signature)
router.post('/simulate-upi', authenticate, simulateUpiPayment);

export default router;
