'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SmartCaptchaProps {
  /** Called when captcha is successfully solved, receives a generated token */
  onVerified: (token: string) => void;
  /** Called when bot-like behavior is detected */
  onFail?: (reason: string) => void;
  /** 'full' = both layers, 'math' = only math challenge, 'honeypot' = only hidden trap */
  mode?: 'math' | 'honeypot' | 'full';
  /** Controls math question complexity */
  difficulty?: 'easy' | 'medium' | 'hard';
  className?: string;
}

type CaptchaStatus = 'idle' | 'checking' | 'verified' | 'error';

interface MathQuestion {
  /** Persian text for the question, e.g. "حاصل ۷ + ۴ چند است؟" */
  text: string;
  /** Numeric correct answer */
  answer: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Convert a latin digit string to Persian (Eastern Arabic) numerals */
function toPersianDigits(num: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((ch) => {
      const n = parseInt(ch, 10);
      return isNaN(n) ? ch : persianDigits[n];
    })
    .join('');
}

/** Map difficulty to number ranges */
function getRange(difficulty: 'easy' | 'medium' | 'hard'): [number, number] {
  switch (difficulty) {
    case 'easy':
      return [1, 10];
    case 'medium':
      return [2, 20];
    case 'hard':
      return [5, 30];
  }
}

/** Generate a random math question */
function generateQuestion(difficulty: 'easy' | 'medium' | 'hard'): MathQuestion {
  const [min, max] = getRange(difficulty);
  const ops: Array<{ symbol: string; label: string; fn: (a: number, b: number) => number }> = [
    { symbol: '+', label: 'جمع', fn: (a, b) => a + b },
    { symbol: '-', label: 'تفریق', fn: (a, b) => a - b },
  ];

  if (difficulty !== 'easy') {
    ops.push({ symbol: '×', label: 'ضرب', fn: (a, b) => a * b });
  }

  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * (max - min + 1)) + min;
  let b = Math.floor(Math.random() * (max - min + 1)) + min;

  // For subtraction, ensure non-negative result
  if (op.symbol === '-' && a < b) {
    [a, b] = [b, a];
  }

  const answer = op.fn(a, b);
  const text = `حاصل ${toPersianDigits(a)} ${op.symbol} ${toPersianDigits(b)} چند است؟`;

  return { text, answer };
}

/** Generate a simple verification token: base64(`${timestamp}:${randomHex}`) */
function generateToken(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0'),
  ).join('');
  const payload = `${timestamp}:${randomBytes}`;
  return btoa(payload);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Server-side token validation helper                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Validate a captcha token on the server.
 * Checks that the token is a valid base64 string and that the embedded
 * timestamp is within the allowed age window (default 10 minutes).
 *
 * Returns `true` if the token looks legitimate, `false` otherwise.
 */
export function validateCaptchaToken(
  token: string,
  maxAgeMs: number = 10 * 60 * 1000,
): boolean {
  try {
    const decoded = atob(token);
    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1) return false;

    const tsStr = decoded.slice(0, colonIndex);
    const randomPart = decoded.slice(colonIndex + 1);

    // Verify timestamp is a valid base-36 number
    const ts = parseInt(tsStr, 36);
    if (isNaN(ts)) return false;

    // Verify random part is non-empty hex
    if (!randomPart || randomPart.length < 16) return false;
    if (!/^[0-9a-f]+$/.test(randomPart)) return false;

    // Verify token is not expired
    const age = Date.now() - ts;
    if (age < 0 || age > maxAgeMs) return false;

    return true;
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SmartCaptcha({
  onVerified,
  onFail,
  mode = 'full',
  difficulty = 'medium',
  className,
}: SmartCaptchaProps) {
  /* ── State ── */
  const [question, setQuestion] = useState<MathQuestion>(() => generateQuestion(difficulty));
  const [userAnswer, setUserAnswer] = useState('');
  const [status, setStatus] = useState<CaptchaStatus>('idle');
  const [honeypotValue, setHoneypotValue] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ── Refs ── */
  const mountTimeRef = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Honeypot field name — change occasionally to fool smart bots ── */
  const honeypotNameRef = useRef(
    ['website_url', 'company_name', 'fax_number', 'middle_name', 'job_title'][
      Math.floor(Math.random() * 5)
    ],
  );

  /* ── Interaction tracking (mouse + touch) ── */
  useEffect(() => {
    const handleMouseMove = () => setHasInteracted(true);
    const handleTouchMove = () => setHasInteracted(true);
    const handleMouseDown = () => setHasInteracted(true);
    const handleTouchStart = () => setHasInteracted(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  /* ── Refresh question ── */
  const refreshQuestion = useCallback(() => {
    setIsRefreshing(true);
    setUserAnswer('');
    setStatus('idle');

    // Brief spin animation for UX
    setTimeout(() => {
      setQuestion(generateQuestion(difficulty));
      setIsRefreshing(false);
      mountTimeRef.current = Date.now();
      inputRef.current?.focus();
    }, 400);
  }, [difficulty]);

  /* ── Timing check ── */
  const getElapsedMs = useCallback(() => Date.now() - mountTimeRef.current, []);

  /* ── Submit answer ── */
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      // Honeypot check — bot detected
      if (honeypotValue.trim() !== '') {
        setStatus('error');
        onFail?.('honeypot_filled');
        return;
      }

      const parsedAnswer = parseInt(userAnswer.trim(), 10);
      if (isNaN(parsedAnswer)) {
        setStatus('error');
        setShakeKey((k) => k + 1);
        onFail?.('invalid_input');
        return;
      }

      // Timing analysis — too fast is suspicious
      const elapsedMs = getElapsedMs();
      if (elapsedMs < 2000) {
        onFail?.(`suspicious_timing:${elapsedMs}ms`);
      }

      // Interaction analysis — no mouse/touch is suspicious
      if (!hasInteracted) {
        onFail?.('no_interaction_detected');
      }

      // Brief "checking" state for realistic UX
      setStatus('checking');

      setTimeout(() => {
        if (parsedAnswer === question.answer) {
          setStatus('verified');
          const token = generateToken();
          onVerified(token);
        } else {
          setStatus('error');
          setShakeKey((k) => k + 1);
          onFail?.('wrong_answer');
        }
      }, 600);
    },
    [userAnswer, honeypotValue, question.answer, hasInteracted, getElapsedMs, onVerified, onFail],
  );

  /* ── Handle Enter key ── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  /* ── Handle input change ── */
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const val = e.target.value.replace(/[^0-9]/g, '');
    setUserAnswer(val);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  /* ── Determine if math challenge should render ── */
  const showMath = mode === 'math' || mode === 'full';
  const showHoneypot = mode === 'honeypot' || mode === 'full';

  /* ── Status text ── */
  const statusConfig: Record<CaptchaStatus, { text: string; icon: React.ReactNode; color: string }> = {
    idle: {
      text: 'لطفاً پاسخ سؤال بالا را وارد کنید',
      icon: <ShieldCheck className="size-4 text-gold" />,
      color: 'text-muted-foreground',
    },
    checking: {
      text: 'در حال بررسی...',
      icon: <Loader2 className="size-4 text-gold animate-spin" />,
      color: 'text-gold',
    },
    verified: {
      text: 'تایید شد ✓',
      icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      color: 'text-emerald-500',
    },
    error: {
      text: 'پاسخ اشتباه، دوباره تلاش کنید',
      icon: <XCircle className="size-4 text-red-500" />,
      color: 'text-red-500',
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className={cn('relative', className)}>
      {/* ═══════ Honeypot — Invisible anti-bot trap ═══════ */}
      {showHoneypot && (
        <div
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none"
          style={{ position: 'absolute', top: '-9999px', left: '-9999px', tabIndex: -1 }}
        >
          <label htmlFor="hp-field">اگر انسان هستید این فیلد را خالی بگذارید</label>
          <input
            id="hp-field"
            type="text"
            name={honeypotNameRef.current}
            value={honeypotValue}
            onChange={(e) => setHoneypotValue(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            autoFocus={false}
          />
        </div>
      )}

      {/* ═══════ Math Challenge ═══════ */}
      {showMath && (
        <div
          className={cn(
            'rounded-xl border p-4 transition-all duration-300',
            'bg-card',
            status === 'idle' && 'border-gold/30 glow-pulse-border',
            status === 'checking' && 'border-gold/50 gold-glow',
            status === 'verified' && 'border-emerald-500/50 bg-emerald-500/5',
            status === 'error' && 'border-red-500/30',
          )}
        >
          {/* Header row: icon + question + refresh */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className={cn(
                'flex items-center justify-center rounded-lg size-10 shrink-0 mt-0.5 transition-all duration-300',
                status === 'verified'
                  ? 'bg-emerald-500/15 animate-[bounce-in_0.5s_ease]'
                  : status === 'error'
                    ? 'bg-red-500/10'
                    : 'bg-gold/10',
              )}
            >
              <ShieldCheck
                className={cn(
                  'size-5 transition-colors duration-300',
                  status === 'verified'
                    ? 'text-emerald-500'
                    : status === 'error'
                      ? 'text-red-500'
                      : 'text-gold',
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {question.text}
              </p>
            </div>

            {/* Refresh button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-8 shrink-0 rounded-lg transition-all duration-300',
                'hover:bg-gold/10 text-muted-foreground hover:text-gold',
                isRefreshing && 'animate-spin',
                status === 'verified' && 'pointer-events-none opacity-40',
              )}
              onClick={refreshQuestion}
              disabled={status === 'checking' || isRefreshing}
              aria-label="سؤال جدید"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>

          {/* Answer input + submit */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div
              key={`shake-${shakeKey}`}
              className={cn(
                'flex-1 transition-all duration-300',
                status === 'error' && 'animate-[captcha-shake_0.5s_ease]',
              )}
            >
              <Input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                dir="ltr"
                textAlign="center"
                placeholder="پاسخ"
                value={userAnswer}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={status === 'checking' || status === 'verified'}
                className={cn(
                  'h-11 text-center text-lg font-semibold tracking-wider tabular-nums',
                  'transition-all duration-300 outline-none',
                  'focus-visible:border-gold focus-visible:ring-gold/30 focus-visible:ring-[3px]',
                  status === 'verified' &&
                    'border-emerald-500/50 bg-emerald-500/5 text-emerald-600',
                  status === 'error' &&
                    'border-red-500/50 bg-red-500/5 text-red-600',
                )}
                aria-label="پاسخ سؤال امنیتی"
              />
            </div>

            <Button
              type="submit"
              disabled={
                status === 'checking' ||
                status === 'verified' ||
                userAnswer.trim() === ''
              }
              className={cn(
                'h-11 px-4 rounded-lg transition-all duration-300 shrink-0',
                status === 'verified'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-gold text-gold-dark hover:bg-gold-light',
              )}
            >
              {status === 'checking' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : status === 'verified' ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <span className="text-sm font-medium">بررسی</span>
              )}
            </Button>
          </form>

          {/* Status indicator */}
          <div
            className={cn(
              'flex items-center gap-2 mt-3 transition-all duration-300',
              status === 'checking' && 'animate-[fade-in_0.3s_ease]',
            )}
          >
            {currentStatus.icon}
            <span
              className={cn('text-xs transition-colors duration-300', currentStatus.color)}
            >
              {currentStatus.text}
            </span>
          </div>

          {/* Suspicious timing warning */}
          {status === 'verified' && getElapsedMs() < 2000 && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-600 dark:text-amber-400">
                پاسخ بسیار سریع ثبت شد — لطفاً مطمئن شوید ربات نیستید
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══════ Inline CSS for animations ═══════ */}
      <style jsx global>{`
        @keyframes captcha-shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-4px); }
          30%, 70% { transform: translateX(4px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Exports                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type { SmartCaptchaProps, CaptchaStatus, MathQuestion };
