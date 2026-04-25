'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { formatToman, formatGrams, formatNumber } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface HealthAnalysis {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Circular Score Gauge (CSS-only SVG animation)                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ScoreGauge({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  const riskLabel =
    score >= 75 ? 'عالی' : score >= 50 ? 'متوسط' : 'نیاز به بهبود';

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color }}
        >
          {formatNumber(score)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">
          {riskLabel}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HealthCheckSkeleton() {
  return (
    <Card className="border-gold/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-36 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex justify-center py-4">
          <div className="size-36 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
          <div className="h-12 rounded-xl bg-muted animate-pulse" />
          <div className="h-12 rounded-xl bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Risk Level Badge                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const config = {
    low: {
      label: 'ریسک پایین',
      className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
      icon: ShieldCheck,
    },
    medium: {
      label: 'ریسک متوسط',
      className: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
      icon: AlertTriangle,
    },
    high: {
      label: 'ریسک بالا',
      className: 'bg-red-500/15 text-red-600 border-red-500/30',
      icon: AlertTriangle,
    },
  };

  const { label, className, icon: Icon } = config[level];

  return (
    <Badge variant="outline" className={`gap-1.5 text-xs ${className}`}>
      <Icon className="size-3.5" />
      {label}
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function HealthCheck() {
  const { user, fiatWallet, goldWallet, addToast } = useAppStore();

  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  const goldGrams = goldWallet?.goldGrams ?? 0;
  const fiatBalance = fiatWallet?.balance ?? 0;

  /* ── Animate score when analysis loads ── */
  useEffect(() => {
    if (!analysis) return;
    let current = 0;
    const target = analysis.overallScore;
    const step = Math.max(1, Math.ceil(target / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setAnimatedScore(current);
    }, 30);
    return () => clearInterval(interval);
  }, [analysis]);

  /* ── Fetch Analysis ── */
  const runHealthCheck = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAnimatedScore(0);

    try {
      const res = await fetch('/api/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          goldGrams,
          fiatBalance,
        }),
      });
      const data = await res.json();

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'خطا در دریافت تحلیل');
      }
    } catch {
      setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, goldGrams, fiatBalance]);

  /* ── Render ── */

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card id="hc-start" className="border-gold/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gold/10">
                <HeartPulse className="size-5 text-gold" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  چکاپ سلامت مالی
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تحلیل هوشمند وضعیت مالی شما
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1 border-gold/30 text-gold text-[10px]">
              <Sparkles className="size-3" />
              AI
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* User balance info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-muted/50 p-3 text-center border border-border/50">
              <p className="text-[10px] text-muted-foreground mb-1">موجودی طلای شما</p>
              <p className="text-sm font-bold text-gold tabular-nums">
                {formatGrams(goldGrams)} گرم
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center border border-border/50">
              <p className="text-[10px] text-muted-foreground mb-1">موجودی واحد طلایی شما</p>
              <p className="text-sm font-bold text-emerald-600 tabular-nums">
                {formatToman(fiatBalance)}
              </p>
            </div>
          </div>

          {/* Action button */}
          {!analysis && !loading && (
            <Button
              onClick={runHealthCheck}
              className="w-full bg-gold text-white hover:bg-gold/90 rounded-xl py-5 text-sm font-medium gap-2"
            >
              <HeartPulse className="size-4" />
              شروع بررسی
            </Button>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative">
                <div className="size-12 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
                <HeartPulse className="size-5 text-gold absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm text-muted-foreground">
                در حال تحلیل وضعیت مالی شما...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="size-6 text-red-500" />
              </div>
              <p className="text-sm text-red-500 text-center">{error}</p>
              <Button
                variant="outline"
                onClick={runHealthCheck}
                className="border-gold/30 text-gold hover:bg-gold/5"
                size="sm"
              >
                <RefreshCw className="size-3.5 me-1.5" />
                تلاش مجدد
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading && <HealthCheckSkeleton />}
      {analysis && !loading && (
        <div className="space-y-4">
          {/* Score Card */}
          <Card id="hc-score" className="border-gold/20">
            <CardContent className="pt-6 space-y-4">
              {/* Score Gauge */}
              <ScoreGauge score={animatedScore} />

              {/* Risk Level Badge */}
              <div className="flex justify-center">
                <RiskBadge level={analysis.riskLevel} />
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-muted/50 p-4 border border-border/50">
                <p className="text-sm leading-7 text-foreground text-center">
                  {analysis.summary}
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>سلامت مالی</span>
                  <span className="tabular-nums font-medium">{animatedScore}/۱۰۰</span>
                </div>
                <Progress
                  value={animatedScore}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card id="hc-advice" className="border-gold/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="size-4 text-emerald-500" />
                </div>
                <CardTitle className="text-sm font-bold">توصیه‌ها</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3"
                >
                  <Check className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-sm leading-6 text-foreground">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <div id="hc-history" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <Card className="border-emerald-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <TrendingUp className="size-4 text-emerald-500" />
                  </div>
                  <CardTitle className="text-sm font-bold">نقاط قوت</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-sm leading-6 text-foreground">{s}</p>
                  </div>
                ))}
                {analysis.strengths.length === 0 && (
                  <p className="text-xs text-muted-foreground">داده‌ای موجود نیست</p>
                )}
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card className="border-red-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10">
                    <TrendingDown className="size-4 text-red-500" />
                  </div>
                  <CardTitle className="text-sm font-bold">نقاط ضعف</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <X className="size-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm leading-6 text-foreground">{w}</p>
                  </div>
                ))}
                {analysis.weaknesses.length === 0 && (
                  <p className="text-xs text-muted-foreground">داده‌ای موجود نیست</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Refresh button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={runHealthCheck}
              disabled={loading}
              className="border-gold/30 text-gold hover:bg-gold/5 gap-2"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              بررسی مجدد
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
