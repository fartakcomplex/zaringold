'use client';

import React, { useState } from 'react';
import { motion } from '@/lib/framer-compat';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Search, Home, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: Math.random() * 6 + 2,
  left: Math.random() * 100,
  delay: Math.random() * 6,
  duration: Math.random() * 4 + 4,
  opacity: Math.random() * 0.4 + 0.1,
}));

export default function NotFound() {
  const { t, dir } = useTranslation();
  const router = useRouter();
  const { setPage } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleGoHome = () => {
    setPage('dashboard');
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setPage('dashboard');
      router.push('/');
    }
  };

  return (
    <div dir={dir} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Floating gold particles */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-gold"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: '-10px',
            opacity: p.opacity,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Animated gold coin */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="relative mb-8"
      >
        <div
          className="size-24 rounded-full shadow-2xl shadow-gold/30"
          style={{
            background: 'linear-gradient(135deg, #F5E6A3 0%, #D4AF37 25%, #B8962E 50%, #D4AF37 75%, #F5E6A3 100%)',
            animation: 'coin-rotate 6s ease-in-out infinite',
          }}
        >
          {/* Coin inner circle */}
          <div className="absolute inset-2 rounded-full border-2 border-white/20" />
          {/* Coin star */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>🪙</span>
          </div>
        </div>
      </motion.div>

      {/* 404 Text */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-4 text-8xl font-black gold-gradient-text"
      >
        ۴۰۴
      </motion.h1>

      {/* Messages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8 text-center"
      >
        <p className="mb-2 text-lg font-bold text-foreground">
          این صفحه مثل طلای گمشده، پیدا نشد!
        </p>
        <p className="text-sm text-muted-foreground">
          This page is like lost gold — it couldn&apos;t be found!
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onSubmit={handleSearch}
        className="mb-6 w-full max-w-md"
      >
        <div className="relative">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در زرین‌گلد..."
            className="w-full rounded-xl border border-gold/20 bg-card/80 py-3 pe-4 ps-10 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-sm transition-all focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
      </motion.form>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        <Button
          onClick={handleGoHome}
          className="bg-gradient-to-r from-gold-dark via-gold to-gold-light text-gray-950 font-bold shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30"
        >
          <Home className="size-4 ms-2" />
          بازگشت به خانه
        </Button>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="border-gold/20 hover:border-gold/40"
        >
          {dir === 'rtl' ? <ArrowRight className="size-4 ms-2" /> : <ArrowLeft className="size-4 ms-2" />}
          بازگشت
        </Button>
      </motion.div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes coin-rotate {
          0%, 100% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.1; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
