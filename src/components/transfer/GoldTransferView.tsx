'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  ArrowLeftRight,
  Send,
  Check,
  ChevronLeft,
  AlertTriangle,
  ArrowDownUp,
  Shield,
  BadgeCheck,
  CreditCard,
  Nfc,
  Gem,
  Smartphone,
  KeyRound,
  Clock,
  Lock,
  Calculator,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  Zap,
  History,
  UserPlus,
  Wallet,
  ArrowRightLeft,
  Copy,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { formatGrams, formatToman, formatNumber, getTimeAgo, toPersianDigits, cn } from '@/lib/helpers'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RecipientPreview {
  id: string
  fullName: string
  phone: string
  maskedPhone: string
  avatar: string | null
  referralCode: string
  role: string
  isVerified: boolean
  maskedCard: string
  designTheme: string
  cardType: string
  status: string
}

interface TransferResult {
  transferRef: string
  amountGrams: number
  feeGrams: number
  senderBalance: number
  senderCard: { maskedNumber: string }
  recipient: {
    id: string; fullName: string; phone: string; maskedPhone: string
    avatar: string | null; referralCode: string; maskedCard: string; designTheme: string
  }
  goldPrice: number
  fiatEquivalent: number
  createdAt: string
}

interface RecentTransfer {
  id: string
  recipientName: string
  recipientCard: string
  amount: number
  fee: number
  status: 'completed' | 'pending' | 'failed'
  date: string
  referenceId: string
}

type Step = 'input' | 'confirm' | 'otp' | 'success' | 'error'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CARD_THEMES: Record<string, { bg: string; chip: string; border: string }> = {
  'gold-dark': {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)',
    chip: 'linear-gradient(135deg, #d4af37, #f5d061, #b8941e)',
    border: 'rgba(212,175,55,0.3)',
  },
  'gold-light': {
    bg: 'linear-gradient(135deg, #2d1b00 0%, #4a2c0a 30%, #6b3a0a 60%, #2d1b00 100%)',
    chip: 'linear-gradient(135deg, #f5d061, #ffe082, #d4af37)',
    border: 'rgba(245,158,11,0.4)',
  },
  'platinum': {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 30%, #4a4a6a 60%, #1a1a2e 100%)',
    chip: 'linear-gradient(135deg, #c0c0c0, #e8e8e8, #a0a0a0)',
    border: 'rgba(192,192,192,0.3)',
  },
}

const QUICK_AMOUNTS = [
  { label: '۰.۰۱', value: 0.01 },
  { label: '۰.۰۵', value: 0.05 },
  { label: '۰.۱', value: 0.1 },
  { label: '۰.۵', value: 0.5 },
  { label: '۱', value: 1 },
]

const MOCK_RECENT_TRANSFERS: RecentTransfer[] = [
  {
    id: '1',
    recipientName: 'علی محمدی',
    recipientCard: '**** **** **** ۶۷۸۹',
    amount: 0.25,
    fee: 0.00125,
    status: 'completed',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    referenceId: 'TRF-A8X2K9M1',
  },
  {
    id: '2',
    recipientName: 'سارا رضایی',
    recipientCard: '**** **** **** ۳۴۵۶',
    amount: 0.1,
    fee: 0.0005,
    status: 'completed',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    referenceId: 'TRF-B3Y7L0N2',
  },
  {
    id: '3',
    recipientName: 'محمد حسینی',
    recipientCard: '**** **** **** ۱۲۳۴',
    amount: 0.5,
    fee: 0.0025,
    status: 'completed',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    referenceId: 'TRF-C5Z8M3P7',
  },
  {
    id: '4',
    recipientName: 'فاطمه احمدی',
    recipientCard: '**** **** **** ۹۸۷۶',
    amount: 0.05,
    fee: 0.00025,
    status: 'completed',
    date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    referenceId: 'TRF-D1W4Q6R8',
  },
  {
    id: '5',
    recipientName: 'رضا کریمی',
    recipientCard: '**** **** **** ۵۴۳۲',
    amount: 1.0,
    fee: 0.005,
    status: 'completed',
    date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    referenceId: 'TRF-E9V2S5T1',
  },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toPersianDigit(n: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).split('').map(d => persianDigits[parseInt(d)] || d).join('')
}

function generateCaptcha(): { question: string; answer: number } {
  const ops: Array<'+' | '-'> = ['+', '-']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a: number, b: number, answer: number

  if (op === '+') {
    a = Math.floor(Math.random() * 9) + 1
    b = Math.floor(Math.random() * 9) + 1
    answer = a + b
  } else {
    a = Math.floor(Math.random() * 9) + 2
    b = Math.floor(Math.random() * (a - 1)) + 1
    answer = a - b
  }

  return {
    question: `${toPersianDigit(a)} ${op === '+' ? '＋' : '－'} ${toPersianDigit(b)} = ؟`,
    answer,
  }
}

function formatCardDisplay(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 16)
  return d.replace(/(.{4})/g, '$1 ').trim()
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/* ── Mini Gold Card ── */

function GoldCardPreview({ name, maskedCard, theme, label, compact }: {
  name: string
  maskedCard: string
  theme: string
  label: string
  compact?: boolean
}) {
  const t = CARD_THEMES[theme] || CARD_THEMES['gold-dark']
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
      <div
        className="relative overflow-hidden rounded-xl px-3 py-2"
        style={{
          background: t.bg,
          border: `1px solid ${t.border}`,
          minHeight: compact ? 36 : 52,
        }}
      >
        {/* Holographic pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            background:
              'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212,175,55,0.15) 10px, rgba(212,175,55,0.15) 20px)',
          }}
        />
        {/* Radial shimmer */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(212,175,55,0.3), transparent 60%)',
          }}
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gem
              className={compact ? 'size-2.5' : 'size-3'}
              style={{ color: theme === 'platinum' ? '#c0c0c0' : '#d4af37' }}
            />
            <span
              className={compact ? 'text-[7px]' : 'text-[9px]'}
              style={{
                color: theme === 'platinum' ? '#c0c0c0' : '#d4af37',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              ZARRIN GOLD
            </span>
          </div>
          <Nfc
            className={compact ? 'size-2.5' : 'size-3'}
            style={{ color: theme === 'platinum' ? '#a0a0a0' : '#94a3b8' }}
          />
        </div>
        <p className="relative mt-1 text-[11px] font-mono tracking-widest text-white/80" dir="ltr">
          {maskedCard}
        </p>
        <p className="relative mt-0.5 text-[9px] text-white/60 truncate">{name}</p>
      </div>
    </div>
  )
}

/* ── OTP Digit Input ── */

function OTPInput({
  length = 4,
  value,
  onChange,
  disabled,
  error,
}: {
  length?: number
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  error?: boolean
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const firstEmpty = value.length < length ? value.length : 0
    inputRefs.current[firstEmpty]?.focus()
  }, [value, length])

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleInput = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    if (!digit) return
    const newVal = value.split('')
    newVal[index] = digit
    const joined = newVal.join('').slice(0, length)
    onChange(joined)
    if (index < length - 1 && joined.length === index + 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) onChange(pasted)
  }

  const isFilled = value.length >= length

  return (
    <div className="flex items-center justify-center gap-3" dir="ltr" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className={cn(
            'size-14 rounded-xl border-2 text-center text-2xl font-bold transition-all outline-none focus:ring-0',
            error
              ? 'border-destructive/60 bg-destructive/5 text-destructive animate-[shake_0.3s_ease]'
              : isFilled
                ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500'
                : value[i]
                  ? 'border-gold/50 bg-gold/5 text-foreground'
                  : 'border-border bg-muted/50 text-foreground',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        />
      ))}
    </div>
  )
}

/* ── Math Captcha ── */

function MathCaptcha({
  captchaValue,
  captchaAnswer,
  onCaptchaChange,
  onCaptchaInput,
  onRefresh,
  error,
}: {
  captchaValue: string
  captchaAnswer: string
  onCaptchaChange: (val: string) => void
  onCaptchaInput: () => void
  onRefresh: () => void
  error: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 space-y-2.5',
        error ? 'border-destructive/30 bg-destructive/5' : 'border-purple-500/20 bg-purple-500/5',
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
          <Calculator className="size-3.5 text-purple-500" />
        </div>
        <Label className="text-xs font-medium text-foreground">کد امنیتی (ریکپچا)</Label>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/10 px-4 py-2.5 select-none">
          <span className="text-lg font-bold text-purple-400 tracking-wider font-mono" dir="ltr">
            {captchaValue}
          </span>
        </div>
        <div className="relative w-20">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="؟"
            value={captchaAnswer}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 3)
              onCaptchaChange(v)
            }}
            onFocus={onCaptchaInput}
            className={cn(
              'h-11 text-center text-lg font-bold font-mono pr-3',
              error && 'border-destructive/60 bg-destructive/5 text-destructive',
            )}
            dir="ltr"
            maxLength={3}
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted/30 transition-all hover:bg-muted/50 active:scale-95"
          title="سؤال جدید"
        >
          <RefreshCw className="size-4 text-muted-foreground" />
        </button>
      </div>
      {error && (
        <p className="text-[10px] text-destructive text-center font-medium">
          جواب صحیح نیست. دوباره تلاش کنید.
        </p>
      )}
    </div>
  )
}

/* ── Step Indicator ── */

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { key: 'input', label: 'ورود اطلاعات', icon: CreditCard },
    { key: 'confirm', label: 'تأیید', icon: CheckCircle2 },
    { key: 'otp', label: 'کد تأیید', icon: KeyRound },
    { key: 'success', label: 'نتیجه', icon: CheckCircle2 },
  ] as const

  const stepOrder: Step[] = ['input', 'confirm', 'otp', 'success']
  const currentIndex = stepOrder.indexOf(currentStep)

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {steps.map((s, i) => {
        const stepIndex = stepOrder.indexOf(s.key)
        const isCompleted = stepIndex < currentIndex
        const isCurrent = stepIndex === currentIndex
        const Icon = s.icon

        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-full transition-all duration-500',
                  isCompleted && 'bg-gold/20 text-gold',
                  isCurrent && 'bg-gradient-to-br from-gold to-amber-600 text-black shadow-lg shadow-gold/30',
                  !isCompleted && !isCurrent && 'bg-muted/50 text-muted-foreground/40',
                )}
              >
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              <span
                className={cn(
                  'text-[9px] font-medium transition-colors',
                  isCurrent ? 'text-gold' : 'text-muted-foreground/50',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-px w-8 transition-colors duration-500 sm:w-12',
                  stepIndex < currentIndex ? 'bg-gold/40' : 'bg-border',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Recent Transfer Item ── */

function RecentTransferItem({ item }: { item: RecentTransfer }) {
  const statusConfig = {
    completed: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'موفق', icon: CheckCircle2 },
    pending: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'در انتظار', icon: Clock },
    failed: { color: 'text-destructive', bg: 'bg-destructive/10', label: 'ناموفق', icon: XCircle },
  }
  const status = statusConfig[item.status]
  const StatusIcon = status.icon

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 transition-colors hover:bg-muted/30">
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', status.bg)}>
        <StatusIcon className={cn('size-4', status.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-foreground">{item.recipientName}</p>
          <Badge variant="secondary" className={cn('text-[9px] font-medium', status.bg, status.color)}>
            {status.label}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">
            {item.recipientCard}
          </span>
          <span className="text-xs font-bold text-gold">-{formatGrams(item.amount)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{getTimeAgo(item.date)}</span>
          <span className="text-[9px] text-muted-foreground/60 font-mono" dir="ltr">
            {item.referenceId}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function GoldTransferView() {
  const { user, goldWallet, goldPrice, token, setGoldWallet, addTransaction, addToast } =
    useAppStore()

  /* ── State ── */
  const [step, setStep] = useState<Step>('input')
  const [cardInput, setCardInput] = useState('')
  const [amountGrams, setAmountGrams] = useState('')
  const [note, setNote] = useState('')
  const [recipient, setRecipient] = useState<RecipientPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<TransferResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [myCard, setMyCard] = useState<{ maskedNumber: string } | null>(null)

  // OTP
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState(false)
  const [otpErrorMessage, setOtpErrorMessage] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(120)
  const [devCode, setDevCode] = useState<string | null>(null)

  // Captcha
  const [captcha, setCaptcha] = useState(() => generateCaptcha())
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaError, setCaptchaError] = useState(false)
  const [captchaTouched, setCaptchaTouched] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const searchDebounce = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  /* ── Computed ── */
  const availableGold = goldWallet
    ? Math.max(0, goldWallet.goldGrams - goldWallet.frozenGold)
    : 0

  const parsedAmount = parseFloat(amountGrams) || 0
  let feeGrams = parsedAmount * 0.005
  if (feeGrams > 0.01) feeGrams = 0.01
  if (feeGrams < 0.0001) feeGrams = 0
  const totalDeduct = parsedAmount + feeGrams
  const hasEnough = availableGold >= totalDeduct && parsedAmount > 0
  const fiatEquiv = goldPrice ? Math.round(parsedAmount * goldPrice.marketPrice) : 0
  const isCaptchaValid =
    captchaAnswer.trim() !== '' && parseInt(captchaAnswer) === captcha.answer
  const rawCardNumber = cardInput.replace(/\D/g, '')

  const todayTransfers = MOCK_RECENT_TRANSFERS.filter(
    (t) => new Date(t.date).toDateString() === new Date().toDateString(),
  ).length

  /* ── Load user's card ── */
  useEffect(() => {
    let cancelled = false
    const loadMyCard = async () => {
      try {
        const res = await fetch('/api/card', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!cancelled && data.success && data.card) {
          setMyCard({ maskedNumber: data.card.maskedNumber })
        }
      } catch {
        /* ignore */
      }
    }
    loadMyCard()
    return () => {
      cancelled = true
    }
  }, [token])

  /* ── OTP countdown ── */
  useEffect(() => {
    if (step !== 'otp' || otpCountdown <= 0) return
    countdownRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [step, otpCountdown])

  /* ── Card search ── */
  const searchCard = useCallback(
    async (cardNumber: string) => {
      const clean = cardNumber.replace(/[\s\-]/g, '')
      if (clean.length < 16) {
        setRecipient(null)
        return
      }
      setPreviewLoading(true)
      try {
        const res = await fetch(
          `/api/transfer/create?q=${encodeURIComponent(clean)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        const data = await res.json()
        if (data.success) setRecipient(data.data)
        else setRecipient(null)
      } catch {
        setRecipient(null)
      } finally {
        setPreviewLoading(false)
      }
    },
    [token],
  )

  const handleCardChange = useCallback(
    (val: string) => {
      const cleaned = val.replace(/\D/g, '').slice(0, 16)
      setCardInput(cleaned)
      setRecipient(null)
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
      if (cleaned.length >= 16) {
        searchDebounce.current = setTimeout(() => searchCard(cleaned), 500)
      }
    },
    [searchCard],
  )

  /* ── Captcha ── */
  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha())
    setCaptchaAnswer('')
    setCaptchaError(false)
  }, [])

  /* ── OTP send ── */
  const sendOTP = useCallback(async () => {
    setOtpSending(true)
    setOtpError(false)
    setOtpErrorMessage('')
    setDevCode(null)
    try {
      const res = await fetch('/api/transfer/otp', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setOtpSent(true)
        setOtpCountdown(120)
        setOtpCode('')
        if (data.devCode) setDevCode(data.devCode)
        addToast(data.message, 'success')
      } else {
        addToast(data.message || 'خطا در ارسال کد تأیید', 'error')
        if (res.status === 429) setStep('confirm')
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error')
      setStep('confirm')
    }
    setOtpSending(false)
  }, [token, addToast])

  /* ── Go to OTP step ── */
  const goToOtpStep = useCallback(() => {
    if (!recipient || !hasEnough || parsedAmount <= 0) return
    if (!isCaptchaValid) {
      setCaptchaError(true)
      setCaptchaTouched(true)
      addToast('لطفاً کد امنیتی را صحیح وارد کنید', 'error')
      return
    }
    setStep('otp')
    sendOTP()
  }, [recipient, hasEnough, parsedAmount, isCaptchaValid, sendOTP, addToast])

  /* ── Resend OTP ── */
  const resendOtp = useCallback(() => {
    if (otpCountdown > 0) return
    sendOTP()
  }, [otpCountdown, sendOTP])

  /* ── Verify & Transfer ── */
  const handleVerifyAndTransfer = useCallback(async () => {
    if (otpCode.length !== 4) {
      setOtpError(true)
      setOtpErrorMessage('لطفاً کد ۴ رقمی را وارد کنید')
      return
    }

    setSubmitting(true)
    setOtpError(false)
    setOtpErrorMessage('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/transfer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recipientCard: rawCardNumber,
          amountGrams: parsedAmount,
          otpCode,
          note,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setResult(data.data)
        setStep('success')
        if (data.data.senderBalance !== undefined) {
          setGoldWallet({
            goldGrams: data.data.senderBalance,
            frozenGold: goldWallet?.frozenGold || 0,
          })
        }
        addTransaction({
          id: `tx_${Date.now()}`,
          type: 'gold_transfer_out',
          amountFiat: data.data.fiatEquivalent,
          amountGold: -totalDeduct,
          fee: data.data.feeGrams,
          goldPrice: data.data.goldPrice || undefined,
          status: 'completed',
          referenceId: data.data.transferRef,
          description: `انتقال طلا (کارت‌به‌کارت) به ${data.data.recipient.fullName}`,
          createdAt: new Date().toISOString(),
        })
        addToast('انتقال طلا با موفقیت انجام شد', 'success')
      } else {
        const msg = data.message || 'خطا در انتقال طلا'
        if (
          msg.includes('کد تأیید') ||
          msg.includes('نادرست') ||
          msg.includes('منقضی') ||
          msg.includes('تلاش')
        ) {
          setOtpError(true)
          setOtpErrorMessage(msg)
          addToast(msg, 'error')
        } else {
          setErrorMsg(msg)
          setStep('error')
        }
      }
    } catch {
      setErrorMsg('خطا در ارتباط با سرور')
      setStep('error')
    }
    setSubmitting(false)
  }, [
    otpCode,
    rawCardNumber,
    parsedAmount,
    note,
    token,
    totalDeduct,
    goldWallet,
    setGoldWallet,
    addTransaction,
    addToast,
  ])

  /* ── Reset form ── */
  const resetForm = useCallback(() => {
    setStep('input')
    setCardInput('')
    setAmountGrams('')
    setNote('')
    setRecipient(null)
    setResult(null)
    setErrorMsg('')
    setOtpCode('')
    setOtpSent(false)
    setOtpError(false)
    setOtpErrorMessage('')
    setOtpCountdown(0)
    setDevCode(null)
    setCaptcha(generateCaptcha())
    setCaptchaAnswer('')
    setCaptchaError(false)
    setCaptchaTouched(false)
  }, [])

  /* ── Effects ── */
  useEffect(() => {
    if (step === 'input' && inputRef.current) inputRef.current.focus()
  }, [step])

  useEffect(() => {
    if (step === 'otp' && otpCode.length === 4 && !submitting) {
      const t = setTimeout(() => handleVerifyAndTransfer(), 300)
      return () => clearTimeout(t)
    }
  }, [otpCode.length, step, handleVerifyAndTransfer])

  useEffect(() => {
    if (captchaTouched && captchaAnswer && parseInt(captchaAnswer) === captcha.answer) {
      setCaptchaError(false)
    }
  }, [captchaAnswer, captcha.answer, captchaTouched])

  /* ================================================================ */
  /*  RENDER                                                            */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <main className="mx-auto max-w-lg px-4 pb-8 pt-6">
        {/* ════════════════════════════════════════════════════════════ */}
        {/*  HEADER SECTION                                              */}
        {/* ════════════════════════════════════════════════════════════ */}
        <header className="mb-6 space-y-5">
          {/* Page Title */}
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 items-center justify-center rounded-2xl shadow-lg shadow-gold/20"
              style={{
                background: 'linear-gradient(135deg, #d4af37, #b8941e)',
              }}
            >
              <ArrowLeftRight className="size-6 text-black" />
            </div>
            <div>
              <h1
                className="text-xl font-bold gold-gradient-text"
              >
                انتقال طلا
              </h1>
              <p className="text-xs text-muted-foreground">
                کارت‌به‌کارت طلا بین کاربران زرین گلد
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Balance Card */}
            <Card className="border-border/50 bg-card overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-gold/10">
                    <Wallet className="size-3.5 text-gold" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    موجودی طلای آزاد
                  </span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {formatGrams(availableGold)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  مسدود: {formatGrams(goldWallet?.frozenGold || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Price + Transfers Card */}
            <Card className="border-border/50 bg-card overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
                    <TrendingUp className="size-3.5 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    قیمت لحظه‌ای طلا
                  </span>
                </div>
                {goldPrice && goldPrice.marketPrice > 0 ? (
                  <>
                    <p className="text-lg font-bold text-foreground">
                      {formatNumber(goldPrice.marketPrice)}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="gold-pulse size-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-emerald-500 font-medium">لحظه‌ای</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">در انتظار...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                resetForm()
                window.scrollTo({ top: 300, behavior: 'smooth' })
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-2 text-[11px] font-medium text-foreground transition-all hover:border-gold/40 hover:bg-gold/5 active:scale-95"
            >
              <UserPlus className="size-3.5 text-gold" />
              انتقال به کارت جدید
            </button>
            <button
              onClick={() => {
                setAmountGrams('0.01')
                window.scrollTo({ top: 300, behavior: 'smooth' })
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-2 text-[11px] font-medium text-foreground transition-all hover:border-gold/40 hover:bg-gold/5 active:scale-95"
            >
              <Zap className="size-3.5 text-amber-500" />
              انتقال سریع
            </button>
            <button
              onClick={() => {
                document.getElementById('recent-transfers')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-2 text-[11px] font-medium text-foreground transition-all hover:border-gold/40 hover:bg-gold/5 active:scale-95"
            >
              <History className="size-3.5 text-blue-400" />
              انتقال‌های اخیر
            </button>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={step} />
        </header>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  TRANSFER FORM (Gold-bordered main card)                     */}
        {/* ════════════════════════════════════════════════════════════ */}
        <section className="mb-8">
          <Card
            className="overflow-hidden"
            style={{
              border: '1px solid rgba(212,175,55,0.3)',
              boxShadow: '0 0 30px rgba(212,175,55,0.05)',
            }}
          >
            <CardContent className="p-4 space-y-5">
              {/* ────────────────────────────────────────────────────── */}
              {/*  STEP: INPUT                                          */}
              {/* ────────────────────────────────────────────────────── */}
              {step === 'input' && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
                  {/* Sender Card */}
                  {myCard && (
                    <GoldCardPreview
                      name={user?.fullName || user?.phone || ''}
                      maskedCard={myCard.maskedNumber}
                      theme="gold-dark"
                      label="از کارت شما"
                    />
                  )}

                  {/* Arrow */}
                  <div className="flex items-center justify-center py-0.5">
                    <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-yellow-600/10 gold-shimmer">
                      <ArrowDownUp className="size-4 text-gold" />
                    </div>
                  </div>

                  {/* Destination Card Number */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="size-3.5" />
                      شماره کارت مقصد (۱۶ رقم)
                    </Label>
                    <div className="relative">
                      <Input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        placeholder="0000 0000 0000 0000"
                        value={formatCardDisplay(cardInput)}
                        onChange={(e) => handleCardChange(e.target.value)}
                        className={cn(
                          'h-13 text-base font-mono pr-12 tracking-[0.2em] transition-colors',
                          recipient && 'border-emerald-500/50 bg-emerald-500/5',
                          !recipient && rawCardNumber.length >= 16 && !previewLoading && 'border-destructive/50',
                        )}
                        dir="ltr"
                        maxLength={19}
                      />
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                        {previewLoading ? (
                          <div className="size-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                        ) : recipient ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          <CreditCard className="size-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </div>

                    {/* Digit counter */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                        <Shield className="size-3" />
                        <span>انتقال فقط بین کارت‌های فعال زرین گلد</span>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-mono',
                          rawCardNumber.length === 16
                            ? 'text-emerald-500 font-bold'
                            : 'text-muted-foreground/50',
                        )}
                      >
                        {toPersianDigits(String(rawCardNumber.length))}/۱۶
                      </span>
                    </div>

                    {/* Recipient preview */}
                    {recipient && (
                      <div className="animate-[fadeIn_0.3s_ease] space-y-2">
                        <GoldCardPreview
                          name={recipient.fullName}
                          maskedCard={recipient.maskedCard}
                          theme={recipient.designTheme}
                          label="به کارت مقصد"
                        />
                        <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className="size-4 text-emerald-500" />
                            <span className="text-xs font-bold text-foreground">
                              {recipient.fullName}
                            </span>
                          </div>
                          <span
                            className="text-[10px] text-muted-foreground font-mono"
                            dir="ltr"
                          >
                            {recipient.maskedPhone}
                          </span>
                        </div>
                      </div>
                    )}

                    {!recipient && rawCardNumber.length >= 16 && !previewLoading && (
                      <p className="text-[11px] text-destructive">کارت مقصد یافت نشد</p>
                    )}
                  </div>

                  <Separator />

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Gem className="size-3.5" />
                      مقدار انتقال (گرم طلا)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.001"
                        min="0.001"
                        placeholder="0.000"
                        value={amountGrams}
                        onChange={(e) => setAmountGrams(e.target.value)}
                        className="h-14 text-xl font-bold text-left pr-16 font-mono"
                        dir="ltr"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        گرم
                      </span>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_AMOUNTS.map((qa) => (
                        <button
                          key={qa.value}
                          onClick={() => setAmountGrams(String(qa.value))}
                          disabled={qa.value > availableGold}
                          className={cn(
                            'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all',
                            qa.value > availableGold
                              ? 'cursor-not-allowed border-border/50 text-muted-foreground/40'
                              : parseFloat(amountGrams) === qa.value
                                ? 'border-gold bg-gold/10 text-gold shadow-sm shadow-gold/10'
                                : 'border-border bg-muted/30 text-foreground hover:border-gold/50 hover:bg-gold/5',
                          )}
                        >
                          {qa.label} گرم
                        </button>
                      ))}
                    </div>

                    {/* Fiat equivalent */}
                    {parsedAmount > 0 && goldPrice != null && goldPrice.marketPrice > 0 && (
                      <div className="rounded-lg bg-muted/50 p-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">معادل ریالی:</span>
                          <span className="font-bold text-foreground">
                            {formatNumber(fiatEquiv)} تومان
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">قیمت هر گرم:</span>
                          <span className="text-foreground">
                            {formatNumber(goldPrice.marketPrice)} تومان
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Insufficient balance warning */}
                    {parsedAmount > 0 && !hasEnough && (
                      <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                        <div className="text-[11px]">
                          <p className="font-medium text-destructive">موجودی کافی نیست</p>
                          <p className="text-muted-foreground">
                            نیاز: {formatGrams(totalDeduct)} | موجودی:{' '}
                            {formatGrams(availableGold)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Note */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      توضیحات (اختیاری)
                    </Label>
                    <Input
                      type="text"
                      placeholder="مثلاً: بابت خرید"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={100}
                      className="h-10 text-sm"
                    />
                  </div>

                  <Separator />

                  {/* Summary + Transfer Button */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">از کارت:</span>
                        <span
                          className="font-mono text-foreground text-[11px]"
                          dir="ltr"
                        >
                          {myCard?.maskedNumber || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">به کارت:</span>
                        <span
                          className="font-mono text-foreground text-[11px]"
                          dir="ltr"
                        >
                          {recipient?.maskedCard || '—'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">مقدار انتقال:</span>
                        <span className="font-bold text-gold">
                          {formatGrams(parsedAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">کارمزد (۰.۵٪):</span>
                        <span className="text-foreground">
                          {feeGrams > 0 ? formatGrams(feeGrams) : 'رایگان 🎉'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">مجموع کسر:</span>
                        <span className="font-bold text-foreground">
                          {formatGrams(totalDeduct)}
                        </span>
                      </div>
                    </div>

                    {/* Transfer Button with floating gold pulse */}
                    <div className="relative">
                      {/* Gold pulse glow behind button */}
                      {recipient && hasEnough && parsedAmount > 0 && (
                        <div className="absolute inset-0 rounded-xl gold-pulse opacity-30" style={{ background: 'linear-gradient(135deg, #d4af37, #b8941e)' }} />
                      )}
                      <Button
                        onClick={() => {
                          if (recipient && hasEnough && parsedAmount > 0) {
                            setStep('confirm')
                            refreshCaptcha()
                          }
                        }}
                        disabled={!recipient || !hasEnough || parsedAmount <= 0}
                        className="relative h-12 w-full text-sm font-bold shadow-lg transition-all active:scale-[0.98]"
                        style={{
                          background: !recipient || !hasEnough || parsedAmount <= 0
                            ? '#444'
                            : 'linear-gradient(135deg, #d4af37, #b8941e)',
                          color: '#0a0a0f',
                          boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                        }}
                      >
                        <Send className="ml-2 size-4" />
                        ادامه و تأیید انتقال
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────── */}
              {/*  STEP: CONFIRM                                         */}
              {/* ────────────────────────────────────────────────────── */}
              {step === 'confirm' && recipient && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-amber-500" />
                    <p className="text-sm font-bold text-amber-500">تأیید نهایی انتقال</p>
                  </div>

                  {/* Card comparison */}
                  <div className="grid grid-cols-5 items-center gap-2">
                    <div className="col-span-2">
                      <GoldCardPreview
                        name={user?.fullName || 'کاربر'}
                        maskedCard={myCard?.maskedNumber || '---- ---- ---- ----'}
                        theme="gold-dark"
                        label="از کارت"
                        compact
                      />
                    </div>
                    <div className="flex justify-center">
                      <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-yellow-600/10">
                        <ArrowRightLeft className="size-3.5 text-gold" />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <GoldCardPreview
                        name={recipient.fullName}
                        maskedCard={recipient.maskedCard}
                        theme={recipient.designTheme}
                        label="به کارت"
                        compact
                      />
                    </div>
                  </div>

                  {/* Transfer details */}
                  <div className="space-y-2 rounded-xl bg-muted/30 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">مقدار انتقال:</span>
                      <span className="font-bold text-gold text-base">
                        {formatGrams(parsedAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">کارمزد:</span>
                      <span className="text-foreground">
                        {feeGrams > 0 ? formatGrams(feeGrams) : 'رایگان'}
                      </span>
                    </div>
                    {fiatEquiv > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">معادل ریالی:</span>
                        <span className="text-foreground">
                          {formatNumber(fiatEquiv)} تومان
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-muted-foreground">مجموع کسر:</span>
                      <span className="font-bold text-foreground">{formatGrams(totalDeduct)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">موجودی بعد از انتقال:</span>
                      <span className="font-medium text-foreground">
                        {formatGrams(availableGold - totalDeduct)}
                      </span>
                    </div>
                    {note && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">توضیحات:</span>
                        <span className="text-foreground">{note}</span>
                      </div>
                    )}
                  </div>

                  {/* Captcha */}
                  <MathCaptcha
                    captchaValue={captcha.question}
                    captchaAnswer={captchaAnswer}
                    onCaptchaChange={(val) => {
                      setCaptchaAnswer(val)
                      setCaptchaError(false)
                    }}
                    onCaptchaInput={() => setCaptchaTouched(true)}
                    onRefresh={refreshCaptcha}
                    error={captchaError}
                  />

                  {/* OTP notice */}
                  <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
                    <Smartphone className="mt-0.5 size-4 shrink-0 text-blue-500" />
                    <div className="text-[11px]">
                      <p className="font-medium text-blue-600">تأیید پیامکی الزامی است</p>
                      <p className="text-muted-foreground">
                        در مرحله بعد، کد تأیید ۴ رقمی به شماره موبایل شما ارسال می‌شود.
                      </p>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <p className="text-[11px] text-destructive/80">
                      انتقال طلا غیرقابل بازگشت است. آیا مطمئنید؟
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep('input')
                        setCaptchaError(false)
                        setCaptchaAnswer('')
                      }}
                      className="h-11 text-sm"
                    >
                      <ChevronLeft className="ml-1 size-4" />
                      بازگشت
                    </Button>
                    <Button
                      onClick={goToOtpStep}
                      disabled={otpSending || !isCaptchaValid}
                      className="h-11 text-sm font-bold shadow-lg transition-all active:scale-[0.98]"
                      style={{
                        background:
                          !isCaptchaValid || otpSending
                            ? '#444'
                            : 'linear-gradient(135deg, #d4af37, #b8941e)',
                        color: '#0a0a0f',
                        boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                      }}
                    >
                      {otpSending ? (
                        <>
                          <div className="ml-2 size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                          در حال ارسال کد...
                        </>
                      ) : (
                        <>
                          <KeyRound className="ml-1 size-4" />
                          ارسال کد تأیید
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────── */}
              {/*  STEP: OTP                                             */}
              {/* ────────────────────────────────────────────────────── */}
              {step === 'otp' && (
                <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                  {/* OTP Header */}
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/15 to-amber-600/5">
                      <KeyRound className="size-8 text-gold" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">کد تأیید پیامکی</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed max-w-[280px]">
                      کد ۴ رقمی ارسال شده به شماره موبایل خود را وارد کنید
                    </p>
                    <p className="mt-1 text-xs font-medium text-foreground">
                      {formatGrams(parsedAmount)} طلا به{' '}
                      <span className="text-gold">{recipient?.fullName}</span>
                    </p>
                  </div>

                  {/* OTP Input */}
                  <OTPInput
                    value={otpCode}
                    onChange={(val) => {
                      setOtpCode(val)
                      setOtpError(false)
                      setOtpErrorMessage('')
                    }}
                    disabled={submitting}
                    error={otpError}
                  />

                  {/* OTP error message */}
                  {otpError && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 animate-[shake_0.3s_ease]">
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      <p className="text-[11px] text-destructive">{otpErrorMessage}</p>
                    </div>
                  )}

                  {/* Dev code (development) */}
                  {devCode && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                      <Info className="size-4 text-amber-500" />
                      <span className="text-[11px] text-amber-600">
                        کد توسعه:{' '}
                        <span className="font-mono font-bold" dir="ltr">{devCode}</span>
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(devCode)
                          addToast('کد کپی شد', 'success')
                        }}
                        className="mr-auto"
                      >
                        <Copy className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                      </button>
                    </div>
                  )}

                  {/* Countdown & Resend */}
                  <div className="text-center">
                    {otpCountdown > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        ارسال مجدد تا{' '}
                        <span className="font-mono font-bold text-foreground">
                          {formatCountdown(otpCountdown)}
                        </span>
                      </p>
                    ) : (
                      <button
                        onClick={resendOtp}
                        disabled={otpSending}
                        className="text-xs font-medium text-gold hover:text-gold/80 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="inline ml-1 size-3" />
                        ارسال مجدد کد تأیید
                      </button>
                    )}
                  </div>

                  {/* Submitting indicator */}
                  {submitting && (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="size-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                      <p className="text-xs text-muted-foreground">در حال بررسی...</p>
                    </div>
                  )}

                  {/* Back button */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('confirm')
                      setOtpCode('')
                      setOtpError(false)
                      setOtpErrorMessage('')
                    }}
                    className="w-full h-11 text-sm"
                    disabled={submitting}
                  >
                    <ChevronLeft className="ml-1 size-4" />
                    بازگشت به مرحله قبل
                  </Button>
                </div>
              )}

              {/* ────────────────────────────────────────────────────── */}
              {/*  STEP: SUCCESS                                         */}
              {/* ────────────────────────────────────────────────────── */}
              {step === 'success' && result && (
                <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                  {/* Success icon */}
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="mb-3 flex size-20 items-center justify-center rounded-full gold-shimmer"
                      style={{
                        background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(184,148,30,0.1))',
                        border: '2px solid rgba(212,175,55,0.3)',
                      }}
                    >
                      <CheckCircle2 className="size-10 text-gold" />
                    </div>
                    <h3 className="text-lg font-bold gold-gradient-text">
                      انتقال موفق!
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      طلا با موفقیت به کارت مقصد منتقل شد
                    </p>
                  </div>

                  {/* Transfer details */}
                  <div className="space-y-3 rounded-xl bg-muted/30 p-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">شماره پیگیری:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-foreground" dir="ltr">
                          {result.transferRef}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(result.transferRef)
                            addToast('شماره پیگیری کپی شد', 'success')
                          }}
                        >
                          <Copy className="size-3 text-muted-foreground hover:text-foreground transition-colors" />
                        </button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">مقدار انتقال:</span>
                      <span className="font-bold text-gold">{formatGrams(result.amountGrams)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">کارمزد:</span>
                      <span className="text-foreground">{formatGrams(result.feeGrams)}</span>
                    </div>
                    {result.fiatEquivalent > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">معادل ریالی:</span>
                        <span className="text-foreground">
                          {formatNumber(result.fiatEquivalent)} تومان
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">گیرنده:</span>
                      <span className="font-medium text-foreground">{result.recipient.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">کارت مقصد:</span>
                      <span className="font-mono text-foreground text-[11px]" dir="ltr">
                        {result.recipient.maskedCard}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-muted-foreground">موجودی فعلی:</span>
                      <span className="font-bold text-foreground">
                        {formatGrams(result.senderBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Security note */}
                  <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/20 p-2.5">
                    <Lock className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      این انتقال با موفقیت در شبکه زرین گلد ثبت شد و غیرقابل بازگشت می‌باشد.
                    </p>
                  </div>

                  {/* New Transfer Button */}
                  <Button
                    onClick={resetForm}
                    className="w-full h-12 text-sm font-bold shadow-lg transition-all active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #d4af37, #b8941e)',
                      color: '#0a0a0f',
                      boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                    }}
                  >
                    <ArrowLeftRight className="ml-2 size-4" />
                    انتقال جدید
                  </Button>
                </div>
              )}

              {/* ────────────────────────────────────────────────────── */}
              {/*  STEP: ERROR                                           */}
              {/* ────────────────────────────────────────────────────── */}
              {step === 'error' && (
                <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex size-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
                      <XCircle className="size-10 text-destructive" />
                    </div>
                    <h3 className="text-lg font-bold text-destructive">انتقال ناموفق</h3>
                    <p className="mt-2 text-xs text-muted-foreground max-w-[280px]">
                      {errorMsg || 'خطایی در انجام انتقال رخ داده است'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      className="h-11 text-sm"
                    >
                      <ChevronLeft className="ml-1 size-4" />
                      بازگشت
                    </Button>
                    <Button
                      onClick={() => setStep('confirm')}
                      className="h-11 text-sm font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #d4af37, #b8941e)',
                        color: '#0a0a0f',
                      }}
                    >
                      تلاش مجدد
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  RECENT TRANSFERS SECTION                                     */}
        {/* ════════════════════════════════════════════════════════════ */}
        <section id="recent-transfers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50">
                <History className="size-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">انتقال‌های اخیر</h2>
                <p className="text-[10px] text-muted-foreground">
                  {toPersianDigits(String(todayTransfers))} انتقال امروز
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[9px] font-medium">
              {toPersianDigits(String(MOCK_RECENT_TRANSFERS.length))} مورد
            </Badge>
          </div>

          <div className="space-y-2">
            {MOCK_RECENT_TRANSFERS.map((item) => (
              <RecentTransferItem key={item.id} item={item} />
            ))}
          </div>

          {/* Empty state hint */}
          <div className="rounded-xl border border-dashed border-border/50 p-6 text-center">
            <Clock className="mx-auto mb-2 size-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/60">
              سوابق انتقال واقعی پس از اولین انتقال نمایش داده می‌شود
            </p>
          </div>
        </section>

        {/* Footer info */}
        <footer className="mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-3 py-1.5">
            <Shield className="size-3 text-emerald-500" />
            <span className="text-[10px] text-muted-foreground">
              تمامی انتقال‌ها با رمزنگاری SSL محافظت می‌شوند
            </span>
          </div>
        </footer>
      </main>
    </div>
  )
}
