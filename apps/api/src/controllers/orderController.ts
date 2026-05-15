import { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/orderService';
import { calcEarnings } from '../services/orderService';
import { Order } from '../models';

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

export const getMyCourierOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courierId = req.user!._id.toString();
    const orders = await Order.find({ courierId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('restaurantId', 'name address location images')
      .populate('consumerId', 'profile address');
    res.json({ success: true, data: orders });
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

    // Populate courier details to send in socket events
    const populatedOrder = await Order.findById(order._id)
      .populate('restaurantId', 'name address')
      .populate('consumerId', 'profile')
      .populate('courierId', 'profile');

    const courier = populatedOrder?.courierId as any;
    const courierName = courier?.profile
      ? `${courier.profile.firstName} ${courier.profile.lastName}`
      : 'Your Courier';

    // Estimate earnings from stored delivery distance data
    let distanceKm = 0;
    const rest = populatedOrder?.restaurantId as any;
    if (rest?.location?.coordinates?.length === 2 && order.deliveryAddress?.location?.coordinates?.length === 2) {
      const [rLng, rLat] = rest.location.coordinates;
      const [dLng, dLat] = order.deliveryAddress.location.coordinates!;
      const R = 6371;
      const dLatR = ((dLat - rLat) * Math.PI) / 180;
      const dLngR = ((dLng - rLng) * Math.PI) / 180;
      const a = Math.sin(dLatR / 2) ** 2 + Math.cos((rLat * Math.PI) / 180) * Math.cos((dLat * Math.PI) / 180) * Math.sin(dLngR / 2) ** 2;
      distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    const estimatedEarnings = calcEarnings(distanceKm);

    const io = req.app.get('io');
    if (io) {
      const payload = {
        orderId: order._id.toString(),
        status: 'courier_assigned',
        courierName,
        courierId: req.user!._id.toString(),
        estimatedEarnings,
        distanceKm: Math.round(distanceKm * 10) / 10,
        timestamp: new Date().toISOString(),
      };

      // Notify consumer
      io.to(`order:${order._id}`).emit('orderStatusUpdate', payload);
      io.to(`order:${order._id}`).emit('courierAssigned', payload);

      // Notify restaurant owner
      io.to(`restaurant:${order.restaurantId}`).emit('courierAssigned', payload);
      io.to(`restaurant:${order.restaurantId}`).emit('orderStatusUpdate', payload);
    }

    res.json({
      success: true,
      data: { ...populatedOrder?.toObject(), _estimatedEarnings: estimatedEarnings, _distanceKm: Math.round(distanceKm * 10) / 10 },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};
