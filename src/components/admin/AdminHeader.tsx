'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Menu, Bell, Search, RefreshCw, ShieldCheck, Banknote, CreditCard,
  Maximize, Minimize, User, Settings, LogOut, Sun, Moon,
  ChevronLeft,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/* ------------------------------------------------------------------ */
/*  Breadcrumb mapping                                                 */
/* ------------------------------------------------------------------ */

const pageTitles: Record<string, string> = {
  dashboard: 'داشبورد',
  users: 'مدیریت کاربران',
  kyc: 'احراز هویت',
  tickets: 'تیکت‌ها',
  chats: 'چت‌های زنده',
  transactions: 'تراکنش‌ها',
  loans: 'وام‌ها',
  prices: 'قیمت طلا',
  blog: 'بلاگ',
  pages: 'صفحات',
  backups: 'بکاپ دیتابیس',
  'easy-installer': 'ایزی اینستالر',
  'fraud-alerts': 'هشدار تقلب',
  gateway: 'مدیریت درگاه',
  security: 'سپر امنیتی',
  'landing-builder': 'ویرایش لندینگ',
  settings: 'تنظیمات',
};

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function getInitials(name?: string): string {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
  return parts[0].slice(0, 2);
}

function getRoleLabel(role?: string): string {
  if (role === 'super_admin') return 'مدیر ارشد';
  if (role === 'admin') return 'مدیر';
  return 'کاربر';
}

function getRoleVariant(role?: string): 'default' | 'secondary' | 'outline' {
  if (role === 'super_admin') return 'default';
  if (role === 'admin') return 'secondary';
  return 'outline';
}

/* ------------------------------------------------------------------ */
/*  Server status checker                                              */
/* ------------------------------------------------------------------ */

async function checkServerStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/health?_t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Admin Header                                                       */
/* ------------------------------------------------------------------ */

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { adminPage, setAdminPage, user, setPage, setUser } = useAppStore();
  const { theme, setTheme } = useTheme();

  const title = pageTitles[adminPage] || 'داشبورد';

  /* -------- 1. Real-time Persian clock -------- */
  const [persianDateTime, setPersianDateTime] = useState('');
  const [persianDate, setPersianDate] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setPersianDateTime(timeFormatter.format(now));
      setPersianDate(dateFormatter.format(now));
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  /* -------- 4. Live server status -------- */
  const [serverOnline, setServerOnline] = useState(true);

  useEffect(() => {
    checkServerStatus().then(setServerOnline);
    const interval = setInterval(() => {
      checkServerStatus().then(setServerOnline);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  /* -------- 6. Fullscreen toggle -------- */
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  /* -------- 7. Logout handler -------- */
  const handleLogout = useCallback(() => {
    setUser(null);
    setPage('landing');
  }, [setUser, setPage]);

  /* -------- Breadcrumb segments -------- */
  const breadcrumbSegments: Array<{ label: string; page?: string }> = [
    { label: 'پنل مدیریت', page: 'dashboard' },
    ...(adminPage !== 'dashboard'
      ? [{ label: title, page: adminPage }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      {/* Top bar */}
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuToggle} aria-label="منو">
          <Menu className="size-5" />
        </Button>

        {/* Breadcrumb trail */}
        <nav className="hidden sm:flex" aria-label="مسیر ناوبری">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              {breadcrumbSegments.map((seg, i) => (
                <React.Fragment key={seg.page ?? 'root'}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {seg.page && i < breadcrumbSegments.length - 1 ? (
                      <BreadcrumbLink
                        className="cursor-pointer text-muted-foreground hover:text-gold transition-colors"
                        onClick={() => setAdminPage(seg.page!)}
                      >
                        {seg.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-foreground font-semibold">
                        {seg.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </nav>

        {/* Mobile page title (visible only when breadcrumb is hidden) */}
        <div className="flex items-center gap-2 sm:hidden">
          <h1 className="text-base font-bold text-foreground">{title}</h1>
        </div>

        <div className="flex-1" />

        {/* 1. Persian date/time (desktop) */}
        <div className="hidden lg:flex flex-col items-end gap-0 ml-2">
          <span className="text-xs font-medium text-foreground tabular-nums tracking-wide">
            {persianDateTime}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {persianDate}
          </span>
        </div>

        {/* 1. Persian time (mobile) */}
        <span className="lg:hidden text-xs font-medium text-foreground tabular-nums">
          {persianDateTime}
        </span>

        {/* Search (desktop) */}
        <div className="relative hidden md:block">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="جستجو..." className="w-64 h-9 pr-9 text-sm bg-muted/50 border-border/50 focus:border-gold/30" />
        </div>

        {/* Refresh */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-gold" onClick={() => window.location.reload()} aria-label="بروزرسانی">
              <RefreshCw className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">بروزرسانی</TooltipContent>
        </Tooltip>

        {/* 6. Fullscreen toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-gold" onClick={toggleFullscreen} aria-label={isFullscreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}>
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{isFullscreen ? 'خروج از تمام صفحه' : 'نمایش تمام صفحه'}</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="اعلان‌ها">
                  <Bell className="size-5 text-muted-foreground" />
                  <span className="absolute start-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    ۳
                  </span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">اعلان‌ها</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-gold">اعلان‌ها</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setAdminPage('kyc')}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-amber-500" />
                <span className="flex-1">۳ درخواست KYC در انتظار بررسی</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAdminPage('loans')}>
              <div className="flex items-center gap-2">
                <Banknote className="size-4 text-emerald-500" />
                <span className="flex-1">۲ درخواست وام جدید</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAdminPage('transactions')}>
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-red-500" />
                <span className="flex-1">۵ برداشت معلق</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-gold text-center justify-center">
              مشاهده همه اعلان‌ها
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 7. User dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex items-center gap-2 shrink-0 px-2 h-9 hover:bg-muted/50 rounded-lg">
              {/* Avatar */}
              <Avatar className="size-8 border-2 border-gold/30">
                <AvatarFallback className="bg-gold/15 text-xs font-semibold text-gold">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              {/* 2. Admin name */}
              <div className="hidden sm:flex flex-col items-start gap-0">
                <span className="text-xs font-semibold text-foreground leading-tight">
                  {user?.fullName || user?.phone || 'مدیر'}
                </span>
                {/* 3. Role badge */}
                <Badge
                  variant={getRoleVariant(user?.role)}
                  className="text-[9px] px-1.5 py-0 h-4 leading-none border-gold/20 bg-gold/10 text-gold"
                >
                  {getRoleLabel(user?.role)}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">{user?.fullName || user?.phone || 'مدیر'}</span>
                <span className="text-xs text-muted-foreground">{user?.phone}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setAdminPage('settings')}>
                <User className="ms-2 size-4" />
                <span>پروفایل</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAdminPage('settings')}>
                <Settings className="ms-2 size-4" />
                <span>تنظیمات</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? (
                  <>
                    <Sun className="ms-2 size-4" />
                    <span>حالت روشن</span>
                  </>
                ) : (
                  <>
                    <Moon className="ms-2 size-4" />
                    <span>حالت تاریک</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
              <LogOut className="ms-2 size-4" />
              <span>خروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sub bar: server status (always visible, thin bar) */}
      <div className="flex items-center gap-2 px-4 md:px-6 h-6 border-t border-border/30 bg-muted/30">
        {/* 4. Server status indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            {serverOnline && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex size-2 rounded-full ${
                serverOnline ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </span>
          <span className="text-[10px] text-muted-foreground">
            {serverOnline ? 'سرور آنلاین' : 'اتصال قطع'}
          </span>
        </div>

        <div className="flex-1" />

        {/* Mobile breadcrumb (shown in sub-bar) */}
        <nav className="sm:hidden" aria-label="مسیر ناوبری">
          <Breadcrumb>
            <BreadcrumbList className="text-[10px]">
              {breadcrumbSegments.map((seg, i) => (
                <React.Fragment key={seg.page ?? 'root'}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {seg.page && i < breadcrumbSegments.length - 1 ? (
                      <BreadcrumbLink
                        className="cursor-pointer text-muted-foreground hover:text-gold transition-colors"
                        onClick={() => setAdminPage(seg.page!)}
                      >
                        {seg.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-foreground font-medium">
                        {seg.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </nav>

        {/* Mobile role badge */}
        <Badge
          variant={getRoleVariant(user?.role)}
          className="sm:hidden text-[9px] px-1.5 py-0 h-4 leading-none border-gold/20 bg-gold/10 text-gold"
        >
          {getRoleLabel(user?.role)}
        </Badge>
      </div>
    </header>
  );
}
