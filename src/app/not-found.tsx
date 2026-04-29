'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from '@/lib/framer-compat';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Home, ArrowRight, ArrowLeft } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Floating Gold Particle                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface GoldParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function GoldParticles() {
  const particles = useMemo<GoldParticle[]>(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 3,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes gold-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: var(--particle-opacity);
          }
          25% {
            transform: translateY(-30px) rotate(90deg);
            opacity: calc(var(--particle-opacity) * 1.5);
          }
          50% {
            transform: translateY(-15px) rotate(180deg);
            opacity: var(--particle-opacity);
          }
          75% {
            transform: translateY(-40px) rotate(270deg);
            opacity: calc(var(--particle-opacity) * 0.8);
          }
        }
        @keyframes coin-rotate {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, #D4AF37, #B8962E)`,
            boxShadow: `0 0 ${p.size * 2}px rgba(212, 175, 55, ${p.opacity * 0.6})`,
            '--particle-opacity': p.opacity,
            animation: `gold-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  404 Not Found Page                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function NotFound() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { setPage } = useAppStore();
  const isRTL = locale === 'fa';

  const [searchQuery, setSearchQuery] = useState('');

  const handleGoHome = () => {
    setPage('dashboard');
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setPage('dashboard');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
      {/* Gold Particles Background */}
      <GoldParticles />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/[0.03] via-transparent to-[#D4AF37]/[0.05] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center max-w-lg mx-auto">
        {/* Animated Gold Coin */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <div
            className="relative size-28 sm:size-36 rounded-full mx-auto"
            style={{ perspective: '600px' }}
          >
            <div
              className="w-full h-full rounded-full relative"
              style={{
                background: 'linear-gradient(145deg, #F5E6A3, #D4AF37, #B8962E, #9A7B2D)',
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
                animation: 'coin-rotate 6s linear infinite',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Coin inner ring */}
              <div
                className="absolute inset-3 rounded-full border-2 border-[#9A7B2D]/60"
                style={{ boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2)' }}
              />
              {/* Coin center emblem */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[#9A7B2D] text-3xl sm:text-4xl font-bold select-none" style={{ textShadow: '1px 1px 0 rgba(255,255,255,0.3)' }}>
                  ₮
                </span>
              </div>
            </div>
            {/* Glow underneath */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#D4AF37]/20 rounded-full blur-xl" />
          </div>
        </motion.div>

        {/* 404 Number */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h1
            className={cn(
              'text-8xl sm:text-9xl font-black leading-none',
              'bg-gradient-to-r from-[#F5E6A3] via-[#D4AF37] to-[#B8962E] bg-clip-text text-transparent',
              'drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]',
            )}
          >
            ۴۰۴
          </h1>
        </motion.div>

        {/* Persian Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-4"
        >
          <p className="text-lg sm:text-xl text-[#D4AF37]/90 font-medium" dir="rtl">
            این صفحه مثل طلای گمشده، پیدا نشد!
          </p>
        </motion.div>

        {/* English Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="mt-2 text-sm sm:text-base text-gray-500">
            This page is like lost gold — it couldn&apos;t be found!
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 w-full"
        >
          <form onSubmit={handleSearch} className="relative">
            <Search className={cn('absolute top-1/2 -translate-y-1/2 size-4 text-gray-500', isRTL ? 'right-3' : 'left-3')} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'جستجو در زرین گلد...' : 'Search ZarinGold...'}
              className={cn(
                'h-12 bg-white/5 border-[#D4AF37]/20 text-white',
                'placeholder:text-gray-600 rounded-xl',
                'focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20',
                isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4',
              )}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </form>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className={cn('mt-6 flex gap-3', isRTL && 'flex-row-reverse')}
        >
          <Button
            onClick={handleGoHome}
            className={cn(
              'bg-gradient-to-l from-[#D4AF37] to-[#B8962E] text-black font-bold',
              'hover:from-[#E5C039] hover:to-[#C9A33A]',
              'rounded-xl px-6 h-11 text-sm',
              'flex items-center gap-2',
            )}
          >
            <Home className="size-4" />
            {isRTL ? 'صفحه اصلی' : 'Go Home'}
          </Button>

          <Button
            onClick={handleGoBack}
            variant="outline"
            className={cn(
              'border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10',
              'rounded-xl px-6 h-11 text-sm',
              'flex items-center gap-2',
            )}
          >
            {isRTL ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            {isRTL ? 'بازگشت' : 'Back'}
          </Button>
        </motion.div>

        {/* Decorative text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-12 text-xs text-gray-600"
        >
          {isRTL ? 'زرین گلد — سرمایه‌گذاری هوشمند در طلا' : 'ZarinGold — Smart Gold Investment'}
        </motion.p>
      </div>
    </div>
  );
}
