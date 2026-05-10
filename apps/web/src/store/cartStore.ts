import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from 'shared-types';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;

  addItem: (item: CartItem) => boolean;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,

      addItem: (item) => {
        const state = get();

        // Check if adding from a different restaurant
        if (state.restaurantId && state.restaurantId !== item.restaurantId) {
          // Return false to signal the UI to show confirmation dialog
          return false;
        }

        const existingIndex = state.items.findIndex(
          (i) => i.menuItemId === item.menuItemId
        );

        if (existingIndex >= 0) {
          const newItems = [...state.items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + item.quantity,
          };
          set({ items: newItems });
        } else {
          set({
            items: [...state.items, item],
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
          });
        }
        return true;
      },

      removeItem: (menuItemId) => {
        const newItems = get().items.filter((i) => i.menuItemId !== menuItemId);
        if (newItems.length === 0) {
          set({ items: [], restaurantId: null, restaurantName: null });
        } else {
          set({ items: newItems });
        }
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        const newItems = get().items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i
        );
        set({ items: newItems });
      },

      clearCart: () => {
        set({ items: [], restaurantId: null, restaurantName: null });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: 'food-delivery-cart',
    }
  )
);
