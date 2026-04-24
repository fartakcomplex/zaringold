'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Ticket,
  MessageCircle,
  ArrowUpDown,
  Banknote,
  TrendingUp,
  FileText,
  FileEdit,
  Settings,
  LogOut,
  ChevronLeft,
  Moon,
  Sun,
  ShieldAlert,
  Shield,
  Store,
  MessageSquare,
  Database,
  Package,
  Layers,
  Mail,
  Bot,
  ShieldHalf,
  Umbrella,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Navigation items                                                   */
/* ------------------------------------------------------------------ */

interface AdminNavItem {
  label: string;
  page: string;
  icon: React.ElementType;
  badge?: string;
  section?: string;
}

const adminNavSections: { title: string; items: AdminNavItem[] }[] = [
  {
    title: 'نمای کلی',
    items: [
      { label: 'داشبورد', page: 'dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'مدیریت کاربران',
    items: [
      { label: 'کاربران', page: 'users', icon: Users },
      { label: 'احراز هویت', page: 'kyc', icon: ShieldCheck, badge: 'KYC' },
    ],
  },
  {
    title: 'پشتیبانی',
    items: [
      { label: 'تیکت‌ها', page: 'tickets', icon: Ticket },
      { label: 'چت‌های زنده', page: 'chats', icon: MessageCircle },
    ],
  },
  {
    title: 'مالی',
    items: [
      { label: 'تراکنش‌ها', page: 'transactions', icon: ArrowUpDown },
      { label: 'وام‌ها', page: 'loans', icon: Banknote },
      { label: 'قیمت طلا', page: 'prices', icon: TrendingUp },
      { label: 'هشدار تقلب', page: 'fraud-alerts', icon: ShieldAlert },
      { label: 'مدیریت درگاه', page: 'gateway', icon: Store },
    ],
  },
  {
    title: 'مارکتینگ',
    items: [
      { label: 'پیامک', page: 'sms-marketing', icon: MessageSquare, badge: 'SMS' },
      { label: 'ایمیل', page: 'email-marketing', icon: Mail, badge: 'EMAIL' },
      { label: 'ربات تلگرام', page: 'telegram-bot', icon: Bot, badge: 'BOT' },
    ],
  },
  {
    title: 'محتوا',
    items: [
      { label: 'بلاگ', page: 'blog', icon: FileText },
      { label: 'صفحات', page: 'pages', icon: FileEdit },
      { label: 'ویرایش لندینگ', page: 'landing-builder', icon: Layers },
    ],
  },
  {
    title: 'بیمه و خدمات',
    items: [
      { label: 'مدیریت بیمه', page: 'insurance', icon: Umbrella },
    ],
  },
  {
    title: 'سیستم',
    items: [
      { label: 'نقش‌ها و دسترسی‌ها', page: 'roles', icon: ShieldHalf },
      { label: 'بکاپ دیتابیس', page: 'backups', icon: Database },
      { label: 'ایزی اینستالر', page: 'easy-installer', icon: Package },
      { label: 'سپر امنیتی', page: 'security', icon: Shield },
      { label: 'تنظیمات', page: 'settings', icon: Settings },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function getInitials(name?: string): string {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
  return parts[0].slice(0, 2);
}

/* ------------------------------------------------------------------ */
/*  Admin Sidebar Nav Item                                             */
/* ------------------------------------------------------------------ */

function AdminNavItemButton({
  item,
  isActive,
  onClick,
}: {
  item: AdminNavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-gold/10 text-gold'
          : 'text-muted-foreground hover:bg-gold/5 hover:text-gold/80'
      )}
    >
      {isActive && (
        <span className="absolute inset-y-0 start-0 w-[3px] rounded-e-full bg-gold" />
      )}

      <Icon
        className={cn(
          'size-[18px] shrink-0 transition-colors duration-200',
          isActive ? 'text-gold' : 'text-muted-foreground group-hover:text-gold/70'
        )}
      />

      <span className="flex-1 text-start">{item.label}</span>

      {item.badge && (
        <Badge className="bg-gold/15 text-[10px] text-gold hover:bg-gold/20">
          {item.badge}
        </Badge>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin Sidebar                                                      */
/* ------------------------------------------------------------------ */

export default function AdminSidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { user, adminPage, setAdminPage, switchToUserPanel, reset } = useAppStore();
  const { theme, setTheme } = useTheme();

  const handleNavigate = (page: string) => {
    setAdminPage(page);
    onNavigate?.();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    reset();
    onNavigate?.();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-sidebar backdrop-blur-xl',
        className
      )}
    >
      {/* ─── Logo ─── */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gold/15">
          <ShieldCheck className="size-5 text-gold" />
        </div>
        <div className="flex flex-col">
          <span className="gold-gradient-text text-lg font-bold leading-tight">
            پنل مدیریت
          </span>
          <span className="text-[11px] text-gold/50">زرین گلد</span>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* ─── User Info ─── */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent p-3">
          <Avatar className="size-10 border-2 border-gold/30">
            <AvatarFallback className="bg-gold/20 text-sm font-semibold text-gold">
              {getInitials(user?.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.fullName || user?.phone || 'مدیر'}
            </span>
            <Badge
              variant="secondary"
              className="w-fit bg-gold/15 text-[10px] text-gold hover:bg-gold/20"
            >
              {user?.role === 'super_admin' ? 'مدیر ارشد' : 'مدیر'}
            </Badge>
          </div>
        </div>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        {adminNavSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <AdminNavItemButton
                  key={item.page}
                  item={item}
                  isActive={adminPage === item.page}
                  onClick={() => handleNavigate(item.page)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Bottom Section ─── */}
      <div className="mt-auto px-3 pb-4">
        <Separator className="mb-3 bg-sidebar-border" />

        {/* Back to user panel */}
        <button
          type="button"
          onClick={() => switchToUserPanel()}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-gold/5 hover:text-gold/80"
        >
          <ChevronLeft className="size-5 text-muted-foreground group-hover:text-gold/70" />
          <span className="flex-1 text-start">بازگشت به پنل کاربری</span>
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {theme === 'dark' ? (
            <Sun className="size-5 text-gold/70 group-hover:text-gold" />
          ) : (
            <Moon className="size-5 text-gold/70 group-hover:text-gold" />
          )}
          <span className="flex-1 text-start">
            {theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
          </span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400/80 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="size-5" />
          <span className="flex-1 text-start">خروج</span>
        </button>
      </div>
    </aside>
  );
}
