import { Event } from '../models/Event';
import { EventBooking } from '../models/EventBooking';
import crypto from 'crypto';

/* ── Create Event ── */
export const createEvent = async (organizerId: string, body: any) => {
  const event = await Event.create({
    ...body,
    organizerId,
    availableSeats: body.totalSeats,
  });
  return event;
};

/* ── Get Organizer Events ── */
export const getOrganizerEvents = async (organizerId: string) => {
  return Event.find({ organizerId }).sort({ date: -1 });
};

/* ── Get Events by Location (Country → State → District → City cascade) ── */
export const getEventsByLocation = async (query: {
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  category?: string;
  page?: number;
  limit?: number;
}) => {
  const { country, state, district, city, category, page = 1, limit = 20 } = query;
  const filter: any = {
    isActive: true,
    date: { $gte: new Date() },
  };

  if (country) filter['venue.country'] = country;
  if (state) filter['venue.state'] = state;
  if (district) filter['venue.district'] = district;
  if (city) filter['venue.city'] = city;
  if (category) filter.category = category;

  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate('organizerId', 'profile email'),
    Event.countDocuments(filter),
  ]);

  return { events, total, page, limit };
};

/* ── Get Single Event ── */
export const getEventById = async (eventId: string) => {
  const event = await Event.findById(eventId).populate('organizerId', 'profile email');
  if (!event) {
    const err: any = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  return event;
};

/* ── Update Event ── */
export const updateEvent = async (eventId: string, organizerId: string, body: any) => {
  const event = await Event.findOne({ _id: eventId, organizerId });
  if (!event) {
    const err: any = new Error('Event not found or not authorized');
    err.statusCode = 403;
    throw err;
  }
  Object.assign(event, body);
  await event.save();
  return event;
};

/* ── Toggle Event Active ── */
export const toggleEvent = async (eventId: string, organizerId: string) => {
  const event = await Event.findOne({ _id: eventId, organizerId });
  if (!event) {
    const err: any = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  event.isActive = !event.isActive;
  await event.save();
  return event;
};

/* ── Book Event ── */
export const bookEvent = async (eventId: string, userId: string, tickets: number, paymentMethod: 'online' | 'cod') => {
  const event = await Event.findById(eventId);
  if (!event || !event.isActive) {
    const err: any = new Error('Event not found or not available');
    err.statusCode = 404;
    throw err;
  }
  if (event.availableSeats < tickets) {
    const err: any = new Error(`Only ${event.availableSeats} seat(s) remaining`);
    err.statusCode = 400;
    throw err;
  }

  // Decrement seats
  event.availableSeats -= tickets;
  await event.save();

  const bookingRef = `EVT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const booking = await EventBooking.create({
    eventId,
    userId,
    tickets,
    totalAmount: tickets * event.ticketPrice,
    status: 'confirmed',
    paymentMethod: paymentMethod || 'online',
    paymentStatus: paymentMethod === 'online' ? 'completed' : 'pending',
    bookingRef,
  });

  return booking;
};

/* ── Get User Bookings ── */
export const getUserBookings = async (userId: string) => {
  return EventBooking.find({ userId })
    .populate('eventId')
    .sort({ createdAt: -1 });
};

/* ── Cancel Booking ── */
export const cancelBooking = async (bookingId: string, userId: string) => {
  const booking = await EventBooking.findOne({ _id: bookingId, userId });
  if (!booking) {
    const err: any = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }
  if (booking.status === 'cancelled') {
    const err: any = new Error('Booking already cancelled');
    err.statusCode = 400;
    throw err;
  }

  // Restore seat count
  await Event.findByIdAndUpdate(booking.eventId, {
    $inc: { availableSeats: booking.tickets },
  });

  booking.status = 'cancelled';
  await booking.save();
  return booking;
};

/* ── Get Event Bookings (organizer) ── */
export const getEventBookings = async (eventId: string, organizerId: string) => {
  const event = await Event.findOne({ _id: eventId, organizerId });
  if (!event) {
    const err: any = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  return EventBooking.find({ eventId, status: 'confirmed' }).populate('userId', 'profile email');
};

/* ── Get available countries/states/districts/cities ── */
export const getLocations = async (level: string, parent?: Record<string, string>) => {
  const filter: any = { isActive: true };
  if (parent?.country) filter['venue.country'] = parent.country;
  if (parent?.state) filter['venue.state'] = parent.state;
  if (parent?.district) filter['venue.district'] = parent.district;

  const fieldMap: Record<string, string> = {
    countries: 'venue.country',
    states: 'venue.state',
    districts: 'venue.district',
    cities: 'venue.city',
  };

  const field = fieldMap[level];
  if (!field) return [];

  return Event.distinct(field, filter);
};
