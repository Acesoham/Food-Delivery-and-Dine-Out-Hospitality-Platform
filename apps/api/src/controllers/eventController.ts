import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.createEvent(req.user!._id.toString(), req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    if (error.statusCode) { res.status(error.statusCode).json({ success: false, error: error.message }); return; }
    next(error);
  }
};

export const getOrganizerEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await eventService.getOrganizerEvents(req.user!._id.toString());
    res.json({ success: true, data: events });
  } catch (error) { next(error); }
};

export const browseEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await eventService.getEventsByLocation(req.query as any);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.getEventById(req.params.id as string);
    res.json({ success: true, data: event });
  } catch (error: any) {
    if (error.statusCode) { res.status(error.statusCode).json({ success: false, error: error.message }); return; }
    next(error);
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.updateEvent(req.params.id as string, req.user!._id.toString(), req.body);
    res.json({ success: true, data: event });
  } catch (error: any) {
    if (error.statusCode) { res.status(error.statusCode).json({ success: false, error: error.message }); return; }
    next(error);
  }
};

export const toggleEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.toggleEvent(req.params.id as string, req.user!._id.toString());
    res.json({ success: true, data: event });
  } catch (error: any) {
    if (error.statusCode) { res.status(error.statusCode).json({ success: false, error: error.message }); return; }
    next(error);
  }
};

export const bookEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tickets, paymentMethod } = req.body;
    const booking = await eventService.bookEvent(req.params.id as string, req.user!._id.toString(), Number(tickets) || 1, paymentMethod);
    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    if (error.statusCode) { res.status(error.statusCode).json({ success: false, error: error.message }); return; }
    next(error);
  }
};

export const getUserBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await eventService.getUserBookings(req.user!._id.toString());
    res.json({ success: true, data: bookings });
  } catch (error) { next(error); }
};

export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await eventService.cancelBooking(req.params.bookingId as string, req.user!._id.toString());
    res.json({ success: true, data: booking });
  } catch (error: any) {
    if (error.statusCode) { res.status(error.statusCode).json({ success: false, error: error.message }); return; }
    next(error);
  }
};

export const getEventBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await eventService.getEventBookings(req.params.id as string, req.user!._id.toString());
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    if (error.statusCode) { res.status(error.statusCode).json({ success: false, error: error.message }); return; }
    next(error);
  }
};

export const getLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level, country, state, district } = req.query as any;
    const locations = await eventService.getLocations(level, { country, state, district });
    res.json({ success: true, data: locations });
  } catch (error) { next(error); }
};
