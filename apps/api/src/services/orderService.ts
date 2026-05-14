import { Order } from '../models';
import { MenuItem } from '../models';
import { Restaurant } from '../models';
import type { CreateOrderInput, UpdateOrderStatusInput } from 'shared-types';
import { ORDER_STATUS_TRANSITIONS } from 'shared-types';

/**
 * Generate unique order number: ORD-2026-XXXXX
 */
const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${year}-${random}`;
};

/**
 * Create a new order
 */
export const createOrder = async (consumerId: string, input: CreateOrderInput) => {
  // Validate restaurant exists
  const restaurant = await Restaurant.findById(input.restaurantId);
  if (!restaurant || !restaurant.isActive) {
    throw Object.assign(new Error('Restaurant not found or inactive'), { statusCode: 404 });
  }

  // Validate all menu items belong to this restaurant and are available
  const menuItemIds = input.items.map((i) => i.menuItemId);
  const menuItems = await MenuItem.find({
    _id: { $in: menuItemIds },
    restaurantId: input.restaurantId,
    isAvailable: true,
  });

  if (menuItems.length !== input.items.length) {
    throw Object.assign(new Error('One or more items are unavailable'), { statusCode: 400 });
  }

  // Calculate totals server-side (never trust client prices)
  const menuItemMap = new Map(menuItems.map((m) => [m._id.toString(), m]));
  let subtotal = 0;
  const validatedItems = input.items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId)!;
    const lineTotal = menuItem.price * item.quantity;
    subtotal += lineTotal;
    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity,
    };
  });

  const deliveryFee = input.type === 'delivery' ? 49 : 0; // ₹49 delivery fee
  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    consumerId,
    restaurantId: input.restaurantId,
    type: input.type,
    items: validatedItems,
    subtotal,
    deliveryFee,
    tax,
    total,
    status: 'pending',
    payment: {
      status: 'pending',
      method: (input as any).paymentMethod || 'card',
    },
    deliveryAddress: input.deliveryAddress,
    tableReservation: input.tableReservation,
    statusHistory: [{ status: 'pending', timestamp: new Date() }],
  });

  return order;
};

/**
 * Update order status with state machine validation
 */
export const updateOrderStatus = async (
  orderId: string,
  input: UpdateOrderStatusInput,
  userId: string,
  userRole: string
) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  // Validate the status transition
  const currentStatus = order.status;
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus as keyof typeof ORDER_STATUS_TRANSITIONS];
  if (!allowedTransitions || !allowedTransitions.includes(input.status as any)) {
    throw Object.assign(
      new Error(`Cannot transition from '${currentStatus}' to '${input.status}'`),
      { statusCode: 400 }
    );
  }

  // Authorization checks
  if (userRole === 'merchant') {
    const restaurant = await Restaurant.findOne({ _id: order.restaurantId, ownerId: userId });
    if (!restaurant) {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
    }
  } else if (userRole === 'courier') {
    if (!['courier_assigned', 'in_transit', 'delivered'].includes(input.status)) {
      throw Object.assign(new Error('Couriers can only update delivery statuses'), { statusCode: 403 });
    }
  }

  // Update status
  order.status = input.status as any;
  order.statusHistory.push({
    status: input.status,
    timestamp: new Date() as any,
    note: input.note,
  });

  // If courier assigned
  if (input.status === 'courier_assigned' && userRole === 'courier') {
    order.courierId = userId as any;
  }

  await order.save();
  return order;
};

/**
 * Get consumer's orders
 */
export const getConsumerOrders = async (consumerId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ consumerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('restaurantId', 'name slug images'),
    Order.countDocuments({ consumerId }),
  ]);

  return {
    data: orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get restaurant orders (for merchant dashboard)
 */
export const getRestaurantOrders = async (restaurantId: string, status?: string) => {
  const filter: Record<string, any> = { restaurantId };
  if (status) filter.status = status;

  return Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('consumerId', 'profile');
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string) => {
  const order = await Order.findById(orderId)
    .populate('restaurantId', 'name slug images address contact')
    .populate('consumerId', 'profile')
    .populate('courierId', 'profile');

  if (!order) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  return order;
};

/**
 * Get available deliveries for couriers (orders that are 'ready' and need a courier)
 */
export const getAvailableDeliveries = async (courierLat: number, courierLng: number) => {
  return Order.find({
    status: 'ready',
    type: 'delivery',
    courierId: { $exists: false },
  })
    .sort({ createdAt: 1 })
    .limit(20)
    .populate('restaurantId', 'name address location');
};
