'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Shield,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Coins,
  Loader2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  CircleDot,
  Building2,
  LogIn,
} from 'lucide-react'
import { motion, AnimatePresence } from '@/lib/framer-compat'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TypeScript Types                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

type CheckoutPhase = 'loading' | 'ready' | 'processing' | 'success' | 'error' | 'expired'

/** Shape returned by GET /api/checkout/[authority] */
interface CheckoutData {
  authority: string
  amountToman: number
  amountGold: number | null
  goldGrams: number | null
  feeToman: number | null
  feeGold: number | null
  paymentMethod: string | null
  description: string | null
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  callbackUrl: string | null
  goldPriceAtPay: number | null
  status: string
  createdAt: string
  expiresAt: string
  merchant: {
    businessName: string
    logo: string | null
    brandingColor: string
    website: string | null
    isVerified: boolean
  }
  goldEquivalent?: {
    goldGrams: number
    goldPrice: number
    goldPriceGrams: number
  }
  remainingSeconds: number
  isExpired: boolean
  isPaid: boolean
}

interface WalletInfo {
  goldBalance: number
  tomanBalance: number
}

interface PayResponse {
  success: boolean
  message: string
  data?: {
    status?: string
    paymentURL?: string
    paymentMethod?: string
    goldGrams?: number
    amountToman?: number
    feeGold?: number
    feeToman?: number
    remainingGold?: number
    remainingBalance?: number
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: Formatting Utilities                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
function toPD(n: number | string): string {
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)])
}

function formatGrams(g: number): string {
  if (g >= 1) return `${toPD(g.toFixed(2))} گرم`
  return `${toPD((g * 1000).toFixed(1))} میلی‌گرم`
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${toPD(String(m).padStart(2, '0'))}:${toPD(String(s).padStart(2, '0'))}`
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Merchant header with logo, name, description, and verified badge */
function MerchantHeader({
  merchantName,
  merchantLogo,
  brandingColor,
  isVerified,
  description,
  callbackUrl,
}: {
  merchantName: string
  merchantLogo?: string | null
  brandingColor?: string
  isVerified?: boolean
  description?: string | null
  callbackUrl?: string | null
}) {
  return (
    <div className="flex items-start gap-3">
      {callbackUrl && (
        <a
          href={callbackUrl}
          className="p-2 rounded-xl hover:bg-muted/50 transition-colors -mr-1 mt-0.5"
          aria-label="بازگشت"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </a>
      )}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Merchant logo or initial */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-bold text-lg"
          style={{ backgroundColor: brandingColor || '#D4AF37' }}
        >
          {merchantLogo ? (
            <img
              src={merchantLogo}
              alt={merchantName}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <Building2 className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-base font-bold text-foreground">
              {merchantName}
            </h2>
            {isVerified && (
              <Shield className="h-4 w-4 shrink-0 text-emerald-500" />
            )}
          </div>
          {description && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Amount display card — shows gold grams only */
function AmountDisplay({
  goldGrams,
  description,
}: {
  goldGrams: number
  description?: string | null
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-gold/5">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gold/8 blur-3xl" />

      {/* Description strip */}
      {description && (
        <div className="relative border-b border-gold/10 px-5 py-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleDot className="h-3.5 w-3.5 text-gold/50" />
            {description}
          </p>
        </div>
      )}

      <div className="relative flex flex-col items-center gap-2 p-6 text-center">
        <span className="text-xs font-medium text-muted-foreground">
          مبلغ پرداخت
        </span>
        <span className="gold-gradient-text text-3xl font-extrabold tabular-nums sm:text-4xl">
          {formatGrams(goldGrams)}
        </span>
        <span className="text-sm text-muted-foreground">طلا</span>

        {/* Gold icon badge */}
        <div className="mt-1 flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5">
          <Coins className="h-3.5 w-3.5 text-gold" />
          <span className="text-xs font-medium text-gold tabular-nums">
            پرداخت مستقیم از کیف پول طلایی
          </span>
        </div>
      </div>
    </div>
  )
}

/** Wallet status — gold balance only */
function WalletStatus({
  wallet,
  loading,
  authRequired,
}: {
  wallet: WalletInfo | null
  loading?: boolean
  authRequired?: boolean
}) {
  if (authRequired) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">موجودی کیف پول طلای شما</span>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <LogIn className="h-6 w-6 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            برای پرداخت با کیف پول طلایی وارد شوید
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-gold/30 text-gold hover:bg-gold/10"
            onClick={() => {
              window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
            }}
          >
            <LogIn className="ml-1.5 h-4 w-4" />
            ورود / ثبت‌نام
          </Button>
        </div>
      </div>
    )
  }

  if (loading || !wallet) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">موجودی کیف پول طلای شما</span>
        <Skeleton className="h-16 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-foreground">موجودی کیف پول طلای شما</span>
      <div className="flex flex-col items-center gap-1 rounded-xl border border-gold/20 bg-gold/5 p-4 text-center">
        <div className="flex items-center gap-1">
          <Coins className="h-4 w-4 text-gold" />
          <span className="text-xs text-muted-foreground">موجودی طلای کیف پول</span>
        </div>
        <span className="text-lg font-bold text-gold tabular-nums">
          {formatGrams(wallet.goldBalance)}
        </span>
      </div>
    </div>
  )
}

/** Countdown timer with urgency styling */
function CountdownTimer({
  totalSeconds,
}: {
  totalSeconds: number
}) {
  const isUrgent = totalSeconds <= 120
  const isWarning = totalSeconds > 120 && totalSeconds <= 300

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-colors duration-300',
        'glass-card',
        isUrgent && 'border-red-500/30 bg-red-500/5',
        isWarning && 'border-amber-500/20 bg-amber-500/5',
      )}
    >
      <Clock
        className={cn(
          'h-4 w-4',
          isUrgent ? 'text-red-500 animate-pulse' : isWarning ? 'text-amber-500' : 'text-gold',
        )}
      />
      <span
        className={cn(
          'text-lg font-bold tabular-nums tracking-wider',
          isUrgent ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gold',
        )}
      >
        {formatTimer(totalSeconds)}
      </span>
      <span className="text-xs text-muted-foreground mr-1">تا انقضا</span>
    </div>
  )
}

/** Trust badges row */
function TrustBadges() {
  const badges = [
    { icon: <Lock className="h-3.5 w-3.5 text-emerald-500" />, label: 'رمزنگاری SSL', sub: 'اتصال امن' },
    { icon: <Shield className="h-3.5 w-3.5 text-gold" />, label: 'پرداخت امن', sub: 'تضمین وجه' },
    { icon: <Coins className="h-3.5 w-3.5 text-gold" />, label: 'پشتوانه طلا', sub: 'بازگشت وجه' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {badges.map((badge) => (
        <div
          key={badge.label}
          className="glass-card rounded-xl p-3 text-center space-y-1.5 hover-lift-sm"
        >
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
            {badge.icon}
            <span className="text-[11px] font-medium text-foreground">{badge.label}</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{badge.sub}</p>
        </div>
      ))}
    </div>
  )
}

/** Zarrin Gold branding header */
function BrandingHeader() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-md">
        <span className="text-[10px] font-extrabold text-background">Z</span>
      </div>
      <span className="gold-gradient-text text-base font-extrabold tracking-wide">
        زرین گلد
      </span>
      <Badge variant="outline" className="border-gold/20 text-gold text-[10px] px-1.5 py-0">
        درگاه پرداخت
      </Badge>
    </div>
  )
}

/** Powered-by footer — gold only */
function PoweredByFooter() {
  return (
    <div className="text-center py-4 space-y-1.5">
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
          <span className="text-[7px] font-bold text-background">Z</span>
        </div>
        <span className="text-xs font-semibold gold-gradient-text">Zarrin Gold</span>
      </div>
      <p className="text-[10px] text-muted-foreground/60">
        درگاه پرداخت طلایی — پرداخت امن با طلا
      </p>
    </div>
  )
}

/** Success state — gold only */
function SuccessState({
  checkoutData,
  refId,
  callbackUrl,
}: {
  checkoutData: CheckoutData
  refId: string
  callbackUrl?: string | null
}) {
  const goldGrams = checkoutData.goldEquivalent?.goldGrams || checkoutData.goldGrams || 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      {/* Animated checkmark circle */}
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 bounce-in">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-bold gold-gradient-text">پرداخت موفق!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          پرداخت شما با موفقیت انجام شد
        </p>
      </div>

      <Separator className="bg-gold/10" />

      {/* Payment summary */}
      <div className="w-full space-y-3 text-right">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">فروشگاه</span>
          <span className="font-medium">{checkoutData.merchant.businessName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">مبلغ پرداخت</span>
          <span className="font-bold text-lg text-gold">{formatGrams(goldGrams)} طلا</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">شماره پیگیری</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono border-gold/30 text-gold">
              {toPD(refId.slice(0, 16))}
            </Badge>
            <button
              onClick={() => navigator.clipboard?.writeText(refId)}
              className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="کپی شناسه"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Callback button */}
      {callbackUrl && (
        <Button
          className="btn-gold-shine mt-2 w-full bg-gold text-background hover:bg-gold-light font-semibold rounded-xl h-12 text-base"
          onClick={() => {
            window.location.href = callbackUrl
          }}
        >
          <ExternalLink className="ml-2 h-4 w-4" />
          بازگشت به فروشگاه
        </Button>
      )}
    </motion.div>
  )
}

/** Error / Expired state */
function ErrorState({
  message,
  onRetry,
  isExpired,
  callbackUrl,
}: {
  message: string
  onRetry: () => void
  isExpired: boolean
  callbackUrl?: string | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
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

      <div className="flex w-full gap-3">
        {!isExpired && (
          <Button
            variant="outline"
            className="flex-1 border-gold/30 text-gold hover:bg-gold/10 font-semibold"
            onClick={onRetry}
          >
            <RefreshCw className="ml-1.5 h-4 w-4" />
            تلاش مجدد
          </Button>
        )}
        {callbackUrl && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              window.location.href = callbackUrl
            }}
          >
            <ExternalLink className="ml-1.5 h-4 w-4" />
            بازگشت
          </Button>
        )}
      </div>
    </motion.div>
  )
}

/** Initial loading skeleton */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Branding skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      {/* Timer skeleton */}
      <Skeleton className="h-11 w-full rounded-xl" />
      {/* Merchant header skeleton */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
      </div>
      {/* Amount skeleton */}
      <Skeleton className="h-44 rounded-2xl" />
      {/* Gold payment info skeleton */}
      <Skeleton className="h-28 rounded-xl" />
      {/* Wallet skeleton */}
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-48 rounded-md" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      {/* Button skeleton */}
      <Skeleton className="h-12 rounded-xl" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Checkout Page Inner (uses useSearchParams)                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CheckoutPageInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const authority = params.authority as string

  /* ── State ── */
  const [phase, setPhase] = useState<CheckoutPhase>('loading')
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(900)
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [walletLoading, setWalletLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [refId, setRefId] = useState<string>('')
  const [paying, setPaying] = useState(false)

  /* ── Derived values ── */
  const isExpired = remainingSeconds <= 0 && phase !== 'loading'
  const goldGrams =
    checkoutData?.goldEquivalent?.goldGrams ||
    checkoutData?.goldGrams ||
    0

  // Validate wallet sufficiency — gold only
  const canPay = useMemo(() => {
    if (!checkoutData) return false
    if (authRequired || !wallet) return false
    return wallet.goldBalance >= goldGrams
  }, [wallet, goldGrams, checkoutData, authRequired])

  // Balance error message — gold only
  const balanceError = useMemo(() => {
    if (!checkoutData || authRequired || !wallet) return null
    if (canPay) return null
    return 'موجودی طلای کیف پول کافی نیست'
  }, [wallet, canPay, checkoutData, authRequired])

  /* ── Timer effect ── */
  useEffect(() => {
    if (phase !== 'ready' && phase !== 'loading') return
    if (remainingSeconds <= 0) return

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setPhase('expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, remainingSeconds])

  /* ── Fetch checkout data on mount ── */
  const fetchCheckoutData = useCallback(async () => {
    if (!authority) return

    try {
      setPhase('loading')
      setErrorMsg('')

      // Fetch checkout details
      const res = await fetch(`/api/checkout/${authority}`)
      const json = await res.json()

      if (!json.success) {
        setErrorMsg(json.message || 'خطا در دریافت اطلاعات پرداخت')
        setPhase('error')
        return
      }

      setCheckoutData(json.data)

      // Check if already paid or expired
      if (json.data.isPaid) {
        setRefId(json.data.authority)
        setPhase('success')
        return
      }

      if (json.data.isExpired) {
        setPhase('expired')
        setErrorMsg('زمان پرداخت به پایان رسیده است')
        return
      }

      // Set timer from API
      if (json.data.remainingSeconds) {
        setRemainingSeconds(json.data.remainingSeconds)
      }

      // Check URL params for status (from callback redirect)
      const status = searchParams.get('status')
      if (status === 'success') {
        setRefId(json.data.authority)
        setPhase('success')
        return
      }
      if (status === 'cancelled') {
        setPhase('error')
        setErrorMsg('پرداخت توسط شما لغو شد')
        return
      }
      if (status === 'error') {
        setPhase('error')
        setErrorMsg('پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.')
        return
      }

      setPhase('ready')

      // Fetch wallet info (non-blocking — may fail for unauthenticated users)
      setWalletLoading(true)
      try {
        const walletRes = await fetch('/api/v1/wallet/info')
        if (walletRes.ok) {
          const walletJson = await walletRes.json()
          if (walletJson.success && walletJson.data) {
            setWallet(walletJson.data as WalletInfo)
            setAuthRequired(false)
          } else {
            setAuthRequired(true)
          }
        } else {
          setAuthRequired(true)
        }
      } catch {
        setAuthRequired(true)
      } finally {
        setWalletLoading(false)
      }
    } catch {
      setErrorMsg('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.')
      setPhase('error')
    }
  }, [authority, searchParams])

  /* Fetch on mount */
  useEffect(() => {
    fetchCheckoutData()
  }, [fetchCheckoutData])

  /* ── Handle payment — gold only ── */
  const handlePay = useCallback(async () => {
    if (!authority || !checkoutData) return

    // Gold payment always requires auth
    if (authRequired) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }

    setPaying(true)
    setPhase('processing')
    setErrorMsg('')

    try {
      const body: Record<string, string> = { paymentMethod: 'gold' }
      body.userId = 'demo-user-1'

      const res = await fetch(`/api/checkout/${authority}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json: PayResponse = await res.json()

      if (!json.success) {
        // Handle 401 — need login
        if (res.status === 401) {
          setAuthRequired(true)
          setPhase('ready')
          setErrorMsg('برای پرداخت با طلا ابتدا وارد حساب کاربری خود شوید')
          setPaying(false)
          return
        }

        setErrorMsg(json.message || 'خطا در پردازش پرداخت')
        setPhase('error')
        setPaying(false)
        return
      }

      // Gold payment: show success
      if (json.data?.status === 'paid') {
        setRefId(json.data.goldGrams
          ? `GP-${authority.slice(0, 8)}-${toPD(json.data.goldGrams.toFixed(3))}`
          : `GP-${authority.slice(0, 8)}`,
        )
        setPhase('success')
      }
    } catch {
      setErrorMsg('خطا در پردازش پرداخت. لطفاً دوباره تلاش کنید.')
      setPhase('error')
    } finally {
      setPaying(false)
    }
  }, [authority, checkoutData, authRequired])

  /* ── Handle retry ── */
  const handleRetry = useCallback(() => {
    setErrorMsg('')
    fetchCheckoutData()
  }, [fetchCheckoutData])

  /* ════════════════════════════════════════════════════════════════════════════ */
  /*  LOADING STATE                                                          */
  /* ════════════════════════════════════════════════════════════════════════════ */

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden border-gold/20 bg-card shadow-xl">
            <div className="h-1 bg-gradient-to-l from-gold-dark via-gold to-gold-light" />
            <LoadingSkeleton />
          </Card>
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════════════════════ */
  /*  SUCCESS STATE                                                          */
  /* ════════════════════════════════════════════════════════════════════════════ */

  if (phase === 'success' && checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-5 fade-in">
          <Card className="overflow-hidden border-gold/20 bg-card shadow-xl">
            <div className="h-1 bg-gradient-to-l from-emerald-500 via-emerald-400 to-emerald-500" />
            <CardContent className="p-6 sm:p-8">
              <SuccessState
                checkoutData={checkoutData}
                refId={refId}
                callbackUrl={checkoutData.callbackUrl}
              />
            </CardContent>
          </Card>
          <TrustBadges />
          <PoweredByFooter />
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════════════════════ */
  /*  ERROR / EXPIRED STATE                                                  */
  /* ════════════════════════════════════════════════════════════════════════════ */

  if (phase === 'error' || phase === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-5 fade-in">
          <Card className="overflow-hidden border-gold/20 bg-card shadow-xl">
            <div className={cn(
              'h-1',
              phase === 'expired'
                ? 'bg-gradient-to-l from-amber-500 via-amber-400 to-amber-500'
                : 'bg-gradient-to-l from-red-500 via-red-400 to-red-500',
            )} />
            <CardContent className="p-6 sm:p-8">
              <ErrorState
                message={errorMsg}
                onRetry={handleRetry}
                isExpired={phase === 'expired'}
                callbackUrl={checkoutData?.callbackUrl}
              />
            </CardContent>
          </Card>
          <TrustBadges />
          <PoweredByFooter />
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════════════════════ */
  /*  PROCESSING STATE                                                       */
  /* ════════════════════════════════════════════════════════════════════════════ */

  if (phase === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden border-gold/20 bg-card shadow-xl">
            <div className="h-1 bg-gradient-to-l from-gold-dark via-gold to-gold-light" />
            <CardContent className="flex flex-col items-center gap-5 p-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
                <Coins className="w-7 h-7 text-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">در حال پردازش...</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  لطفاً منتظر بمانید، تراکنش طلایی در حال انجام است
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!checkoutData) return null

  const brandColor = checkoutData.merchant.brandingColor || '#D4AF37'

  /* ════════════════════════════════════════════════════════════════════════════ */
  /*  MAIN CHECKOUT UI (phase === 'ready') — GOLD ONLY                     */
  /* ════════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* ── Top Gold Bar ── */}
      <div className="h-1 bg-gradient-to-l from-gold-dark via-gold to-gold-light" />

      <div className="mx-auto max-w-md px-4 py-6 space-y-5 fade-in">
        {/* ── Zarrin Gold branding ── */}
        <BrandingHeader />

        {/* ── Main checkout card ── */}
        <Card className="overflow-hidden border-gold/20 bg-card shadow-xl">
          {/* Gold accent bar */}
          <div className="h-1 bg-gradient-to-l from-gold-dark via-gold to-gold-light" />

          <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
            {/* Merchant header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <MerchantHeader
                  merchantName={checkoutData.merchant.businessName}
                  merchantLogo={checkoutData.merchant.logo}
                  brandingColor={brandColor}
                  isVerified={checkoutData.merchant.isVerified}
                  description={checkoutData.description}
                  callbackUrl={checkoutData.callbackUrl}
                />
              </div>
            </div>

            {/* Timer */}
            <CountdownTimer totalSeconds={remainingSeconds} />

            <Separator className="bg-gold/10" />

            {/* Amount display — gold grams only */}
            <AmountDisplay
              goldGrams={goldGrams}
              description={undefined} // Already shown in merchant header
            />

            {/* ── Gold Payment Method (no tabs — always gold) ── */}
            {authRequired ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-center space-y-3">
                <LogIn className="h-8 w-8 text-amber-500 mx-auto" />
                <div>
                  <p className="text-sm font-semibold">ورود به حساب کاربری</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    برای پرداخت طلایی ابتدا وارد حساب کاربری خود شوید
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10"
                  onClick={() => {
                    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
                  }}
                >
                  <LogIn className="ml-1.5 h-4 w-4" />
                  ورود / ثبت‌نام
                </Button>
              </div>
            ) : (
              <>
                {/* Payment info card */}
                <div className="rounded-xl border border-gold/10 bg-gold/5 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Coins className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gold">پرداخت از کیف پول طلایی</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        معادل طلای مبلغ از کیف پول طلایی شما کسر می‌شود. بدون نیاز به درگاه بانکی.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>مبلغ پرداخت</span>
                      <span className="text-gold font-semibold">{formatGrams(goldGrams)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>روش پرداخت</span>
                      <span className="text-foreground">کیف پول طلایی</span>
                    </div>
                  </div>
                </div>

                {/* Balance error */}
                {balanceError && (
                  <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-sm font-medium text-destructive">{balanceError}</span>
                  </div>
                )}

                {/* Pay button */}
                <Button
                  className="btn-gold-shine w-full h-12 text-base font-bold bg-gradient-to-l from-gold-dark via-gold to-gold-light text-background hover:opacity-90 transition-opacity rounded-xl"
                  onClick={handlePay}
                  disabled={paying || !canPay || remainingSeconds <= 0}
                >
                  {paying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Coins className="ml-2 h-5 w-5" />
                      پرداخت {formatGrams(goldGrams)} طلا
                    </>
                  )}
                </Button>
              </>
            )}

            {/* ── Wallet status ── */}
            <WalletStatus
              wallet={wallet}
              loading={walletLoading}
              authRequired={authRequired}
            />

            {/* ── Error message ── */}
            {errorMsg && phase === 'ready' && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                <span className="text-sm font-medium text-destructive">{errorMsg}</span>
              </div>
            )}

            {/* Security note */}
            <p className="text-center text-xs text-muted-foreground">
              <Lock className="mr-1 inline h-3 w-3" />
              پرداخت طلایی شما توسط درگاه زرین گلد با امنیت بالا انجام می‌شود
            </p>
          </CardContent>
        </Card>

        {/* Trust badges below the card */}
        <TrustBadges />

        {/* Powered by footer */}
        <PoweredByFooter />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Checkout Page (with Suspense boundary for useSearchParams)             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function StandaloneCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="overflow-hidden border-gold/20 bg-card shadow-xl">
              <div className="h-1 bg-gradient-to-l from-gold-dark via-gold to-gold-light" />
              <div className="text-center space-y-4 p-10">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
                  <Coins className="w-6 h-6 text-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-muted-foreground text-sm">در حال بارگذاری صفحه پرداخت طلایی...</p>
              </div>
            </Card>
          </div>
        </div>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  )
}
