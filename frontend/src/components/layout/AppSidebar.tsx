
import React from 'react';
import {LayoutDashboard, ArrowLeftRight, Wallet, Receipt, Users, HelpCircle, User, Settings, ShieldCheck, BarChart3, PiggyBank, Trophy, Banknote, LogOut, Moon, Sun, Bell, MessageCircle, /* New module icons */
  Bot, Target, Gift, Flame, Crown, CalendarCheck, TrendingUp, Sparkles, Calculator, Vault, Shield, UsersRound, Gamepad2, HandCoins, Video, CreditCard, Send, Landmark, Heart, QrCode, FileText, ShieldAlert, BookOpen, Store, Umbrella, Car, Smartphone} from 'lucide-react';
import {useTheme} from 'next-themes';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import {cn} from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Navigation item definition                                        */
/* ------------------------------------------------------------------ */

interface NavItem {
  labelKey: string;
  page: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  isNew?: boolean;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    titleKey: 'nav.main',
    items: [
      { labelKey: 'nav.dashboard', page: 'dashboard', icon: LayoutDashboard },
      { labelKey: 'nav.trade', page: 'trade', icon: ArrowLeftRight },
      { labelKey: 'nav.goldTransfer', page: 'gold-transfer', icon: Send, isNew: true },
      { labelKey: 'nav.goldCard', page: 'gold-card', icon: CreditCard, isNew: true },
      { labelKey: 'nav.wallet', page: 'wallet', icon: Wallet },
      { labelKey: 'nav.transactions', page: 'transactions', icon: Receipt },
      { labelKey: 'nav.market', page: 'market', icon: BarChart3 },
    ],
  },
  {
    titleKey: 'nav.smartTools',
    items: [
      { labelKey: 'nav.smartBuy', page: 'smart-buy', icon: Bot, isNew: true },
      { labelKey: 'nav.analytics', page: 'analytics', icon: TrendingUp, isNew: true },
      { labelKey: 'nav.aiCoach', page: 'ai-coach', icon: Sparkles, isNew: true },
    ],
  },
  {
    titleKey: 'nav.saving',
    items: [
      { labelKey: 'nav.autosave', page: 'autosave', icon: Calculator, isNew: true },
      { labelKey: 'nav.goals', page: 'goals', icon: Target, isNew: true },
      { labelKey: 'nav.savings', page: 'savings', icon: PiggyBank },
      { labelKey: 'nav.loans', page: 'loans', icon: Banknote },
    ],
  },
  {
    titleKey: 'nav.social',
    items: [
      { labelKey: 'nav.creatorClub', page: 'creator-club', icon: Video, isNew: true },
      { labelKey: 'nav.referral', page: 'referral', icon: Users },
      { labelKey: 'nav.gifts', page: 'gifts', icon: Gift, isNew: true },
      { labelKey: 'nav.familyWallet', page: 'family-wallet', icon: UsersRound, isNew: true },
      { labelKey: 'nav.socialFeed', page: 'social-feed', icon: MessageCircle, isNew: true },
    ],
  },
  {
    titleKey: 'nav.gamification',
    items: [
      { labelKey: 'nav.achievements', page: 'achievements', icon: Trophy, isNew: true },
      { labelKey: 'nav.checkin', page: 'checkin', icon: CalendarCheck, isNew: true },
      { labelKey: 'nav.prediction', page: 'prediction', icon: Gamepad2, isNew: true },
      { labelKey: 'nav.vip', page: 'vip', icon: Crown, isNew: true },
      { labelKey: 'nav.cashback', page: 'cashback', icon: HandCoins, isNew: true },
    ],
  },
  {
    titleKey: 'nav.trust',
    items: [
      { labelKey: 'nav.merchantPanel', page: 'merchant', icon: Store, isNew: true },
      { labelKey: 'nav.apiDocs', page: 'api-docs', icon: BookOpen, isNew: true },
      { labelKey: 'nav.qrPayments', page: 'qr-payment', icon: QrCode, isNew: true },
      { labelKey: 'nav.invoices', page: 'invoices', icon: FileText, isNew: true },
      { labelKey: 'nav.loyalty', page: 'loyalty', icon: Heart, isNew: true },
      { labelKey: 'nav.fraudAlerts', page: 'fraud-alerts', icon: ShieldAlert, isNew: true },
      { labelKey: 'nav.vault', page: 'vault', icon: Shield, isNew: true },
      { labelKey: 'nav.emergencySell', page: 'emergency-sell', icon: Vault, isNew: true },
    ],
  },
  {
    titleKey: 'nav.insurance',
    items: [
      { labelKey: 'nav.insuranceBuy', page: 'insurance', icon: Umbrella, isNew: true },
    ],
  },
  {
    titleKey: 'nav.carServices',
    items: [
      { labelKey: 'nav.carServices', page: 'car-services', icon: Car, isNew: true },
    ],
  },
  {
    titleKey: 'nav.utility',
    items: [
      { labelKey: 'nav.utility', page: 'utility', icon: Smartphone, isNew: true },
    ],
  },
  {
    titleKey: 'nav.account',
    items: [
      { labelKey: 'nav.notifications', page: 'notifications', icon: Bell },
      { labelKey: 'nav.support', page: 'support', icon: HelpCircle },
      { labelKey: 'nav.profile', page: 'profile', icon: User },
      { labelKey: 'nav.settings', page: 'settings', icon: Settings },
      { labelKey: 'nav.admin', page: 'admin', icon: ShieldCheck, adminOnly: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helper: derive initials from full name                             */
/* ------------------------------------------------------------------ */

function getInitials(name?: string): string {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[0][0] + parts[parts.length - 1][0];
  }
  return parts[0].slice(0, 2);
}

/* ------------------------------------------------------------------ */
/*  Section Label                                                      */
/* ------------------------------------------------------------------ */

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-gold/40 first:mt-0">
      {label}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar Nav Item                                                  */
/* ------------------------------------------------------------------ */

function SidebarNavItem({
  item,
  label,
  isActive,
  onClick,
}: {
  item: NavItem;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
        isActive
          ? 'bg-gold/10 text-gold shadow-[inset_0_0_0_1px_oklch(0.75_0.15_85/20%)]'
          : 'text-muted-foreground hover:bg-white/5 hover:text-gold/80'
      )}
    >
      {/* Active indicator — gold left border */}
      {isActive && (
        <span className="absolute inset-y-1 start-0 w-[3px] rounded-e-full bg-gold shadow-[0_0_8px_oklch(0.75_0.15_85/50%)]" />
      )}

      <Icon
        className={cn(
          'size-[18px] shrink-0 transition-colors duration-200',
          isActive ? 'text-gold drop-shadow-[0_0_4px_oklch(0.75_0.15_85/40%)]' : 'text-muted-foreground group-hover:text-gold/70'
        )}
      />

      <span className="flex-1 text-start text-[13px]">{label}</span>

      {/* New badge */}
      {item.isNew && !isActive && (
        <span className="flex size-2 shrink-0 rounded-full bg-emerald-500">
          <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Sidebar Component                                            */
/* ------------------------------------------------------------------ */

export default function AppSidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { user, currentPage, setPage, reset } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const handleNavigate = (page: string) => {
    setPage(page);
    onNavigate?.();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // silent fail
    }
    reset();
    onNavigate?.();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return t('common.admin');
      case 'vip':
        return t('common.vip');
      default:
        return t('common.user');
    }
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
          <span className="text-xl font-bold text-gold">Z</span>
        </div>
        <div className="flex flex-col">
          <span className="gold-gradient-text text-lg font-bold leading-tight">
            {t('common.zarrinGold')}
          </span>
          <span className="text-[11px] text-gold/50">{t('common.onlineTrading')}</span>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* ─── User Info ─── */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 rounded-xl border border-gold/10 bg-sidebar-accent/80 p-3 shadow-[0_0_20px_oklch(0.75_0.15_85/5%)]">
          <div className="relative">
            <Avatar className="size-11 border-2 border-gold/40 shadow-[0_0_12px_oklch(0.75_0.15_85/20%)]">
              {user?.avatar && <AvatarImage src={user.avatar} alt={user.fullName} />}
              <AvatarFallback className="bg-gold/20 text-sm font-semibold text-gold">
                {getInitials(user?.fullName)}
              </AvatarFallback>
            </Avatar>
            {/* Online status dot */}
            <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-sidebar bg-emerald-500 shadow-[0_0_6px_oklch(0.7_0.15_145/60%)]" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              {user?.fullName || user?.phone || t('common.user')}
            </span>
            <Badge
              variant="secondary"
              className="w-fit border border-gold/10 bg-gold/15 text-[10px] text-gold hover:bg-gold/20"
            >
              {getRoleLabel(user?.role || 'user')}
            </Badge>
          </div>
        </div>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="scrollbar-gold flex-1 overflow-y-auto px-3 pb-2">
        <div className="flex flex-col gap-1">
          {navSections
            .map((section, sectionIdx) => {
              const filteredItems = section.items.filter(
                (item) => !item.adminOnly || user?.role === 'admin' || user?.role === 'super_admin'
              );
              if (filteredItems.length === 0) return null;
              return (
                <React.Fragment key={section.titleKey}>
                  {/* Gold-tinted divider between sections (skip before the first) */}
                  {sectionIdx > 0 && (
                    <Separator className="my-1 bg-gold/10" />
                  )}
                  <SectionLabel label={t(section.titleKey)} />
                  {filteredItems.map((item) => (
                    <SidebarNavItem
                      key={item.page}
                      item={item}
                      label={t(item.labelKey)}
                      isActive={currentPage === item.page}
                      onClick={() => handleNavigate(item.page)}
                    />
                  ))}
                </React.Fragment>
              );
            })}
        </div>
      </nav>

      {/* ─── Bottom Section ─── */}
      <div className="mt-auto px-3 pb-4">
        <Separator className="mb-3 bg-sidebar-border" />

        {/* Language switcher */}
        <LanguageSwitcher />

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
            {theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
          </span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400/80 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="size-5" />
          <span className="flex-1 text-start">{t('common.logout')}</span>
        </button>

        {/* Version */}
        <p className="mt-4 text-center text-[11px] text-sidebar-foreground/30">{t('common.version')}</p>
      </div>
    </aside>
  );
}
