'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import {
  useCommandPalette,
  CommandPaletteContextProvider,
  type CommandAction,
} from '@/hooks/useCommandPalette';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  Wallet,
  Landmark,
  CreditCard,
  PiggyBank,
  Crown,
  User,
  Settings,
  Bell,
  MessageCircle,
  Clock,
  type LucideIcon,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Icon Registry — map icon name strings to actual Lucide components        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  Wallet,
  Landmark,
  CreditCard,
  PiggyBank,
  Crown,
  User,
  Settings,
  Bell,
  MessageCircle,
  Clock,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Category Labels                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CATEGORY_LABELS: Record<string, { en: string; fa: string }> = {
  trading: { en: 'Trading', fa: 'معاملات' },
  wallet: { en: 'Wallet', fa: 'کیف پول' },
  services: { en: 'Services', fa: 'خدمات' },
  account: { en: 'Account', fa: 'حساب کاربری' },
  recent: { en: 'Recently Used', fa: 'اخیراً استفاده شده' },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Category color accents                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CATEGORY_COLORS: Record<string, string> = {
  trading: '#34D399',
  wallet: '#60A5FA',
  services: '#FBBF24',
  account: '#A78BFA',
  recent: '#D4AF37',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: Persian normalization for search                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function normalizePersian(str: string): string {
  return str
    .replace(/[یي]/g, 'ی')
    .replace(/[کك]/g, 'ک')
    .replace(/[هة]/g, 'ه')
    .replace(/[أإا]/g, 'ا')
    .replace(/[\u200c\u200d]/g, '') // zero-width non-joiner / joiner
    .trim()
    .toLowerCase();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Flat list item type for rendering                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface FlatItem {
  type: 'category' | 'action';
  category?: string;
  action?: CommandAction;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Inner palette component (must be rendered inside CommandPaletteContext)   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CommandPaletteInner() {
  const { locale } = useTranslation();
  const { setPage, emitPageEvent } = useAppStore();
  const { isOpen, close, actions, recentActionIds, recordAction } = useCommandPalette();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isFa = locale === 'fa';

  /* ── Filter actions based on query (supports English + Persian) ── */
  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    const normalizedQuery = normalizePersian(query);
    return actions.filter((action) => {
      const enMatch = action.labelEn.toLowerCase().includes(normalizedQuery);
      const faMatch = normalizePersian(action.labelFa).includes(normalizedQuery);
      const idMatch = action.id.toLowerCase().includes(normalizedQuery);
      const catMatch = action.category.toLowerCase().includes(normalizedQuery);
      return enMatch || faMatch || idMatch || catMatch;
    });
  }, [actions, query]);

  /* ── Build flat list with category headers and recent section ── */
  const flatItems = useMemo((): FlatItem[] => {
    const items: FlatItem[] = [];

    if (!query.trim() && recentActionIds.length > 0) {
      // Recent section
      items.push({ type: 'category', category: 'recent' });
      const recentActions = recentActionIds
        .map((id) => actions.find((a) => a.id === id))
        .filter((a): a is CommandAction => !!a);
      for (const action of recentActions) {
        items.push({ type: 'action', action, category: 'recent' });
      }
    }

    // Group filtered actions by category
    const categoryOrder = ['trading', 'wallet', 'services', 'account'];
    const grouped: Record<string, CommandAction[]> = {};
    for (const action of filteredActions) {
      if (!query.trim() && recentActionIds.includes(action.id)) continue; // skip recent in main list
      if (!grouped[action.category]) grouped[action.category] = [];
      grouped[action.category].push(action);
    }

    for (const cat of categoryOrder) {
      const catActions = grouped[cat];
      if (!catActions || catActions.length === 0) continue;
      items.push({ type: 'category', category: cat });
      for (const action of catActions) {
        items.push({ type: 'action', action, category: cat });
      }
    }

    // Add any remaining categories not in the predefined order
    for (const cat of Object.keys(grouped)) {
      if (categoryOrder.includes(cat)) continue;
      const catActions = grouped[cat];
      if (!catActions || catActions.length === 0) continue;
      items.push({ type: 'category', category: cat });
      for (const action of catActions) {
        items.push({ type: 'action', action, category: cat });
      }
    }

    return items;
  }, [filteredActions, recentActionIds, actions, query]);

  /* ── Count only actionable items for selection index ── */
  const actionItems = useMemo(
    () => flatItems.filter((item) => item.type === 'action'),
    [flatItems]
  );

  /* ── Reset selection when query changes ── */
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  /* ── Focus input when palette opens ── */
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Delay focus slightly for animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ── Scroll selected item into view ── */
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  /* ── Execute action ── */
  const executeAction = useCallback(
    (action: CommandAction) => {
      recordAction(action.id);
      if (action.page) {
        setPage(action.page);
      }
      if (action.event) {
        emitPageEvent(action.event, action.eventPayload);
      }
      close();
    },
    [recordAction, setPage, emitPageEvent, close]
  );

  /* ── Keyboard navigation ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(actionItems.length, 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? Math.max(actionItems.length - 1, 0) : prev - 1
        );
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const selectedAction = actionItems[selectedIndex]?.action;
        if (selectedAction) {
          executeAction(selectedAction);
        }
        return;
      }
    },
    [actionItems, selectedIndex, executeAction, close]
  );

  /* ── Detect Mac for shortcut display ── */
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? '⌘' : 'Ctrl';

  /* ── Render ── */
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* ── Dialog ── */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-label={isFa ? 'پالت دستورات' : 'Command Palette'}
              className={cn(
                'w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl',
                'bg-[#0C0C0C] border-[#D4AF37]/20',
                'shadow-[0_0_60px_rgba(212,175,55,0.1)]'
              )}
              onKeyDown={handleKeyDown}
            >
              {/* ── Search Input ── */}
              <div className="flex items-center gap-3 border-b border-[#D4AF37]/15 px-4 py-3">
                <Search className="size-5 shrink-0 text-[#D4AF37]/60" strokeWidth={1.8} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isFa ? 'جستجوی دستورات...' : 'Search commands...'}
                  className={cn(
                    'flex-1 bg-transparent text-sm text-white placeholder:text-white/30',
                    'outline-none border-none',
                    isFa && 'text-right font-[IRANSans]'
                  )}
                  dir={isFa ? 'rtl' : 'ltr'}
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40 font-mono">
                  ESC
                </kbd>
              </div>

              {/* ── Actions List ── */}
              <div
                ref={listRef}
                className="max-h-80 overflow-y-auto overscroll-contain px-2 py-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(212,175,55,0.3) transparent',
                }}
              >
                {actionItems.length === 0 && (
                  <div className="py-8 text-center text-sm text-white/30">
                    {isFa ? 'نتیجه‌ای یافت نشد' : 'No results found'}
                  </div>
                )}

                {flatItems.map((item, index) => {
                  if (item.type === 'category') {
                    const cat = item.category || 'other';
                    const catLabel = CATEGORY_LABELS[cat];
                    const label = catLabel
                      ? isFa
                        ? catLabel.fa
                        : catLabel.en
                      : cat;
                    const color = CATEGORY_COLORS[cat] || '#D4AF37';

                    return (
                      <div
                        key={`cat-${cat}-${index}`}
                        className="flex items-center gap-2 px-2 pt-3 pb-1 first:pt-1"
                      >
                        <span
                          className="text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color }}
                        >
                          {label}
                        </span>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                    );
                  }

                  const action = item.action!;
                  const actionIndex = actionItems.findIndex(
                    (ai) => ai.action?.id === action.id
                  );
                  const isSelected = actionIndex === selectedIndex;
                  const IconComponent = ICON_MAP[action.icon];
                  const catColor = CATEGORY_COLORS[action.category] || '#D4AF37';

                  return (
                    <button
                      key={action.id}
                      data-index={actionIndex}
                      onClick={() => executeAction(action)}
                      onMouseEnter={() => setSelectedIndex(actionIndex)}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-100',
                        isSelected
                          ? 'bg-[#D4AF37]/10 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex size-8 items-center justify-center rounded-lg shrink-0 transition-colors duration-100',
                          isSelected
                            ? 'bg-[#D4AF37]/20'
                            : 'bg-white/5 group-hover:bg-white/10'
                        )}
                      >
                        {IconComponent ? (
                          <IconComponent
                            className="size-4"
                            style={{ color: isSelected ? '#D4AF37' : catColor }}
                            strokeWidth={1.8}
                          />
                        ) : (
                          <Search className="size-4 text-[#D4AF37]" strokeWidth={1.8} />
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className={cn(
                          'flex-1 truncate text-left',
                          isFa && 'text-right font-[IRANSans]',
                          isSelected && 'text-white font-medium'
                        )}
                        dir={isFa ? 'rtl' : 'ltr'}
                      >
                        {isFa ? action.labelFa : action.labelEn}
                      </span>

                      {/* Shortcut hint */}
                      {action.shortcut && (
                        <kbd
                          className={cn(
                            'hidden sm:inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-mono',
                            isSelected
                              ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]/70'
                              : 'border-white/10 bg-white/5 text-white/30'
                          )}
                        >
                          {action.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Footer ── */}
              <div className="flex items-center justify-between border-t border-[#D4AF37]/10 px-4 py-2">
                <div className="flex items-center gap-3 text-[10px] text-white/25">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono">↑</kbd>
                    <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono">↓</kbd>
                    <span>{isFa ? 'انتخاب' : 'navigate'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono">↵</kbd>
                    <span>{isFa ? 'اجرای دستور' : 'select'}</span>
                  </span>
                </div>
                <span className="text-[10px] text-white/20">
                  {modKey}+K {isFa ? 'برای بستن' : 'to close'}
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CommandPalette Component (for standalone use — must be inside a          */
/*  CommandPaletteContextProvider)                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function CommandPalette() {
  return <CommandPaletteInner />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CommandPaletteProvider — all-in-one wrapper that:                         */
/*  1. Provides the shared context (CommandPaletteContextProvider)            */
/*  2. Sets up the global Ctrl+K / Cmd+K keyboard shortcut                  */
/*  3. Renders the CommandPalette component                                  */
/*                                                                           */
/*  Usage: Wrap your app with <CommandPaletteProvider>                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteContextProvider>
      <KeyboardListener />
      {children}
      <CommandPaletteInner />
    </CommandPaletteContextProvider>
  );
}

/* ── Internal: Keyboard listener (renders nothing, just attaches listener) ── */

function KeyboardListener() {
  const { toggle } = useCommandPalette();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K or Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [toggle]);

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Re-exports                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

export { CommandPaletteContextProvider } from '@/hooks/useCommandPalette';

export default CommandPalette;
