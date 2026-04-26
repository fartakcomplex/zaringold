'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Tour steps data                                                    */
/* ------------------------------------------------------------------ */

interface TourStep {
  title: string;
  description: string;
  icon: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'به زرین گلد خوش آمدید! 👋',
    description: 'پلتفرم خرید و فروش آنلاین طلا. با ما شروع کنید.',
    icon: '🪙',
  },
  {
    title: 'داشبورد شما',
    description: 'اینجا خلاصه‌ای از حساب، موجودی و آخرین تراکنش‌هایتان را می‌بینید.',
    icon: '📊',
  },
  {
    title: 'خرید و فروش طلا',
    description: 'با بهترین قیمت و کمترین کارمزد، طلا بخرید یا بفروشید.',
    icon: '💱',
  },
  {
    title: 'کیف پول شما',
    description: 'موجودی طلایی خود را مدیریت کنید.',
    icon: '👛',
  },
  {
    title: 'آماده‌اید!',
    description: 'شروع به سرمایه‌گذاری در طلا کنید. موفق باشید! 🎉',
    icon: '🚀',
  },
];

const STORAGE_KEY = 'zarrin-gold-tour-completed';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  /* ── Check localStorage on mount ── */
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const handleStartTrading = useCallback(() => {
    completeTour();
  }, [completeTour]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 fade-in"
    >
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* ── Card ── */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md overflow-hidden fade-scale-in',
          'rounded-2xl border border-gold/20',
          'bg-white dark:bg-gray-900',
          'shadow-2xl shadow-gold/10'
        )}
      >
        {/* ── Gold gradient top border ── */}
        <div className="h-1 w-full bg-gradient-to-l from-gold-light via-gold to-gold-dark" />

        {/* ── Close button ── */}
        <button
          type="button"
          onClick={handleSkip}
          className={cn(
            'absolute top-4 start-4 z-20 rounded-lg p-1.5 transition-colors',
            'text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5'
          )}
          aria-label="بستن"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ── Step content ── */}
        <div className="relative min-h-[240px] overflow-hidden px-6 pt-8 pb-4" key={currentStep}>
          <div className="flex flex-col items-center text-center page-transition">
            {/* Icon */}
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 via-gold/10 to-gold/5 ring-2 ring-gold/20">
              <span className="text-4xl">{step.icon}</span>
            </div>

            {/* Title */}
            <h3
              className={cn(
                'mb-3 text-xl font-bold leading-relaxed',
                'text-foreground'
              )}
            >
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-sm leading-7 text-foreground/60 max-w-[320px]">
              {step.description}
            </p>
          </div>
        </div>

        {/* ── Step indicator dots ── */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {TOUR_STEPS.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentStep
                  ? 'w-6 bg-gold'
                  : index < currentStep
                    ? 'w-2 bg-gold/50'
                    : 'w-2 bg-foreground/15'
              )}
            />
          ))}
        </div>

        {/* ── Navigation buttons ── */}
        <div className="border-t border-foreground/5 px-6 py-4">
          {isLastStep ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleStartTrading}
                className={cn(
                  'w-full rounded-xl py-3 text-sm font-bold',
                  'bg-gradient-to-l from-gold-light via-gold to-gold-dark',
                  'text-gray-900 shadow-lg shadow-gold/25',
                  'transition-all duration-200',
                  'hover:shadow-gold/40 hover:scale-[1.02]',
                  'active:scale-[0.98]'
                )}
              >
                شروع معامله
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className={cn(
                  'w-full rounded-xl py-3 text-sm font-medium',
                  'text-foreground/50 transition-colors',
                  'hover:text-foreground/70 hover:bg-foreground/5'
                )}
              >
                بستن
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {isFirstStep ? (
                <button
                  type="button"
                  onClick={handleSkip}
                  className={cn(
                    'text-sm font-medium text-foreground/40 transition-colors',
                    'hover:text-foreground/60'
                  )}
                >
                  رد شدن
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    'text-foreground/50 transition-colors',
                    'hover:text-foreground/70'
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                  قبلی
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className={cn(
                  'flex items-center gap-1 rounded-xl px-6 py-2.5 text-sm font-bold',
                  'bg-gradient-to-l from-gold-light via-gold to-gold-dark',
                  'text-gray-900 shadow-md shadow-gold/20',
                  'transition-all duration-200',
                  'hover:shadow-gold/35 hover:scale-[1.02]',
                  'active:scale-[0.98]'
                )}
              >
                بعدی
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
