
import React, { useState, useMemo } from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Bell, CheckCheck, ArrowUpRight, ShieldCheck, TrendingUp, Trash2, Settings2, ShoppingCart, Star} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';
import {useAppStore} from '@/lib/store';
import {usePageEvent} from '@/hooks/use-page-event';
import {useTranslation} from '@/lib/i18n';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'خرید طلا موفق',
    description: 'شما ۰.۵ گرم طلا خریداری کردید.',
    time: '۵ دقیقه پیش',
    type: 'trade',
    read: false,
    actionLabel: 'مشاهده جزئیات',
    actionPage: 'transactions',
  },
  {
    id: '2',
    title: 'افزایش قیمت طلا',
    description: 'قیمت هر گرم طلای خام ۰.۸٪ افزایش یافت.',
    time: '۱۵ دقیقه پیش',
    type: 'price',
    read: false,
    actionLabel: 'مشاهده قیمت‌ها',
    actionPage: 'trade',
  },
  {
    id: '3',
    title: 'واریز موفق',
    description: '۰.۰۳ گرم طلا به کیف پول طلایی شما واریز شد.',
    time: '۱ ساعت پیش',
    type: 'trade',
    read: true,
  },
  {
    id: '4',
    title: 'ورود جدید',
    description: 'ورود به حساب کاربری از دستگاه جدید (Android - Chrome).',
    time: '۲ ساعت پیش',
    type: 'security',
    read: false,
    actionLabel: 'تأیید فعالیت',
    actionPage: 'settings',
  },
  {
    id: '5',
    title: 'پاداش دعوت',
    description: 'دوست شما علی محمدی ثبت‌نام کرد و پاداش ۰.۰۰۱ گرم طلا دریافت کردید.',
    time: '۳ ساعت پیش',
    type: 'promo',
    read: true,
  },
  {
    id: '6',
    title: 'تغییر رمز عبور',
    description: 'رمز عبور حساب شما با موفقیت تغییر کرد.',
    time: '۵ ساعت پیش',
    type: 'security',
    read: true,
  },
  {
    id: '7',
    title: 'فروش طلا',
    description: '۰.۳ گرم طلا فروخته شد.',
    time: '۱ روز پیش',
    type: 'trade',
    read: true,
  },
  {
    id: '8',
    title: 'سفارش در انتظار',
    description: 'سفارش برداشت ۰.۱۵ گرم طلا در انتظار تأیید است.',
    time: '۱ روز پیش',
    type: 'system',
    read: false,
    actionLabel: 'پیگیری سفارش',
    actionPage: 'transactions',
  },
  {
    id: '9',
    title: 'پیشنهاد ویژه',
    description: 'تا ۳۰ آذر، کارمزد خرید طلا فقط ۰.۲٪!',
    time: '۲ روز پیش',
    type: 'promo',
    read: true,
    actionLabel: 'خرید طلا',
    actionPage: 'trade',
  },
  {
    id: '10',
    title: 'تکمیل احراز هویت',
    description: 'مدارک احراز هویت شما تأیید شد.',
    time: '۳ روز پیش',
    type: 'system',
    read: true,
  },
  {
    id: '11',
    title: 'هشدار قیمت',
    description: 'قیمت طلا به زیر ۳۳,۰۰۰,۰۰۰ رسید (هشدار تنظیم‌شده).',
    time: '۳ روز پیش',
    type: 'price',
    read: false,
    actionLabel: 'مشاهده نمودار',
    actionPage: 'market',
  },
  {
    id: '12',
    title: 'برداشت موفق',
    description: '۰.۰۶ گرم طلا به کیف پول طلایی شما واریز شد.',
    time: '۵ روز پیش',
    type: 'trade',
    read: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Icon / Color helpers                                               */
/* ------------------------------------------------------------------ */

function getTypeConfig(type: NotificationType) {
  switch (type) {
    case 'trade':
      return {
        icon: ShoppingCart,
        bg: 'bg-[#D4AF37]/10',
        iconColor: 'text-[#D4AF37]',
        label: 'معاملات',
      };
    case 'security':
      return {
        icon: ShieldCheck,
        bg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        label: 'امنیتی',
      };
    case 'system':
      return {
        icon: Settings2,
        bg: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        label: 'سیستمی',
      };
    case 'promo':
      return {
        icon: Star,
        bg: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        label: 'تبلیغاتی',
      };
    case 'price':
      return {
        icon: TrendingUp,
        bg: 'bg-[#D4AF37]/10',
        iconColor: 'text-[#D4AF37]',
        label: 'قیمت',
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.2 } },
};

/* ------------------------------------------------------------------ */
/*  Notification Card                                                  */
/* ------------------------------------------------------------------ */

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { icon: Icon, bg, iconColor } = getTypeConfig(notification.type);

  return (
    <motion.div
      layout
      variants={itemVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn(
        'group relative rounded-xl border p-4 transition-colors duration-200 hover-lift-sm',
        notification.read
          ? 'border-border/50 bg-card/50 hover:bg-card/80'
          : 'border-gold/20 border-s-2 border-s-[#D4AF37] bg-gold/[0.03] hover:bg-gold/[0.06]'
      )}
      onClick={() => !notification.read && onMarkRead(notification.id)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            bg
          )}
        >
          <Icon className={cn('size-5', iconColor)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                'truncate text-sm font-semibold',
                notification.read ? 'text-foreground/80' : 'text-foreground'
              )}
            >
              {notification.title}
            </h4>
            {/* Unread dot */}
            {!notification.read && (
              <span className="size-2 shrink-0 rounded-full bg-gold shadow-sm shadow-gold/50" />
            )}
          </div>

          <p
            className={cn(
              'mt-1 text-xs leading-relaxed line-clamp-2',
              notification.read
                ? 'text-muted-foreground/70'
                : 'text-muted-foreground'
            )}
          >
            {notification.description}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-gold">
              {notification.time}
            </span>

            <div className="flex items-center gap-1">
              {notification.actionLabel && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[11px] text-gold hover:text-gold-dark hover:bg-gold/10"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {notification.actionLabel}
                  <ArrowUpRight className="size-3" />
                </Button>
              )}

              {/* Delete button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                aria-label="حذف اعلان"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10">
        <Bell className="size-7 text-gold-gradient" />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">
        اعلان جدیدی وجود ندارد
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        تمام اعلان‌ها را در اینجا مشاهده می‌کنید
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings Card                                                      */
/* ------------------------------------------------------------------ */

function NotificationSettings() {
  const [settings, setSettings] = useState({
    trade: true,
    price: true,
    login: true,
    promo: false,
    system: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const items: { key: keyof typeof settings; label: string; desc: string }[] = [
    { key: 'trade', label: 'اعلان معاملات', desc: 'خرید، فروش، واریز و برداشت' },
    { key: 'price', label: 'هشدار قیمت', desc: 'تغییرات قیمت و هشدارهای تنظیم‌شده' },
    { key: 'login', label: 'اعلان ورود', desc: 'ورود از دستگاه‌های جدید' },
    { key: 'promo', label: 'اعلان‌های تبلیغاتی', desc: 'پیشنهادهای ویژه و تخفیف‌ها' },
    { key: 'system', label: 'اعلان‌های سیستمی', desc: 'بروزرسانی‌ها و اطلاعیه‌ها' },
  ];

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Settings2 className="size-5 text-gold" />
          تنظیمات اعلان‌ها
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {items.map((item, idx) => (
          <React.Fragment key={item.key}>
            {idx > 0 && <Separator className="my-3 bg-border/50" />}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={() => toggleSetting(item.key)}
                className="data-[state=checked]:bg-gold shrink-0 me-2"
              />
            </div>
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function NotificationsView() {
  const { t, locale } = useTranslation();
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const { addToast } = useAppStore();

  /* ── Derived state ── */
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = useMemo(() => {
    let list = [...notifications];

    // Tab filter
    if (activeTab !== 'all') {
      list = list.filter((n) => n.type === activeTab);
    }

    // Read/unread filter
    if (readFilter === 'unread') {
      list = list.filter((n) => !n.read);
    } else if (readFilter === 'read') {
      list = list.filter((n) => n.read);
    }

    return list;
  }, [notifications, activeTab, readFilter]);

  /* ── Handlers ── */
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  /* ── Quick Action Event Listeners ── */
  usePageEvent('read-all', () => { markAllRead(); addToast('همه اعلان‌ها خوانده شد', 'success'); });
  usePageEvent('filter', () => { addToast('فیلتر اعلان‌ها', 'info'); });
  usePageEvent('delete-all', () => { setNotifications([]); addToast('همه اعلان‌ها حذف شدند', 'success'); });

  const handleTabChange = (value: string) => {
    setIsLoading(true);
    setActiveTab(value);
    setTimeout(() => setIsLoading(false), 300);
  };

  /* ── Render ── */
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
            <Bell className="size-5 text-gold" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">اعلان‌ها</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-gold">{unreadCount}</span>{' '}
                اعلان خوانده نشده
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="btn-gold-outline gap-2"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="size-4" />
          خواندن همه
        </Button>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className={cn('text-xs', activeTab === 'all' && 'tab-active-gold')}>
              همه
              {unreadCount > 0 && (
                <Badge className="ms-1.5 h-4 min-w-4 px-1 text-[10px] bg-gold/20 text-gold hover:bg-gold/30">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="trade" className={cn('text-xs', activeTab === 'trade' && 'tab-active-gold')}>معاملات</TabsTrigger>
            <TabsTrigger value="security" className={cn('text-xs', activeTab === 'security' && 'tab-active-gold')}>امنیتی</TabsTrigger>
            <TabsTrigger value="system" className={cn('text-xs', activeTab === 'system' && 'tab-active-gold')}>سیستمی</TabsTrigger>
            <TabsTrigger value="promo" className={cn('text-xs', activeTab === 'promo' && 'tab-active-gold')}>تبلیغاتی</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Read/Unread Filter ── */}
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant={readFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-8 text-xs',
              readFilter === 'all' && 'bg-gold text-gold-foreground hover:bg-gold/90'
            )}
            onClick={() => setReadFilter('all')}
          >
            همه
          </Button>
          <Button
            variant={readFilter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-8 text-xs',
              readFilter === 'unread' && 'bg-gold text-gold-foreground hover:bg-gold/90'
            )}
            onClick={() => setReadFilter('unread')}
          >
            خوانده نشده
          </Button>
          <Button
            variant={readFilter === 'read' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-8 text-xs',
              readFilter === 'read' && 'bg-gold text-gold-foreground hover:bg-gold/90'
            )}
            onClick={() => setReadFilter('read')}
          >
            خوانده شده
          </Button>
        </div>

        {/* ── Notification List ── */}
        {['all', 'trade', 'security', 'system', 'promo'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/50 bg-card/50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Skeleton className="size-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <EmptyState />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notif) => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      onMarkRead={markOneRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* ── Notification Settings ── */}
      <div className="pt-2">
        <NotificationSettings />
      </div>
    </div>
  );
}
