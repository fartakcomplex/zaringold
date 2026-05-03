
import React, { useState, useCallback } from 'react';
import {Home, ArrowLeftRight, Wallet, User, ChevronUp, LayoutDashboard, Users, HelpCircle, Settings, ShieldCheck, PiggyBank, Trophy, Bell, Banknote, TrendingUp, X, Bot, Target, Gift, Flame, Crown, CalendarCheck, Sparkles, Calculator, Vault, Shield, UsersRound, Gamepad2, HandCoins, Video, BarChart3, CreditCard, Store, Receipt, MessageCircle, QrCode, FileText, AlertTriangle, Percent, BookOpen, Send} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {cn} from '@/lib/utils';
import {Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose} from '@/components/ui/drawer';

/* ------------------------------------------------------------------ */
/*  Navigation item definitions                                       */
/* ------------------------------------------------------------------ */

interface BottomNavItem {
  labelKey: string;
  page: string;
  icon: React.ElementType;
  badge?: 'new' | number;
}

const mainItemLabels: Record<string, string> = {
  '__wallet__': 'کیف طلا',
  '__trade__': 'معامله',
  '__home__': 'خانه',
  '__transfer__': 'انتقال',
  '__more__': 'بیشتر',
};

const mainItems: BottomNavItem[] = [
  { labelKey: '__wallet__', page: 'wallet', icon: Wallet },
  { labelKey: '__trade__', page: 'trade', icon: ArrowLeftRight },
  { labelKey: '__home__', page: 'dashboard', icon: Home },
  { labelKey: '__transfer__', page: 'gold-transfer', icon: Send },
  { labelKey: '__more__', page: '__more__', icon: LayoutDashboard },
];

interface MoreMenuItem {
  labelKey: string;
  page: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: number;
}

const moreMenuItems: MoreMenuItem[] = [
  /* ── Smart Tools ── */
  { labelKey: 'nav.smartBuy', page: 'smart-buy', icon: Bot },
  { labelKey: 'nav.analytics', page: 'analytics', icon: TrendingUp },
  { labelKey: 'nav.aiCoach', page: 'ai-coach', icon: Sparkles },

  /* ── Market ── */
  { labelKey: 'nav.market', page: 'market', icon: BarChart3 },

  /* ── Saving & Loans ── */
  { labelKey: 'nav.autosave', page: 'autosave', icon: Calculator },
  { labelKey: 'nav.goals', page: 'goals', icon: Target },
  { labelKey: 'nav.savings', page: 'savings', icon: PiggyBank },
  { labelKey: 'nav.loans', page: 'loans', icon: Banknote },

  /* ── Social ── */
  { labelKey: 'nav.creatorClub', page: 'creator-club', icon: Video },
  { labelKey: 'nav.referral', page: 'referral', icon: Users },
  { labelKey: 'nav.gifts', page: 'gifts', icon: Gift },
  { labelKey: 'nav.familyWallet', page: 'family-wallet', icon: UsersRound },
  { labelKey: 'nav.socialFeed', page: 'social-feed', icon: LayoutDashboard },

  /* ── Gamification ── */
  { labelKey: 'nav.achievements', page: 'achievements', icon: Trophy },
  { labelKey: 'nav.checkin', page: 'checkin', icon: CalendarCheck },
  { labelKey: 'nav.prediction', page: 'prediction', icon: Gamepad2 },
  { labelKey: 'nav.vip', page: 'vip', icon: Crown },
  { labelKey: 'nav.cashback', page: 'cashback', icon: HandCoins },
  { labelKey: 'nav.earn', page: 'earn', icon: Flame },

  /* ── Gold Card & Trust ── */
  { labelKey: 'nav.goldCard', page: 'gold-card', icon: CreditCard },
  { labelKey: 'nav.goldTransfer', page: 'gold-transfer', icon: Send },
  { labelKey: 'nav.vault', page: 'vault', icon: Vault },
  { labelKey: 'nav.emergencySell', page: 'emergency-sell', icon: Shield },

  /* ── Merchant & Gateway ── */
  { labelKey: 'nav.merchantPanel', page: 'merchant', icon: Store },
  { labelKey: 'nav.qrPayments', page: 'qr-payment', icon: QrCode },
  { labelKey: 'nav.invoices', page: 'invoices', icon: FileText },
  { labelKey: 'nav.fraudAlerts', page: 'fraud-alerts', icon: AlertTriangle },
  { labelKey: 'nav.loyalty', page: 'loyalty', icon: Percent },
  { labelKey: 'nav.apiDocs', page: 'api-docs', icon: BookOpen },

  /* ── Account ── */
  { labelKey: 'nav.profile', page: 'profile', icon: User },
  { labelKey: 'nav.transactions', page: 'transactions', icon: Receipt },
  { labelKey: 'nav.chat', page: 'chat', icon: MessageCircle },
  { labelKey: 'nav.notifications', page: 'notifications', icon: Bell, badge: 2 },
  { labelKey: 'nav.support', page: 'support', icon: HelpCircle },
  { labelKey: 'nav.settings', page: 'settings', icon: Settings },
  { labelKey: 'nav.admin', page: 'admin', icon: ShieldCheck, adminOnly: true },
];

/* ------------------------------------------------------------------ */
/*  Total unread notifications count (for More button badge)          */
/* ------------------------------------------------------------------ */

const totalUnreadInMore = moreMenuItems.reduce(
  (sum, item) => sum + (item.badge ?? 0),
  0
);

/* ------------------------------------------------------------------ */
/*  MoreMenuDrawer — gold-themed slide-up panel                       */
/* ------------------------------------------------------------------ */

function MoreMenuDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: (open: boolean) => void;
}) {
  const { currentPage, setPage, user } = useAppStore();
  const { t } = useTranslation();

  const handleItemClick = useCallback(
    (page: string) => {
      setPage(page);
      onClose(false);
    },
    [setPage, onClose]
  );

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="bottom">
      <DrawerContent className="drawer-gold-panel rounded-t-3xl border-t-0 px-2 pb-4 pt-0">
        <div className="mx-auto mb-3 mt-3 flex w-12 justify-center">
          <div className="h-1.5 w-12 rounded-full bg-gold/40" />
        </div>

        <DrawerHeader className="px-2 pb-3 pt-0 text-right">
          <DrawerTitle className="text-base font-bold text-gold">
            {t('bottomNav.moreMenu')}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            {t('bottomNav.quickAccess')}
          </DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[50vh] overflow-y-auto px-1 pb-2">
          <div className="grid grid-cols-3 gap-1.5">
            {moreMenuItems
              .filter((item) => !item.adminOnly || user?.role === 'admin' || user?.role === 'super_admin')
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.page;

                return (
                  <button
                    key={item.page}
                    type="button"
                    onClick={() => handleItemClick(item.page)}
                    className={cn(
                      'group relative flex flex-col items-center gap-2 rounded-2xl p-3 transition-all duration-200',
                      isActive
                        ? 'bg-gold/10 text-gold ring-1 ring-gold/25'
                        : 'text-muted-foreground hover:bg-gold/5 hover:text-foreground'
                    )}
                  >
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="badge-pulse absolute -top-0.5 -left-0.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                        {item.badge}
                      </span>
                    )}

                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-xl transition-all duration-200',
                      isActive ? 'bg-gold/15 shadow-sm' : 'bg-muted/50 group-hover:bg-gold/10'
                    )}>
                      <Icon className="size-5" />
                    </div>

                    <span className="text-[10px] font-medium leading-tight text-center">
                      {t(item.labelKey)}
                    </span>

                    {isActive && (
                      <span className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-gold gold-pulse" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/*  Component — Floating dark bottom nav bar                          */
/* ------------------------------------------------------------------ */

export default function BottomNav() {
  const { currentPage, setPage } = useAppStore();
  const { t } = useTranslation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <>
      <MoreMenuDrawer isOpen={isMoreOpen} onClose={setIsMoreOpen} />

      {/* ─── Floating Bottom Navigation Bar ─── */}
      <nav className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto max-w-lg px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-0">
          <div className="relative flex items-center justify-around rounded-2xl bg-[#1A1A1A] px-2 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.4),0_2px_12px_rgba(0,0,0,0.3)] border border-white/[0.06]">
            {/* Main 5 tabs */}
            {mainItems.map((item) => {
              const isMore = item.page === '__more__';
              const isActive = !isMore && currentPage === item.page;
              const Icon = item.icon;

              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => isMore ? setIsMoreOpen(true) : setPage(item.page)}
                  className={cn(
                    'relative flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-300 ease-out min-w-[56px]',
                    isActive ? 'text-gold scale-[1.02]' : 'text-gray-500 active:scale-95 active:text-gray-300'
                  )}
                >
                  {/* Gold active background pill — with smooth transition */}
                  <div className={cn(
                    'absolute inset-0 flex items-center justify-center rounded-xl transition-all duration-300 ease-out',
                    isActive ? 'bg-gold/[0.12] scale-100 opacity-100' : 'scale-75 opacity-0'
                  )} />

                  {/* More button badge */}
                  {isMore && totalUnreadInMore > 0 && (
                    <span className="badge-pulse absolute -top-0.5 right-2 z-10 size-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                  )}

                  <Icon className={cn(
                    'relative z-[1] size-5 transition-all duration-300 ease-out',
                    isActive && 'text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                  )} />
                  <span className={cn(
                    'relative z-[1] text-[10px] font-medium leading-tight whitespace-nowrap transition-all duration-300 ease-out',
                    isActive ? 'text-gold font-semibold' : 'text-gray-500'
                  )}>
                    {mainItemLabels[item.labelKey] || t(item.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
