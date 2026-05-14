import { Request, Response, NextFunction } from 'express';
import * as reservationService from '../services/reservationService';

export const createReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.createReservation(
      req.user!._id.toString(),
      req.body
    );
    res.status(201).json({ success: true, data: reservation });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const getMyReservations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservations = await reservationService.getMyReservations(req.user!._id.toString());
    res.json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.getReservationById(
      (req.params.id as string),
      req.user!._id.toString()
    );
    res.json({ success: true, data: reservation });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const cancelReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.cancelReservation(
      (req.params.id as string),
      req.user!._id.toString()
    );
    res.json({ success: true, data: reservation });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const getRestaurantReservations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservations = await reservationService.getRestaurantReservations(
      (req.params.restaurantId as string),
      req.user!._id.toString()
    );
    res.json({ success: true, data: reservations });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const updateReservationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.updateReservationStatus(
      (req.params.id as string),
      req.user!._id.toString(),
      (req.body.status as string)
    );
    res.json({ success: true, data: reservation });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};
