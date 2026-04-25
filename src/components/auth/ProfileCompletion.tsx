'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProfileCompletionProps {
  userId: string;
  token: string;
  phone: string;
  onComplete: (user: any) => void;
  onSkip?: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  nationalId: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_STEPS = 3;

const STEP_META: { title: string; subtitle: string }[] = [
  { title: 'اطلاعات پایه', subtitle: 'نام و اطلاعات تماس خود را وارد کنید' },
  { title: 'هویت و احراز', subtitle: 'کد ملی خود را برای احراز هویت وارد کنید' },
  { title: 'تبریک!', subtitle: 'پروفایل شما تکمیل شد' },
];

/* ------------------------------------------------------------------ */
/*  CSS Keyframe Styles (injected once)                               */
/* ------------------------------------------------------------------ */

const STYLES_ID = 'profile-completion-styles';

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLES_ID)) return;

  const sheet = document.createElement('style');
  sheet.id = STYLES_ID;
  sheet.textContent = `
    /* ---- Fade-in & slide-up ---- */
    @keyframes pcFadeSlideUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .pc-fade-slide-up {
      animation: pcFadeSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* ---- Fade-out & slide-down ---- */
    @keyframes pcFadeSlideDown {
      from { opacity: 1; transform: translateY(0); }
      to   { opacity: 0; transform: translateY(16px); }
    }
    .pc-fade-slide-down {
      animation: pcFadeSlideDown 0.25s ease-in forwards;
    }

    /* ---- Backdrop fade-in ---- */
    @keyframes pcBackdropIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .pc-backdrop-in {
      animation: pcBackdropIn 0.35s ease-out forwards;
    }

    /* ---- Pulse glow for the bronze badge ---- */
    @keyframes pcBadgePulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(205, 127, 50, 0.5); }
      50%      { transform: scale(1.06); box-shadow: 0 0 40px 12px rgba(205, 127, 50, 0.3); }
    }
    .pc-badge-pulse {
      animation: pcBadgePulse 2s ease-in-out infinite;
    }

    /* ---- Float animation for the badge icon ---- */
    @keyframes pcFloat {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-10px); }
    }
    .pc-float {
      animation: pcFloat 2.5s ease-in-out infinite;
    }

    /* ---- Spin for loading ---- */
    @keyframes pcSpin {
      to { transform: rotate(360deg); }
    }
    .pc-spin {
      animation: pcSpin 0.7s linear infinite;
    }

    /* ---- Gold shimmer on the header ---- */
    @keyframes pcGoldShimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .pc-gold-shimmer {
      background: linear-gradient(
        90deg,
        #b8860b 0%,
        #ffd700 25%,
        #fff8dc 50%,
        #ffd700 75%,
        #b8860b 100%
      );
      background-size: 200% auto;
      animation: pcGoldShimmer 3s linear infinite;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* ---- Confetti particles ---- */
    @keyframes pcConfettiFall {
      0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
    }
    .pc-confetti {
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      animation: pcConfettiFall linear forwards;
      pointer-events: none;
    }

    /* ---- Progress bar gold fill ---- */
    .pc-progress-gold [data-slot="progress-indicator"] {
      background: linear-gradient(90deg, #b8860b, #ffd700, #daa520);
    }

    /* ---- Step circle active ring ---- */
    @keyframes pcStepRing {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
      50%      { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); }
    }
    .pc-step-ring {
      animation: pcStepRing 2s ease-in-out infinite;
    }

    /* ---- Success checkmark ---- */
    @keyframes pcCheckPop {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    .pc-check-pop {
      animation: pcCheckPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `;
  document.head.appendChild(sheet);
}

/* ------------------------------------------------------------------ */
/*  Confetti Particles Component                                       */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = [
  '#ffd700', '#daa520', '#b8860b', '#cd7f32',
  '#f0c040', '#e6be44', '#fff8dc', '#f5deb3',
];

function ConfettiParticles() {
  const [particles, setParticles] = useState<
    { id: number; left: string; delay: string; duration: string; color: string; size: string }[]
  >(() => Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1.5}s`,
      duration: `${1.8 + Math.random() * 2}s`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: `${6 + Math.random() * 8}px`,
    })))();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="pc-confetti"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            top: '10%',
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step Progress Indicator                                            */
/* ------------------------------------------------------------------ */

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: 'اطلاعات', icon: '👤' },
    { label: 'هویت', icon: '🪪' },
    { label: 'تکمیل', icon: '🏆' },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8 px-4" dir="rtl">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <React.Fragment key={stepNum}>
            {/* Connector line (before, except first) */}
            {idx > 0 && (
              <div className="relative flex-1 max-w-[60px] h-[2px] mx-2">
                <div className="absolute inset-0 rounded-full bg-white/10" />
                <div
                  className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-amber-500 to-amber-700 transition-all duration-500"
                  style={{ width: isCompleted || isActive ? '100%' : '0%' }}
                />
              </div>
            )}

            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  relative flex items-center justify-center w-11 h-11 rounded-full
                  border-2 text-sm font-bold transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-400 text-white'
                      : isActive
                        ? 'bg-gradient-to-br from-amber-500 to-yellow-600 border-yellow-400 text-white pc-step-ring'
                        : 'bg-white/5 border-white/20 text-white/40'
                  }
                `}
              >
                {isCompleted ? (
                  <span className="pc-check-pop text-base">✓</span>
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors duration-300 ${
                  isActive
                    ? 'text-amber-400'
                    : isCompleted
                      ? 'text-amber-300/70'
                      : 'text-white/30'
                }`}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Spinner                                                            */
/* ------------------------------------------------------------------ */

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`pc-spin ${className}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.25" />
      <path
        d="M12 2a10 10 0 019.95 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ProfileCompletion({
  userId,
  token,
  phone,
  onComplete,
  onSkip,
}: ProfileCompletionProps) {
  /* ---- State ---- */
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    nationalId: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [apiError, setApiError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  /* ---- Inject animation styles on mount ---- */
  useEffect(() => {
    injectStyles();
  }, []);

  /* ---- Handlers ---- */
  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError('');
  }, []);

  const handleNationalIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
      updateField('nationalId', digits);
    },
    [updateField],
  );

  /* ---- Validation ---- */
  const validateStep1 = useCallback((): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'نام و نام خانوادگی الزامی است';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد';
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'ایمیل وارد شده معتبر نیست';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.fullName, formData.email]);

  const validateStep2 = useCallback((): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'کد ملی الزامی است';
    } else if (!/^\d{10}$/.test(formData.nationalId.trim())) {
      newErrors.nationalId = 'کد ملی باید دقیقاً ۱۰ رقم باشد';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.nationalId]);

  /* ---- Step Navigation ---- */
  const goToStep = useCallback(
    (step: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(step);
        setIsTransitioning(false);
      }, 250);
    },
    [isTransitioning],
  );

  const handleNext = useCallback(async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      goToStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setIsLoading(true);
      setApiError('');
      try {
        const profileRes = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            fullName: formData.fullName.trim(),
            email: formData.email.trim() || undefined,
            nationalId: formData.nationalId.trim(),
          }),
        });

        if (!profileRes.ok) {
          const data = await profileRes.json().catch(() => ({}));
          throw new Error(data.message || 'خطا در ذخیره اطلاعات پروفایل');
        }

        const profileData = await profileRes.json();

        // Trigger level upgrade
        try {
          await fetch('/api/level', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId }),
          });
        } catch {
          // Level upgrade failure is non-blocking
        }

        goToStep(3);
      } catch (err: any) {
        setApiError(err.message || 'خطایی رخ داده است. لطفاً دوباره تلاش کنید.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentStep, validateStep1, validateStep2, goToStep, userId, token, formData]);

  const handleFinalAction = useCallback(() => {
    onComplete({
      userId,
      fullName: formData.fullName,
      phone,
      level: 'bronze',
    });
  }, [onComplete, userId, formData.fullName, phone]);

  const handleSkip = useCallback(() => {
    if (onSkip) onSkip();
  }, [onSkip]);

  /* ---- Progress percentage ---- */
  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pc-backdrop-in"
      dir="rtl"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
    >
      {/* Subtle radial glow behind the card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(205,127,50,0.08) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      {/* Main Card */}
      <Card
        className={`
          relative w-full max-w-md border-white/10
          backdrop-blur-xl
          bg-black/80
          rounded-2xl shadow-2xl shadow-amber-900/10
          overflow-hidden
          ${isTransitioning ? 'pc-fade-slide-down' : 'pc-fade-slide-up'}
        `}
      >
        {/* Gold gradient header */}
        <div className="relative px-6 pt-6 pb-4">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                'linear-gradient(135deg, rgba(205,127,50,0.3) 0%, rgba(255,215,0,0.1) 50%, rgba(184,134,11,0.3) 100%)',
            }}
            aria-hidden
          />

          <div className="relative">
            {/* Phone badge */}
            <div className="flex items-center justify-center mb-3">
              <Badge
                variant="outline"
                className="border-amber-600/40 text-amber-400/80 text-xs px-3 py-1 bg-amber-900/10"
              >
                📱 {phone}
              </Badge>
            </div>

            {/* Step indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Title */}
            <div className="text-center">
              {currentStep < 3 ? (
                <>
                  <p className="text-xs text-white/40 mb-1">
                    مرحله {currentStep} از {TOTAL_STEPS}
                  </p>
                  <h2 className="text-lg font-bold text-white mb-1">
                    {STEP_META[currentStep - 1].title}
                  </h2>
                  <p className="text-sm text-white/50">
                    {STEP_META[currentStep - 1].subtitle}
                  </p>
                </>
              ) : (
                <div className="pc-fade-slide-up">
                  <h2 className="text-2xl font-extrabold mb-1">
                    <span className="pc-gold-shimmer">
                      {STEP_META[2].title}
                    </span>
                  </h2>
                  <p className="text-sm text-white/50">
                    {STEP_META[2].subtitle}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6">
          <Progress
            value={currentStep === 3 ? 100 : progressPercent}
            className="h-1.5 rounded-full bg-white/10 pc-progress-gold"
          />
        </div>

        {/* Content area */}
        <CardContent className="relative pt-6 pb-2 min-h-[260px]">
          {/* ---- STEP 1: Basic Info ---- */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="pc-fullname"
                  className="text-sm font-medium text-white/80 flex items-center gap-1.5"
                >
                  نام و نام خانوادگی
                  <span className="text-red-400 text-xs">*</span>
                </Label>
                <Input
                  id="pc-fullname"
                  type="text"
                  placeholder="مثلاً: علی محمدی"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={`
                    bg-white/5 border-white/15 text-white placeholder:text-white/25
                    focus:border-amber-500/60 focus:ring-amber-500/20
                    h-11 text-right
                    ${errors.fullName ? 'border-red-500/70 focus:border-red-500' : ''}
                  `}
                  autoFocus
                />
                {errors.fullName && (
                  <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="pc-email"
                  className="text-sm font-medium text-white/60 flex items-center gap-1.5"
                >
                  ایمیل
                  <span className="text-white/20 text-xs">(اختیاری)</span>
                </Label>
                <Input
                  id="pc-email"
                  type="email"
                  placeholder="example@mail.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  dir="ltr"
                  className={`
                    bg-white/5 border-white/15 text-white placeholder:text-white/25
                    focus:border-amber-500/60 focus:ring-amber-500/20
                    h-11 text-left
                    ${errors.email ? 'border-red-500/70 focus:border-red-500' : ''}
                  `}
                />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          )}

          {/* ---- STEP 2: Identity ---- */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Info note */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-900/10 border border-amber-700/20">
                <span className="text-lg leading-none mt-0.5">🔒</span>
                <p className="text-xs text-amber-200/60 leading-relaxed">
                  کد ملی شما فقط برای احراز هویت استفاده می‌شود و به صورت امن ذخیره
                  خواهد شد.
                </p>
              </div>

              {/* National ID */}
              <div className="space-y-2">
                <Label
                  htmlFor="pc-nationalid"
                  className="text-sm font-medium text-white/80 flex items-center gap-1.5"
                >
                  کد ملی
                  <span className="text-red-400 text-xs">*</span>
                </Label>
                <Input
                  id="pc-nationalid"
                  type="text"
                  inputMode="numeric"
                  placeholder="۱۰ رقم کد ملی خود را وارد کنید"
                  value={formData.nationalId}
                  onChange={handleNationalIdChange}
                  maxLength={10}
                  dir="ltr"
                  className={`
                    bg-white/5 border-white/15 text-white placeholder:text-white/25
                    focus:border-amber-500/60 focus:ring-amber-500/20
                    h-11 text-center text-lg tracking-[0.3em] font-mono
                    ${errors.nationalId ? 'border-red-500/70 focus:border-red-500' : ''}
                  `}
                  autoFocus
                />
                {errors.nationalId && (
                  <p className="text-xs text-red-400 mt-1">{errors.nationalId}</p>
                )}
                <p className="text-[11px] text-white/25 mt-1">
                  {formData.nationalId.length} / ۱۰ رقم
                </p>
              </div>
            </div>
          )}

          {/* ---- STEP 3: Success ---- */}
          {currentStep === 3 && (
            <div className="relative flex flex-col items-center justify-center py-4">
              <ConfettiParticles />

              {/* Bronze Badge */}
              <div className="relative mb-6">
                <div className="pc-badge-pulse w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-yellow-600 to-amber-800 flex items-center justify-center shadow-2xl shadow-amber-600/30">
                  <span className="pc-float text-5xl">🥉</span>
                </div>
                {/* Glow rings */}
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
              </div>

              {/* Congratulations text */}
              <h3 className="text-xl font-bold text-white mb-2">
                سطح برنزی فعال شد!
              </h3>
              <p className="text-sm text-white/50 text-center leading-relaxed max-w-[280px] mb-6">
                تبریک! شما به سطح برنزی رسیدید. اکنون می‌توانید از امکانات زرین گلد
                استفاده کنید.
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-2">
                <Badge
                  variant="outline"
                  className="border-amber-600/30 text-amber-400 bg-amber-900/15 px-3 py-1.5"
                >
                  ⭐ سطح: برنزی
                </Badge>
                <Badge
                  variant="outline"
                  className="border-emerald-600/30 text-emerald-400 bg-emerald-900/15 px-3 py-1.5"
                >
                  ✅ احراز هویت
                </Badge>
              </div>
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="mt-4 p-3 rounded-xl bg-red-900/20 border border-red-700/30">
              <p className="text-xs text-red-400 text-center">{apiError}</p>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          {currentStep < 3 ? (
            <div className="space-y-3">
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className={`
                  w-full h-12 rounded-xl font-bold text-base
                  bg-gradient-to-l from-amber-600 to-yellow-600
                  hover:from-amber-500 hover:to-yellow-500
                  text-white shadow-lg shadow-amber-900/30
                  transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="text-white" />
                    در حال ذخیره…
                  </span>
                ) : currentStep === 1 ? (
                  'ادامه مرحله بعد'
                ) : (
                  'ذخیره و تکمیل پروفایل'
                )}
              </Button>

              {/* Back button */}
              {currentStep === 2 && (
                <Button
                  variant="ghost"
                  onClick={() => goToStep(1)}
                  className="w-full text-white/40 hover:text-white/70 hover:bg-white/5 h-10"
                >
                  → مرحله قبلی
                </Button>
              )}

              {/* Skip link (step 1 only) */}
              {currentStep === 1 && onSkip && (
                <button
                  onClick={handleSkip}
                  className="w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors py-2"
                >
                  رد شدن و تکمیل بعداً
                </button>
              )}
            </div>
          ) : (
            <Button
              onClick={handleFinalAction}
              className={`
                w-full h-12 rounded-xl font-bold text-base
                bg-gradient-to-l from-amber-600 via-yellow-500 to-amber-600
                hover:from-amber-500 hover:via-yellow-400 hover:to-amber-500
                text-white shadow-lg shadow-amber-900/30
                transition-all duration-200
                pc-fade-slide-up
              `}
            >
              ورود به زرین گلد
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
