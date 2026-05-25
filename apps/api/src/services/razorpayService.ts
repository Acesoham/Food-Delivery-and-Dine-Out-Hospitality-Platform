import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay Order
 * @param amountInRupees - Amount in ₹ (will be converted to paise internally)
 * @param receipt - Unique receipt identifier (orderId or bookingId)
 */
export const createRazorpayOrder = async (
  amountInRupees: number,
  receipt: string
): Promise<{ id: string; amount: number; currency: string }> => {
  const amountInPaise = Math.round(amountInRupees * 100); // Razorpay uses paise

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    payment_capture: true, // auto-capture
  } as any);

  return {
    id: order.id,
    amount: order.amount as number,
    currency: order.currency,
  };
};

/**
 * Verify Razorpay payment signature
 * Signature = HMAC-SHA256(key_secret, `${razorpay_order_id}|${razorpay_payment_id}`)
 */
export const verifyRazorpaySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpaySignature;
};
