'use client';

import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface CommandAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label (English) */
  labelEn: string;
  /** Display label (Persian) */
  labelFa: string;
  /** Category this action belongs to */
  category: string;
  /** Lucide icon component name (for rendering) */
  icon: string;
  /** Keyboard shortcut hint, e.g. "Ctrl+B" */
  shortcut?: string;
  /** Page to navigate to when action is selected */
  page?: string;
  /** Optional event to emit when action is selected */
  event?: string;
  /** Optional event payload */
  eventPayload?: Record<string, unknown>;
}

interface CommandPaletteState {
  /** Whether the palette is currently open */
  isOpen: boolean;
  /** Open the palette */
  open: () => void;
  /** Close the palette */
  close: () => void;
  /** Toggle the palette */
  toggle: () => void;
  /** Register a custom action */
  registerAction: (action: CommandAction) => void;
  /** Unregister a custom action */
  unregisterAction: (id: string) => void;
  /** All registered actions (built-in + custom) */
  actions: CommandAction[];
  /** Recently used action IDs (ordered most-recent first) */
  recentActionIds: string[];
  /** Record that an action was used (persists to localStorage) */
  recordAction: (id: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const RECENT_STORAGE_KEY = 'zarrin-gold-command-palette-recent';
const MAX_RECENT = 5;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Built-in Actions                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

const BUILT_IN_ACTIONS: CommandAction[] = [
  // ── Trading ──
  {
    id: 'trading.buy-gold',
    labelEn: 'Buy Gold',
    labelFa: 'خرید طلا',
    category: 'trading',
    icon: 'TrendingUp',
    shortcut: 'Ctrl+B',
    page: 'trade',
    event: 'buy-gold',
  },
  {
    id: 'trading.sell-gold',
    labelEn: 'Sell Gold',
    labelFa: 'فروش طلا',
    category: 'trading',
    icon: 'TrendingDown',
    shortcut: 'Ctrl+S',
    page: 'trade',
    event: 'sell-gold',
  },
  {
    id: 'trading.live-prices',
    labelEn: 'Live Prices',
    labelFa: 'قیمت‌های لحظه‌ای',
    category: 'trading',
    icon: 'Activity',
    page: 'market',
  },
  {
    id: 'trading.market-chart',
    labelEn: 'Market Chart',
    labelFa: 'نمودار بازار',
    category: 'trading',
    icon: 'BarChart3',
    page: 'analytics',
  },

  // ── Wallet ──
  {
    id: 'wallet.deposit',
    labelEn: 'Deposit',
    labelFa: 'واریز',
    category: 'wallet',
    icon: 'ArrowDownToLine',
    page: 'wallet',
    event: 'deposit',
  },
  {
    id: 'wallet.withdraw',
    labelEn: 'Withdraw',
    labelFa: 'برداشت',
    category: 'wallet',
    icon: 'ArrowUpFromLine',
    page: 'wallet',
    event: 'withdraw',
  },
  {
    id: 'wallet.transfer-gold',
    labelEn: 'Transfer Gold',
    labelFa: 'انتقال طلا',
    category: 'wallet',
    icon: 'Send',
    page: 'gold-card',
    event: 'transfer',
  },
  {
    id: 'wallet.balance',
    labelEn: 'Wallet Balance',
    labelFa: 'موجودی کیف پول',
    category: 'wallet',
    icon: 'Wallet',
    page: 'wallet',
  },

  // ── Services ──
  {
    id: 'services.gold-loan',
    labelEn: 'Gold Loan',
    labelFa: 'وام طلایی',
    category: 'services',
    icon: 'Landmark',
    page: 'loans',
  },
  {
    id: 'services.gold-card',
    labelEn: 'Gold Card',
    labelFa: 'کارت طلایی',
    category: 'services',
    icon: 'CreditCard',
    page: 'gold-card',
  },
  {
    id: 'services.savings-plan',
    labelEn: 'Savings Plan',
    labelFa: 'پس‌انداز طلایی',
    category: 'services',
    icon: 'PiggyBank',
    page: 'savings',
  },
  {
    id: 'services.vip-club',
    labelEn: 'VIP Club',
    labelFa: 'باشگاه VIP',
    category: 'services',
    icon: 'Crown',
    page: 'vip',
  },

  // ── Account ──
  {
    id: 'account.profile',
    labelEn: 'Profile',
    labelFa: 'پروفایل',
    category: 'account',
    icon: 'User',
    page: 'profile',
  },
  {
    id: 'account.settings',
    labelEn: 'Settings',
    labelFa: 'تنظیمات',
    category: 'account',
    icon: 'Settings',
    page: 'settings',
  },
  {
    id: 'account.notifications',
    labelEn: 'Notifications',
    labelFa: 'اعلان‌ها',
    category: 'account',
    icon: 'Bell',
    page: 'notifications',
  },
  {
    id: 'account.support',
    labelEn: 'Support',
    labelFa: 'پشتیبانی',
    category: 'account',
    icon: 'MessageCircle',
    page: 'support',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: Read / Write recent actions from localStorage                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function readRecentIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v: unknown) => typeof v === 'string');
  } catch {
    return [];
  }
}

function writeRecentIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
  } catch {
    /* storage full — ignore */
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Context — shared state for CommandPalette & Provider                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CommandPaletteContext = createContext<CommandPaletteState | null>(null);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Provider Component (manages state)                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function CommandPaletteContextProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customActions, setCustomActions] = useState<CommandAction[]>([]);
  const [recentActionIds, setRecentActionIds] = useState<string[]>([]);

  /* ── Load recent actions from localStorage on mount ── */
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setRecentActionIds(readRecentIds());
  }, []);

  /* ── Open / Close / Toggle ── */
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  /* ── Register / Unregister custom actions ── */
  const registerAction = useCallback((action: CommandAction) => {
    setCustomActions((prev) => {
      // Avoid duplicates
      if (prev.some((a) => a.id === action.id)) return prev;
      return [...prev, action];
    });
  }, []);

  const unregisterAction = useCallback((id: string) => {
    setCustomActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /* ── Record action usage ── */
  const recordAction = useCallback((id: string) => {
    setRecentActionIds((prev) => {
      // Move to front if already exists, otherwise prepend
      const filtered = prev.filter((existing) => existing !== id);
      const updated = [id, ...filtered].slice(0, MAX_RECENT);
      writeRecentIds(updated);
      return updated;
    });
  }, []);

  /* ── Combine built-in + custom actions ── */
  const actions = [...BUILT_IN_ACTIONS, ...customActions];

  const value: CommandPaletteState = {
    isOpen,
    open,
    close,
    toggle,
    registerAction,
    unregisterAction,
    actions,
    recentActionIds,
    recordAction,
  };

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Hook — consumers use this to access shared command palette state         */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function useCommandPalette(): CommandPaletteState {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error('useCommandPalette must be used within a CommandPaletteContextProvider');
  }
  return ctx;
}
