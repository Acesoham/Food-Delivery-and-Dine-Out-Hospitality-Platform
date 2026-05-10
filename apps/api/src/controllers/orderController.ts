import { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/orderService';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.createOrder(req.user!._id.toString(), req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await orderService.getConsumerOrders(req.user!._id.toString(), page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getOrderById((req.params.id as string));
    res.json({ success: true, data: order });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.updateOrderStatus(
      (req.params.id as string),
      req.body,
      req.user!._id.toString(),
      req.user!.role
    );

    // Emit socket event for real-time tracking
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order._id}`).emit('orderStatusUpdate', {
        orderId: order._id.toString(),
        status: order.status,
        timestamp: new Date().toISOString(),
        note: req.body.note,
      });

      // Notify merchant of status changes
      io.to(`restaurant:${order.restaurantId}`).emit('orderStatusUpdate', {
        orderId: order._id.toString(),
        status: order.status,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const getRestaurantOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await orderService.getRestaurantOrders(
      (req.params.id as string),
      req.query.status as string | undefined
    );
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getAvailableDeliveries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 0;
    const lng = parseFloat(req.query.lng as string) || 0;
    const orders = await orderService.getAvailableDeliveries(lat, lng);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const acceptDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.updateOrderStatus(
      (req.params.id as string),
      { status: 'courier_assigned' },
      req.user!._id.toString(),
      'courier'
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order._id}`).emit('orderStatusUpdate', {
        orderId: order._id.toString(),
        status: 'courier_assigned',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};
