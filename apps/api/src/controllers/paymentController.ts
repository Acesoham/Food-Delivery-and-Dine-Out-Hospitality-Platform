import { Request, Response, NextFunction } from 'express';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpayService';
import { Order } from '../models';
import { EventBooking } from '../models/EventBooking';
import { Reservation } from '../models/Reservation';

/**
 * POST /payments/create-order
 * Creates a Razorpay order for a pending food order, event booking, or table reservation.
 */
export const createPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, refId } = req.body as { type: 'order' | 'event' | 'reservation'; refId: string };

    if (!type || !refId) {
      res.status(400).json({ success: false, error: 'type and refId are required' });
      return;
    }

    let amount: number;
    let receipt: string;

    if (type === 'order') {
      const order = await Order.findById(refId);
      if (!order) { res.status(404).json({ success: false, error: 'Order not found' }); return; }
      if (order.payment?.status === 'paid') { res.status(400).json({ success: false, error: 'Order already paid' }); return; }
      amount = order.total;
      receipt = `order_${refId}`;
    } else if (type === 'event') {
      const booking = await EventBooking.findById(refId);
      if (!booking) { res.status(404).json({ success: false, error: 'Booking not found' }); return; }
      if (booking.paymentStatus === 'completed') { res.status(400).json({ success: false, error: 'Booking already paid' }); return; }
      amount = booking.totalAmount;
      receipt = `event_${refId}`;
    } else if (type === 'reservation') {
      const reservation = await Reservation.findById(refId);
      if (!reservation) { res.status(404).json({ success: false, error: 'Reservation not found' }); return; }
      if (reservation.paymentStatus === 'completed') { res.status(400).json({ success: false, error: 'Reservation already paid' }); return; }
      amount = reservation.totalAmount || 0;
      receipt = `res_${refId}`;
    } else {
      res.status(400).json({ success: false, error: 'Invalid payment type' }); return;
    }

    const razorpayOrder = await createRazorpayOrder(amount, receipt);

    if (type === 'order') {
      await Order.findByIdAndUpdate(refId, { 'payment.razorpayOrderId': razorpayOrder.id, 'payment.method': 'upi' });
    } else if (type === 'event') {
      await EventBooking.findByIdAndUpdate(refId, { razorpayOrderId: razorpayOrder.id });
    } else if (type === 'reservation') {
      await Reservation.findByIdAndUpdate(refId, { razorpayOrderId: razorpayOrder.id });
    }

    res.json({
      success: true,
      data: {
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) { next(error); }
};

/**
 * POST /payments/verify
 * Verifies Razorpay payment signature and marks order/booking as paid.
 */
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, type, refId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !type || !refId) {
      res.status(400).json({ success: false, error: 'Missing required payment verification fields' }); return;
    }

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) { res.status(400).json({ success: false, error: 'Payment verification failed — invalid signature' }); return; }

    if (type === 'order') {
      const order = await Order.findByIdAndUpdate(refId, {
        'payment.status': 'paid', 'payment.razorpayOrderId': razorpay_order_id, 'payment.razorpayPaymentId': razorpay_payment_id,
      }, { new: true });
      if (!order) { res.status(404).json({ success: false, error: 'Order not found' }); return; }
    } else if (type === 'event') {
      const booking = await EventBooking.findByIdAndUpdate(refId, {
        paymentStatus: 'completed', razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id,
      }, { new: true });
      if (!booking) { res.status(404).json({ success: false, error: 'Booking not found' }); return; }
    } else if (type === 'reservation') {
      const reservation = await Reservation.findByIdAndUpdate(refId, {
        paymentStatus: 'completed', razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id,
      }, { new: true });
      if (!reservation) { res.status(404).json({ success: false, error: 'Reservation not found' }); return; }
    }

    res.json({ success: true, data: { paymentId: razorpay_payment_id } });
  } catch (error) { next(error); }
};

/**
 * POST /payments/simulate-upi
 * TEST MODE ONLY — Marks an order or event booking as paid without Razorpay signature.
 * Used for UPI demo on desktop where real UPI apps cannot be launched.
 */
export const simulateUpiPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ success: false, error: 'Simulation not allowed in production' });
      return;
    }

    const { type, refId } = req.body as { type: 'order' | 'event' | 'reservation'; refId: string };

    if (!type || !refId) {
      res.status(400).json({ success: false, error: 'type and refId are required' });
      return;
    }

    const mockPaymentId = `pay_TEST_${Date.now()}`;

    if (type === 'order') {
      const order = await Order.findByIdAndUpdate(refId, {
        'payment.status': 'paid',
        'payment.method': 'upi',
        'payment.razorpayPaymentId': mockPaymentId,
      }, { new: true });
      if (!order) { res.status(404).json({ success: false, error: 'Order not found' }); return; }
    } else if (type === 'event') {
      const booking = await EventBooking.findByIdAndUpdate(refId, {
        paymentStatus: 'completed',
        paymentMethod: 'upi',
        razorpayPaymentId: mockPaymentId,
      }, { new: true });
      if (!booking) { res.status(404).json({ success: false, error: 'Booking not found' }); return; }
    } else if (type === 'reservation') {
      const reservation = await Reservation.findByIdAndUpdate(refId, {
        paymentStatus: 'completed',
        paymentMethod: 'upi',
        razorpayPaymentId: mockPaymentId,
      }, { new: true });
      if (!reservation) { res.status(404).json({ success: false, error: 'Reservation not found' }); return; }
    }

    res.json({ success: true, data: { paymentId: mockPaymentId, simulated: true } });
  } catch (error) { next(error); }
};
