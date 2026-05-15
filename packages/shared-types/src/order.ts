import { z } from 'zod';
import { GeoPointSchema } from './user';

// ─── Order Status State Machine ───
export const OrderStatus = z.enum([
  'pending',
  'accepted',
  'preparing',
  'ready',
  'courier_assigned',
  'in_transit',
  'delivered',
  'cancelled',
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

// Valid status transitions
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:          ['accepted', 'courier_assigned', 'cancelled'],
  accepted:         ['preparing', 'courier_assigned', 'cancelled'],
  preparing:        ['ready', 'courier_assigned', 'cancelled'],
  ready:            ['courier_assigned', 'cancelled'],
  courier_assigned: ['in_transit'],
  in_transit:       ['delivered'],
  delivered:        [],
  cancelled:        [],
};

export const PaymentStatus = z.enum(['pending', 'paid', 'failed', 'refunded']);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

// ─── Order Item ───
export const OrderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().min(1).max(99),
});

// ─── Create Order ───
export const CreateOrderSchema = z.object({
  restaurantId: z.string(),
  type: z.enum(['delivery', 'dine-in']),
  items: z.array(OrderItemSchema).min(1, 'At least one item required'),
  deliveryAddress: z
    .object({
      street: z.string(),
      location: GeoPointSchema,
    })
    .optional(),
  tableReservation: z
    .object({
      tableId: z.string(),
      reservationDate: z.string().datetime(),
      partySize: z.number().min(1).max(20),
    })
    .optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ─── Update Order Status ───
export const UpdateOrderStatusSchema = z.object({
  status: OrderStatus,
  note: z.string().optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

// ─── Order Response ───
export interface IOrder {
  _id: string;
  orderNumber: string;
  consumerId: string;
  restaurantId: string;
  courierId?: string;
  type: 'delivery' | 'dine-in';
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  payment: {
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    status: PaymentStatus;
    method: 'card' | 'mock';
  };
  deliveryAddress?: {
    street: string;
    location: { type: 'Point'; coordinates: [number, number] };
  };
  tableReservation?: {
    tableId: string;
    reservationDate: string;
    partySize: number;
  };
  courierLocation?: { type: 'Point'; coordinates: [number, number] };
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Cart Item (frontend only) ───
export interface CartItem {
  menuItemId: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}
