'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Check,
  Clock,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Target {
  id: string;
  targetPrice: number;
  direction: 'above' | 'below';
  createdAt: string;
  hit: boolean;
  hitAt?: string;
}

interface PriceMissileData {
  success: boolean;
  currentPrice: number;
  targets: Target[];
  history: Array<{ price: number; hit: boolean; timestamp: string }>;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatNumber(n: number): string {
  return n.toLocaleString('fa-IR');
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'همین الان';
  if (mins < 60) return `${mins} دقیقه پیش`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ساعت پیش`;
  return `${Math.floor(hrs / 24)} روز پیش`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Confetti Piece                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ConfettiPiece({ delay, left, color }: { delay: number; left: number; color: string }) {
  return (
    <span
      className="confetti-piece"
      style={{
        left: `${left}%`,
        backgroundColor: color,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Missile Gauge Visual                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MissileGauge({
  currentPrice,
  targets,
}: {
  currentPrice: number;
  targets: Target[];
}) {
  if (targets.length === 0) return null;

  // Determine range for gauge
  const allPrices = [currentPrice, ...targets.map((t) => t.targetPrice)];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const padding = (maxPrice - minPrice) * 0.1 || 1;
  const rangeMin = minPrice - padding;
  const rangeMax = maxPrice + padding;
  const range = rangeMax - rangeMin;

  const toPercent = (price: number) => {
    return ((price - rangeMin) / range) * 100;
  };

  const currentPercent = toPercent(currentPrice);

  // Separate active and hit targets
  const activeTargets = targets.filter((t) => !t.hit);
  const hitTargets = targets.filter((t) => t.hit);

  return (
    <div className="relative w-full py-8 px-4">
      {/* Gauge line */}
      <div className="relative mx-auto h-4 w-full max-w-md">
        {/* Track */}
        <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-b from-red-500/20 via-yellow-500/20 to-green-500/20 border border-border" />

        {/* Scale labels */}
        <div className="flex justify-between mb-2 text-[10px] text-muted-foreground px-1">
          <span>{formatNumber(Math.round(rangeMin))}</span>
          <span>{formatNumber(Math.round(rangeMax))}</span>
        </div>

        {/* Hit target markers */}
        {hitTargets.map((t) => {
          const pct = toPercent(t.targetPrice);
          return (
            <div
              key={t.id}
              className="absolute"
              style={{ bottom: `${Math.min(100, Math.max(0, pct))}%`, left: '50%', transform: 'translateX(-50%)' }}
            >
              <div className="relative">
                <div className="w-8 h-1 bg-green-500/40 rounded-full -translate-x-1/2" />
              </div>
            </div>
          );
        })}

        {/* Active target markers */}
        {activeTargets.map((t) => {
          const pct = toPercent(t.targetPrice);
          const progress = t.direction === 'above'
            ? currentPrice >= t.targetPrice ? 100 : Math.max(0, ((currentPrice - rangeMin) / (t.targetPrice - rangeMin)) * 100)
            : currentPrice <= t.targetPrice ? 100 : Math.max(0, ((rangeMax - currentPrice) / (rangeMax - t.targetPrice)) * 100);

          return (
            <div
              key={t.id}
              className="absolute z-10"
              style={{ bottom: `${Math.min(100, Math.max(0, pct))}%`, left: '50%', transform: 'translateX(-50%)' }}
            >
              <div className="relative flex flex-col items-center">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground bg-card border border-border rounded px-1.5 py-0.5">
                    {formatNumber(t.targetPrice)}
                  </span>
                  {t.direction === 'above' ? (
                    <TrendingUp className="size-3 text-green-500" />
                  ) : (
                    <TrendingDown className="size-3 text-red-500" />
                  )}
                </div>
                <div
                  className={cn(
                    'w-3 h-3 rounded-full border-2',
                    progress >= 100
                      ? 'bg-green-500 border-green-300'
                      : t.direction === 'above'
                        ? 'bg-yellow-500 border-yellow-300'
                        : 'bg-orange-500 border-orange-300'
                  )}
                  style={{
                    boxShadow: progress >= 100
                      ? '0 0 8px rgba(34,197,94,0.6)'
                      : '0 0 8px rgba(234,179,8,0.4)',
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Current price marker (animated) */}
        <div
          className="absolute z-20"
          style={{
            bottom: `${Math.min(100, Math.max(0, currentPercent))}%`,
            left: '50%',
            transform: 'translateX(-50%)',
            transition: 'bottom 1s ease-out',
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Animated glow line */}
            <div className="missile-glow-line w-10 h-1 -translate-x-1/2" />
            {/* Current price badge */}
            <div className="mt-1 bg-gold text-background text-[11px] font-bold rounded-lg px-2 py-1 shadow-lg border border-gold/50 whitespace-nowrap">
              {formatNumber(currentPrice)}
              <span className="text-[9px] font-normal mr-1 opacity-70">گرم طلا</span>
            </div>
          </div>
        </div>

        {/* Animated missile trail from current price to nearest active target */}
        {activeTargets.length > 0 && (() => {
          const nearest = activeTargets.reduce((best, t) => {
            const dist = Math.abs(t.targetPrice - currentPrice);
            return dist < Math.abs(best.targetPrice - currentPrice) ? t : best;
          });
          const nearestPct = toPercent(nearest.targetPrice);
          const isClose = Math.abs(currentPercent - nearestPct) < 15;

          if (isClose) {
            return (
              <div
                className="absolute z-10 w-0.5 missile-trail"
                style={{
                  bottom: `${Math.min(currentPercent, nearestPct) + 2}%`,
                  height: `${Math.abs(nearestPct - currentPercent) - 4}%`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              />
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Hit Celebration                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HitCelebration({ targetPrice }: { targetPrice: number }) {
  const colors = ['#D4AF37', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#f97316'];

  return (
    <div className="hit-celebration relative flex flex-col items-center justify-center py-6">
      {/* Confetti */}
      {colors.map((color, i) => (
        <ConfettiPiece key={i} delay={i * 0.1} left={i * 17 + 5} color={color} />
      ))}
      {colors.map((color, i) => (
        <ConfettiPiece key={`r${i}`} delay={i * 0.15 + 0.5} left={90 - i * 17} color={color} />
      ))}

      {/* Celebration text */}
      <div className="celebration-text flex items-center gap-2 rounded-2xl bg-gradient-to-r from-green-500/10 via-gold/10 to-green-500/10 border border-green-500/30 px-6 py-4">
        <span className="text-3xl celebration-bounce">💥</span>
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-bold text-green-500">هدف رسید!</span>
          <span className="text-sm text-muted-foreground">
            {formatNumber(targetPrice)} <span className="text-[10px] opacity-70">گرم طلا</span>
          </span>
        </div>
        <Check className="size-6 text-green-500 celebration-bounce" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Target List Item                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TargetItem({
  target,
  currentPrice,
}: {
  target: Target;
  currentPrice: number;
}) {
  const progress = target.direction === 'above'
    ? currentPrice >= target.targetPrice ? 100 : Math.max(0, ((currentPrice) / target.targetPrice) * 100)
    : currentPrice <= target.targetPrice ? 100 : Math.max(0, (1 - (currentPrice - target.targetPrice) / (currentPrice * 0.1)) * 100);

  const remaining = Math.abs(target.targetPrice - currentPrice);
  const remainingPercent = ((remaining / currentPrice) * 100).toFixed(2);

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-all',
        target.hit
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {target.direction === 'above' ? (
            <div className="flex size-7 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="size-4 text-green-500" />
            </div>
          ) : (
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10">
              <TrendingDown className="size-4 text-red-500" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">
              {formatNumber(target.targetPrice)} <span className="text-[10px] font-normal text-muted-foreground">گرم طلا</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              {target.direction === 'above' ? 'بالاتر' : 'پایین‌تر'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {target.hit ? (
            <Badge className="bg-green-500/15 text-green-500 border-green-500/30 hover:bg-green-500/20 gap-1">
              <Check className="size-3" />
              رسید!
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground gap-1">
              <Clock className="size-3" />
              {remainingPercent}%
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            target.hit
              ? 'bg-green-500'
              : target.direction === 'above'
                ? 'bg-gradient-to-l from-gold to-yellow-400'
                : 'bg-gradient-to-l from-red-400 to-orange-400'
          )}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Timestamp */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="size-2.5" />
          {relativeTime(target.createdAt)}
        </span>
        {target.hit && target.hitAt && (
          <span className="text-[10px] text-green-500">
            ✓ {relativeTime(target.hitAt)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Add Target Form                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AddTargetForm({
  currentPrice,
  onAdd,
}: {
  currentPrice: number;
  onAdd: (target: Omit<Target, 'id' | 'createdAt' | 'hit' | 'hitAt'>) => void;
}) {
  const [price, setPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const { t } = useTranslation();

  const handleSubmit = () => {
    const numPrice = parseInt(price.replace(/,/g, ''), 10);
    if (!numPrice || numPrice <= 0) return;
    onAdd({ targetPrice: numPrice, direction });
    setPrice('');
  };

  return (
    <Card className="border-gold/20" id="pm-new">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Plus className="size-4 text-gold" />
          افزودن هدف جدید
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={currentPrice ? `مثلاً ${formatNumber(Math.round(currentPrice * 1.03))}` : 'قیمت هدف...'}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 text-sm"
            dir="ltr"
          />
          <Select value={direction} onValueChange={(v) => setDirection(v as 'above' | 'below')}>
            <SelectTrigger className="w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="above">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-green-500" />
                  بالاتر
                </div>
              </SelectItem>
              <SelectItem value="below">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="size-3.5 text-red-500" />
                  پایین‌تر
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!price}
          className="w-full bg-gold text-background hover:bg-gold/90 font-bold text-sm"
        >
          <Target className="size-4 ml-2" />
          ثبت هدف قیمتی
        </Button>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PriceMissileTracker() {
  const [data, setData] = useState<PriceMissileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [localTargets, setLocalTargets] = useState<Target[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTarget, setCelebrationTarget] = useState<number>(0);
  const { goldPrice } = useAppStore();
  const { t } = useTranslation();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/price-missile');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch {
      // Use store price as fallback
      if (goldPrice) {
        const currentPrice = goldPrice.marketPrice || goldPrice.buyPrice;
        const targets: Target[] = [
          {
            id: 'l1',
            targetPrice: Math.round(currentPrice * 1.03),
            direction: 'above',
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            hit: false,
          },
          {
            id: 'l2',
            targetPrice: Math.round(currentPrice * 0.97),
            direction: 'below',
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            hit: false,
          },
          {
            id: 'l3',
            targetPrice: Math.round(currentPrice * 1.02),
            direction: 'above',
            createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
            hit: true,
            hitAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
        ];
        setData({
          success: true,
          currentPrice,
          targets,
          history: [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, [goldPrice]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAddTarget = useCallback(
    (newTarget: Omit<Target, 'id' | 'createdAt' | 'hit' | 'hitAt'>) => {
      const currentPrice = data?.currentPrice || goldPrice?.marketPrice || 0;
      const target: Target = {
        ...newTarget,
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
        hit: false,
      };

      // Check if already hit
      if (
        (newTarget.direction === 'above' && currentPrice >= newTarget.targetPrice) ||
        (newTarget.direction === 'below' && currentPrice <= newTarget.targetPrice)
      ) {
        target.hit = true;
        target.hitAt = new Date().toISOString();
        setCelebrationTarget(newTarget.targetPrice);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }

      setLocalTargets((prev) => [target, ...prev]);
    },
    [data?.currentPrice, goldPrice]
  );

  const currentPrice = data?.currentPrice || goldPrice?.marketPrice || 0;
  const allTargets = [...localTargets, ...(data?.targets || [])];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10">
          <Target className="size-8 text-gold animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">در حال بارگذاری ردیاب...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* ── CSS Animations ── */}
      <style jsx>{`
        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(-30px) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(80px) rotate(720deg) scale(0.3);
          }
        }
        @keyframes celebrationPop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes missileGlow {
          0%, 100% { opacity: 0.4; box-shadow: 0 0 4px rgba(212,175,55,0.3); }
          50% { opacity: 1; box-shadow: 0 0 12px rgba(212,175,55,0.8); }
        }
        @keyframes missileTrail {
          0% { opacity: 0; background-position: 0 0; }
          50% { opacity: 1; }
          100% { opacity: 0.3; background-position: 0 20px; }
        }

        .confetti-piece {
          position: absolute;
          top: -10px;
          width: 6px;
          height: 6px;
          border-radius: 2px;
          animation: confettiFall 2.5s ease-out forwards;
        }

        .celebration-text {
          animation: celebrationPop 0.5s ease-out;
        }

        .celebration-bounce {
          animation: bounce 0.8s ease-in-out infinite;
        }

        .missile-glow-line {
          background: linear-gradient(to top, rgba(212,175,55,0.1), rgba(212,175,55,0.8));
          border-radius: 4px;
          animation: missileGlow 2s ease-in-out infinite;
        }

        .missile-trail {
          background: repeating-linear-gradient(
            to top,
            rgba(212,175,55,0.6) 0px,
            rgba(212,175,55,0.1) 4px,
            rgba(212,175,55,0.4) 8px
          );
          border-radius: 2px;
          animation: missileTrail 1.5s ease-in-out infinite;
        }

        .hit-celebration {
          overflow: hidden;
        }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gold/15">
            <Target className="size-5 text-gold" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              ردیاب هدف قیمت
              <Badge className="bg-gold/15 text-gold border-gold/30 hover:bg-gold/20 gap-1 text-[10px]">
                <Zap className="size-2.5" />
                موشک قیمتی
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              اهداف قیمتی خود را تعیین و روند طلا را ردیابی کنید
            </p>
          </div>
        </div>
      </div>

      {/* ── Current Price Card ── */}
      <Card className="border-gold/20 bg-gradient-to-br from-gold/5 via-card to-card" id="pm-stats">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">قیمت فعلی طلا (هر گرم)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold gold-gradient-text">
                  {currentPrice ? formatNumber(currentPrice) : '---'}
                </span>
                <span className="text-xs text-muted-foreground">گرم طلا</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex size-10 items-center justify-center rounded-full bg-gold/10 missile-pulse">
                <Zap className="size-5 text-gold" />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {t('common.live')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Hit Celebrations ── */}
      {showCelebration && <HitCelebration targetPrice={celebrationTarget} />}

      {/* ── Missile Gauge ── */}
      {allTargets.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="size-4 text-gold" />
              ردیاب موشکی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MissileGauge currentPrice={currentPrice} targets={allTargets} />
          </CardContent>
        </Card>
      )}

      {/* ── Add Target Form ── */}
      <AddTargetForm currentPrice={currentPrice} onAdd={handleAddTarget} />

      {/* ── Active Targets ── */}
      <div className="space-y-2" id="pm-active">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Target className="size-4 text-gold" />
          اهداف فعال
          <Badge variant="secondary" className="text-[10px]">
            {allTargets.filter((t) => !t.hit).length} فعال
          </Badge>
        </h3>

        {allTargets.filter((t) => !t.hit).length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Target className="size-10 opacity-20 mb-2" />
            <p className="text-sm">هنوز هدف قیمتی ثبت نشده</p>
            <p className="text-xs mt-1">هدف جدیدی اضافه کنید</p>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {allTargets
            .filter((t) => !t.hit)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((t) => (
              <TargetItem key={t.id} target={t} currentPrice={currentPrice} />
            ))}
        </div>
      </div>

      {/* ── Hit Targets ── */}
      {allTargets.filter((t) => t.hit).length > 0 && (
        <div className="space-y-2" id="pm-history">
          <h3 className="text-sm font-bold flex items-center gap-2 text-green-500">
            <Check className="size-4" />
            اهداف رسیده
            <Badge className="bg-green-500/15 text-green-500 border-green-500/30 hover:bg-green-500/20 text-[10px]">
              {allTargets.filter((t) => t.hit).length}
            </Badge>
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {allTargets
              .filter((t) => t.hit)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((t) => (
                <TargetItem key={t.id} target={t} currentPrice={currentPrice} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
