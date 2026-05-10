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

  acceptDelivery: (id: string) =>
    api.post<{ success: boolean; data: IOrder }>(`/orders/${id}/accept-delivery`),
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

  getAiPrompts: (orderId: string) =>
    api.get<{ success: boolean; data: ReviewPrompt[] }>(`/reviews/ai-prompts/${orderId}`),

  previewPoints: (text: string, media?: string[]) =>
    api.post<{ success: boolean; data: PointsBreakdown }>('/reviews/preview-points', {
      text,
      media,
    }),
};
