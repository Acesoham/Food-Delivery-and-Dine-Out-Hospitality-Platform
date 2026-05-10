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
  consumerId: string;
  restaurantId: string;
  tableId: string;
  reservationDate: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}
