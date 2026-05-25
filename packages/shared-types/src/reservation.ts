import { z } from 'zod';

// ─── Create Reservation ───
export const CreateReservationSchema = z.object({
  restaurantId: z.string(),
  tableId: z.string(),
  reservationDate: z.string().datetime(),
  partySize: z.number().int().min(1).max(20),
  specialRequests: z.string().max(500).optional(),
});
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

export const ReservationStatus = z.enum([
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
]);
export type ReservationStatus = z.infer<typeof ReservationStatus>;

export interface IReservation {
  _id: string;
  consumerId: string | any; // populated User
  restaurantId: string | any; // populated Restaurant
  tableId: string;
  reservationDate: Date | string;
  partySize: number;
  totalAmount?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentMethod?: 'online' | 'upi' | 'cod';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  specialRequests?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
