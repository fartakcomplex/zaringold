
import React, { useState } from 'react';
import {Menu, Bell, TrendingUp, TrendingDown, User, Check, Globe} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {useTranslation, getPageTitleKey} from '@/lib/i18n';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import {Popover, PopoverTrigger, PopoverContent} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import {useGoldPriceSocket} from '@/lib/useGoldPriceSocket';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(price));
}

function getInitials(name?: string): string {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[0][0] + parts[parts.length - 1][0];
  }
  return parts[0].slice(0, 2);
}

/* ------------------------------------------------------------------ */
/*  Mock Notifications                                                */
/* ------------------------------------------------------------------ */

interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', icon: '🔔', title: 'خرید شما با موفقیت انجام شد', time: '۱۰ دقیقه پیش', read: false },
  { id: '2', icon: '📈', title: 'قیمت طلا به ۴۰ گرم طلا رسید', time: '۳۰ دقیقه پیش', read: false },
  { id: '3', icon: '💰', title: 'موجودی کیف پول شما شارژ شد', time: '۱ ساعت پیش', read: true },
  { id: '4', icon: '🎁', title: 'جایزه دعوت شما اضافه شد', time: '۲ ساعت پیش', read: true },
  { id: '5', icon: '⚠️', title: 'سقف روزانه معامله نزدیک است', time: '۵ ساعت پیش', read: true },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

export default function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { currentPage, setPage, user, goldPrice } = useAppStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const { t } = useTranslation();

  // WebSocket live prices
  const { isConnected: wsConnected } = useGoldPriceSocket();

  const title = t(getPageTitleKey(currentPage));
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markOneRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleViewAllNotifications = () => {
    setNotifOpen(false);
    markAllRead();
    setPage('notifications');
  };

  return (
    <header className="sticky top-0 z-10 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/* iOS status bar spacer */}
      <div className="ios-status-bar-spacer md:hidden" />

      {/* ─── Mobile Header (matching reference design) ─── */}
      <div className="flex h-12 items-center justify-between px-4 md:hidden">
        {/* Right side: Menu + Bell */}
        <div className="flex items-center gap-1">
          {/* Hamburger menu button */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted/50"
              aria-label="منو"
            >
              <Menu className="size-5 text-foreground" />
            </button>
          )}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <button className="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted/50">
                <Bell className="size-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 end-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-80 rounded-xl border border-border/80 bg-card p-0 shadow-xl sm:w-[340px]">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <h4 className="text-sm font-bold text-foreground">{t('notifications.recent')}</h4>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 transition-colors">
                      <Check className="size-3" />
                      {t('notifications.markAllRead')}
                    </button>
                  )}
                  <button onClick={handleViewAllNotifications} className="text-xs font-medium text-gold hover:text-gold/80 transition-colors">
                    {t('notifications.viewAll')}
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => markOneRead(notif.id)}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-border/30 p-3.5 text-start transition-colors last:border-0',
                      !notif.read ? 'bg-gold/[0.04] hover:bg-gold/[0.08]' : 'hover:bg-muted/50',
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="relative mt-0.5 shrink-0">
                        <span className="text-lg">{notif.icon}</span>
                        {!notif.read && (
                          <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-gold" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-xs leading-relaxed text-foreground line-clamp-2', !notif.read && 'font-semibold')}>
                          {notif.title}
                        </p>
                        <p className={cn('mt-1 text-[10px]', !notif.read ? 'text-gold/70' : 'text-muted-foreground/70')}>
                          {notif.time}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-border/50 p-2">
                <button onClick={handleViewAllNotifications} className="w-full rounded-lg py-2 text-center text-xs font-medium text-gold hover:bg-gold/[0.06] transition-colors">
                  {t('notifications.viewAllNotifications')}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Center: Z Logo */}
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gold/15">
            <span className="text-lg font-bold text-gold">Z</span>
          </div>
        </div>

        {/* Left side: Profile avatar */}
        <button
          type="button"
          onClick={() => setPage('profile')}
          className="transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-full"
          aria-label="پروفایل"
        >
          <Avatar className="size-9 border-2 border-gold/30">
            {user?.avatar && <AvatarImage src={user.avatar} alt={user.fullName} />}
            <AvatarFallback className="bg-gold/15 text-[10px] font-semibold text-gold">
              {getInitials(user?.fullName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>

      {/* ─── Desktop Header (original layout) ─── */}
      <div className="hidden items-center gap-2 px-4 md:flex md:h-14 md:px-6">
        {/* Desktop hamburger */}
        <Button variant="ghost" size="icon" className="shrink-0" onClick={onMenuToggle} aria-label="منو">
          <Menu className="size-5" />
        </Button>

        {/* Page title */}
        <h1 className="flex-1 truncate text-base font-bold text-foreground md:text-lg">
          {title}
        </h1>

        {/* Gold price ticker */}
        {goldPrice && (
          <div className="hidden items-center gap-2.5 rounded-full border border-gold/25 bg-gradient-to-l from-gold/10 via-gold/5 to-gold/[0.03] px-4 py-1.5 sm:flex shadow-sm shadow-gold/[0.06]">
            <span className={cn('relative inline-block size-2 shrink-0 rounded-full', wsConnected ? 'bg-emerald-500' : 'bg-gray-400')}>
              {wsConnected && <span className="absolute inset-0 inline-block size-2 animate-ping rounded-full bg-emerald-400 opacity-75" />}
            </span>
            <span className={cn('text-[11px] font-medium shrink-0', wsConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
              {wsConnected ? 'زنده' : 'آفلاین'}
            </span>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-500" />
              <span className="text-[11px] text-muted-foreground">خرید:</span>
              <span className="text-xs font-semibold text-emerald-500 tabular-nums">{formatPrice(goldPrice.buyPrice)}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <TrendingDown className="size-3.5 text-red-500" />
              <span className="text-[11px] text-muted-foreground">فروش:</span>
              <span className="text-xs font-semibold text-red-500 tabular-nums">{formatPrice(goldPrice.sellPrice)}</span>
            </div>
          </div>
        )}

        <LanguageSwitcher />

        {/* Notification Bell */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="اعلان‌ها">
              <Bell className="size-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute start-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-80 rounded-xl border border-border/80 bg-card p-0 shadow-xl sm:w-[340px]">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <h4 className="text-sm font-bold text-foreground">{t('notifications.recent')}</h4>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 transition-colors">
                    <Check className="size-3" />
                    {t('notifications.markAllRead')}
                  </button>
                )}
                <button onClick={handleViewAllNotifications} className="text-xs font-medium text-gold hover:text-gold/80 transition-colors">
                  {t('notifications.viewAll')}
                </button>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => markOneRead(notif.id)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-border/30 p-3.5 text-start transition-colors last:border-0',
                    !notif.read ? 'bg-gold/[0.04] hover:bg-gold/[0.08]' : 'hover:bg-muted/50',
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="relative mt-0.5 shrink-0">
                      <span className="text-lg">{notif.icon}</span>
                      {!notif.read && <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-gold" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-xs leading-relaxed text-foreground line-clamp-2', !notif.read && 'font-semibold')}>{notif.title}</p>
                      <p className={cn('mt-1 text-[10px]', !notif.read ? 'text-gold/70' : 'text-muted-foreground/70')}>{notif.time}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-border/50 p-2">
              <button onClick={handleViewAllNotifications} className="w-full rounded-lg py-2 text-center text-xs font-medium text-gold hover:bg-gold/[0.06] transition-colors">
                {t('notifications.viewAllNotifications')}
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User avatar */}
        <button type="button" onClick={() => setPage('profile')} className="shrink-0 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full" aria-label="پروفایل">
          <Avatar className="size-9 border-2 border-gold/50 ring-2 ring-gold/20 ring-offset-1 ring-offset-background transition-shadow duration-200 hover:ring-gold/40">
            {user?.avatar && <AvatarImage src={user.avatar} alt={user.fullName} />}
            <AvatarFallback className="bg-gradient-to-br from-gold/20 to-gold/10 text-xs font-semibold text-gold">{getInitials(user?.fullName)}</AvatarFallback>
          </Avatar>
        </button>
      </div>

      {/* Mobile gold price bar (visible only on small screens) */}
      {goldPrice && (
        <div className="flex items-center justify-center gap-3 border-t border-border/30 bg-gold/5 px-4 py-1.5 sm:hidden">
          <span className={cn('relative inline-block size-2 shrink-0 rounded-full', wsConnected ? 'bg-emerald-500' : 'bg-gray-400')}>
            {wsConnected && <span className="absolute inset-0 inline-block size-2 animate-ping rounded-full bg-emerald-400 opacity-75" />}
          </span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3 text-emerald-500" />
            <span className="text-[10px] text-muted-foreground">خرید</span>
            <span className="text-xs font-semibold text-emerald-500 tabular-nums">{formatPrice(goldPrice.buyPrice)}</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <TrendingDown className="size-3 text-red-500" />
            <span className="text-[10px] text-muted-foreground">فروش</span>
            <span className="text-xs font-semibold text-red-500 tabular-nums">{formatPrice(goldPrice.sellPrice)}</span>
          </div>
        </div>
      )}
    </header>
  );
}
