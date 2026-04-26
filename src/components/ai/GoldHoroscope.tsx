'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Star, RefreshCw, Gem, Palette, Hash } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface HoroscopeResult {
  fortune: string;
  buyLuck: number;
  sellLuck: number;
  luckyNumber: number;
  luckyColor: string;
  luckyGemstone: string;
  motivationalQuote: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getLuckEmoji(value: number): string {
  if (value >= 70) return '🟢';
  if (value >= 40) return '🟡';
  return '🔴';
}

function getLuckLabel(value: number): string {
  if (value >= 80) return 'عالی';
  if (value >= 60) return 'خوب';
  if (value >= 40) return 'متوسط';
  return 'ضعیف';
}

function getLuckBarColor(value: number): string {
  if (value >= 70) return 'bg-emerald-500';
  if (value >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function toPersianDigits(num: number): string {
  return num.toLocaleString('fa-IR');
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Decorative Stars (CSS-only twinkle)                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CosmicStars() {
  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 3,
    duration: 1.5 + Math.random() * 2,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-[#D4AF37]/40"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GoldHoroscope() {
  const [loading, setLoading] = useState(false);
  const [horoscope, setHoroscope] = useState<HoroscopeResult | null>(null);
  const [date, setDate] = useState<string>('');
  const [error, setError] = useState('');

  const fetchHoroscope = async () => {
    setLoading(true);
    setError('');
    setHoroscope(null);

    try {
      const res = await fetch('/api/gold-horoscope');
      const data = await res.json();

      if (data.success && data.horoscope) {
        setHoroscope(data.horoscope);
        setDate(data.date || '');
      } else {
        setError('خطا در دریافت فال. لطفاً دوباره تلاش کنید.');
      }
    } catch {
      setError('خطا در ارتباط با سرور. لطفاً بعداً تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1e] via-[#1a1030] to-[#0f0a1e] pb-8">
      {/* ── Global CSS Keyframes ── */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 15px rgba(212,175,55,0.3); }
          50% { box-shadow: 0 0 35px rgba(212,175,55,0.6), 0 0 60px rgba(212,175,55,0.2); }
        }
        @keyframes loading-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #D4AF37 0%, #f5e6a3 25%, #D4AF37 50%, #f5e6a3 75%, #D4AF37 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .horoscope-reveal {
          animation: revealUp 0.6s ease-out forwards;
        }
        .horoscope-reveal-delay-1 { animation-delay: 0.1s; opacity: 0; }
        .horoscope-reveal-delay-2 { animation-delay: 0.2s; opacity: 0; }
        .horoscope-reveal-delay-3 { animation-delay: 0.3s; opacity: 0; }
        .horoscope-reveal-delay-4 { animation-delay: 0.4s; opacity: 0; }
        .horoscope-reveal-delay-5 { animation-delay: 0.5s; opacity: 0; }
      `}</style>

      <div className="mx-auto max-w-lg px-4 pt-6">
        {/* ─── Header ─── */}
        <div className="relative mb-6 text-center">
          <CosmicStars />

          {/* Decorative orbs */}
          <div
            className="absolute -top-4 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute -top-2 left-1/4 h-32 w-32 rounded-full opacity-15 blur-2xl"
            style={{
              background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-[#D4AF37]" />
              <Star className="h-5 w-5 text-[#D4AF37]/70" />
              <Sparkles className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <h1 className="shimmer-text mb-1 text-3xl font-extrabold tracking-tight">
              فال روزانه طلایی
            </h1>
            <p className="text-sm text-[#D4AF37]/60">
              ✨ پیش‌بینی سرگرم‌کننده بازار طلا با هوش مصنوعی
            </p>
          </div>
        </div>

        {/* ─── Main Card ─── */}
        <div
          id="gh-history"
          className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/20"
          style={{
            background:
              'linear-gradient(135deg, rgba(26,16,48,0.95) 0%, rgba(15,10,30,0.98) 50%, rgba(26,16,48,0.95) 100%)',
            boxShadow:
              '0 0 30px rgba(212,175,55,0.1), inset 0 1px 0 rgba(212,175,55,0.15)',
          }}
        >
          {/* Card cosmic bg */}
          <CosmicStars />

          <div className="relative z-10 p-5">
            {/* ── Date ── */}
            <div className="mb-5 text-center">
              <Badge
                variant="outline"
                className="border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-4 py-1.5 text-xs text-[#8B5CF6]"
              >
                <Star className="ml-1.5 h-3 w-3" />
                {date || new Date().toLocaleDateString('fa-IR')}
              </Badge>
            </div>

            {/* ── Generate Button ── */}
            {!horoscope && !loading && (
              <div className="text-center">
                <div
                  className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(139,92,246,0.1) 100%)',
                    border: '2px solid rgba(212,175,55,0.2)',
                    animation: 'pulse-gold 3s ease-in-out infinite',
                  }}
                >
                  <Sparkles className="h-10 w-10 text-[#D4AF37]" />
                </div>

                <Button
                  onClick={fetchHoroscope}
                  className="group relative overflow-hidden rounded-xl px-8 py-6 text-base font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background:
                      'linear-gradient(135deg, #D4AF37 0%, #b8941f 50%, #D4AF37 100%)',
                    color: '#0f0a1e',
                    boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                    دیدن فال امروز
                    <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
                  </span>
                </Button>
                <p className="mt-3 text-xs text-white/30">
                  آیا امروز روز خوبی برای خرید طلاست؟ ✨
                </p>
              </div>
            )}

            {/* ── Loading State ── */}
            {loading && (
              <div className="flex flex-col items-center gap-4 py-10">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    animation: 'spin-slow 2s linear infinite, pulse-gold 2s ease-in-out infinite',
                    background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)',
                    border: '2px solid rgba(212,175,55,0.3)',
                  }}
                >
                  <Sparkles className="h-8 w-8 text-[#D4AF37]" />
                </div>
                <p className="text-sm text-[#D4AF37]/70" style={{ animation: 'loading-glow 1.5s ease-in-out infinite' }}>
                  در حال ارتباط با ستارگان... ✨
                </p>
              </div>
            )}

            {/* ── Error State ── */}
            {error && !loading && (
              <div className="text-center py-6">
                <p className="text-sm text-red-400 mb-4">{error}</p>
                <Button
                  onClick={fetchHoroscope}
                  variant="outline"
                  className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                >
                  <RefreshCw className="ml-2 h-4 w-4" />
                  تلاش مجدد
                </Button>
              </div>
            )}

            {/* ── Horoscope Result ── */}
            {horoscope && !loading && (
              <div id="gh-today" className="space-y-5">
                {/* Main Fortune */}
                <div
                  className="horoscope-reveal horoscope-reveal-delay-1 relative overflow-hidden rounded-xl p-5"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(139,92,246,0.08) 100%)',
                    border: '1px solid rgba(212,175,55,0.15)',
                  }}
                >
                  {/* Gold accent corners */}
                  <div className="absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2 border-[#D4AF37]/30 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 border-[#D4AF37]/30 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-[#D4AF37]/30 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-[#D4AF37]/30 rounded-br-xl" />

                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
                    <p className="text-sm leading-7 text-white/90">
                      {horoscope.fortune}
                    </p>
                  </div>
                </div>

                {/* Luck Meters */}
                <div className="horoscope-reveal horoscope-reveal-delay-2 grid grid-cols-2 gap-3">
                  {/* Buy Luck */}
                  <div
                    className="rounded-xl p-3.5"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-white/60">
                        شانس خرید
                      </span>
                      <span className="text-xs">{getLuckEmoji(horoscope.buyLuck)}</span>
                    </div>
                    <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${getLuckBarColor(horoscope.buyLuck)}`}
                        style={{ width: `${horoscope.buyLuck}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">
                        {getLuckLabel(horoscope.buyLuck)}
                      </span>
                      <span className="text-xs font-bold text-[#D4AF37]">
                        {toPersianDigits(horoscope.buyLuck)}٪
                      </span>
                    </div>
                  </div>

                  {/* Sell Luck */}
                  <div
                    className="rounded-xl p-3.5"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-white/60">
                        شانس فروش
                      </span>
                      <span className="text-xs">{getLuckEmoji(horoscope.sellLuck)}</span>
                    </div>
                    <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${getLuckBarColor(horoscope.sellLuck)}`}
                        style={{ width: `${horoscope.sellLuck}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">
                        {getLuckLabel(horoscope.sellLuck)}
                      </span>
                      <span className="text-xs font-bold text-[#D4AF37]">
                        {toPersianDigits(horoscope.sellLuck)}٪
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lucky Items Row */}
                <div className="horoscope-reveal horoscope-reveal-delay-3 grid grid-cols-3 gap-3">
                  {/* Lucky Number */}
                  <div
                    className="flex flex-col items-center rounded-xl p-3 text-center"
                    style={{
                      background: 'rgba(212,175,55,0.06)',
                      border: '1px solid rgba(212,175,55,0.12)',
                    }}
                  >
                    <Hash className="mb-1.5 h-4 w-4 text-[#D4AF37]/70" />
                    <span className="text-[10px] text-white/40">عدد شانس</span>
                    <span className="mt-1 text-2xl font-extrabold shimmer-text">
                      {toPersianDigits(horoscope.luckyNumber)}
                    </span>
                  </div>

                  {/* Lucky Color */}
                  <div
                    className="flex flex-col items-center rounded-xl p-3 text-center"
                    style={{
                      background: 'rgba(139,92,246,0.06)',
                      border: '1px solid rgba(139,92,246,0.12)',
                    }}
                  >
                    <Palette className="mb-1.5 h-4 w-4 text-[#8B5CF6]/70" />
                    <span className="text-[10px] text-white/40">رنگ شانس</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-white/20"
                        style={{
                          background: getLuckyColorHex(horoscope.luckyColor),
                          boxShadow: `0 0 8px ${getLuckyColorHex(horoscope.luckyColor)}66`,
                        }}
                      />
                      <span className="text-xs font-medium text-[#8B5CF6]">
                        {horoscope.luckyColor}
                      </span>
                    </div>
                  </div>

                  {/* Lucky Gemstone */}
                  <div
                    className="flex flex-col items-center rounded-xl p-3 text-center"
                    style={{
                      background: 'rgba(212,175,55,0.06)',
                      border: '1px solid rgba(212,175,55,0.12)',
                    }}
                  >
                    <Gem className="mb-1.5 h-4 w-4 text-[#D4AF37]/70" />
                    <span className="text-[10px] text-white/40">سنگ شانس</span>
                    <span className="mt-1 text-xs font-medium text-[#D4AF37]">
                      {horoscope.luckyGemstone}
                    </span>
                  </div>
                </div>

                {/* Motivational Quote */}
                <div
                  id="gh-share"
                  className="horoscope-reveal horoscope-reveal-delay-4 relative rounded-xl p-4"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(212,175,55,0.05) 100%)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    borderRight: '3px solid #8B5CF6',
                  }}
                >
                  <p className="text-xs leading-6 text-white/70 italic">
                    &ldquo;{horoscope.motivationalQuote}&rdquo;
                  </p>
                </div>

                {/* Refresh Button */}
                <div id="gh-refresh" className="horoscope-reveal horoscope-reveal-delay-5 flex justify-center pt-1">
                  <Button
                    onClick={fetchHoroscope}
                    variant="ghost"
                    className="gap-2 text-sm text-[#D4AF37]/60 transition-colors hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    فال دوباره
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer Note ─── */}
        <p className="mt-6 text-center text-[11px] leading-5 text-white/20">
          ⚠️ این فال صرفاً جنبه سرگرمی دارد و پیشنهاد سرمایه‌گذاری نیست.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Lucky Color Helper                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getLuckyColorHex(colorName: string): string {
  const map: Record<string, string> = {
    'طلایی': '#D4AF37',
    'سبز': '#22c55e',
    'سبز زمردی': '#047857',
    'آبی': '#3b82f6',
    'آبی فیروزه‌ای': '#06b6d4',
    'قرمز': '#ef4444',
    'قرمز یاقوتی': '#dc2626',
    'بنفش': '#8B5CF6',
    'بنفش آمیتیست': '#a855f7',
    'سفید': '#f5f5f5',
    'سفید نقره‌ای': '#c0c0c0',
    'نارنجی': '#f97316',
    'صورتی': '#ec4899',
    'زرد': '#eab308',
    'نقره‌ای': '#94a3b8',
    'قهوه‌ای': '#92400e',
  };
  return map[colorName] || '#D4AF37';
}
