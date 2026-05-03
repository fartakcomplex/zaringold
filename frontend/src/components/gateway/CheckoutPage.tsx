
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {CreditCard, ShieldCheck, Coins, Wallet, Clock, CheckCircle, XCircle, Loader2, Lock, Zap, ArrowLeftRight, Building2} from 'lucide-react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {cn} from '@/lib/utils';
import {formatNumber, formatToman, formatGrams, toPersianDigits} from '@/lib/helpers';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {Slider} from '@/components/ui/slider';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TypeScript Types                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface CheckoutPageProps {
  token: string;
  merchantName: string;
  merchantLogo?: string;
  amount: number;
  description?: string;
  goldPrice: number;
  callbackUrl?: string;
  onSuccess: (refId: string) => void;
  onError: (message: string) => void;
}

/** Payment method enum */
type PaymentMethod = 'toman' | 'gold' | 'mixed';

/** API response for payment details */
interface PaymentDetailsResponse {
  success: boolean;
  data?: {
    authority: string;
    amount: number;
    description: string;
    merchantName: string;
    merchantLogo?: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    goldPrice: number;
  };
  error?: string;
}

/** API response for wallet info */
interface WalletInfo {
  goldBalance: number;   // gold grams
  tomanBalance: number;  // toman
}

/** API response for payment verification */
interface PaymentVerifyResponse {
  success: boolean;
  data?: {
    refId: string;
    amount: number;
    goldAmount?: number;
    tomanAmount?: number;
    status: string;
  };
  error?: string;
}

/** Checkout internal state machine */
type CheckoutPhase = 'loading' | 'ready' | 'processing' | 'success' | 'error' | 'expired';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PAYMENT_EXPIRY_MINUTES = 15;
const TIMER_TICK_MS = 1000;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: format remaining time in mm:ss Persian digits                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '۰۰:۰۰';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return toPersianDigits(`${mm}:${ss}`);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Merchant header showing logo + business name + description */
function MerchantHeader({
  merchantName,
  merchantLogo,
  description,
}: {
  merchantName: string;
  merchantLogo?: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {/* Merchant logo or placeholder */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
        {merchantLogo ? (
          <img
            src={merchantLogo}
            alt={merchantName}
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <Building2 className="h-6 w-6 text-gold" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="truncate text-base font-bold text-foreground">
          {merchantName}
        </h2>
        {description && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/** Amount display card — shows Toman amount + gold equivalent */
function AmountDisplay({
  amount,
  goldPrice,
}: {
  amount: number;
  goldPrice: number;
}) {
  // Calculate gold equivalent in grams
  const goldEquivalent = goldPrice > 0 ? amount / goldPrice : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-gold/5 p-5">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gold/8 blur-3xl" />

      <div className="relative flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-medium text-muted-foreground">
          مبلغ پرداخت
        </span>
        <span className="gold-gradient-text text-3xl font-extrabold tabular-nums sm:text-4xl">
          {formatNumber(amount)}
        </span>
        <span className="text-sm text-muted-foreground">واحد طلایی</span>

        {/* Gold equivalent */}
        {goldEquivalent > 0 && (
          <div className="mt-1 flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1">
            <Coins className="h-3.5 w-3.5 text-gold" />
            <span className="text-xs font-medium text-gold tabular-nums">
              معادل {formatGrams(goldEquivalent)} طلا
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Payment method selector — radio card group */
function PaymentMethodSelector({
  method,
  onMethodChange,
  disabled,
}: {
  method: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  disabled?: boolean;
}) {
  const options: {
    value: PaymentMethod;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'toman',
      label: 'پرداخت واحد طلاییی',
      sublabel: 'پرداخت مستقیم از کیف پول واحد طلایی',
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      value: 'gold',
      label: 'پرداخت طلایی',
      sublabel: 'پرداخت از موجودی طلای کیف پول',
      icon: <Coins className="h-5 w-5" />,
    },
    {
      value: 'mixed',
      label: 'پرداخت ترکیبی',
      sublabel: 'بخش طلا + بخش واحد طلایی',
      icon: <ArrowLeftRight className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-sm font-semibold text-foreground">روش پرداخت</span>
      <div className="grid gap-2.5">
        {options.map((opt) => {
          const isActive = method === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onMethodChange(opt.value)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3.5 text-right transition-all duration-200',
                'hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isActive
                  ? 'border-gold/40 bg-gold/10 shadow-[0_0_16px_oklch(0.75_0.15_85/0.1)]'
                  : 'border-border bg-card hover:border-gold/20 hover:bg-gold/5',
              )}
            >
              {/* Radio indicator */}
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isActive
                    ? 'border-gold bg-gold'
                    : 'border-muted-foreground/30',
                )}
              >
                {isActive && (
                  <div className="h-2 w-2 rounded-full bg-background" />
                )}
              </div>

              {/* Icon */}
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isActive ? 'bg-gold/15 text-gold' : 'bg-muted text-muted-foreground',
                )}
              >
                {opt.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'block text-sm font-semibold',
                    isActive ? 'text-gold' : 'text-foreground',
                  )}
                >
                  {opt.label}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {opt.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Mixed payment slider — gold % vs toman % */
function MixedPaymentSlider({
  goldPercent,
  onGoldPercentChange,
  amount,
  goldPrice,
  disabled,
}: {
  goldPercent: number;
  onGoldPercentChange: (v: number) => void;
  amount: number;
  goldPrice: number;
  disabled?: boolean;
}) {
  const tomanPercent = 100 - goldPercent;
  const goldAmount = (amount * goldPercent) / 100;
  const tomanAmount = amount - goldAmount;
  const goldGrams = goldPrice > 0 ? goldAmount / goldPrice : 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">نسبت پرداخت ترکیبی</span>
          <Badge
            variant="outline"
            className="border-gold/30 text-gold text-xs"
          >
            <ArrowLeftRight className="mr-1 h-3 w-3" />
            ترکیبی
          </Badge>
        </div>

        {/* Dual labels */}
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className={cn('font-medium', goldPercent > 0 ? 'text-gold' : 'text-muted-foreground')}>
            <Coins className="ml-1 inline h-3 w-3" />
            طلا: {toPersianDigits(String(goldPercent))}٪
          </span>
          <span className={cn('font-medium', tomanPercent > 0 ? 'text-foreground' : 'text-muted-foreground')}>
            واحد طلایی: {toPersianDigits(String(tomanPercent))}٪
          </span>
        </div>

        {/* Slider */}
        <Slider
          value={[goldPercent]}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => onGoldPercentChange(v[0])}
          disabled={disabled}
          className="mb-4 [&_[data-slot=slider-range]]:bg-gradient-to-l [&_[data-slot=slider-range]]:from-gold [&_[data-slot=slider-range]]:to-gold-dark [&_[data-slot=slider-thumb]]:border-gold [&_[data-slot=slider-thumb]]:bg-gold [&_[data-slot=slider-track]]:bg-muted"
        />

        {/* Breakdown */}
        <div className="flex flex-col gap-2 rounded-lg bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Coins className="h-3.5 w-3.5 text-gold" />
              سهم طلا
            </span>
            <span className="text-xs font-semibold text-gold tabular-nums">
              {formatGrams(goldGrams)}
              <span className="mr-1 text-muted-foreground">
                ({formatToman(goldAmount)})
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              سهم واحد طلایی
            </span>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {formatToman(tomanAmount)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** User wallet balance display */
function WalletStatus({ wallet }: { wallet: WalletInfo | null }) {
  if (!wallet) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">موجودی کیف پول</span>
        <div className="flex gap-3">
          <Skeleton className="h-14 flex-1 rounded-xl" />
          <Skeleton className="h-14 flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-foreground">موجودی کیف پول</span>
      <div className="grid grid-cols-2 gap-2.5">
        {/* Gold balance */}
        <div className="flex flex-col items-center gap-1 rounded-xl border border-gold/20 bg-gold/5 p-3 text-center">
          <div className="flex items-center gap-1">
            <Coins className="h-4 w-4 text-gold" />
            <span className="text-xs text-muted-foreground">موجودی طلا</span>
          </div>
          <span className="text-sm font-bold text-gold tabular-nums">
            {formatGrams(wallet.goldBalance)}
          </span>
        </div>
        {/* Toman balance */}
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center">
          <div className="flex items-center gap-1">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">موجودی واحد طلایی</span>
          </div>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {formatToman(wallet.tomanBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Countdown timer — 15 minute expiry */
function CountdownTimer({
  totalSeconds,
  isUrgent,
}: {
  totalSeconds: number;
  isUrgent: boolean;
}) {
  const formatted = formatCountdown(totalSeconds);

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 rounded-full px-4 py-2 transition-colors duration-300',
        isUrgent
          ? 'bg-destructive/10 text-destructive'
          : 'bg-gold/10 text-gold',
      )}
    >
      <Clock
        className={cn('h-4 w-4', isUrgent && 'animate-pulse')}
      />
      <span className="text-sm font-bold tabular-nums tracking-wider">
        {formatted}
      </span>
      <span className="text-xs opacity-70">مانده</span>
    </div>
  );
}

/** Trust badges row */
function TrustBadges() {
  const badges = [
    { icon: <Lock className="h-3.5 w-3.5" />, label: 'رمزنگاری SSL' },
    { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'پرداخت امن' },
    { icon: <Coins className="h-3.5 w-3.5" />, label: 'پشتوانه طلا' },
  ];

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6">
      {badges.map((badge) => (
        <div
          key={badge.label}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          {badge.icon}
          <span className="text-xs font-medium">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Success state — green checkmark animation */
function SuccessState({ refId, callbackUrl }: { refId: string; callbackUrl?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center gap-6 py-8"
    >
      {/* Animated checkmark circle */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 shadow-[0_0_40px_oklch(0.7_0.15_145/0.15)]"
        >
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 180, damping: 12 }}
          >
            <CheckCircle className="h-14 w-14 text-emerald-500" />
          </motion.div>
        </motion.div>
        {/* Pulse ring */}
        <motion.div
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ delay: 0.6, duration: 1.2, repeat: 1 }}
          className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
        />
      </div>

      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">پرداخت موفق!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          تراکنش شما با موفقیت انجام شد
        </p>
      </div>

      {/* Reference ID */}
      <div className="flex flex-col items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-3">
        <span className="text-xs text-muted-foreground">شماره پیگیری</span>
        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {toPersianDigits(refId)}
        </span>
      </div>

      {/* Callback button */}
      {callbackUrl && (
        <Button
          className="btn-gold-shine mt-2 bg-gold text-foreground hover:bg-gold-light font-semibold"
          onClick={() => {
            window.location.href = callbackUrl;
          }}
        >
          <Zap className="ml-2 h-4 w-4" />
          بازگشت به فروشگاه
        </Button>
      )}
    </motion.div>
  );
}

/** Error state with retry */
function ErrorState({
  message,
  onRetry,
  isExpired,
}: {
  message: string;
  onRetry: () => void;
  isExpired: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-5 py-8"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-12 w-12 text-destructive" />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-bold text-foreground">
          {isExpired ? 'زمان پرداخت به پایان رسید' : 'خطا در پرداخت'}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
          {message || 'متأسفانه در پرداخت مشکلی پیش آمده. لطفاً دوباره تلاش کنید.'}
        </p>
      </div>

      {!isExpired && (
        <Button
          variant="outline"
          className="border-gold/30 text-gold hover:bg-gold/10 font-semibold"
          onClick={onRetry}
        >
          تلاش مجدد
        </Button>
      )}
    </motion.div>
  );
}

/** Initial loading skeleton */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Merchant header skeleton */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
      </div>

      {/* Amount skeleton */}
      <Skeleton className="h-36 rounded-2xl" />

      {/* Payment methods skeleton */}
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

      {/* Wallet skeleton */}
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-32 rounded-md" />
        <div className="flex gap-2.5">
          <Skeleton className="h-14 flex-1 rounded-xl" />
          <Skeleton className="h-14 flex-1 rounded-xl" />
        </div>
      </div>

      {/* Button skeleton */}
      <Skeleton className="h-12 rounded-xl" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main CheckoutPage Component                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function CheckoutPage({
  token,
  merchantName,
  merchantLogo,
  amount,
  description,
  goldPrice,
  callbackUrl,
  onSuccess,
  onError,
}: CheckoutPageProps) {
  /* ── State ── */
  const [phase, setPhase] = useState<CheckoutPhase>('loading');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('toman');
  const [goldPercent, setGoldPercent] = useState<number>(50);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    PAYMENT_EXPIRY_MINUTES * 60,
  );
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [refId, setRefId] = useState<string>('');

  /* ── Derived values ── */
  const isUrgent = remainingSeconds <= 120; // last 2 minutes
  const isExpired = remainingSeconds <= 0;
  const goldEquivalent = goldPrice > 0 ? amount / goldPrice : 0;

  // Validate wallet sufficiency
  const canPay = useMemo(() => {
    if (!wallet) return false;
    const goldPayAmount = (amount * goldPercent) / 100;
    const tomanPayAmount = amount - goldPayAmount;
    const goldGramsNeeded = goldPrice > 0 ? goldPayAmount / goldPrice : 0;

    switch (paymentMethod) {
      case 'toman':
        return wallet.tomanBalance >= amount;
      case 'gold':
        return wallet.goldBalance >= goldEquivalent;
      case 'mixed':
        return (
          wallet.goldBalance >= goldGramsNeeded &&
          wallet.tomanBalance >= tomanPayAmount
        );
      default:
        return false;
    }
  }, [wallet, paymentMethod, goldPercent, amount, goldPrice, goldEquivalent]);

  // Error message for insufficient balance
  const balanceError = useMemo(() => {
    if (!wallet || canPay) return null;
    const goldPayAmount = (amount * goldPercent) / 100;
    const tomanPayAmount = amount - goldPayAmount;
    const goldGramsNeeded = goldPrice > 0 ? goldPayAmount / goldPrice : 0;

    switch (paymentMethod) {
      case 'toman':
        return 'موجودی واحد طلایی کافی نیست';
      case 'gold':
        return 'موجودی طلای کیف پول کافی نیست';
      case 'mixed': {
        if (wallet.goldBalance < goldGramsNeeded && wallet.tomanBalance < tomanPayAmount) {
          return 'موجودی طلا و واحد طلایی کافی نیست';
        }
        if (wallet.goldBalance < goldGramsNeeded) {
          return 'موجودی طلای کیف پول کافی نیست';
        }
        return 'موجودی واحد طلایی کافی نیست';
      }
      default:
        return null;
    }
  }, [wallet, canPay, paymentMethod, goldPercent, amount, goldPrice]);

  /* ── Timer effect ── */
  useEffect(() => {
    if (phase !== 'ready' && phase !== 'loading') return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('expired');
          return 0;
        }
        return prev - 1;
      });
    }, TIMER_TICK_MS);
    return () => clearInterval(interval);
  }, [phase]);

  /* ── Fetch payment details + wallet on mount ── */
  const fetchPaymentData = useCallback(async () => {
    try {
      // Fetch payment details
      const detailsRes = await fetch(
        `/api/v1/payment/details?authority=${encodeURIComponent(token)}`,
      );
      const detailsJson: PaymentDetailsResponse = await detailsRes.json();

      if (!detailsRes.ok || !detailsJson.success) {
        const msg = detailsJson.error || 'اطلاعات پرداخت یافت نشد';
        setErrorMsg(msg);
        setPhase('error');
        onError(msg);
        return;
      }

      // Fetch wallet info
      const walletRes = await fetch('/api/v1/wallet/info');
      if (walletRes.ok) {
        const walletJson = await walletRes.json();
        if (walletJson.success && walletJson.data) {
          setWallet(walletJson.data as WalletInfo);
        }
      }

      // Set expiry time from API if available
      if (detailsJson.data?.expiresAt) {
        const expiresAt = new Date(detailsJson.data.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setRemainingSeconds(remaining);
      }

      setPhase('ready');
    } catch (err) {
      const msg = 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
      setErrorMsg(msg);
      setPhase('error');
      onError(msg);
    }
  }, [token, onError]);

  /* Fetch on mount — timeout(0) avoids synchronous setState in effect body */
  useEffect(() => {
    const id = setTimeout(() => {
      fetchPaymentData();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchPaymentData]);

  /* ── Handle pay button click ── */
  const handlePay = useCallback(async () => {
    if (!canPay) return;

    setPhase('processing');
    setErrorMsg('');

    try {
      const goldPayAmount = (amount * goldPercent) / 100;
      const tomanPayAmount = amount - goldPayAmount;
      const goldGramsNeeded = goldPrice > 0 ? goldPayAmount / goldPrice : 0;

      let response: PaymentVerifyResponse;

      // Different API endpoints based on payment method
      if (paymentMethod === 'gold' || paymentMethod === 'mixed') {
        // Gold wallet payment
        response = await (
          await fetch('/api/v1/wallet/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              authority: token,
              paymentMethod,
              goldGrams: goldGramsNeeded,
              tomanAmount: tomanPayAmount,
            }),
          })
        ).json();
      } else {
        // Standard toman payment
        response = await (
          await fetch('/api/v1/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              authority: token,
              amount,
            }),
          })
        ).json();
      }

      if (response.success && response.data) {
        setRefId(response.data.refId);
        setPhase('success');
        onSuccess(response.data.refId);
      } else {
        const msg = response.error || 'تراکنش رد شد. لطفاً دوباره تلاش کنید.';
        setErrorMsg(msg);
        setPhase('error');
        onError(msg);
      }
    } catch (err) {
      const msg = 'خطا در پردازش پرداخت. لطفاً دوباره تلاش کنید.';
      setErrorMsg(msg);
      setPhase('error');
      onError(msg);
    }
  }, [canPay, amount, goldPercent, goldPrice, paymentMethod, token, onSuccess, onError]);

  /* ── Handle retry ── */
  const handleRetry = useCallback(() => {
    setErrorMsg('');
    setPhase('loading');
    fetchPaymentData();
  }, [fetchPaymentData]);

  /* ── Render ── */

  // Initial loading skeleton
  if (phase === 'loading') {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Success state
  if (phase === 'success') {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="border-gold/20 bg-card shadow-lg">
            <CardContent className="p-6">
              <SuccessState refId={refId} callbackUrl={callbackUrl} />
            </CardContent>
          </Card>
          <div className="mt-5">
            <TrustBadges />
          </div>
        </div>
      </div>
    );
  }

  // Error / expired state
  if (phase === 'error' || phase === 'expired') {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="border-gold/20 bg-card shadow-lg">
            <CardContent className="p-6">
              <ErrorState
                message={errorMsg}
                onRetry={handleRetry}
                isExpired={phase === 'expired'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main checkout UI (phase === 'ready')
  return (
    <div className="dark flex min-h-screen items-start justify-center bg-background sm:items-center">
      <div className="w-full max-w-md">
        {/* ── Main checkout card ── */}
        <Card className="overflow-hidden border-gold/20 bg-card shadow-xl">
          {/* Top gold accent bar */}
          <div className="h-1 bg-gradient-to-l from-gold-dark via-gold to-gold-light" />

          <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
            {/* Timer + Zarrin Gold branding */}
            <div className="flex items-center justify-between">
              <span className="gold-gradient-text text-sm font-extrabold tracking-wide">
                زرین گلد
              </span>
              <CountdownTimer totalSeconds={remainingSeconds} isUrgent={isUrgent} />
            </div>

            <Separator className="bg-gold/10" />

            {/* Merchant header */}
            <MerchantHeader
              merchantName={merchantName}
              merchantLogo={merchantLogo}
              description={description}
            />

            {/* Amount display */}
            <AmountDisplay amount={amount} goldPrice={goldPrice} />

            {/* Payment method selector */}
            <PaymentMethodSelector
              method={paymentMethod}
              onMethodChange={setPaymentMethod}
              disabled={phase === 'processing'}
            />

            {/* Mixed payment slider (only visible when method is mixed) */}
            <AnimatePresence>
              {paymentMethod === 'mixed' && (
                <MixedPaymentSlider
                  goldPercent={goldPercent}
                  onGoldPercentChange={setGoldPercent}
                  amount={amount}
                  goldPrice={goldPrice}
                  disabled={phase === 'processing'}
                />
              )}
            </AnimatePresence>

            {/* Wallet status */}
            <WalletStatus wallet={wallet} />

            {/* Insufficient balance warning */}
            {balanceError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  {balanceError}
                </span>
              </div>
            )}

            {/* Pay button */}
            <Button
              size="lg"
              disabled={!canPay || phase === 'processing'}
              onClick={handlePay}
              className={cn(
                'btn-gold-shine relative h-13 w-full rounded-xl text-base font-bold transition-all duration-200',
                'bg-gradient-to-l from-gold-dark via-gold to-gold-light',
                'text-foreground shadow-[0_4px_20px_oklch(0.75_0.15_85/0.3)]',
                'hover:shadow-[0_6px_28px_oklch(0.75_0.15_85/0.4)] hover:brightness-110',
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_4px_20px_oklch(0.75_0.15_85/0.3)]',
              )}
            >
              {phase === 'processing' ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                <>
                  <ShieldCheck className="ml-2 h-5 w-5" />
                  {paymentMethod === 'toman'
                    ? `پرداخت ${formatToman(amount)}`
                    : paymentMethod === 'gold'
                      ? `پرداخت ${formatGrams(goldEquivalent)} طلا`
                      : 'پرداخت ترکیبی'}
                </>
              )}
            </Button>

            {/* Security note */}
            <p className="text-center text-xs text-muted-foreground">
              <Lock className="mr-1 inline h-3 w-3" />
              پرداخت شما توسط درگاه زرین گلد با امنیت بالا انجام می‌شود
            </p>
          </CardContent>
        </Card>

        {/* Trust badges below the card */}
        <div className="mt-5">
          <TrustBadges />
        </div>

        {/* Powered by footer */}
        <div className="mt-4 text-center">
          <span className="text-xs text-muted-foreground/60">
            Powered by{' '}
          </span>
          <span className="text-xs font-semibold gold-gradient-text">
            Zarrin Gold
          </span>
        </div>
      </div>
    </div>
  );
}
