import api from './api';
import type {
  AuthResponse,
  RegisterInput,
  LoginInput,
  IUser,
  IRestaurant,
  IMenuItem,
  IOrder,
  IReview,
  DiscoverQuery,
  CreateOrderInput,
  CreateReviewInput,
  CreateRestaurantInput,
  CreateMenuItemInput,
  UpdateOrderStatusInput,
  ReviewPrompt,
  PointsBreakdown,
  LoyaltyInfo,
  ReviewType,
  PaginatedResponse,
} from 'shared-types';

// ─── Auth ───
export const authApi = {
  register: (data: RegisterInput) =>
    api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data),

  login: (data: LoginInput) =>
    api.post<{ success: boolean; data: AuthResponse }>('/auth/login', data),

  refresh: () => api.post('/auth/refresh'),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<{ success: boolean; data: IUser }>('/auth/me'),
};

// ─── Restaurants ───
export const restaurantApi = {
  discover: (params: Partial<DiscoverQuery>) =>
    api.get<PaginatedResponse<IRestaurant>>('/restaurants/discover', { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: { restaurant: IRestaurant; menuItems: IMenuItem[] } }>(
      `/restaurants/${id}`
    ),

  getMenu: (id: string) =>
    api.get<{ success: boolean; data: IMenuItem[] }>(`/restaurants/${id}/menu`),

  create: (data: CreateRestaurantInput) =>
    api.post<{ success: boolean; data: IRestaurant }>('/restaurants', data),

  update: (id: string, data: Partial<CreateRestaurantInput>) =>
    api.patch<{ success: boolean; data: IRestaurant }>(`/restaurants/${id}`, data),

  getMyRestaurants: () =>
    api.get<{ success: boolean; data: IRestaurant[] }>('/restaurants/merchant/my-restaurants'),

  addMenuItem: (restaurantId: string, data: CreateMenuItemInput) =>
    api.post<{ success: boolean; data: IMenuItem }>(`/restaurants/${restaurantId}/menu`, data),

  updateMenuItem: (restaurantId: string, itemId: string, data: Partial<CreateMenuItemInput>) =>
    api.patch<{ success: boolean; data: IMenuItem }>(`/restaurants/${restaurantId}/menu/${itemId}`, data),

  deleteMenuItem: (restaurantId: string, itemId: string) =>
    api.delete(`/restaurants/${restaurantId}/menu/${itemId}`),

  toggleLiveStatus: (restaurantId: string) =>
    api.patch<{ success: boolean; data: IRestaurant }>(`/restaurants/${restaurantId}/toggle-live`),
};

// ─── Orders ───
export const orderApi = {
  create: (data: CreateOrderInput) =>
    api.post<{ success: boolean; data: IOrder }>('/orders', data),

  getMyOrders: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<IOrder>>('/orders/my-orders', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: IOrder }>(`/orders/${id}`),

  updateStatus: (id: string, data: UpdateOrderStatusInput) =>
    api.patch<{ success: boolean; data: IOrder }>(`/orders/${id}/status`, data),

  getRestaurantOrders: (restaurantId: string, status?: string) =>
    api.get<{ success: boolean; data: IOrder[] }>(`/orders/restaurant/${restaurantId}`, {
      params: status ? { status } : {},
    }),

  getAvailableDeliveries: (lat: number, lng: number) =>
    api.get<{ success: boolean; data: IOrder[] }>('/orders/courier/available', {
      params: { lat, lng },
    }),

  getMyCourierDeliveries: () =>
    api.get<{ success: boolean; data: IOrder[] }>('/orders/courier/my-deliveries'),

  acceptDelivery: (id: string, location?: { lat: number; lng: number }) =>
    api.post<{ success: boolean; data: IOrder }>(`/orders/${id}/accept-delivery`, location || {}),

  updateDeliveryStatus: (id: string, status: 'in_transit' | 'delivered') =>
    api.patch<{ success: boolean; data: IOrder }>(`/orders/${id}/status`, { status }),
};

// ─── Reviews ───
export const reviewApi = {
  submit: (data: CreateReviewInput) =>
    api.post<{ success: boolean; data: { review: IReview; points: PointsBreakdown } }>(
      '/reviews',
      data
    ),

  getForRestaurant: (restaurantId: string, page = 1) =>
    api.get<PaginatedResponse<IReview>>(`/reviews/restaurant/${restaurantId}`, {
      params: { page },
    }),

  // entityId = orderId | reservationId | eventBookingId; type defaults to 'order'
  getAiPrompts: (entityId: string, type: ReviewType = 'order') =>
    api.get<{ success: boolean; data: { prompts: ReviewPrompt[]; suggestedKeywords: string[] } }>(
      `/reviews/ai-prompts/${entityId}`,
      { params: { type } }
    ),

  previewPoints: (text: string, rating?: number, media?: string[]) =>
    api.post<{ success: boolean; data: PointsBreakdown }>('/reviews/preview-points', {
      text,
      rating,
      media,
    }),

  getMyStatus: (entityId: string, type: ReviewType = 'order') =>
    api.get<{ success: boolean; data: { reviewed: boolean; review: IReview | null } }>(
      `/reviews/my-status/${entityId}`,
      { params: { type } }
    ),

  getUserPoints: () =>
    api.get<{ success: boolean; data: LoyaltyInfo }>('/reviews/my-points'),
};

// ─── Reservations ───
export interface CreateReservationPayload {
  restaurantId: string;
  tableId: string;
  reservationDate: string;
  partySize: number;
  specialRequests?: string;
}

export const reservationApi = {
  create: (data: CreateReservationPayload) =>
    api.post<{ success: boolean; data: any }>('/reservations', data),

  getMyReservations: () =>
    api.get<{ success: boolean; data: any[] }>('/reservations/my-reservations'),

  getById: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/reservations/${id}`),

  cancel: (id: string) =>
    api.patch<{ success: boolean; data: any }>(`/reservations/${id}/cancel`),
};

// ─── Payments (Razorpay) ───
export const paymentApi = {
  /** Creates a Razorpay order via backend (returns razorpay_order_id, amount, currency) */
  createRazorpayOrder: (type: 'order' | 'event' | 'reservation', refId: string) =>
    api.post<{
      success: boolean;
      data: { razorpay_order_id: string; amount: number; currency: string; key_id: string };
    }>('/payments/create-order', { type, refId }),

  /** Verifies Razorpay payment signature and marks order/booking as paid */
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    type: 'order' | 'event' | 'reservation';
    refId: string;
  }) =>
    api.post<{ success: boolean; data: { paymentId: string } }>('/payments/verify', data),

  /** TEST MODE ONLY: Simulates a UPI payment without real Razorpay signature */
  simulateUpiPayment: (type: 'order' | 'event' | 'reservation', refId: string) =>
    api.post<{ success: boolean; data: { paymentId: string; simulated: boolean } }>(
      '/payments/simulate-upi',
      { type, refId }
    ),
};

// ─── Uploads ───
export const uploadApi = {
  /** Upload a restaurant banner image (multipart/form-data) */
  uploadRestaurantImage: (restaurantId: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<{ success: boolean; data: { imageUrl: string; imageId: string } }>(
      `/uploads/restaurant/${restaurantId}/image`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  /** Upload a menu-item food photo (multipart/form-data) */
  uploadMenuItemImage: (restaurantId: string, itemId: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<{ success: boolean; data: { imageUrl: string; imageId: string } }>(
      `/uploads/restaurant/${restaurantId}/menu/${itemId}/image`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  /** Upload the restaurant's UPI QR code image (multipart/form-data) */
  uploadRestaurantUpiQr: (restaurantId: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<{ success: boolean; data: { imageUrl: string; imageId: string } }>(
      `/uploads/restaurant/${restaurantId}/upi-qr`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};

