'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  ArrowLeftRight,
  Send,
  Check,
  ChevronLeft,
  AlertTriangle,
  ArrowDownUp,
  Shield,
  BadgeCheck,
  X,
  CreditCard,
  Nfc,
  Gem,
  Smartphone,
  KeyRound,
  RotateCcw,
  Clock,
  Lock,
  Calculator,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { formatGrams, formatToman, cn } from '@/lib/helpers'

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

type Step = 'input' | 'confirm' | 'otp' | 'success' | 'error'

/* ------------------------------------------------------------------ */
/*  Card Themes (match GoldCardView)                                   */
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

/* ------------------------------------------------------------------ */
/*  Persian digit helper                                               */
/* ------------------------------------------------------------------ */

const toPersianDigit = (n: number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).split('').map(d => persianDigits[parseInt(d)] || d).join('')
}

/* ------------------------------------------------------------------ */
/*  Simple Math Captcha Generator                                      */
/* ------------------------------------------------------------------ */

function generateCaptcha(): { question: string; answer: number } {
  const ops: Array<'+' | '-'> = ['+', '-']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a: number, b: number, answer: number

  if (op === '+') {
    a = Math.floor(Math.random() * 9) + 1  // 1-9
    b = Math.floor(Math.random() * 9) + 1  // 1-9
    answer = a + b
  } else {
    a = Math.floor(Math.random() * 9) + 2  // 2-10
    b = Math.floor(Math.random() * (a - 1)) + 1  // 1 to a-1 (never negative)
    answer = a - b
  }

  return {
    question: `${toPersianDigit(a)} ${op === '+' ? '＋' : '－'} ${toPersianDigit(b)} = ؟`,
    answer,
  }
}

/* ------------------------------------------------------------------ */
/*  Mini Card Preview                                                  */
/* ------------------------------------------------------------------ */

function MiniCard({ name, maskedCard, theme, label, frozen }: {
  name: string; maskedCard: string; theme: string; label: string; frozen?: boolean
}) {
  const t = CARD_THEMES[theme] || CARD_THEMES['gold-dark']
  return (
    <div className={cn('space-y-1', frozen && 'opacity-40 saturate-50')}>
      <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
      <div
        className="relative overflow-hidden rounded-xl px-3 py-2"
        style={{ background: t.bg, border: `1px solid ${t.border}`, minHeight: 44 }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212,175,55,0.15) 10px, rgba(212,175,55,0.15) 20px)' }}
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gem className="size-3" style={{ color: theme === 'platinum' ? '#c0c0c0' : '#d4af37' }} />
            <span className="text-[9px] font-bold tracking-wider" style={{ color: theme === 'platinum' ? '#c0c0c0' : '#d4af37' }}>
              ZARRIN GOLD
            </span>
          </div>
          <Nfc className="size-3" style={{ color: theme === 'platinum' ? '#a0a0a0' : '#94a3b8' }} />
        </div>
        <p className="relative mt-1 text-[11px] font-mono tracking-widest text-white/80" dir="ltr">
          {maskedCard}
        </p>
        <p className="relative mt-0.5 text-[9px] text-white/60 truncate">{name}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  OTP Digit Input                                                   */
/* ------------------------------------------------------------------ */

function OTPInput({ length = 4, value, onChange, disabled, error }: {
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
          ref={(el) => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className={cn(
            'size-14 rounded-xl border-2 text-center text-2xl font-bold transition-all outline-none',
            'focus:ring-0',
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

/* ------------------------------------------------------------------ */
/*  Countdown Timer                                                   */
/* ------------------------------------------------------------------ */

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ------------------------------------------------------------------ */
/*  Math Captcha Component                                             */
/* ------------------------------------------------------------------ */

function MathCaptcha({ captchaValue, captchaAnswer, onCaptchaChange, onCaptchaInput, onRefresh, error }: {
  captchaValue: string
  captchaAnswer: string
  onCaptchaChange: (val: string) => void
  onCaptchaInput: () => void
  onRefresh: () => void
  error: boolean
}) {
  return (
    <div className={cn(
      'rounded-xl border p-3 space-y-2.5',
      error ? 'border-destructive/30 bg-destructive/5' : 'border-purple-500/20 bg-purple-500/5'
    )}>
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
          <Calculator className="size-3.5 text-purple-500" />
        </div>
        <Label className="text-xs font-medium text-foreground">کد امنیتی (ریکپچا)</Label>
      </div>

      <div className="flex items-center gap-3">
        {/* سؤال ریاضی */}
        <div className="flex-1 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/10 px-4 py-2.5 select-none">
          <span className="text-lg font-bold text-purple-400 tracking-wider font-mono" dir="ltr">
            {captchaValue}
          </span>
        </div>

        {/* ورودی جواب */}
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
              error && 'border-destructive/60 bg-destructive/5 text-destructive'
            )}
            dir="ltr"
            maxLength={3}
          />
        </div>

        {/* دکمه بازنشانی */}
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
        <p className="text-[10px] text-destructive text-center font-medium">جواب صحیح نیست. دوباره تلاش کنید.</p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function GoldTransfer({ onClose }: { onClose?: () => void }) {
  const { user, goldWallet, goldPrice, token, setGoldWallet, addTransaction, addToast } = useAppStore()

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

  // OTP state
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState(false)
  const [otpErrorMessage, setOtpErrorMessage] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(120)
  const [devCode, setDevCode] = useState<string | null>(null)

  // Captcha state
  const [captcha, setCaptcha] = useState(() => generateCaptcha())
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaError, setCaptchaError] = useState(false)
  const [captchaTouched, setCaptchaTouched] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const searchDebounce = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const availableGold = goldWallet ? Math.max(0, goldWallet.goldGrams - goldWallet.frozenGold) : 0

  const parsedAmount = parseFloat(amountGrams) || 0
  let feeGrams = parsedAmount * 0.005
  if (feeGrams > 0.01) feeGrams = 0.01
  if (feeGrams < 0.0001) feeGrams = 0
  const totalDeduct = parsedAmount + feeGrams
  const hasEnough = availableGold >= totalDeduct && parsedAmount > 0
  const fiatEquiv = goldPrice ? Math.round(parsedAmount * goldPrice.marketPrice) : 0

  const isCaptchaValid = captchaAnswer.trim() !== '' && parseInt(captchaAnswer) === captcha.answer

  // ── بارگذاری کارت خود کاربر ──
  useEffect(() => {
    let cancelled = false
    const loadMyCard = async () => {
      try {
        const res = await fetch('/api/card', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (!cancelled && data.success && data.card) {
          setMyCard({ maskedNumber: data.card.maskedNumber })
        }
      } catch { /* ignore */ }
    }
    loadMyCard()
    return () => { cancelled = true }
  }, [token])

  // ── Countdown timer for OTP ──
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
  }, [step])

  // ── جستجوی کارت مقصد ──
  const searchCard = useCallback(async (cardNumber: string) => {
    const clean = cardNumber.replace(/[\s\-]/g, '')
    if (clean.length < 16) { setRecipient(null); return }
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/transfer/create?q=${encodeURIComponent(clean)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setRecipient(data.data)
      else setRecipient(null)
    } catch { setRecipient(null) }
    finally { setPreviewLoading(false) }
  }, [token])

  const handleCardChange = useCallback((val: string) => {
    // فقط عدد قبول کن
    const cleaned = val.replace(/\D/g, '').slice(0, 16)
    setCardInput(cleaned)
    setRecipient(null)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (cleaned.length >= 16) {
      searchDebounce.current = setTimeout(() => searchCard(cleaned), 500)
    }
  }, [searchCard])

  // فرمت‌کردن نمایشی شماره کارت: XXXX XXXX XXXX XXXX (فقط عددی با فاصله)
  const formatCardDisplay = (val: string): string => {
    const d = val.replace(/\D/g, '').slice(0, 16)
    return d.replace(/(.{4})/g, '$1 ').trim()
  }

  const rawCardNumber = cardInput.replace(/\D/g, '')

  // ── Captcha refresh ──
  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha())
    setCaptchaAnswer('')
    setCaptchaError(false)
  }, [])

  // ── ارسال OTP ──
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
        if (res.status === 429) {
          setStep('confirm')
        }
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error')
      setStep('confirm')
    }
    setOtpSending(false)
  }, [token, addToast])

  // ── انتقال از مرحله تأیید به OTP (با بررسی کپچا) ──
  const goToOtpStep = useCallback(() => {
    if (!recipient || !hasEnough || parsedAmount <= 0) return

    // بررسی کپچا
    if (!isCaptchaValid) {
      setCaptchaError(true)
      setCaptchaTouched(true)
      addToast('لطفاً کد امنیتی را صحیح وارد کنید', 'error')
      return
    }

    setStep('otp')
    sendOTP()
  }, [recipient, hasEnough, parsedAmount, isCaptchaValid, sendOTP, addToast])

  // ── ارسال مجدد OTP ──
  const resendOtp = useCallback(() => {
    if (otpCountdown > 0) return
    sendOTP()
  }, [otpCountdown, sendOTP])

  // ── ارسال انتقال با OTP ──
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
          setGoldWallet({ goldGrams: data.data.senderBalance, frozenGold: goldWallet?.frozenGold || 0 })
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
        if (msg.includes('کد تأیید') || msg.includes('نادرست') || msg.includes('منقضی') || msg.includes('تلاش')) {
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
  }, [otpCode, rawCardNumber, parsedAmount, note, token, totalDeduct, goldWallet, setGoldWallet, addTransaction, addToast])

  const resetForm = useCallback(() => {
    setStep('input'); setCardInput(''); setAmountGrams(''); setNote('')
    setRecipient(null); setResult(null); setErrorMsg('')
    setOtpCode(''); setOtpSent(false); setOtpError(false); setOtpErrorMessage('')
    setOtpCountdown(0); setDevCode(null)
    setCaptcha(generateCaptcha()); setCaptchaAnswer(''); setCaptchaError(false); setCaptchaTouched(false)
  }, [])

  const quickAmounts = [
    { label: '۰.۰۱', value: 0.01 },
    { label: '۰.۰۵', value: 0.05 },
    { label: '۰.۱', value: 0.1 },
    { label: '۰.۵', value: 0.5 },
    { label: '۱', value: 1 },
  ]

  useEffect(() => { if (step === 'input' && inputRef.current) inputRef.current.focus() }, [step])

  // ── Auto-submit when all 4 OTP digits entered ──
  useEffect(() => {
    if (step === 'otp' && otpCode.length === 4 && !submitting) {
      const t = setTimeout(() => handleVerifyAndTransfer(), 300)
      return () => clearTimeout(t)
    }
  }, [otpCode.length, step, handleVerifyAndTransfer])

  // ── وقتی کاربر جواب کپچا را تایپ می‌کند، خطا را پاک کن ──
  useEffect(() => {
    if (captchaTouched && captchaAnswer && parseInt(captchaAnswer) === captcha.answer) {
      setCaptchaError(false)
    }
  }, [captchaAnswer, captcha.answer, captchaTouched])

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="mx-auto w-full max-w-md px-3 pb-6" dir="rtl">

      {/* هدر */}
      <div className="mb-5 flex items-center gap-3">
        {onClose && (
          <button onClick={onClose} className="flex size-9 items-center justify-center rounded-xl bg-muted transition-colors hover:bg-muted/80">
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-yellow-600/20">
            <ArrowLeftRight className="size-5 text-gold" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">انتقال طلا (کارت‌به‌کارت)</h2>
            <p className="text-[11px] text-muted-foreground">انتقال از کارت شما به کارت دیگر</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  STEP: INPUT                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {step === 'input' && (
        <div id="gt-new" className="space-y-4">

          {/* کارت مبدا */}
          {myCard && (
            <MiniCard
              name={user?.fullName || user?.phone || ''}
              maskedCard={myCard.maskedNumber}
              theme="gold-dark"
              label="از کارت شما"
            />
          )}

          {/* فلش */}
          <div className="flex items-center justify-center py-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-yellow-600/10">
              <ArrowDownUp className="size-4 text-gold" />
            </div>
          </div>

          {/* شماره کارت مقصد — فقط عددی */}
          <Card className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <Label className="text-xs font-medium text-muted-foreground">💳 شماره کارت مقصد (۱۶ رقم)</Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={formatCardDisplay(cardInput)}
                  onChange={(e) => handleCardChange(e.target.value)}
                  className={cn(
                    'h-13 text-base font-mono pr-12 tracking-[0.2em]',
                    recipient && 'border-emerald-500/50 bg-emerald-500/5',
                    !recipient && rawCardNumber.length >= 16 && !previewLoading && 'border-destructive/50'
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

              {/* شمارنده ارقام */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                  <Shield className="size-3" />
                  <span>انتقال فقط بین کارت‌های فعال زرین گلد</span>
                </div>
                <span className={cn(
                  'text-[10px] font-mono',
                  rawCardNumber.length === 16 ? 'text-emerald-500 font-bold' : 'text-muted-foreground/50'
                )}>
                  {rawCardNumber.length}/16
                </span>
              </div>

              {/* پیش‌نمایش کارت گیرنده */}
              {recipient && (
                <div className="animate-[fadeIn_0.3s_ease]">
                  <MiniCard
                    name={recipient.fullName}
                    maskedCard={recipient.maskedCard}
                    theme={recipient.designTheme}
                    label="به کارت مقصد"
                  />
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="size-4 text-emerald-500" />
                      <span className="text-xs font-bold text-foreground">{recipient.fullName}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono" dir="ltr">{recipient.maskedPhone}</span>
                  </div>
                </div>
              )}

              {!recipient && rawCardNumber.length >= 16 && !previewLoading && (
                <p className="text-[11px] text-destructive">کارت مقصد یافت نشد</p>
              )}
            </CardContent>
          </Card>

          {/* مقدار انتقال */}
          <Card className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <Label className="text-xs font-medium text-muted-foreground">⚖️ مقدار انتقال (گرم طلا)</Label>
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
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">گرم</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((qa) => (
                  <button key={qa.value} onClick={() => setAmountGrams(String(qa.value))}
                    disabled={qa.value > availableGold}
                    className={cn(
                      'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all',
                      qa.value > availableGold ? 'cursor-not-allowed border-border/50 text-muted-foreground/40'
                        : parseFloat(amountGrams) === qa.value ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border bg-muted/30 text-foreground hover:border-gold/50'
                    )}
                  >{qa.label} گرم</button>
                ))}
              </div>

              {parsedAmount > 0 && goldPrice != null && goldPrice.marketPrice > 0 && (
                <div className="rounded-lg bg-muted/50 p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">معادل طلایی:</span>
                    <span className="font-bold text-foreground">{formatGrams(fiatEquiv / (goldPrice?.marketPrice || 1))}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">قیمت هر گرم:</span>
                    <span className="text-foreground">{formatGrams(1)}</span>
                  </div>
                </div>
              )}

              {parsedAmount > 0 && !hasEnough && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div className="text-[11px]">
                    <p className="font-medium text-destructive">موجودی کافی نیست</p>
                    <p className="text-muted-foreground">نیاز: {formatGrams(totalDeduct)} | موجودی: {formatGrams(availableGold)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* توضیحات */}
          <Card className="overflow-hidden">
            <CardContent className="space-y-2 p-4">
              <Label className="text-xs font-medium text-muted-foreground">💬 توضیحات (اختیاری)</Label>
              <Input type="text" placeholder="مثلاً: بابت خرید" value={note} onChange={(e) => setNote(e.target.value)} maxLength={100} className="h-10 text-sm" />
            </CardContent>
          </Card>

          {/* خلاصه + دکمه */}
          <Card className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">از کارت:</span>
                  <span className="font-mono text-foreground text-[11px]" dir="ltr">{myCard?.maskedNumber || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">به کارت:</span>
                  <span className="font-mono text-foreground text-[11px]" dir="ltr">{recipient?.maskedCard || '—'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">مقدار انتقال:</span>
                  <span className="font-bold text-gold">{formatGrams(parsedAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">کارمزد:</span>
                  <span className="text-foreground">{feeGrams > 0 ? formatGrams(feeGrams) : 'رایگان 🎉'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">مجموع کسر:</span>
                  <span className="font-bold text-foreground">{formatGrams(totalDeduct)}</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (recipient && hasEnough && parsedAmount > 0) {
                    setStep('confirm')
                    refreshCaptcha()
                  }
                }}
                disabled={!recipient || !hasEnough || parsedAmount <= 0}
                className="h-12 w-full text-sm font-bold shadow-lg shadow-gold/20"
                style={{ background: 'linear-gradient(135deg, #d4af37, #b8941e)', color: '#0a0a0f' }}
              >
                <Send className="ml-2 size-4" />
                ادامه و تأیید
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  STEP: CONFIRM + CAPTCHA                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {step === 'confirm' && recipient && (
        <div className="space-y-4">
          <Card id="gt-fee" className="overflow-hidden border-amber-500/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                <p className="text-sm font-bold text-amber-500">تأیید انتقال کارت‌به‌کارت</p>
              </div>

              <MiniCard name={user?.fullName || 'کاربر'} maskedCard={myCard?.maskedNumber || '----'} theme="gold-dark" label="از کارت" />

              <div className="flex items-center justify-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-yellow-600/10">
                  <ArrowDownUp className="size-5 text-gold" />
                </div>
              </div>

              <MiniCard name={recipient.fullName} maskedCard={recipient.maskedCard} theme={recipient.designTheme} label="به کارت" />

              <div className="space-y-2 rounded-xl bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">مقدار انتقال:</span>
                  <span className="font-bold text-gold text-base">{formatGrams(parsedAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">کارمزد:</span>
                  <span className="text-foreground">{feeGrams > 0 ? formatGrams(feeGrams) : 'رایگان'}</span>
                </div>
                {fiatEquiv > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">معادل طلایی:</span>
                    <span className="text-foreground">{formatGrams(parsedAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-muted-foreground">مجموع کسر:</span>
                  <span className="font-bold text-foreground">{formatGrams(totalDeduct)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">موجودی بعد از انتقال:</span>
                  <span className="font-medium text-foreground">{formatGrams(availableGold - totalDeduct)}</span>
                </div>
                {note && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">توضیحات:</span>
                    <span className="text-foreground">{note}</span>
                  </div>
                )}
              </div>

              {/* ═══ کد امنیتی (ریکپچا) ═══ */}
              <MathCaptcha
                captchaValue={captcha.question}
                captchaAnswer={captchaAnswer}
                onCaptchaChange={(val) => { setCaptchaAnswer(val); setCaptchaError(false) }}
                onCaptchaInput={() => setCaptchaTouched(true)}
                onRefresh={refreshCaptcha}
                error={captchaError}
              />

              {/* اعلان OTP */}
              <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
                <Smartphone className="mt-0.5 size-4 shrink-0 text-blue-500" />
                <div className="text-[11px]">
                  <p className="font-medium text-blue-600">تأیید پیامکی الزامی است</p>
                  <p className="text-muted-foreground">در مرحله بعد، کد تأیید ۴ رقمی به شماره موبایل شما ارسال می‌شود.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p className="text-[11px] text-destructive/80">انتقال طلا غیرقابل بازگشت است. آیا مطمئنید؟</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => { setStep('input'); setCaptchaError(false); setCaptchaAnswer('') }} className="h-11 text-sm">
              <ChevronLeft className="ml-1 size-4" /> بازگشت
            </Button>
            <Button onClick={goToOtpStep} disabled={otpSending || !isCaptchaValid}
              className="h-11 text-sm font-bold shadow-lg shadow-gold/20"
              style={{ background: (!isCaptchaValid || otpSending) ? '#444' : 'linear-gradient(135deg, #d4af37, #b8941e)', color: '#0a0a0f' }}>
              {otpSending ? (
                <><div className="ml-2 size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />در حال ارسال کد...</>
              ) : (
                <><KeyRound className="ml-1 size-4" />ارسال کد تأیید</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  STEP: OTP                                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {step === 'otp' && (
        <div className="space-y-4">
          {/* هدر OTP */}
          <Card className="overflow-hidden border-blue-500/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-600/5">
                  <KeyRound className="size-8 text-blue-500" />
                </div>
                <h3 className="text-sm font-bold text-foreground">کد تأیید پیامکی</h3>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  کد ۴ رقمی ارسال شده به شماره موبایل خود را وارد کنید
                </p>
              </div>

              {/* ورودی کد ۴ رقمی */}
              <div className="space-y-3">
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

                {/* پیام خطای OTP */}
                {otpError && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 animate-[fadeIn_0.2s_ease]">
                    <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <p className="text-[11px] text-destructive font-medium">{otpErrorMessage || 'کد تأیید نادرست است'}</p>
                  </div>
                )}

                {/* در حال بررسی */}
                {submitting && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="size-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                    <span className="text-xs text-muted-foreground">در حال بررسی و انتقال...</span>
                  </div>
                )}

                {/* کد dev */}
                {devCode && !submitting && (
                  <div className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <Lock className="size-3 text-amber-600" />
                    <span className="text-[11px] text-amber-700 dark:text-amber-400">
                      کد توسعه: <span className="font-mono font-bold">{devCode}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* تایمر + ارسال مجدد */}
              <div className="flex items-center justify-center">
                {otpCountdown > 0 ? (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span>ارسال مجدد تا <span className="font-mono font-bold text-foreground">{formatCountdown(otpCountdown)}</span></span>
                  </div>
                ) : (
                  <button
                    onClick={resendOtp}
                    disabled={otpSending}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={cn('size-3.5', otpSending && 'animate-spin')} />
                    {otpSending ? 'در حال ارسال...' : 'ارسال مجدد کد تأیید'}
                  </button>
                )}
              </div>

              <Separator />

              {/* خلاصه انتقال */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">به:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{recipient?.fullName}</span>
                    <span className="font-mono text-muted-foreground text-[10px]" dir="ltr">{recipient?.maskedCard}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">مقدار:</span>
                  <span className="font-bold text-gold">{formatGrams(parsedAmount)} گرم</span>
                </div>
                {fiatEquiv > 0 && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">معادل:</span>
                    <span className="text-foreground">{formatToman(fiatEquiv)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* دکمه لغو */}
          <Button
            variant="outline"
            onClick={() => { setStep('confirm'); setOtpCode(''); setOtpError(false); setOtpErrorMessage('') }}
            className="h-11 w-full text-sm"
            disabled={submitting}
          >
            <ChevronLeft className="ml-1 size-4" /> بازگشت به تأیید
          </Button>

          {/* راهنما */}
          <div id="gt-guide" className="flex items-start gap-2 rounded-xl border border-border/50 bg-muted/20 p-3">
            <Shield className="mt-0.5 size-3.5 text-emerald-500 shrink-0" />
            <div className="text-[10px] text-muted-foreground/80 space-y-1">
              <p>• کد تأیید ۲ دقیقه اعتبار دارد</p>
              <p>• حداکثر ۳ بار امکان تلاش مجدد وجود دارد</p>
              <p>• کد تأیید فقط برای انتقال طلا معتبر است</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  STEP: SUCCESS                                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {step === 'success' && result && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-4">
            <div className="relative mb-4 flex size-20 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: '50', strokeDashoffset: '50', animation: 'draw 0.6s ease forwards 0.3s' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-emerald-500">انتقال موفق!</h3>
            <p className="mt-1 text-sm text-muted-foreground">{formatGrams(result.amountGrams)} طلا کارت‌به‌کارت شد</p>
          </div>

          {/* رسید */}
          <Card id="gt-recent" className="overflow-hidden border-emerald-500/20">
            <CardContent className="p-4 space-y-3">
              <p className="text-center text-xs font-bold text-emerald-600">رسید انتقال کارت‌به‌کارت</p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">کد پیگیری:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-foreground" dir="ltr">{result.transferRef}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(result.transferRef); addToast('کد پیگیری کپی شد', 'success') }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </div>
              </div>

              <Separator />

              {/* کارت‌ها */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">از کارت:</span>
                  <span className="font-mono text-foreground text-[10px]" dir="ltr">{result.senderCard.maskedNumber}</span>
                </div>
                <div className="flex items-center justify-center py-0.5">
                  <ArrowDownUp className="size-3 text-gold" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">به کارت:</span>
                  <span className="font-mono text-foreground text-[10px]" dir="ltr">{result.recipient.maskedCard}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">نام گیرنده:</span>
                  <span className="font-medium text-foreground">{result.recipient.fullName}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">مقدار انتقال:</span>
                  <span className="font-bold text-gold">{formatGrams(result.amountGrams)} گرم</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">کارمزد:</span>
                  <span className="text-foreground">{result.feeGrams > 0 ? formatGrams(result.feeGrams) + ' گرم' : 'رایگان'}</span>
                </div>
                {result.fiatEquivalent > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">معادل طلایی:</span>
                    <span className="text-foreground">{formatGrams(result.amountGrams)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-muted-foreground">موجودی فعلی:</span>
                  <span className="font-bold text-foreground">{formatGrams(result.senderBalance)} گرم</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-muted-foreground/50 pt-1">
                {new Date(result.createdAt).toLocaleString('fa-IR')}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={resetForm}
            className="h-12 w-full text-sm font-bold shadow-lg shadow-gold/20"
            style={{ background: 'linear-gradient(135deg, #d4af37, #b8941e)', color: '#0a0a0f' }}
          >
            انتقال جدید
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  STEP: ERROR                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {step === 'error' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-4">
            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-destructive/10">
              <X className="size-10 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-destructive">انتقال ناموفق</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center px-4">{errorMsg || 'خطایی در انتقال طلا رخ داده است'}</p>
          </div>

          <Card className="overflow-hidden border-destructive/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive/60" />
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <p>• مطمئن شوید موجودی طلای کافی دارید</p>
                  <p>• کارت مقصد باید فعال باشد</p>
                  <p>• کد تأیید باید معتبر باشد</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setStep('input')} className="h-11 text-sm">
              <ChevronLeft className="ml-1 size-4" /> بازگشت
            </Button>
            <Button onClick={resetForm} className="h-11 text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #d4af37, #b8941e)', color: '#0a0a0f' }}>
              تلاش مجدد
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
