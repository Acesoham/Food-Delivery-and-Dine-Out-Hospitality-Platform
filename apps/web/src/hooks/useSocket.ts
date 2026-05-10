import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from 'shared-types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const useSocket = () => {
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket: TypedSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinOrderRoom = useCallback((orderId: string) => {
    socketRef.current?.emit('joinOrderRoom', orderId);
  }, []);

  const leaveOrderRoom = useCallback((orderId: string) => {
    socketRef.current?.emit('leaveOrderRoom', orderId);
  }, []);

  const onOrderStatusUpdate = useCallback(
    (callback: ServerToClientEvents['orderStatusUpdate']) => {
      socketRef.current?.on('orderStatusUpdate', callback);
      return () => {
        socketRef.current?.off('orderStatusUpdate', callback);
      };
    },
    []
  );

  const onCourierLocationUpdate = useCallback(
    (callback: ServerToClientEvents['courierLocationUpdate']) => {
      socketRef.current?.on('courierLocationUpdate', callback);
      return () => {
        socketRef.current?.off('courierLocationUpdate', callback);
      };
    },
    []
  );

  const onNewOrder = useCallback(
    (callback: ServerToClientEvents['newOrderNotification']) => {
      socketRef.current?.on('newOrderNotification', callback);
      return () => {
        socketRef.current?.off('newOrderNotification', callback);
      };
    },
    []
  );

  return {
    socket: socketRef.current,
    joinOrderRoom,
    leaveOrderRoom,
    onOrderStatusUpdate,
    onCourierLocationUpdate,
    onNewOrder,
  };
};
