import { Reservation } from '../models/Reservation';
import { Restaurant } from '../models/Restaurant';

export interface CreateReservationInput {
  restaurantId: string;
  tableId: string;
  reservationDate: string; // ISO string
  partySize: number;
  specialRequests?: string;
}

export const createReservation = async (
  consumerId: string,
  input: CreateReservationInput
) => {
  const restaurant = await Restaurant.findById(input.restaurantId);
  if (!restaurant) throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });

  // Check table exists and is available
  const table = (restaurant.tables as any[]).find(
    (t) => t.tableId === input.tableId && t.isAvailable
  );
  if (!table) throw Object.assign(new Error('Table not available'), { statusCode: 400 });

  // Check for conflicting reservation (same table, within 2 hours)
  const slotStart = new Date(input.reservationDate);
  const slotEnd = new Date(slotStart.getTime() + 2 * 60 * 60 * 1000);

  const conflict = await Reservation.findOne({
    restaurantId: input.restaurantId,
    tableId: input.tableId,
    status: { $in: ['pending', 'confirmed'] },
    reservationDate: { $gte: slotStart, $lt: slotEnd },
  });
  if (conflict) throw Object.assign(new Error('Table already booked for this time slot'), { statusCode: 409 });

  const reservation = await Reservation.create({
    consumerId,
    restaurantId: input.restaurantId,
    tableId: input.tableId,
    reservationDate: slotStart,
    partySize: input.partySize,
    specialRequests: input.specialRequests,
    status: 'pending',
  });

  return reservation;
};

export const getMyReservations = async (consumerId: string) => {
  const reservations = await Reservation.find({ consumerId })
    .populate('restaurantId', 'name address images contact')
    .sort({ reservationDate: -1 });
  return reservations;
};

export const getReservationById = async (id: string, consumerId: string) => {
  const reservation = await Reservation.findOne({ _id: id, consumerId }).populate(
    'restaurantId',
    'name address images contact'
  );
  if (!reservation) throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  return reservation;
};

export const cancelReservation = async (id: string, consumerId: string) => {
  const reservation = await Reservation.findOne({ _id: id, consumerId });
  if (!reservation) throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  if (!['pending', 'confirmed'].includes(reservation.status))
    throw Object.assign(new Error('Cannot cancel this reservation'), { statusCode: 400 });

  reservation.status = 'cancelled';
  await reservation.save();
  return reservation;
};

export const getRestaurantReservations = async (restaurantId: string, merchantId: string) => {
  const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId: merchantId });
  if (!restaurant) throw Object.assign(new Error('Restaurant not found or unauthorized'), { statusCode: 403 });

  const reservations = await Reservation.find({ restaurantId })
    .populate('consumerId', 'profile email')
    .sort({ reservationDate: 1 });
  return reservations;
};

export const updateReservationStatus = async (
  id: string,
  merchantId: string,
  status: string
) => {
  const reservation = await Reservation.findById(id).populate('restaurantId');
  if (!reservation) throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });

  const restaurant = reservation.restaurantId as any;
  if (restaurant.ownerId.toString() !== merchantId)
    throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });

  reservation.status = status as any;
  await reservation.save();
  return reservation;
};
