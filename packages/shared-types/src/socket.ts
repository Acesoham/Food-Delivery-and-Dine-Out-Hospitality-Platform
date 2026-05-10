import { OrderStatus } from './order';

// ─── Socket.io Event Contracts ───

export interface ServerToClientEvents {
  orderStatusUpdate: (data: {
    orderId: string;
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }) => void;

  courierLocationUpdate: (data: {
    orderId: string;
    location: { lat: number; lng: number };
    estimatedArrival: number; // minutes
  }) => void;

  newOrderNotification: (data: {
    orderId: string;
    orderNumber: string;
    itemCount: number;
    total: number;
    type: 'delivery' | 'dine-in';
  }) => void;

  deliveryAssigned: (data: {
    orderId: string;
    orderNumber: string;
    restaurantName: string;
    pickupAddress: string;
    deliveryAddress: string;
    estimatedPayout: number;
  }) => void;
}

export interface ClientToServerEvents {
  joinOrderRoom: (orderId: string) => void;
  leaveOrderRoom: (orderId: string) => void;
  joinMerchantRoom: (restaurantId: string) => void;
  leaveMerchantRoom: (restaurantId: string) => void;
  joinCourierRoom: (courierId: string) => void;
  updateCourierLocation: (data: {
    orderId: string;
    lat: number;
    lng: number;
  }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  role: string;
}

// ─── Generic API Response Wrapper ───
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
