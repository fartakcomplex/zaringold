import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  phone: string;
  email?: string;
  fullName?: string;
  isVerified: boolean;
  isActive: boolean;
  avatar?: string;
  referralCode: string;
  role: string;
  sessionToken?: string;
}

export interface WalletData {
  balance: number;
  frozenBalance: number;
}

export interface GoldWalletData {
  goldGrams: number;
  frozenGold: number;
}

export interface GoldPriceData {
  buyPrice: number;
  sellPrice: number;
  marketPrice: number;
  ouncePrice: number;
  spread: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: string;
  amountFiat: number;
  amountGold: number;
  fee: number;
  goldPrice?: number;
  status: string;
  referenceId: string;
  description?: string;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Page Event — used by MobileQuickActions to communicate with page components  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface PageEvent {
  /** Unique key per invocation (used as useEffect dependency) */
  id: string;
  /** Event name, e.g. 'deposit', 'withdraw', 'buy-gold' */
  action: string;
  /** Optional payload (e.g. tab name, amount, etc.) */
  payload?: Record<string, unknown>;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  currentPage: string;
  adminPage: string;

  // Wallet
  fiatWallet: WalletData;
  goldWallet: GoldWalletData;

  // Gold Price
  goldPrice: GoldPriceData | null;
  priceHistory: Array<{ timestamp: string; price: number }>;

  // Transactions
  transactions: Transaction[];

  // UI State
  isLoading: boolean;
  toasts: Array<{ id: string; message: string; type: "success" | "error" | "info" }>;

  // Blog
  blogPostSlug: string | null;

  // Page Event — for MobileQuickActions → page component communication
  pageEvent: PageEvent | null;

  // Actions
  setUser: (user: User | null) => void;
  setPage: (page: string) => void;
  setAdminPage: (page: string) => void;
  switchToUserPanel: () => void;
  switchToAdminPanel: () => void;
  setFiatWallet: (data: WalletData) => void;
  setGoldWallet: (data: GoldWalletData) => void;
  setGoldPrice: (data: GoldPriceData) => void;
  setPriceHistory: (data: Array<{ timestamp: string; price: number }>) => void;
  setTransactions: (data: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
  setLoading: (loading: boolean) => void;
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
  setBlogPostSlug: (slug: string | null) => void;
  setPageEvent: (event: PageEvent | null) => void;
  emitPageEvent: (action: string, payload?: Record<string, unknown>) => void;
  reset: () => void;
}

const DEV_SUPER_ADMIN: User = {
  id: 'dev-super-admin',
  phone: '09120000000',
  email: 'admin@zarringold.ir',
  fullName: 'مدیر کل سیستم',
  isVerified: true,
  isActive: true,
  referralCode: 'ADMIN001',
  role: 'super_admin',
  sessionToken: 'dev-token',
};

const initialState = {
  user: DEV_SUPER_ADMIN,
  isAuthenticated: true,
  currentPage: "dashboard",
  adminPage: "dashboard",
  fiatWallet: { balance: 0, frozenBalance: 0 },
  goldWallet: { goldGrams: 0, frozenGold: 0 },
  goldPrice: null,
  priceHistory: [],
  transactions: [],
  isLoading: false,
  toasts: [],
  blogPostSlug: null as string | null,
  pageEvent: null as PageEvent | null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setPage: (currentPage) => set({ currentPage }),
      setAdminPage: (adminPage) => set({ adminPage, currentPage: 'admin' }),
      switchToUserPanel: () => set({ currentPage: 'dashboard' }),
      switchToAdminPanel: () => set({ currentPage: 'admin' }),
      setFiatWallet: (data) => set({ fiatWallet: data }),
      setGoldWallet: (data) => set({ goldWallet: data }),
      setGoldPrice: (data) => set({ goldPrice: data }),
      setPriceHistory: (data) => set({ priceHistory: data }),
      setTransactions: (data) => set({ transactions: data }),
      addTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
      setLoading: (isLoading) => set({ isLoading }),
      addToast: (message, type = "info") => {
        const id = Math.random().toString(36).substr(2, 9);
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 4000);
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      setBlogPostSlug: (blogPostSlug) => set({ blogPostSlug }),
      setPageEvent: (pageEvent) => set({ pageEvent }),
      emitPageEvent: (action, payload) => {
        const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set({ pageEvent: { id, action, payload } });
        // Auto-clear after 1 second so it doesn't re-trigger on re-renders
        setTimeout(() => {
          set((s) => s.pageEvent?.id === id ? { pageEvent: null } : {});
        }, 1000);
      },
      reset: () => set(initialState),
    }),
    {
      name: "zarrin-gold-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentPage: state.currentPage,
        adminPage: state.adminPage,
      }),
      storage: {
        getItem: (name) => {
          try {
            const raw = localStorage.getItem(name);
            if (!raw) return null;
            return JSON.parse(raw);
          } catch {
            // Corrupted state — clear it silently
            try { localStorage.removeItem(name); } catch { /* ignore */ }
            return null;
          }
        },
        setItem: (name, value) => {
          try { localStorage.setItem(name, JSON.stringify(value)); } catch { /* storage full */ }
        },
        removeItem: (name) => {
          try { localStorage.removeItem(name); } catch { /* ignore */ }
        },
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[ZarrinGold] Failed to rehydrate store, resetting:', error);
          state?.reset?.();
        }
      },
    }
  )
);
