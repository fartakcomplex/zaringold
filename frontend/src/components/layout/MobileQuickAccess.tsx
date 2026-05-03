
import React, { useState, useEffect } from 'react';
import {/* Trading */
  TrendingUp, ArrowLeftRight, Wallet, Receipt, CreditCard, Send, /* Smart Tools & AI */
  Bot, Sparkles, HeartPulse, Camera, /* Saving */
  PiggyBank, Target, /* Social */
  Gift, Users} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {cn} from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Quick Access Item Definition                                       */
/* ------------------------------------------------------------------ */

interface QuickAccessItem {
  labelKey: string;
  page: string;
  icon: React.ElementType;
  color: string;
  badge?: 'new';
}

const quickAccessItems: QuickAccessItem[] = [
  // Row 1 — Main Trading & Card
  { labelKey: 'quickAccess.buyGold', page: 'trade', icon: TrendingUp, color: 'text-emerald-400' },
  { labelKey: 'quickAccess.sellGold', page: 'trade', icon: ArrowLeftRight, color: 'text-red-400' },
  { labelKey: 'quickAccess.goldTransfer', page: 'gold-transfer', icon: Send, color: 'text-amber-400', badge: 'new' },
  { labelKey: 'quickAccess.goldCard', page: 'gold-card', icon: CreditCard, color: 'text-yellow-300', badge: 'new' },

  // Row 2 — Smart & AI Tools
  { labelKey: 'quickAccess.smartBuy', page: 'smart-buy', icon: Bot, color: 'text-cyan-400', badge: 'new' },
  { labelKey: 'quickAccess.aiCoach', page: 'ai-coach', icon: Sparkles, color: 'text-amber-400', badge: 'new' },
  { labelKey: 'quickAccess.healthCheck', page: 'health-check', icon: HeartPulse, color: 'text-rose-400', badge: 'new' },
  { labelKey: 'quickAccess.goldScanner', page: 'gold-scanner', icon: Camera, color: 'text-orange-400', badge: 'new' },

  // Row 3 — Saving & Social
  { labelKey: 'quickAccess.autosave', page: 'autosave', icon: PiggyBank, color: 'text-teal-400', badge: 'new' },
  { labelKey: 'quickAccess.goals', page: 'goals', icon: Target, color: 'text-orange-400' },
  { labelKey: 'quickAccess.gifts', page: 'gifts', icon: Gift, color: 'text-pink-400' },
  { labelKey: 'quickAccess.referral', page: 'referral', icon: Users, color: 'text-violet-400' },
];

/* ------------------------------------------------------------------ */
/*  QuickAccessButton — Individual icon button (NO framer-motion)      */
/* ------------------------------------------------------------------ */

function QuickAccessButton({
  item,
  label,
  onClick,
  index,
}: {
  item: QuickAccessItem;
  label: string;
  onClick: () => void;
  index: number;
}) {
  const Icon = item.icon;
  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80 + index * 35);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <button
      type="button"
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setTimeout(() => setIsPressed(false), 150)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        'group relative flex flex-col items-center gap-2 py-2 focus:outline-none',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      )}
      style={{
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        transitionDelay: `${80 + index * 35}ms`,
      }}
    >
      {/* Icon Container */}
      <div
        className={cn(
          'relative flex size-[52px] items-center justify-center rounded-[16px] transition-all duration-200',
          isPressed && 'scale-[0.88]',
          !isPressed && 'group-hover:scale-105 group-hover:-translate-y-0.5',
        )}
      >
        {/* Background layers */}
        <div
          className="absolute inset-0 rounded-[16px]"
          style={{
            background:
              'linear-gradient(145deg, rgba(30,30,32,0.95) 0%, rgba(22,22,24,0.92) 50%, rgba(35,30,25,0.88) 100%)',
          }}
        />
        {/* Inner gold border gradient */}
        <div
          className="absolute inset-[0.5px] rounded-[15px]"
          style={{
            background:
              'linear-gradient(145deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.04) 50%, rgba(212,175,55,0.12) 100%)',
          }}
        />
        {/* Top highlight line */}
        <div
          className="absolute inset-x-2 top-[0.5px] h-[1px] rounded-full opacity-60"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 50%, transparent 100%)',
          }}
        />
        {/* Bottom subtle line */}
        <div
          className="absolute inset-x-3 bottom-[0.5px] h-[1px] rounded-full opacity-30"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          }}
        />

        {/* Icon */}
        <Icon
          className={cn(
            'relative z-10 size-[22px] transition-all duration-200',
            item.color,
            'group-hover:brightness-125',
          )}
          strokeWidth={1.8}
        />

        {/* Hover glow effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          )}
          style={{
            background:
              'radial-gradient(circle at center, rgba(212,175,55,0.08) 0%, transparent 70%)',
            boxShadow: 'inset 0 0 20px rgba(212,175,55,0.05)',
          }}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-[10px] font-medium leading-tight text-center max-w-[66px] truncate transition-colors duration-200',
          'text-muted-foreground/70 group-hover:text-foreground/90 group-active:text-foreground',
        )}
      >
        {label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  MobileQuickAccess — Premium icon grid (NO framer-motion)           */
/* ------------------------------------------------------------------ */

export default function MobileQuickAccess() {
  const { setPage } = useAppStore();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'md:hidden',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      )}
      style={{ transition: 'opacity 0.5s ease-out, transform 0.5s ease-out' }}
    >
      <div
        className="relative rounded-[20px] p-3"
        style={{
          background:
            'linear-gradient(145deg, rgba(20,20,22,0.88) 0%, rgba(16,16,18,0.92) 50%, rgba(22,20,18,0.85) 100%)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          boxShadow: [
            '0 8px 40px rgba(0,0,0,0.25)',
            '0 0 0 0.5px rgba(212,175,55,0.1)',
            '0 1px 0 rgba(255,255,255,0.04) inset',
            '0 -1px 0 rgba(0,0,0,0.3) inset',
          ].join(', '),
        }}
      >
        {/* Top shimmer line */}
        <div className="pointer-events-none absolute inset-x-4 top-0 h-[1px] overflow-hidden rounded-full">
          <div
            className="h-full w-full"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.2) 20%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.2) 80%, transparent 100%)',
              animation: 'goldShimmer 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Grid - 4 columns × 3 rows */}
        <div className="grid grid-cols-4 justify-items-center gap-y-1 gap-x-1">
          {quickAccessItems.map((item, index) => (
            <QuickAccessButton
              key={item.page + item.labelKey}
              item={item}
              label={t(item.labelKey)}
              onClick={() => setPage(item.page)}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
