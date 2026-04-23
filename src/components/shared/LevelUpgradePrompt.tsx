'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { getNextLevel, getLevelUpgradePrompt, LEVELS, type UserLevel, type LevelInfo } from '@/lib/level-system';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LevelUpgradePromptProps {
  currentLevel: string;
  onNextLevelAction?: (route: string) => void;
  onDismiss?: () => void;
  variant?: 'banner' | 'card';
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DISMISS_KEY = 'level-upgrade-dismissed';
const AUTO_DISMISS_MS = 30_000;     // 30 seconds (banner only)
const DISMISS_WINDOW_MS = 86_400_000; // 24 hours

/* ------------------------------------------------------------------ */
/*  LocalStorage helpers                                               */
/* ------------------------------------------------------------------ */

function getDismissalTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as number) : null;
  } catch {
    return null;
  }
}

function setDismissalTimestamp(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(Date.now()));
  } catch {
    /* storage full or blocked – silently ignore */
  }
}

function isDismissalExpired(): boolean {
  const ts = getDismissalTimestamp();
  if (ts === null) return true;                 // never dismissed
  return Date.now() - ts >= DISMISS_WINDOW_MS;  // >24 h ago → show again
}

/* ------------------------------------------------------------------ */
/*  CSS-in-JS keyframes (injected once)                                */
/* ------------------------------------------------------------------ */

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;

  const id = 'level-upgrade-prompt-styles';
  if (document.getElementById(id)) return;

  const sheet = document.createElement('style');
  sheet.id = id;
  sheet.textContent = `
    @keyframes lup-slide-down {
      0%   { transform: translateY(-100%); opacity: 0; }
      100% { transform: translateY(0);     opacity: 1; }
    }
    @keyframes lup-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes lup-fade-in {
      0%   { opacity: 0; transform: translateY(12px) scale(0.97); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .lup-slide-down {
      animation: lup-slide-down 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .lup-shimmer {
      background-size: 200% 100%;
      animation: lup-shimmer 3s ease-in-out infinite;
    }
    .lup-fade-in {
      animation: lup-fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
  `;
  document.head.appendChild(sheet);
}

/* ------------------------------------------------------------------ */
/*  Gradient map — background for the banner based on next-level color */
/* ------------------------------------------------------------------ */

function bannerGradientFor(nextLevel: LevelInfo): string {
  switch (nextLevel.key) {
    case 'bronze':  return 'linear-gradient(90deg, rgba(120,53,15,0.55), rgba(180,83,9,0.55), rgba(120,53,15,0.55))';
    case 'silver':  return 'linear-gradient(90deg, rgba(75,85,99,0.45), rgba(156,163,175,0.45), rgba(75,85,99,0.45))';
    case 'gold':    return 'linear-gradient(90deg, rgba(113,63,18,0.50), rgba(202,138,4,0.50), rgba(113,63,18,0.50))';
    case 'diamond': return 'linear-gradient(90deg, rgba(22,78,99,0.50), rgba(6,182,212,0.45), rgba(22,78,99,0.50))';
    default:        return 'linear-gradient(90deg, rgba(75,85,99,0.40), rgba(120,113,108,0.40), rgba(75,85,99,0.40))';
  }
}

function shimmerGradientFor(nextLevel: LevelInfo): string {
  switch (nextLevel.key) {
    case 'bronze':  return 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.15) 50%, transparent 100%)';
    case 'silver':  return 'linear-gradient(90deg, transparent 0%, rgba(209,213,219,0.15) 50%, transparent 100%)';
    case 'gold':    return 'linear-gradient(90deg, transparent 0%, rgba(250,204,21,0.18) 50%, transparent 100%)';
    case 'diamond': return 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.18) 50%, transparent 100%)';
    default:        return 'linear-gradient(90deg, transparent 0%, rgba(168,162,158,0.12) 50%, transparent 100%)';
  }
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Small badge that shows a level's icon + name */
function LevelBadge({ level, size = 'md' }: { level: LevelInfo; size?: 'sm' | 'md' }) {
  const isSmall = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${level.bgColor} ${level.borderColor} border ${level.textColor} ${isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}
    >
      <span className={isSmall ? 'text-sm' : 'text-base'}>{level.icon}</span>
      {level.labelFa}
    </span>
  );
}

/** Banner variant */
function BannerView({
  currentLevelInfo,
  nextLevelInfo,
  prompt,
  onAction,
  onDismiss,
}: {
  currentLevelInfo: LevelInfo;
  nextLevelInfo: LevelInfo;
  prompt: NonNullable<ReturnType<typeof getLevelUpgradePrompt>>;
  onAction: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      dir="rtl"
      className="lup-slide-down relative z-50 w-full overflow-hidden"
      style={{
        height: 50,
        background: bannerGradientFor(nextLevelInfo),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Shimmer overlay */}
      <div
        className="lup-shimmer pointer-events-none absolute inset-0"
        style={{ backgroundImage: shimmerGradientFor(nextLevelInfo) }}
      />

      {/* Content row */}
      <div className="relative flex h-full items-center justify-between px-3 sm:px-5">
        {/* Right side (RTL: visually right = start) — current → next */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <LevelBadge level={currentLevelInfo} size="sm" />
          <ChevronLeft className="size-4 shrink-0 text-amber-400" />
          <LevelBadge level={nextLevelInfo} size="sm" />
          <span className="hidden sm:inline-block max-w-[220px] truncate text-xs text-amber-200/80 mr-2">
            {prompt.description}
          </span>
        </div>

        {/* Left side — action + dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={onAction}
            className="h-7 rounded-lg bg-gradient-to-l from-amber-500 to-yellow-400 px-3 text-xs font-bold text-gray-900 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all duration-200"
          >
            {prompt.action}
          </Button>
          <button
            onClick={onDismiss}
            className="flex size-7 items-center justify-center rounded-lg text-amber-200/60 transition-colors hover:bg-white/10 hover:text-amber-200"
            aria-label="بستن"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Card variant */
function CardView({
  currentLevelInfo,
  nextLevelInfo,
  prompt,
  onAction,
  onDismiss,
}: {
  currentLevelInfo: LevelInfo;
  nextLevelInfo: LevelInfo;
  prompt: NonNullable<ReturnType<typeof getLevelUpgradePrompt>>;
  onAction: () => void;
  onDismiss: () => void;
}) {
  const requirements = nextLevelInfo.requirements;

  return (
    <div dir="rtl" className="lup-fade-in">
      <Card className="relative overflow-hidden border-amber-500/20 bg-gray-900/80 text-gray-100 shadow-2xl shadow-amber-500/5 backdrop-blur-xl">
        {/* Decorative gradient orb */}
        <div
          className="pointer-events-none absolute -top-20 -left-20 size-48 rounded-full opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${nextLevelInfo.key === 'gold' ? '#f59e0b' : nextLevelInfo.key === 'diamond' ? '#06b6d4' : nextLevelInfo.key === 'silver' ? '#9ca3af' : '#b45309'} 0%, transparent 70%)`,
          }}
        />

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute left-3 top-3 z-10 flex size-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-300"
          aria-label="بستن"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <CardHeader className="relative pb-2">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <LevelBadge level={currentLevelInfo} />

            <div className="flex flex-col items-center gap-1">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                <ChevronLeft className="size-4 text-amber-400" />
              </div>
              <span className="text-[10px] text-gray-500">ارتقا</span>
            </div>

            <LevelBadge level={nextLevelInfo} />
          </div>

          <p className="mt-3 text-center text-sm font-semibold text-amber-300">
            {prompt.title}
          </p>
        </CardHeader>

        {/* Body */}
        <CardContent className="space-y-4 pb-2">
          {/* Description */}
          <p className="text-center text-xs leading-relaxed text-gray-400">
            {prompt.description}
          </p>

          {/* Requirements list */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">شرایط ارتقا:</p>
            <ul className="space-y-1.5">
              {requirements.map((req, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <Check className="size-3" />
                  </span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex-col gap-2 pt-2">
          <Button
            onClick={onAction}
            className="w-full bg-gradient-to-l from-amber-500 to-yellow-400 text-gray-900 font-bold shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-yellow-300 transition-all duration-200"
          >
            <Crown className="size-4 ml-1.5" />
            {prompt.action}
          </Button>

          <button
            onClick={onDismiss}
            className="text-[11px] text-gray-600 transition-colors hover:text-gray-400"
          >
            بعداً نمایش نده
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function LevelUpgradePrompt({
  currentLevel,
  onNextLevelAction,
  onDismiss,
  variant = 'banner',
}: LevelUpgradePromptProps) {
  const [shouldShow, setShouldShow] = useState(false);

  /* ---------- derive data ---------- */
  const nextLevelInfo = getNextLevel(currentLevel as UserLevel);
  const prompt = getLevelUpgradePrompt(currentLevel as UserLevel);
  const currentLevelInfo = nextLevelInfo ? LEVELS[currentLevel as UserLevel] : null;
  const isValid = !!(nextLevelInfo && prompt && currentLevelInfo);

  /* ---------- mount: inject styles + schedule visibility ---------- */
  useEffect(() => {
    injectStyles();
    if (!isValid) return;
    if (!isDismissalExpired()) return;
    const t = setTimeout(() => setShouldShow(true), 200);
    return () => clearTimeout(t);
  }, [isValid]);

  /* ---------- dismiss handler ---------- */
  const handleDismiss = useCallback(
    (store = true) => {
      setShouldShow(false);
      if (store) setDismissalTimestamp();
      onDismiss?.();
    },
    [onDismiss],
  );

  const handleAction = useCallback(() => {
    if (onNextLevelAction && prompt) {
      onNextLevelAction(prompt.actionRoute);
    }
  }, [onNextLevelAction, prompt]);

  /* ---------- auto-dismiss (banner only) ---------- */
  useEffect(() => {
    if (!isValid || variant !== 'banner' || !shouldShow) return;
    const t = setTimeout(() => handleDismiss(false), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [isValid, variant, shouldShow, handleDismiss]);

  /* ---------- render gate ---------- */
  if (!isValid || !shouldShow) return null;

  /* ---------- render ---------- */
  return variant === 'banner' ? (
    <BannerView
      currentLevelInfo={currentLevelInfo!}
      nextLevelInfo={nextLevelInfo!}
      prompt={prompt!}
      onAction={handleAction}
      onDismiss={() => handleDismiss(true)}
    />
  ) : (
    <CardView
      currentLevelInfo={currentLevelInfo!}
      nextLevelInfo={nextLevelInfo!}
      prompt={prompt!}
      onAction={handleAction}
      onDismiss={() => handleDismiss(true)}
    />
  );
}
