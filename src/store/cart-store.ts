import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: 'boys' | 'girls' | 'baby' | 'accessories';
  sizes: string[];
  colors: string[];
  badge?: string;
  rating: number;
  reviews: number;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, size: string, color: string) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      wishlist: [],

      addItem: (product, size, color) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedSize === size &&
            item.selectedColor === color
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems });
        } else {
          set({
            items: [...items, { product, quantity: 1, selectedSize: size, selectedColor: color }],
          });
        }
      },

      removeItem: (productId, size, color) => {
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.selectedSize === size &&
                item.selectedColor === color
              )
          ),
        });
      },

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        const newItems = get().items.map((item) =>
          item.product.id === productId &&
          item.selectedSize === size &&
          item.selectedColor === color
            ? { ...item, quantity }
            : item
        );
        set({ items: newItems });
      },

      clearCart: () => set({ items: [] }),
      setIsOpen: (open) => set({ isOpen: open }),

      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        ),

      toggleWishlist: (productId) => {
        const wishlist = get().wishlist;
        if (wishlist.includes(productId)) {
          set({ wishlist: wishlist.filter((id) => id !== productId) });
        } else {
          set({ wishlist: [...wishlist, productId] });
        }
      },
    }),
    {
      name: 'amanda-kids-cart',
      partialize: (state) => ({
        items: state.items,
        wishlist: state.wishlist,
      }),
    }
  )
);
