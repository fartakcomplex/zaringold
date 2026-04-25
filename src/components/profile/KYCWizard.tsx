'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Shield, CheckCircle, XCircle, Upload, Camera, Video,
  RotateCcw, Trash2, Info, Lock, Eye, Sparkles,
  IdCard, UserCheck, ShieldCheck, ScanFace, X,
  ChevronLeft, ChevronRight, AlertCircle, CircleDot,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface KYCData {
  status: string;
  adminNote: string;
  idCardImage: string;
  idCardBackImage: string;
  selfieImage: string;
  bankCardImage: string;
  verificationVideo: string;
}

interface KYCWizardProps {
  kyc: KYCData;
  userId: string;
  onSubmit: (form: Record<string, string>) => Promise<boolean>;
  onRefresh: () => void;
}

/* ================================================================== */
/*  Step Definitions (3 steps only)                                    */
/* ================================================================== */

const STEPS = [
  {
    id: 'idCardImage',
    title: 'روی کارت ملی',
    desc: 'عکس واضح از روی کارت ملی خود را بگیرید',
    icon: IdCard,
    color: 'from-amber-500 to-yellow-600',
    shortLabel: 'روی کارت',
    facingMode: 'environment' as const,
    tips: [
      'کارت ملی باید واضح و بدون انعکاس نور باشد',
      'تمام ۴ گوشه کارت باید در تصویر باشد',
      'فقط کارت ملی هوشمند معتبر است',
      'دوربین را دقیقاً روبروی کارت نگه دارید',
    ],
  },
  {
    id: 'idCardBackImage',
    title: 'پشت کارت ملی',
    desc: 'عکس واضح از پشت کارت ملی را بگیرید',
    icon: ShieldCheck,
    color: 'from-orange-500 to-amber-600',
    shortLabel: 'پشت کارت',
    facingMode: 'environment' as const,
    tips: [
      'اطلاعات پشت کارت باید خوانا باشد',
      'بارکد یا QRCode پشت کارت قابل رویت باشد',
      'از فلاش استفاده نکنید تا تصویر تار نشود',
    ],
  },
  {
    id: 'verificationVideo',
    title: 'ویدئوی سلفی',
    desc: 'ویدئوی کوتاه با دستورالعمل‌های گام‌به‌گام',
    icon: UserCheck,
    color: 'from-yellow-500 to-amber-600',
    shortLabel: 'سلفی',
    facingMode: 'user' as const,
    tips: [
      'نور محیط کافی باشد — ترجیحاً نور روز',
      'عینک یا ماسک نداشته باشید',
      'صدا و تصویر واضح باشد',
      'حداقل ۱۰ ثانیه ضبط کنید',
    ],
  },
];

const VIDEO_GUIDE_STEPS = [
  { time: [0, 5], text: 'نام و نام خانوادگی خود را بگویید', icon: '👋' },
  { time: [5, 12], text: 'کارت ملی را جلوی دوربین بگیرید — روی کارت', icon: '🪪' },
  { time: [12, 19], text: 'کارت را بچرخانید — پشت کارت', icon: '🔄' },
  { time: [19, 25], text: 'بگویید: این ویدئو برای احراز هویت در میلی گلد است', icon: '🗣️' },
  { time: [25, 999], text: 'عالی! دکمه قرمز را بزنید', icon: '✅' },
];

const MIN_RECORD_TIME = 10;
const MAX_RECORD_TIME = 60;

/* ================================================================== */
/*  SVG Placeholder Illustrations                                      */
/* ================================================================== */

function IDCardFrontPlaceholder() {
  return (
    <svg viewBox="0 0 280 180" className="w-full h-full max-w-[220px] mx-auto" fill="none">
      <rect x="10" y="10" width="260" height="160" rx="12" fill="#1a1a2e" stroke="rgba(212,175,55,0.3)" strokeWidth="1.5" />
      <rect x="14" y="14" width="252" height="152" rx="10" stroke="rgba(212,175,55,0.1)" strokeWidth="0.5" />
      <circle cx="45" cy="45" r="16" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.25)" strokeWidth="1" />
      <circle cx="45" cy="45" r="8" fill="rgba(212,175,55,0.12)" />
      <circle cx="45" cy="45" r="2.5" fill="rgba(212,175,55,0.35)" />
      <text x="70" y="38" fill="rgba(212,175,55,0.45)" fontSize="9" fontWeight="bold" fontFamily="sans-serif">جمهوری اسلامی ایران</text>
      <text x="70" y="52" fill="rgba(212,175,55,0.35)" fontSize="7.5" fontFamily="sans-serif">کارت ملی هوشمند</text>
      <rect x="30" y="72" width="50" height="62" rx="4" fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.2)" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="55" cy="90" r="8" fill="rgba(212,175,55,0.1)" />
      <ellipse cx="55" cy="115" rx="12" ry="8" fill="rgba(212,175,55,0.08)" />
      <rect x="92" y="72" width="160" height="8" rx="2" fill="rgba(212,175,55,0.12)" />
      <rect x="92" y="88" width="120" height="6" rx="2" fill="rgba(212,175,55,0.08)" />
      <rect x="92" y="102" width="140" height="6" rx="2" fill="rgba(212,175,55,0.08)" />
      <rect x="92" y="116" width="100" height="6" rx="2" fill="rgba(212,175,55,0.08)" />
      <rect x="30" y="142" width="220" height="16" rx="4" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.15)" strokeWidth="0.5" />
      <text x="140" y="153" textAnchor="middle" fill="rgba(212,175,55,0.3)" fontSize="7" fontFamily="monospace">000-0000000-00</text>
      <rect x="220" y="28" width="28" height="22" rx="3" fill="rgba(212,175,55,0.15)" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8" />
      <line x1="234" y1="28" x2="234" y2="50" stroke="rgba(212,175,55,0.2)" strokeWidth="0.5" />
      <line x1="220" y1="39" x2="248" y2="39" stroke="rgba(212,175,55,0.2)" strokeWidth="0.5" />
    </svg>
  );
}

function IDCardBackPlaceholder() {
  return (
    <svg viewBox="0 0 280 180" className="w-full h-full max-w-[220px] mx-auto" fill="none">
      <rect x="10" y="10" width="260" height="160" rx="12" fill="#1a1a2e" stroke="rgba(212,175,55,0.3)" strokeWidth="1.5" />
      <rect x="14" y="14" width="252" height="152" rx="10" stroke="rgba(212,175,55,0.1)" strokeWidth="0.5" />
      <rect x="30" y="30" width="220" height="40" rx="4" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.12)" strokeWidth="0.5" />
      {[35, 40, 44, 49, 52, 57, 60, 64, 67, 72, 76, 80, 84, 88, 93, 96, 100, 105, 108, 112, 116, 120, 124, 128].map((x, i) => (
        <rect key={i} x={x} y={38} width={i % 3 === 0 ? 1.5 : 1} height={24} rx="0.3" fill={`rgba(212,175,55,${0.2 + (i % 4) * 0.05})`} />
      ))}
      <rect x="90" y="90" width="70" height="70" rx="4" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.2)" strokeWidth="0.8" />
      <rect x="96" y="96" width="14" height="14" rx="1" fill="rgba(212,175,55,0.25)" />
      <rect x="140" y="96" width="14" height="14" rx="1" fill="rgba(212,175,55,0.25)" />
      <rect x="96" y="140" width="14" height="14" rx="1" fill="rgba(212,175,55,0.25)" />
      <rect x="114" y="114" width="6" height="6" fill="rgba(212,175,55,0.2)" />
      <rect x="124" y="108" width="4" height="4" fill="rgba(212,175,55,0.15)" />
      <rect x="132" y="124" width="4" height="4" fill="rgba(212,175,55,0.15)" />
      <rect x="30" y="90" width="48" height="6" rx="2" fill="rgba(212,175,55,0.12)" />
      <rect x="30" y="102" width="40" height="6" rx="2" fill="rgba(212,175,55,0.08)" />
      <rect x="30" y="114" width="45" height="6" rx="2" fill="rgba(212,175,55,0.08)" />
      <rect x="30" y="126" width="35" height="6" rx="2" fill="rgba(212,175,55,0.08)" />
      <rect x="30" y="138" width="42" height="6" rx="2" fill="rgba(212,175,55,0.06)" />
      <rect x="170" y="90" width="80" height="6" rx="2" fill="rgba(212,175,55,0.1)" />
      <rect x="170" y="102" width="65" height="6" rx="2" fill="rgba(212,175,55,0.07)" />
      <rect x="170" y="114" width="75" height="6" rx="2" fill="rgba(212,175,55,0.07)" />
    </svg>
  );
}

function SelfieVideoPlaceholder() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full max-w-[160px] mx-auto" fill="none">
      <ellipse cx="100" cy="105" rx="55" ry="68" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.25)" strokeWidth="1.5" />
      <ellipse cx="80" cy="88" rx="8" ry="5" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.2)" strokeWidth="0.8" />
      <ellipse cx="120" cy="88" rx="8" ry="5" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.2)" strokeWidth="0.8" />
      <circle cx="80" cy="88" r="2" fill="rgba(212,175,55,0.3)" />
      <circle cx="120" cy="88" r="2" fill="rgba(212,175,55,0.3)" />
      <path d="M70 78 Q80 74 90 78" stroke="rgba(212,175,55,0.2)" strokeWidth="1" fill="none" />
      <path d="M110 78 Q120 74 130 78" stroke="rgba(212,175,55,0.2)" strokeWidth="1" fill="none" />
      <path d="M100 95 L97 108 Q100 110 103 108 Z" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.15)" strokeWidth="0.8" />
      <path d="M85 118 Q100 128 115 118" stroke="rgba(212,175,55,0.2)" strokeWidth="1.2" fill="none" />
      <rect x="148" y="110" width="40" height="28" rx="3" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.25)" strokeWidth="1" transform="rotate(15, 168, 124)" />
      <text x="160" y="125" fill="rgba(212,175,55,0.25)" fontSize="5" fontWeight="bold" fontFamily="sans-serif" transform="rotate(15, 168, 124)">کارت ملی</text>
      <path d="M45 155 Q70 170 100 170 Q130 170 155 155" stroke="rgba(212,175,55,0.15)" strokeWidth="1.5" fill="rgba(212,175,55,0.03)" />
      {/* Pulsing REC indicator */}
      <circle cx="40" cy="30" r="5" fill="rgba(239,68,68,0.7)">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <text x="50" y="33" fill="rgba(239,68,68,0.5)" fontSize="7" fontWeight="bold" fontFamily="sans-serif">REC</text>
      {/* Scan frame corners */}
      <path d="M40 45 L40 30 L55 30" stroke="rgba(212,175,55,0.4)" strokeWidth="2.5" fill="none" />
      <path d="M160 45 L160 30 L145 30" stroke="rgba(212,175,55,0.4)" strokeWidth="2.5" fill="none" />
      <path d="M40 160 L40 175 L55 175" stroke="rgba(212,175,55,0.4)" strokeWidth="2.5" fill="none" />
      <path d="M160 160 L160 175 L145 175" stroke="rgba(212,175,55,0.4)" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

/* ================================================================== */
/*  Helper: format seconds → MM:SS                                     */
/* ================================================================== */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ================================================================== */
/*  Camera Overlay: Card scan frame for ID card steps                  */
/* ================================================================== */

function CardScanOverlay({ text }: { text: string }) {
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanY(prev => (prev >= 100 ? 0 : prev + 1));
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      {/* Dark vignette */}
      <div className="absolute inset-0 bg-black/40" />
      {/* Card-shaped cutout */}
      <div className="relative w-[85%] max-w-[320px] aspect-[1.586/1]">
        {/* Transparent center */}
        <div className="absolute inset-0 bg-black/20 rounded-xl" />
        {/* Golden corner brackets */}
        <div className="absolute top-0 right-0 w-8 h-8">
          <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-l from-[#D4AF37] to-[#D4AF37]/30 rounded-full" />
          <div className="absolute top-0 right-0 h-full w-[3px] bg-gradient-to-b from-[#D4AF37] to-[#D4AF37]/30 rounded-full" />
        </div>
        <div className="absolute top-0 left-0 w-8 h-8">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/30 rounded-full" />
          <div className="absolute top-0 left-0 h-full w-[3px] bg-gradient-to-b from-[#D4AF37] to-[#D4AF37]/30 rounded-full" />
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8">
          <div className="absolute bottom-0 right-0 w-full h-[3px] bg-gradient-to-l from-[#D4AF37] to-[#D4AF37]/30 rounded-full" />
          <div className="absolute bottom-0 right-0 h-full w-[3px] bg-gradient-to-t from-[#D4AF37] to-[#D4AF37]/30 rounded-full" />
        </div>
        <div className="absolute bottom-0 left-0 w-8 h-8">
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/30 rounded-full" />
          <div className="absolute bottom-0 left-0 h-full w-[3px] bg-gradient-to-t from-[#D4AF37] to-[#D4AF37]/30 rounded-full" />
        </div>
        {/* Scanning line */}
        <div
          className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_12px_rgba(212,175,55,0.6)]"
          style={{ top: `${scanY}%` }}
        />
        {/* Instruction text */}
        <div className="absolute -bottom-10 left-0 right-0 text-center">
          <span className="text-sm font-medium text-white/90 bg-black/40 rounded-full px-4 py-1.5 backdrop-blur-sm">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Camera Overlay: Face scan frame for selfie video step              */
/* ================================================================== */

function FaceScanOverlay({
  recording,
  recordingTime,
  guideStepIndex,
}: {
  recording: boolean;
  recordingTime: number;
  guideStepIndex: number;
}) {
  const [scanY, setScanY] = useState(0);
  const pulseRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanY(prev => (prev >= 100 ? 0 : prev + 1.2));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    pulseRef.current = true;
    const pulseInterval = setInterval(() => {
      pulseRef.current = !pulseRef.current;
    }, 1500);
    return () => clearInterval(pulseInterval);
  }, []);

  const activeGuide = VIDEO_GUIDE_STEPS[guideStepIndex] || VIDEO_GUIDE_STEPS[VIDEO_GUIDE_STEPS.length - 1];
  const progressPercent = Math.min(((recordingTime - activeGuide.time[0]) / (activeGuide.time[1] - activeGuide.time[0])) * 100, 100);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* Vignette */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Oval face frame */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[65%] max-w-[260px] aspect-[3/4]">
          {/* Oval border */}
          <div
            className="absolute inset-0 rounded-[50%] border-2 transition-all duration-500"
            style={{
              borderColor: recording ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.3)',
              boxShadow: recording ? '0 0 30px rgba(212,175,55,0.2), inset 0 0 30px rgba(212,175,55,0.05)' : 'none',
            }}
          />
          {/* Pulsing outer oval */}
          {recording && (
            <div className="absolute inset-[-6px] rounded-[50%] border border-[#D4AF37]/20 animate-pulse" />
          )}
          {/* Golden corners */}
          <div className="absolute top-[10%] right-[8%] w-7 h-7">
            <div className="absolute top-0 right-0 w-full h-[2.5px] bg-[#D4AF37] rounded-full" />
            <div className="absolute top-0 right-0 h-full w-[2.5px] bg-[#D4AF37] rounded-full" />
          </div>
          <div className="absolute top-[10%] left-[8%] w-7 h-7">
            <div className="absolute top-0 left-0 w-full h-[2.5px] bg-[#D4AF37] rounded-full" />
            <div className="absolute top-0 left-0 h-full w-[2.5px] bg-[#D4AF37] rounded-full" />
          </div>
          <div className="absolute bottom-[10%] right-[8%] w-7 h-7">
            <div className="absolute bottom-0 right-0 w-full h-[2.5px] bg-[#D4AF37] rounded-full" />
            <div className="absolute bottom-0 right-0 h-full w-[2.5px] bg-[#D4AF37] rounded-full" />
          </div>
          <div className="absolute bottom-[10%] left-[8%] w-7 h-7">
            <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#D4AF37] rounded-full" />
            <div className="absolute bottom-0 left-0 h-full w-[2.5px] bg-[#D4AF37] rounded-full" />
          </div>
          {/* Scan line */}
          {recording && (
            <div
              className="absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_16px_rgba(212,175,55,0.7)]"
              style={{ top: `${scanY}%` }}
            />
          )}
        </div>
      </div>

      {/* Recording indicator */}
      {recording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-xs font-bold font-mono">{formatTime(recordingTime)}</span>
          <span className="text-red-400 text-[10px] font-bold">REC</span>
        </div>
      )}

      {/* Guide panel */}
      {recording && (
        <div className="absolute bottom-6 left-4 right-4 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            {/* Step circles */}
            <div className="flex items-center justify-center gap-2 mb-3">
              {VIDEO_GUIDE_STEPS.map((gs, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-300',
                      i < guideStepIndex
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : i === guideStepIndex
                          ? 'bg-[#D4AF37] text-black font-bold ring-2 ring-[#D4AF37]/50'
                          : 'bg-white/10 text-white/30'
                    )}
                  >
                    {i < guideStepIndex ? '✓' : gs.icon}
                  </div>
                  {i < VIDEO_GUIDE_STEPS.length - 1 && (
                    <div className={cn(
                      'w-4 h-0.5 rounded-full transition-all duration-300',
                      i < guideStepIndex ? 'bg-[#D4AF37]/40' : 'bg-white/10'
                    )} />
                  )}
                </div>
              ))}
            </div>
            {/* Active guide text */}
            <div className="text-center">
              <span className="text-lg mb-1 block">{activeGuide.icon}</span>
              <p className="text-white/90 text-sm font-medium">{activeGuide.text}</p>
            </div>
            {/* Progress ring for current step */}
            {guideStepIndex < VIDEO_GUIDE_STEPS.length - 1 && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-[#D4AF37] to-[#D4AF37]/60 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Not recording hint */}
      {!recording && (
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <span className="text-sm text-white/80 bg-black/40 rounded-full px-4 py-2 backdrop-blur-sm inline-block">
            روی دکمه قرمز بزنید تا ضبط شروع شود
          </span>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Flash Effect                                                       */
/* ================================================================== */

function FlashEffect({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-30 bg-white pointer-events-none" style={{ animation: 'flash 0.4s ease-out forwards' }} />
  );
}

/* ================================================================== */
/*  CSS keyframes (injected once)                                      */
/* ================================================================== */

function injectStyles() {
  if (typeof document === 'undefined') return;
  const id = 'kyc-wizard-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    @keyframes flash {
      0% { opacity: 0.9; }
      100% { opacity: 0; }
    }
    @keyframes pulse-rec {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.7; }
    }
    @keyframes scan-line {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }
  `;
  document.head.appendChild(style);
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function KYCWizard({ kyc, userId, onSubmit, onRefresh }: KYCWizardProps) {
  /* Inject styles */
  useEffect(() => { injectStyles(); }, []);

  /* ── State ── */
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({
    idCardImage: '',
    idCardBackImage: '',
    verificationVideo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [flash, setFlash] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewStepId, setPreviewStepId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  /* ── Refs ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function cleanupStream() {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
  }

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      cleanupStream();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (videoRecorderRef.current && recordingRef.current) videoRecorderRef.current.stop();
    };
  }, []);

  /* ── Computed ── */
  const step = STEPS[currentStep];
  const fileValue = formData[step.id] || (kyc[step.id as keyof KYCData] as string) || '';
  const StepIcon = step.icon;
  const isVideoStep = step.id === 'verificationVideo';
  const stepHasFile = (stepId: string) => !!formData[stepId] || !!(kyc[stepId as keyof KYCData]);
  const completedSteps = STEPS.filter(s => stepHasFile(s.id)).length;
  const progressPercent = (completedSteps / STEPS.length) * 100;

  /* Active video guide step */
  const activeGuideStep = VIDEO_GUIDE_STEPS.findIndex(
    gs => recordingTime >= gs.time[0] && recordingTime < gs.time[1]
  );

  /* ── File handling ── */
  const handleFileSelect = useCallback((stepId: string, file: File) => {
    const isVideo = file.type.startsWith('video/');
    if (!isVideo && file.size > 15 * 1024 * 1024) {
      alert('حجم تصویر نباید بیشتر از ۱۵ مگابایت باشد');
      return;
    }
    if (isVideo && file.size > 50 * 1024 * 1024) {
      alert('حجم ویدئو نباید بیشتر از ۵۰ مگابایت باشد');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, [stepId]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }, []);

  /* ── Camera handling ── */
  const stopRecording = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (videoRecorderRef.current && recordingRef.current) {
      recordingRef.current = false;
      videoRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const stopCamera = useCallback(() => {
    cleanupStream();
    setCameraOpen(false);
    setRecording(false);
  }, []);

  const startCamera = useCallback(async (stepIdx?: number) => {
    const targetStep = stepIdx !== undefined ? STEPS[stepIdx] : step;
    setCameraError('');
    try {
      cleanupStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: targetStep.facingMode,
          width: { ideal: targetStep.facingMode === 'environment' ? 1920 : 1280 },
          height: { ideal: targetStep.facingMode === 'environment' ? 1080 : 720 },
        },
        audio: targetStep.id === 'verificationVideo',
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }

      if (targetStep.id === 'verificationVideo') {
        /* Start recording immediately for video step */
        recordedChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : 'video/webm';
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        videoRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const reader = new FileReader();
          reader.onload = (ev) => {
            setFormData(prev => ({ ...prev, verificationVideo: ev.target?.result as string }));
          };
          reader.readAsDataURL(blob);
          cleanupStream();
          setCameraOpen(false);
        };
        mediaRecorder.start(1000);
        recordingRef.current = true;
        setRecording(true);
        setRecordingTime(0);
        recordTimerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            const next = prev + 1;
            if (next >= MAX_RECORD_TIME) {
              stopRecording();
            }
            return next;
          });
        }, 1000);
      }

      setCameraOpen(true);
      setScanProgress(0);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('دسترسی به دوربین مجاز نیست. لطفاً از گالری استفاده کنید.');
    }
  }, [step]);

  const capturePhoto = useCallback(() => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      /* Flash effect */
      setFlash(true);
      setTimeout(() => setFlash(false), 500);

      /* Show preview dialog */
      setPreviewSrc(dataUrl);
      setPreviewStepId(step.id);
      setPreviewOpen(true);
    }
  }, [step.id]);

  const confirmCapture = useCallback(() => {
    if (previewSrc && previewStepId) {
      setFormData(prev => ({ ...prev, [previewStepId]: previewSrc }));
    }
    setPreviewOpen(false);
    setPreviewSrc('');
    cleanupStream();
    setCameraOpen(false);
  }, [previewSrc, previewStepId]);

  const retakeCapture = useCallback(() => {
    setPreviewOpen(false);
    setPreviewSrc('');
  }, []);

  /* ── Navigation ── */
  const goToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  };

  const goToNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const goToPrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  /* ── Remove file ── */
  const removeFile = (stepId: string) => {
    setFormData(prev => ({ ...prev, [stepId]: '' }));
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setSubmitting(true);
    const success = await onSubmit(formData);
    if (success) onRefresh();
    setSubmitting(false);
  };

  /* ── Placeholder ── */
  const getPlaceholder = () => {
    switch (step.id) {
      case 'idCardImage': return <IDCardFrontPlaceholder />;
      case 'idCardBackImage': return <IDCardBackPlaceholder />;
      case 'verificationVideo': return <SelfieVideoPlaceholder />;
      default: return null;
    }
  };

  /* ════════════════════════════════════════════════════════════════ */
  /*  SUMMARY VIEW                                                     */
  /* ════════════════════════════════════════════════════════════════ */
  if (showSummary) {
    return (
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl p-3.5 bg-gradient-to-l from-emerald-500/[0.06] to-emerald-500/[0.02] border border-emerald-500/15"
        >
          <div className="size-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">تمام مدارک آماده ارسال</p>
            <p className="text-xs text-muted-foreground mt-0.5">لطفاً صحت مدارک را بررسی و تأیید کنید</p>
          </div>
        </motion.div>

        <Card className="border-[#D4AF37]/15 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-l from-[#D4AF37] via-[#F5D778] to-[#D4AF37]" />
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                <ScanFace className="size-4 text-[#D4AF37]" />
              </div>
              <h3 className="font-bold text-base">بررسی نهایی مدارک</h3>
            </div>

            <div className="space-y-2.5">
              {STEPS.map((s, i) => {
                const hasFile = stepHasFile(s.id);
                const SIcon = s.icon;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl p-3 transition-colors',
                      hasFile
                        ? 'bg-emerald-500/5 border border-emerald-500/10'
                        : 'bg-red-500/5 border border-red-500/10'
                    )}
                  >
                    <div className={cn(
                      'size-8 rounded-full flex items-center justify-center shrink-0',
                      hasFile ? 'bg-emerald-500/15' : 'bg-red-500/15'
                    )}>
                      {hasFile ? (
                        <CheckCircle className="size-4 text-emerald-500" />
                      ) : (
                        <XCircle className="size-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', hasFile ? 'text-emerald-400' : 'text-red-400')}>
                        {s.title}
                      </p>
                    </div>
                    <SIcon className={cn('size-4 shrink-0', hasFile ? 'text-emerald-500/40' : 'text-red-400/40')} />
                  </motion.div>
                );
              })}
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[#D4AF37]/20 hover:bg-[#D4AF37]/5"
                onClick={() => setShowSummary(false)}
              >
                <ChevronRight className="size-4 ml-1.5" />
                بازگشت و ویرایش
              </Button>
              <Button
                className="flex-1 bg-gradient-to-l from-[#D4AF37] to-[#B8941E] text-black font-bold hover:from-[#E5C44D] hover:to-[#D4AF37] shadow-lg shadow-[#D4AF37]/20"
                onClick={handleSubmit}
                disabled={completedSteps < STEPS.length || submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    در حال ارسال...
                  </span>
                ) : (
                  <>
                    <Lock className="size-4 ml-1.5" />
                    ارسال و تکمیل احراز
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════ */
  /*  CAMERA FULL-SCREEN OVERLAY                                        */
  /* ════════════════════════════════════════════════════════════════ */
  if (cameraOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col" dir="rtl">
        {/* Camera feed */}
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={cameraVideoRef}
            autoPlay
            playsInline
            muted={!recording}
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              step.facingMode === 'user' && 'scale-x-[-1]'
            )}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Flash effect */}
          <FlashEffect active={flash} />

          {/* Overlay based on step type */}
          {!isVideoStep && <CardScanOverlay text="کارت ملی را در قاب قرار دهید" />}
          {isVideoStep && (
            <FaceScanOverlay
              recording={recording}
              recordingTime={recordingTime}
              guideStepIndex={activeGuideStep}
            />
          )}

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => {
                if (recording) {
                  stopRecording();
                }
                stopCamera();
              }}
              className="size-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors"
            >
              <X className="size-5" />
            </button>
            <span className="text-white/80 text-sm font-medium bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
              {step.title}
            </span>
            <div className="size-10" />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="bg-black/90 backdrop-blur-md p-6 safe-area-bottom">
          {!isVideoStep ? (
            /* Photo capture controls */
            <div className="flex items-center justify-center gap-8">
              {/* Gallery (small text) */}
              <button
                onClick={() => {
                  cleanupStream();
                  setCameraOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors"
              >
                <Upload className="size-5" />
                <span className="text-[10px]">گالری</span>
              </button>

              {/* Capture button (big, gold gradient) */}
              <button
                onClick={capturePhoto}
                className="relative group"
              >
                <div className="size-[72px] rounded-full bg-gradient-to-br from-[#D4AF37] via-[#F5D778] to-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] group-hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] transition-shadow duration-300">
                  <div className="size-[62px] rounded-full border-[3px] border-black/20 flex items-center justify-center">
                    <Camera className="size-7 text-black/70" />
                  </div>
                </div>
              </button>

              {/* Flip camera */}
              <button
                onClick={() => {
                  cleanupStream();
                  /* Toggle facing mode */
                  const newFacing = step.facingMode === 'environment' ? 'user' : 'environment';
                  navigator.mediaDevices.getUserMedia({
                    video: { facingMode: newFacing, width: { ideal: 1920 }, height: { ideal: 1080 } },
                  }).then(stream => {
                    cameraStreamRef.current = stream;
                    if (cameraVideoRef.current) {
                      cameraVideoRef.current.srcObject = stream;
                      cameraVideoRef.current.play();
                    }
                  }).catch(() => {});
                }}
                className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors"
              >
                <RotateCcw className="size-5" />
                <span className="text-[10px]">تغییر</span>
              </button>
            </div>
          ) : (
            /* Video recording controls */
            <div className="flex items-center justify-center gap-8">
              {/* Gallery upload (small) */}
              {!recording && (
                <button
                  onClick={() => {
                    cleanupStream();
                    setCameraOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors"
                >
                  <Upload className="size-5" />
                  <span className="text-[10px]">آپلود</span>
                </button>
              )}

              {recording && (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-white/50 text-[10px]">
                    {recordingTime < MIN_RECORD_TIME ? `حداقل ${MIN_RECORD_TIME - recordingTime} ثانیه` : 'آماده توقف'}
                  </span>
                </div>
              )}

              {/* Record / Stop button */}
              <button
                onClick={() => {
                  if (recording) {
                    if (recordingTime >= MIN_RECORD_TIME) {
                      stopRecording();
                    }
                  }
                }}
                className="relative"
              >
                {recording ? (
                  <div className="size-[72px] rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:bg-red-500 transition-colors">
                    <div className={cn(
                      'bg-white rounded-md transition-all',
                      recordingTime >= MIN_RECORD_TIME ? 'w-7 h-7' : 'w-5 h-5 opacity-50'
                    )} />
                  </div>
                ) : (
                  <div className="size-[72px] rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                    <div className="size-[26px] rounded-full bg-white" style={{ animation: 'pulse-rec 1.5s ease-in-out infinite' }} />
                  </div>
                )}
              </button>

              {/* Timer / Placeholder */}
              {recording ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-white font-mono text-lg font-bold">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              ) : (
                <div className="w-[52px]" />
              )}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={isVideoStep ? 'video/*' : 'image/*'}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(step.id, file);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════ */
  /*  MAIN STEP VIEW                                                   */
  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">
      {/* ── Security Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-xl p-3.5 bg-gradient-to-l from-[#D4AF37]/[0.06] to-[#D4AF37]/[0.02] border border-[#D4AF37]/15"
      >
        <div className="size-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
          <Lock className="size-4.5 text-[#D4AF37]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#D4AF37]">اطلاعات شما با بالاترین سطح امنیت محافظت می‌شود</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">تمام مدارک رمزنگاری و به‌صورت امن ذخیره می‌شوند</p>
        </div>
        <ShieldCheck className="size-5 text-[#D4AF37]/40 shrink-0" />
      </motion.div>

      {/* ── Connected Step Progress Tracker ── */}
      <Card className="border-[#D4AF37]/10 overflow-hidden">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">پیشرفت احراز هویت</span>
              <span className="font-bold text-[#D4AF37]">{completedSteps} از {STEPS.length} مرحله</span>
            </div>
            <Progress
              value={progressPercent}
              className="h-2 [&>div]:bg-gradient-to-l [&>div]:from-[#D4AF37] [&>div]:to-[#B8941E]"
            />

            {/* Connected step circles */}
            <div className="flex items-center pt-1">
              {STEPS.map((s, i) => {
                const isCompleted = stepHasFile(s.id);
                const isCurrent = i === currentStep;
                const SIcon = s.icon;
                return (
                  <React.Fragment key={s.id}>
                    <button
                      onClick={() => goToStep(i)}
                      className="flex flex-col items-center gap-1.5 group relative z-10"
                    >
                      <div className={cn(
                        'size-11 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0',
                        isCompleted
                          ? 'bg-[#D4AF37] text-black shadow-[0_0_16px_rgba(212,175,55,0.35)]'
                          : isCurrent
                            ? 'bg-[#D4AF37]/15 text-[#D4AF37] ring-2 ring-[#D4AF37]/40 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                            : 'bg-muted/50 text-muted-foreground/50 group-hover:bg-muted group-hover:text-muted-foreground'
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="size-5" />
                        ) : (
                          <SIcon className="size-5" />
                        )}
                      </div>
                      <span className={cn(
                        'text-[10px] font-medium text-center leading-tight max-w-[52px] truncate',
                        isCompleted ? 'text-[#D4AF37]' : isCurrent ? 'text-[#D4AF37]/80' : 'text-muted-foreground/50'
                      )}>
                        {s.shortLabel}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 mx-1 -mt-4 mb-2 rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-muted/40 rounded-full" />
                        <motion.div
                          className="absolute inset-y-0 start-0 rounded-full"
                          initial={false}
                          animate={{
                            width: isCompleted ? '100%' : '0%',
                            background: isCompleted ? '#D4AF37' : 'transparent',
                          }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Step Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Card className="border-[#D4AF37]/10 overflow-hidden">
            <div className={cn('h-1.5 bg-gradient-to-l', step.color)} />
            <CardContent className="p-5 space-y-5">
              {/* Step header */}
              <div className="flex items-start gap-3">
                <div className={cn('size-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br text-black shadow-lg', step.color)}>
                  <StepIcon className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 bg-muted/80 rounded-full px-2.5 py-1 border border-border/50">
                  مرحله {currentStep + 1}
                </span>
              </div>

              {/* Tips */}
              <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/10 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Info className="size-3.5" />
                  <span className="text-xs font-semibold">راهنما</span>
                </div>
                {step.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

              {/* Camera area or preview */}
              {!fileValue ? (
                <div className="space-y-4">
                  {/* Placeholder illustration area */}
                  <div className="relative rounded-2xl border-2 border-dashed border-[#D4AF37]/15 bg-gradient-to-b from-[#D4AF37]/[0.03] to-transparent overflow-hidden">
                    <div className="p-6 flex flex-col items-center gap-4">
                      {/* Placeholder */}
                      <div className="h-32 sm:h-36 flex items-center justify-center">
                        {getPlaceholder()}
                      </div>

                      {/* Gold shimmer effect on hover area */}
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-[#D4AF37]/[0.02] via-transparent to-[#D4AF37]/[0.01] pointer-events-none" />
                    </div>
                  </div>

                  {/* Big camera button (PRIMARY) */}
                  <button
                    onClick={() => startCamera()}
                    className="w-full py-4 rounded-2xl bg-gradient-to-l from-[#D4AF37] via-[#F5D778] to-[#D4AF37] text-black font-bold text-base flex items-center justify-center gap-3 shadow-[0_4px_24px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_32px_rgba(212,175,55,0.5)] active:scale-[0.98] transition-all duration-200"
                  >
                    {isVideoStep ? (
                      <>
                        <Video className="size-6" />
                        شروع ضبط ویدئو
                      </>
                    ) : (
                      <>
                        <Camera className="size-6" />
                        عکس با دوربین
                      </>
                    )}
                  </button>

                  {/* Gallery upload (SECONDARY - text link only) */}
                  <div className="text-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-muted-foreground hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1.5 py-2"
                    >
                      <Upload className="size-3.5" />
                      یا انتخاب از گالری
                    </button>
                  </div>

                  {/* Camera error message */}
                  {cameraError && (
                    <div className="flex items-center gap-2 rounded-xl p-3 bg-red-500/5 border border-red-500/10 text-red-400 text-xs">
                      <AlertCircle className="size-4 shrink-0" />
                      {cameraError}
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={isVideoStep ? 'video/*' : 'image/*'}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(step.id, file);
                      e.target.value = '';
                    }}
                  />
                </div>
              ) : (
                /* ── File Preview ── */
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/20 bg-black/5">
                    {fileValue.startsWith('data:video') ? (
                      <video
                        src={fileValue}
                        controls
                        className="w-full max-h-64 object-contain bg-black/5"
                        playsInline
                      />
                    ) : (
                      <img
                        src={fileValue}
                        alt={step.title}
                        className="w-full max-h-64 object-contain bg-black/5 cursor-pointer"
                        onClick={() => {
                          setPreviewSrc(fileValue);
                          setPreviewStepId(step.id);
                          setPreviewOpen(true);
                        }}
                      />
                    )}

                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-emerald-500/90 text-white text-[10px] shadow-lg shadow-emerald-500/20">
                        <CheckCircle className="size-3 ml-1" />
                        آپلود شد
                      </Badge>
                    </div>

                    {/* Gold corner decorations */}
                    <div className="absolute top-0 left-0 w-10 h-10 pointer-events-none">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#D4AF37]/40 to-transparent" />
                      <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-[#D4AF37]/40 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none">
                      <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-[#D4AF37]/40 to-transparent" />
                      <div className="absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-[#D4AF37]/40 to-transparent" />
                    </div>
                  </div>

                  {/* Action buttons for captured file */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-[#D4AF37]/15 hover:bg-[#D4AF37]/5 text-xs"
                      onClick={() => removeFile(step.id)}
                    >
                      <Trash2 className="size-3.5 ml-1.5 text-red-400" />
                      حذف و دوباره
                    </Button>
                    {!isVideoStep && (
                      <Button
                        variant="outline"
                        className="flex-1 border-[#D4AF37]/15 hover:bg-[#D4AF37]/5 text-xs"
                        onClick={() => startCamera()}
                      >
                        <RotateCcw className="size-3.5 ml-1.5" />
                        عکس جدید
                      </Button>
                    )}
                    {isVideoStep && (
                      <Button
                        variant="outline"
                        className="flex-1 border-[#D4AF37]/15 hover:bg-[#D4AF37]/5 text-xs"
                        onClick={() => startCamera()}
                      >
                        <RotateCcw className="size-3.5 ml-1.5" />
                        ضبط مجدد
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Navigation buttons ── */}
              <div className="flex gap-3 pt-1">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    className="border-[#D4AF37]/15 hover:bg-[#D4AF37]/5"
                    onClick={goToPrev}
                  >
                    <ChevronRight className="size-4 ml-1" />
                    مرحله قبل
                  </Button>
                )}
                <Button
                  className={cn(
                    'flex-1 bg-gradient-to-l from-[#D4AF37] to-[#B8941E] text-black font-bold',
                    'hover:from-[#E5C44D] hover:to-[#D4AF37] shadow-lg shadow-[#D4AF37]/15',
                    !stepHasFile(step.id) && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={goToNext}
                  disabled={!stepHasFile(step.id)}
                >
                  {currentStep < STEPS.length - 1 ? (
                    <>
                      مرحله بعد
                      <ChevronLeft className="size-4 mr-1" />
                    </>
                  ) : (
                    <>
                      <Lock className="size-4 ml-1.5" />
                      بررسی و ارسال
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════ */}
      {/*  Preview Dialog                                               */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Dialog open={previewOpen} onOpenChange={(open) => {
        if (!open) {
          setPreviewOpen(false);
          setPreviewSrc('');
        }
      }}>
        <DialogContent className="max-w-lg border-[#D4AF37]/15 p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm font-bold">پیش‌نمایش تصویر</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              آیا از این تصویر راضی هستید؟
            </DialogDescription>
          </DialogHeader>

          {/* Image preview */}
          <div className="p-4">
            <div className="rounded-xl overflow-hidden border border-border/50 bg-black/5">
              <img
                src={previewSrc}
                alt="Preview"
                className="w-full max-h-[50vh] object-contain"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 p-4 pt-0">
            <Button
              variant="outline"
              className="flex-1 border-[#D4AF37]/15 hover:bg-[#D4AF37]/5"
              onClick={retakeCapture}
            >
              <RotateCcw className="size-4 ml-1.5" />
              عکس مجدد
            </Button>
            <Button
              className="flex-1 bg-gradient-to-l from-[#D4AF37] to-[#B8941E] text-black font-bold shadow-lg shadow-[#D4AF37]/15"
              onClick={confirmCapture}
            >
              <CheckCircle className="size-4 ml-1.5" />
              تأیید
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
