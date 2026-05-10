import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'shared-types';

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: [config.clientUrl, config.merchantUrl],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT Authentication middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as {
        userId: string;
        role: string;
      };
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.data.userId} (${socket.data.role})`);

    // ─── Room Management ───
    socket.on('joinOrderRoom', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`📦 User ${socket.data.userId} joined order:${orderId}`);
    });

    socket.on('leaveOrderRoom', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('joinMerchantRoom', (restaurantId) => {
      if (socket.data.role === 'merchant' || socket.data.role === 'admin') {
        socket.join(`restaurant:${restaurantId}`);
        console.log(`🏪 Merchant joined restaurant:${restaurantId}`);
      }
    });

    socket.on('leaveMerchantRoom', (restaurantId) => {
      socket.leave(`restaurant:${restaurantId}`);
    });

    socket.on('joinCourierRoom', (courierId) => {
      if (socket.data.role === 'courier') {
        socket.join(`courier:${courierId}`);
        console.log(`🚴 Courier joined courier:${courierId}`);
      }
    });

    // ─── Courier Location Updates ───
    socket.on('updateCourierLocation', (data) => {
      if (socket.data.role !== 'courier') return;

      // Broadcast to order room (consumer tracking the delivery)
      io.to(`order:${data.orderId}`).emit('courierLocationUpdate', {
        orderId: data.orderId,
        location: { lat: data.lat, lng: data.lng },
        estimatedArrival: 0, // TODO: Calculate based on distance
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.data.userId}`);
    });
  });

  return io;
};
