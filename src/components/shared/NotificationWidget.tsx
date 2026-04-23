'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Bell,
  BellOff,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  CheckCheck,
  X,
  ArrowUpRight,
  ShoppingCart,
  ShieldCheck,
  Settings2,
  Star,
  AlertTriangle,
  CircleAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

type NotificationType = 'trade' | 'security' | 'system' | 'promo' | 'price';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
  actionLabel?: string;
  actionPage?: string;
}

interface PriceAlertData {
  id: string;
  type: 'buy' | 'sell';
  condition: 'above' | 'below';
  targetPrice: number;
  isActive: boolean;
  isTriggered: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Notifications                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'خرید طلا موفق',
    description: 'شما ۰.۵ گرم طلا خریداری کردید.',
    time: '۵ دقیقه پیش',
    type: 'trade',
    read: false,
    actionLabel: 'جزئیات',
    actionPage: 'transactions',
  },
  {
    id: '2',
    title: 'افزایش قیمت طلا',
    description: 'قیمت هر گرم طلای خام ۰.۸٪ افزایش یافت.',
    time: '۱۵ دقیقه پیش',
    type: 'price',
    read: false,
    actionPage: 'trade',
  },
  {
    id: '3',
    title: 'واریز موفق',
    description: 'مبلغ به کیف پول شما واریز شد.',
    time: '۱ ساعت پیش',
    type: 'trade',
    read: true,
  },
  {
    id: '4',
    title: 'ورود جدید',
    description: 'ورود از دستگاه جدید (Android - Chrome).',
    time: '۲ ساعت پیش',
    type: 'security',
    read: false,
    actionPage: 'settings',
  },
  {
    id: '5',
    title: 'پاداش دعوت',
    description: 'دوست شما علی ثبت‌نام کرد.',
    time: '۳ ساعت پیش',
    type: 'promo',
    read: true,
  },
  {
    id: '6',
    title: 'هشدار قیمت فعال شد',
    description: 'قیمت طلا به زیر ۳۳,۰۰۰,۰۰۰ رسید.',
    time: '۳ روز پیش',
    type: 'price',
    read: false,
    actionPage: 'market',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Icon / Color helpers                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getTypeConfig(type: NotificationType) {
  switch (type) {
    case 'trade':
      return { icon: ShoppingCart, bg: 'bg-[#D4AF37]/10', iconColor: 'text-[#D4AF37]' };
    case 'security':
      return { icon: ShieldCheck, bg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' };
    case 'system':
      return { icon: Settings2, bg: 'bg-blue-500/10', iconColor: 'text-blue-500' };
    case 'promo':
      return { icon: Star, bg: 'bg-amber-500/10', iconColor: 'text-amber-500' };
    case 'price':
      return { icon: TrendingUp, bg: 'bg-[#D4AF37]/10', iconColor: 'text-[#D4AF37]' };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Persian number helper                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function toPersianNum(n: number): string {
  const fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return n.toLocaleString('en-US').replace(/\d/g, (d) => fa[parseInt(d)]);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  NotificationWidget                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

type WidgetTab = 'notifications' | 'alerts' | 'new-alert';

export default function NotificationWidget() {
  const { user, setPage, addToast } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WidgetTab>('notifications');

  /* ── Notifications state ── */
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  /* ── Price alerts state ── */
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(8_900_000);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  /* ── New alert form ── */
  const [alertType, setAlertType] = useState<'buy' | 'sell'>('buy');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alertPrice, setAlertPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  /* ── Derived ── */
  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ── Fetch alerts on mount & when tab changes ── */
  useEffect(() => {
    if (user && activeTab === 'alerts') {
      fetchAlerts();
    }
  }, [user, activeTab]);

  /* ── Fetch current gold price ── */
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/gold/prices');
        if (res.ok) {
          const data = await res.json();
          setCurrentPrice(data.buyPrice || 8_900_000);
        }
      } catch { /* silent */ }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ── Focus price input when switching to new-alert ── */
  useEffect(() => {
    if (activeTab === 'new-alert' && priceInputRef.current) {
      const timer = setTimeout(() => priceInputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  /* ── Auto-scroll to bottom on open ── */
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen, activeTab]);

  /* ── Fetch alerts from API ── */
  const fetchAlerts = async () => {
    if (!user) return;
    setIsLoadingAlerts(true);
    try {
      const res = await fetch(`/api/alerts?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.alerts) {
          setPriceAlerts(data.alerts);
        }
      }
    } catch { /* silent */ }
    finally {
      setIsLoadingAlerts(false);
    }
  };

  /* ── Mark one notification read ── */
  const markOneRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  /* ── Mark all read ── */
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('همه اعلان‌ها خوانده شد', 'success');
  }, [addToast]);

  /* ── Delete notification ── */
  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /* ── Create price alert ── */
  const handleCreateAlert = useCallback(async () => {
    const price = parseInt(alertPrice.replace(/,/g, ''), 10);
    if (!price || price < 1_000_000 || !user) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: alertType,
          condition: alertCondition,
          targetPrice: price,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'هشدار قیمت ایجاد شد', 'success');
        setAlertPrice('');
        setPriceAlerts((prev) => [
          {
            id: data.alert?.id || Date.now().toString(),
            type: alertType,
            condition: alertCondition,
            targetPrice: price,
            isActive: true,
            isTriggered: false,
          },
          ...prev,
        ]);
        setActiveTab('alerts');
      } else {
        addToast(data.message || 'خطا در ایجاد هشدار', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsCreating(false);
    }
  }, [alertPrice, alertType, alertCondition, user, addToast]);

  /* ── Delete alert ── */
  const handleDeleteAlert = useCallback(async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    } catch { /* silent */ }
    setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
    addToast('هشدار حذف شد', 'success');
  }, [addToast]);

  /* ── Don't show if user is not authenticated ── */
  if (!user) return null;

  return (
    <>
      {/* ── Floating Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed z-50 flex size-14 items-center justify-center rounded-full bg-[#1A1A1A] shadow-lg shadow-black/30 md:bottom-6 md:left-6"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)', left: '1.25rem' }}
            aria-label="باز کردن اعلان‌ها"
          >
            <Bell className="size-6 text-[#D4AF37]" />
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '۹+' : toPersianNum(unreadCount)}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Notification Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 flex h-[560px] w-[calc(100vw-2.5rem)] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl md:bottom-6 md:left-6"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)', left: '1.25rem' }}
          >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-[#D4AF37]/10">
                <Bell className="size-5 text-[#D4AF37]" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-bold text-foreground">اعلان‌ها</span>
                <span className="text-[11px] text-muted-foreground">
                  {unreadCount > 0 ? (
                    <span className="text-[#D4AF37] font-semibold">{toPersianNum(unreadCount)}</span>
                  ) : (
                    'بدون اعلان جدید'
                  )}
                  {' '}خوانده نشده
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="size-8 text-muted-foreground hover:text-foreground"
                aria-label="بستن"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* ── Tab Bar ── */}
            <div className="flex border-b border-border bg-muted/30">
              {([
                { key: 'notifications' as WidgetTab, label: 'اعلان‌ها', icon: Bell },
                { key: 'alerts' as WidgetTab, label: 'هشدار قیمت', icon: CircleAlert },
                { key: 'new-alert' as WidgetTab, label: 'اعلان جدید', icon: Plus },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors relative',
                    activeTab === tab.key
                      ? 'text-[#D4AF37]'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="size-3.5" />
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-[#D4AF37]" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Content ── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {/* ── Notifications Tab ── */}
              {activeTab === 'notifications' && (
                <div className="p-3">
                  {/* Quick actions */}
                  {unreadCount > 0 && (
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {toPersianNum(notifications.length)} اعلان
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-[11px] text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/10"
                        onClick={markAllRead}
                      >
                        <CheckCheck className="size-3" />
                        خواندن همه
                      </Button>
                    </div>
                  )}

                  {/* Notification list */}
                  <div className="space-y-1.5">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <BellOff className="size-8 text-muted-foreground/30" />
                        <p className="mt-3 text-xs font-medium text-muted-foreground">
                          اعلان جدیدی وجود ندارد
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const { icon: NIcon, bg, iconColor } = getTypeConfig(notif.type);
                        return (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              'group relative rounded-xl p-3 transition-colors cursor-pointer',
                              notif.read
                                ? 'bg-card/50 hover:bg-card/80'
                                : 'bg-[#D4AF37]/[0.04] border border-[#D4AF37]/10 hover:bg-[#D4AF37]/[0.08]'
                            )}
                            onClick={() => !notif.read && markOneRead(notif.id)}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', bg)}>
                                <NIcon className={cn('size-4', iconColor)} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className={cn(
                                    'truncate text-xs font-semibold',
                                    notif.read ? 'text-foreground/70' : 'text-foreground'
                                  )}>
                                    {notif.title}
                                  </h4>
                                  {!notif.read && (
                                    <span className="size-1.5 shrink-0 rounded-full bg-[#D4AF37]" />
                                  )}
                                </div>
                                <p className={cn(
                                  'mt-0.5 text-[11px] leading-relaxed line-clamp-2',
                                  notif.read ? 'text-muted-foreground/60' : 'text-muted-foreground'
                                )}>
                                  {notif.description}
                                </p>
                                <div className="mt-1.5 flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground/60">{notif.time}</span>
                                  <div className="flex items-center gap-0.5">
                                    {notif.actionLabel && (
                                      <span className="text-[10px] text-[#D4AF37] hover:underline">
                                        {notif.actionLabel}
                                        <ArrowUpRight className="inline size-2.5 me-0.5" />
                                      </span>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10"
                                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                      aria-label="حذف"
                                    >
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ── Alerts Tab ── */}
              {activeTab === 'alerts' && (
                <div className="p-3">
                  {/* Current price banner */}
                  <div className="mb-3 flex items-center gap-2 rounded-xl bg-gradient-to-l from-[#D4AF37]/10 to-[#D4AF37]/[0.03] border border-[#D4AF37]/10 p-3">
                    <TrendingUp className="size-4 text-[#D4AF37]" />
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground">قیمت فعلی هر گرم طلای خام</p>
                      <p className="text-sm font-bold text-foreground">{toPersianNum(currentPrice)} <span className="text-[10px] text-muted-foreground font-normal">گرم طلا</span></p>
                    </div>
                  </div>

                  {/* Alerts list */}
                  {isLoadingAlerts ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
                      ))}
                    </div>
                  ) : priceAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="size-8 text-muted-foreground/30" />
                      <p className="mt-3 text-xs font-medium text-muted-foreground">
                        هنوز هشدار قیمتی ثبت نکردید
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 h-8 gap-1.5 bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90 text-[11px]"
                        onClick={() => setActiveTab('new-alert')}
                      >
                        <Plus className="size-3" />
                        ایجاد هشدار
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {priceAlerts.map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3"
                        >
                          <div className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-lg',
                            alert.type === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                          )}>
                            {alert.condition === 'above' ? (
                              <TrendingUp className={cn('size-4', alert.type === 'buy' ? 'text-emerald-500' : 'text-red-500')} />
                            ) : (
                              <TrendingDown className={cn('size-4', alert.type === 'buy' ? 'text-emerald-500' : 'text-red-500')} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">
                                {alert.type === 'buy' ? 'قیمت خرید' : 'قیمت فروش'}
                              </span>
                              {alert.isTriggered && (
                                <Badge className="bg-[#D4AF37] text-white text-[8px] px-1 py-0 hover:bg-[#D4AF37]">فعال‌شده</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {alert.condition === 'above' ? 'بالاتر از' : 'پایین‌تر از'}
                              {' '}{toPersianNum(alert.targetPrice)} گرم طلا
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDeleteAlert(alert.id)}
                            aria-label="حذف هشدار"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Go to full page link */}
                  {priceAlerts.length > 0 && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={() => { setIsOpen(false); setPage('notifications'); }}
                        className="text-[11px] text-[#D4AF37] hover:underline"
                      >
                        مشاهده همه در صفحه اعلان‌ها
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── New Alert Tab ── */}
              {activeTab === 'new-alert' && (
                <div className="p-3 space-y-4">
                  {/* Current price */}
                  <div className="flex items-center gap-2 rounded-xl bg-muted/30 p-3">
                    <TrendingUp className="size-4 text-[#D4AF37]" />
                    <span className="text-[11px] text-muted-foreground">
                      قیمت فعلی: <span className="font-bold text-foreground">{toPersianNum(currentPrice)}</span> گرم طلا
                    </span>
                  </div>

                  {/* Alert type */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-foreground">نوع هشدار</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setAlertType('buy')}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium transition-all border',
                          alertType === 'buy'
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-border bg-card/50 text-muted-foreground hover:bg-card'
                        )}
                      >
                        <TrendingUp className="size-3.5" />
                        قیمت خرید
                      </button>
                      <button
                        onClick={() => setAlertType('sell')}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium transition-all border',
                          alertType === 'sell'
                            ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'border-border bg-card/50 text-muted-foreground hover:bg-card'
                        )}
                      >
                        <TrendingDown className="size-3.5" />
                        قیمت فروش
                      </button>
                    </div>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-foreground">شرط هشدار</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setAlertCondition('above')}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium transition-all border',
                          alertCondition === 'above'
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                            : 'border-border bg-card/50 text-muted-foreground hover:bg-card'
                        )}
                      >
                        <TrendingUp className="size-3.5" />
                        بالاتر از
                      </button>
                      <button
                        onClick={() => setAlertCondition('below')}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium transition-all border',
                          alertCondition === 'below'
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                            : 'border-border bg-card/50 text-muted-foreground hover:bg-card'
                        )}
                      >
                        <TrendingDown className="size-3.5" />
                        پایین‌تر از
                      </button>
                    </div>
                  </div>

                  {/* Target price */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-foreground">قیمت هدف (گرم طلا)</label>
                    <div className="relative">
                      <Input
                        ref={priceInputRef}
                        type="text"
                        inputMode="numeric"
                        value={alertPrice ? toPersianNum(parseInt(alertPrice.replace(/,/g, ''), 10)) : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
                          const num = val.replace(/[^0-9]/g, '');
                          setAlertPrice(num);
                        }}
                        placeholder={toPersianNum(currentPrice)}
                        className="border-border bg-muted/50 text-sm focus-visible:ring-[#D4AF37]/30 text-left dir-ltr"
                        dir="ltr"
                      />
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[11px] text-muted-foreground">گرم طلا</span>
                    </div>
                    {/* Quick set buttons */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[
                        { label: '-۵٪', pct: 0.95 },
                        { label: '-۳٪', pct: 0.97 },
                        { label: '+۳٪', pct: 1.03 },
                        { label: '+۵٪', pct: 1.05 },
                        { label: '+۱۰٪', pct: 1.10 },
                      ].map((q) => {
                        const val = Math.round(currentPrice * q.pct);
                        return (
                          <button
                            key={q.label}
                            onClick={() => setAlertPrice(val.toString())}
                            className="rounded-lg bg-muted/50 px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
                          >
                            {q.label} ({toPersianNum(val)})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl bg-[#D4AF37]/[0.04] border border-[#D4AF37]/10 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      وقتی قیمت{' '}
                      <span className="font-semibold text-foreground">
                        {alertType === 'buy' ? 'خرید' : 'فروش'}
                      </span>
                      {' '}طلا{' '}
                      <span className="font-semibold text-[#D4AF37]">
                        {alertCondition === 'above' ? 'بالاتر' : 'پایین‌تر'}
                      </span>
                      {' '}از{' '}
                      <span className="font-semibold text-foreground">
                        {alertPrice ? toPersianNum(parseInt(alertPrice)) : '...'} گرم طلا
                      </span>
                      {' '}رسید، به شما اطلاع می‌دهیم.
                    </p>
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleCreateAlert}
                    disabled={!alertPrice || parseInt(alertPrice) < 1_000_000 || isCreating}
                    className="w-full bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90 font-semibold"
                  >
                    {isCreating ? (
                      <span className="flex items-center gap-2">
                        <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        در حال ثبت...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        <Plus className="size-4" />
                        ثبت هشدار قیمت
                      </span>
                    )}
                  </Button>

                  {/* Existing alerts count */}
                  {priceAlerts.length > 0 && (
                    <p className="text-center text-[10px] text-muted-foreground">
                      شما {toPersianNum(priceAlerts.length)} هشدار فعال دارید
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            {activeTab === 'notifications' && (
              <div className="border-t border-border bg-card/80 px-3 py-2">
                <button
                  onClick={() => { setIsOpen(false); setPage('notifications'); }}
                  className="flex w-full items-center justify-center gap-1.5 py-1 text-[11px] text-muted-foreground hover:text-[#D4AF37] transition-colors"
                >
                  مشاهده همه اعلان‌ها
                  <ArrowUpRight className="size-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
