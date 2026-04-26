'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Banner Data                                                        */
/* ------------------------------------------------------------------ */

interface BannerItem {
  id: number;
  titleKey: string;
  subtitleKey: string;
  gradient: string;
  icon: string;
}

const banners: BannerItem[] = [
  {
    id: 1,
    titleKey: 'banner.title1',
    subtitleKey: 'banner.subtitle1',
    gradient: 'from-gold/20 via-amber-900/30 to-gold/10',
    icon: '🏆',
  },
  {
    id: 2,
    titleKey: 'banner.title2',
    subtitleKey: 'banner.subtitle2',
    gradient: 'from-emerald-900/30 via-teal-900/20 to-emerald-900/10',
    icon: '🎯',
  },
  {
    id: 3,
    titleKey: 'banner.title3',
    subtitleKey: 'banner.subtitle3',
    gradient: 'from-purple-900/30 via-violet-900/20 to-purple-900/10',
    icon: '🎁',
  },
];

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

/* ------------------------------------------------------------------ */
/*  MobilePromoBanner Component                                        */
/* ------------------------------------------------------------------ */

export default function MobilePromoBanner() {
  const { t } = useTranslation();
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = useCallback(
    (newDirection: number) => {
      setPage(([prevPage]) => {
        const nextPage = (prevPage + newDirection + banners.length) % banners.length;
        return [nextPage, newDirection];
      });
    },
    [],
  );

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => paginate(1), 4000);
    return () => clearInterval(timer);
  }, [paginate]);

  const currentBanner = banners[page];

  return (
    <div className="md:hidden">
      {/* Slider container */}
      <div className="relative overflow-hidden rounded-2xl h-[114px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            className={cn(
              'absolute inset-0 flex items-center gap-3 rounded-2xl bg-gradient-to-l p-4',
              currentBanner.gradient,
            )}
          >
            {/* Icon */}
            <span className="text-3xl">{currentBanner.icon}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">
                {t(currentBanner.titleKey)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                {t(currentBanner.subtitleKey)}
              </p>
            </div>

            {/* Action button */}
            <button className="shrink-0 rounded-xl bg-gold/15 px-3 py-1.5 text-[11px] font-semibold text-gold transition-colors hover:bg-gold/25 active:bg-gold/30">
              {t('common.viewAll')}
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Swipe arrows (subtle) */}
        <button
          onClick={() => paginate(-1)}
          className="absolute start-1 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-background/20 backdrop-blur-sm opacity-0 transition-opacity hover:opacity-100 active:opacity-80"
          aria-label="Previous"
        >
          <ChevronRight className="size-4 text-foreground" />
        </button>
        <button
          onClick={() => paginate(1)}
          className="absolute end-1 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-background/20 backdrop-blur-sm opacity-0 transition-opacity hover:opacity-100 active:opacity-80"
          aria-label="Next"
        >
          <ChevronLeft className="size-4 text-foreground" />
        </button>
      </div>


    </div>
  );
}
