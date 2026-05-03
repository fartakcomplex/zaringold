'use client'

import {useState, useEffect, useCallback} from 'react'
import {CreditCard, Eye, EyeOff, Copy, Check, Lock, Unlock, Wifi, Settings, RefreshCw, Shield, Globe, Zap, ChevronLeft, Snowflake, Smartphone, Mail, QrCode, ToggleLeft, ToggleRight, Palette, CreditCardIcon, Nfc, BadgeCheck, AlertTriangle, ExternalLink, Gem} from 'lucide-react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {useAppStore} from '@/lib/store'
import {formatToman, formatGrams, cn} from '@/lib/helpers'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GoldCardData {
  id: string
  cardNumber: string
  maskedNumber: string
  formattedNumber: string
  expiry: string
  holderName: string
  cardType: string
  status: string
  designTheme: string
  dailyLimit: number
  monthlyLimit: number
  onlineEnabled: boolean
  contactlessEnabled: boolean
  nfcEnabled: boolean
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Themes                                                             */
/* ------------------------------------------------------------------ */

const CARD_THEMES: Record<string, { bg: string; chip: string; text: string; sub: string; accent: string; border: string; glow: string }> = {
  'gold-dark': {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)',
    chip: 'linear-gradient(135deg, #d4af37, #f5d061, #b8941e)',
    text: '#e2e8f0',
    sub: '#94a3b8',
    accent: '#d4af37',
    border: 'rgba(212,175,55,0.3)',
    glow: '0 20px 60px rgba(212,175,55,0.15)',
  },
  'gold-light': {
    bg: 'linear-gradient(135deg, #2d1b00 0%, #4a2c0a 30%, #6b3a0a 60%, #2d1b00 100%)',
    chip: 'linear-gradient(135deg, #f5d061, #ffe082, #d4af37)',
    text: '#fef3c7',
    sub: '#d4a574',
    accent: '#f59e0b',
    border: 'rgba(245,158,11,0.4)',
    glow: '0 20px 60px rgba(245,158,11,0.2)',
  },
  'platinum': {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 30%, #4a4a6a 60%, #1a1a2e 100%)',
    chip: 'linear-gradient(135deg, #c0c0c0, #e8e8e8, #a0a0a0)',
    text: '#e2e8f0',
    sub: '#a1a1aa',
    accent: '#c0c0c0',
    border: 'rgba(192,192,192,0.3)',
    glow: '0 20px 60px rgba(192,192,192,0.15)',
  },
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function GoldCardView() {
  const { user, goldWallet, fiatWallet, goldPrice, token, addToast } = useAppStore()

  const [card, setCard] = useState<GoldCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [showNumber, setShowNumber] = useState(false)
  const [showCVV, setShowCVV] = useState(false)
  const [copied, setCopied] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [showThemes, setShowThemes] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('gold-dark')

  // ── بارگذاری کارت ──
  const loadCard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/card', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.card) {
        setCard(data.card)
        setCurrentTheme(data.card.designTheme || 'gold-dark')
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [token])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/card', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!cancelled && data.success && data.card) {
          setCard(data.card)
          setCurrentTheme(data.card.designTheme || 'gold-dark')
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [token])

  // ── صدور کارت ──
  const issueCard = useCallback(async () => {
    setIssuing(true)
    try {
      const res = await fetch('/api/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (data.success && data.card) {
        setCard(data.card)
        setCurrentTheme(data.card.designTheme || 'gold-dark')
        addToast(data.message, 'success')
      } else {
        addToast(data.message || 'خطا در صدور کارت', 'error')
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error')
    }
    setIssuing(false)
  }, [token, addToast])

  // ── فریز/آنفریز ──
  const toggleFreeze = useCallback(async () => {
    if (!card) return
    try {
      const res = await fetch('/api/card', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'freeze' }),
      })
      const data = await res.json()
      if (data.success && data.card) {
        setCard(data.card)
        addToast(data.message, data.card.status === 'frozen' ? 'info' : 'success')
      }
    } catch {
      addToast('خطا در تغییر وضعیت کارت', 'error')
    }
  }, [card, token, addToast])

  // ── تغییر تم ──
  const changeTheme = useCallback(async (theme: string) => {
    if (!card) return
    try {
      const res = await fetch('/api/card', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'settings', designTheme: theme }),
      })
      const data = await res.json()
      if (data.success && data.card) {
        setCard(data.card)
        setCurrentTheme(theme)
        setShowThemes(false)
        addToast('تم کارت تغییر کرد', 'success')
      }
    } catch { /* ignore */ }
  }, [card, token, addToast])

  // ── کپی ──
  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    addToast(`${label} کپی شد`, 'success')
    setTimeout(() => setCopied(''), 2000)
  }, [addToast])

  const theme = CARD_THEMES[currentTheme] || CARD_THEMES['gold-dark']
  const isFrozen = card?.status === 'frozen'
  const availableGold = goldWallet ? Math.max(0, goldWallet.goldGrams - goldWallet.frozenGold) : 0

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="mx-auto w-full max-w-md px-3 pb-6" dir="rtl">

      {/* ── هدر ── */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-yellow-600/20">
          <CreditCard className="size-5 text-gold" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">کارت طلایی زرین گلد</h2>
          <p className="text-[11px] text-muted-foreground">کارت مجازی هوشمند طلایی</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  بدون کارت — صدور                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {!card && !loading && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-center py-10 px-4 text-center">
              <div className="mb-4 flex size-20 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))' }}>
                <CreditCard className="size-10 text-gold" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">کارت طلایی خود را داشته باشید!</h3>
              <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
                کارت مجازی زرین گلد با قابلیت پرداخت آنلاین، NFC و پوز در آینده نزدیک
              </p>
              <Button
                onClick={issueCard}
                disabled={issuing}
                className="h-12 w-full max-w-xs text-sm font-bold shadow-lg"
                style={{
                  background: issuing ? '#666' : 'linear-gradient(135deg, #d4af37, #b8941e)',
                  color: '#0a0a0f',
                }}
              >
                {issuing ? (
                  <>
                    <div className="ml-2 size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    در حال صدور...
                  </>
                ) : (
                  <>
                    <CreditCard className="ml-2 size-4" />
                    صدور کارت مجازی رایگان
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* ویژگی‌ها */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield, label: 'رمزنگاری AES-256', desc: 'امنیت بانکی' },
              { icon: Wifi, label: 'پرداخت بی‌سیم', desc: 'NFC آماده' },
              { icon: Globe, label: 'پرداخت آنلاین', desc: 'تمام سایت‌ها' },
              { icon: Zap, label: 'آنی و سریع', desc: 'حواله لحظه‌ای' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-border/50 bg-muted/30 p-3">
                <f.icon className="mb-2 size-5 text-gold" />
                <p className="text-xs font-bold text-foreground">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  کارت فعال                                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {card && (
        <div className="space-y-4">
          {/* ── کارت مجازی ── */}
          <div id="gc-info" className="perspective-1000">
            <div
              className={cn(
                'relative overflow-hidden rounded-2xl p-5 transition-all duration-500',
                isFrozen && 'opacity-60 saturate-50',
              )}
              style={{
                background: theme.bg,
                boxShadow: theme.glow,
                aspectRatio: '1.586 / 1',
                border: `1px solid ${theme.border}`,
              }}
            >
              {/* هولوگرام */}
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  background: isFrozen
                    ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(100,200,255,0.1) 10px, rgba(100,200,255,0.1) 20px)'
                    : 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212,175,55,0.15) 10px, rgba(212,175,55,0.15) 20px)',
                }}
              />

              {/* لایه فریز */}
              {isFrozen && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                  <Snowflake className="mb-2 size-10 text-cyan-400" />
                  <p className="text-sm font-bold text-cyan-300">کارت مسدود (فریز) شده</p>
                  <p className="mt-1 text-[10px] text-cyan-400/70">برای فعال‌سازی دکمه آنفریز را بزنید</p>
                </div>
              )}

              {/* سطر بالا: لوگو + NFC */}
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black tracking-wider" style={{ color: theme.accent }}>
                      ZARRIN GOLD
                    </span>
                    <Gem className="size-3.5" style={{ color: theme.accent }} />
                  </div>
                  <p className="mt-0.5 text-[9px] font-medium" style={{ color: theme.sub }}>
                    Gold Digital Card
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Nfc className="size-5" style={{ color: theme.accent }} />
                  <Badge
                    className="text-[8px] font-bold px-1.5 py-0"
                    style={{
                      background: card.cardType === 'physical' ? 'rgba(212,175,55,0.3)' : 'rgba(212,175,55,0.2)',
                      color: theme.accent,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    {card.cardType === 'physical' ? 'PHYSICAL' : 'VIRTUAL'}
                  </Badge>
                </div>
              </div>

              {/* تراشه */}
              <div className="relative mt-4 ml-1">
                <div
                  className="h-9 w-12 rounded-md"
                  style={{ background: theme.chip, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                >
                  <div className="flex h-full flex-col justify-center gap-[2px] px-1.5">
                    <div className="h-[1px] w-full rounded" style={{ background: 'rgba(0,0,0,0.2)' }} />
                    <div className="h-[1px] w-2/3 rounded" style={{ background: 'rgba(0,0,0,0.2)' }} />
                    <div className="h-[1px] w-full rounded" style={{ background: 'rgba(0,0,0,0.2)' }} />
                    <div className="h-[1px] w-1/2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>

              {/* شماره کارت */}
              <div className="relative mt-4 flex items-center justify-center" dir="ltr">
                <p
                  className="text-xl font-bold tracking-[0.2em]"
                  style={{ color: theme.text, fontFamily: 'monospace' }}
                >
                  {showNumber ? card.formattedNumber : card.maskedNumber}
                </p>
              </div>

              {/* سطر پایین: نام + انقضا + نوع */}
              <div className="relative mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[8px] uppercase" style={{ color: theme.sub }}>Card Holder</p>
                  <p className="mt-0.5 text-sm font-bold" style={{ color: theme.text }} dir="ltr">
                    {card.holderName || '—'}
                  </p>
                </div>
                <div className="text-left" dir="ltr">
                  <p className="text-[8px] uppercase" style={{ color: theme.sub }}>Expires</p>
                  <p className="mt-0.5 text-sm font-bold" style={{ color: theme.text }}>
                    {card.expiry}
                  </p>
                </div>
                <div className="text-left" dir="ltr">
                  <p className="text-[8px] uppercase" style={{ color: theme.sub }}>CVV</p>
                  <div className="flex items-center gap-1">
                    <p className="mt-0.5 text-sm font-bold" style={{ color: theme.text }}>
                      {showCVV ? '***' : '***'}
                    </p>
                    <button onClick={() => setShowCVV(!showCVV)} className="opacity-50 hover:opacity-100">
                      {showCVV ? <EyeOff className="size-3" style={{ color: theme.sub }} /> : <Eye className="size-3" style={{ color: theme.sub }} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── دکمه‌های سریع زیر کارت ── */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setShowNumber(!showNumber)}
              className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-2.5 transition-colors hover:bg-muted"
            >
              {showNumber ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
              <span className="text-[10px] text-muted-foreground">{showNumber ? 'مخفی' : 'نمایش'}</span>
            </button>
            <button
              onClick={() => copyToClipboard(card.formattedNumber, 'شماره کارت')}
              className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-2.5 transition-colors hover:bg-muted"
            >
              {copied === 'شماره کارت' ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4 text-muted-foreground" />}
              <span className="text-[10px] text-muted-foreground">{copied === 'شماره کارت' ? 'کپی شد' : 'کپی'}</span>
            </button>
            <button
              onClick={toggleFreeze}
              className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-2.5 transition-colors hover:bg-muted"
            >
              {isFrozen ? <Unlock className="size-4 text-emerald-500" /> : <Snowflake className="size-4 text-cyan-500" />}
              <span className="text-[10px] text-muted-foreground">{isFrozen ? 'آنفریز' : 'فریز'}</span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-2.5 transition-colors hover:bg-muted"
            >
              <Settings className="size-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">تنظیمات</span>
            </button>
          </div>

          {/* ── موجودی کارت ── */}
          <div id="gc-transactions" className="grid grid-cols-2 gap-3">
            <Card className="overflow-hidden">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">موجودی طلای کارت</p>
                <p className="mt-1 text-lg font-bold text-gold">{formatGrams(availableGold)}</p>
                {goldPrice && (
                  <p className="text-[10px] text-muted-foreground">≈ {formatToman(Math.round(availableGold * Number(goldPrice)))}</p>
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">موجودی واحد طلایی کارت</p>
                <p className="mt-1 text-lg font-bold text-foreground">{formatToman(Math.round(fiatWallet.balance))}</p>
                <p className="text-[10px] text-muted-foreground">قابل برداشت</p>
              </CardContent>
            </Card>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/*  تنظیمات کارت                                                   */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {showSettings && (
            <Card id="gc-settings" className="overflow-hidden animate-[fadeIn_0.3s_ease]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Settings className="size-4 text-gold" />
                  تنظیمات کارت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* پرداخت آنلاین */}
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-gold" />
                    <div>
                      <p className="text-xs font-medium text-foreground">پرداخت آنلاین</p>
                      <p className="text-[10px] text-muted-foreground">خرید از سایت‌ها و اپلیکیشن‌ها</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full cursor-pointer transition-all',
                      card.onlineEnabled ? 'bg-emerald-500/20' : 'bg-muted'
                    )}
                  >
                    {card.onlineEnabled ? (
                      <ToggleRight className="size-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="size-6 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* پرداخت بدون تماس */}
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="size-4 text-gold" />
                    <div>
                      <p className="text-xs font-medium text-foreground">پرداخت بدون تماس</p>
                      <p className="text-[10px] text-muted-foreground">NFC و دستگاه‌های پوز</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full cursor-pointer transition-all',
                      card.contactlessEnabled ? 'bg-emerald-500/20' : 'bg-muted'
                    )}
                  >
                    {card.contactlessEnabled ? (
                      <ToggleRight className="size-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="size-6 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <Separator />

                {/* محدودیت‌ها */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">محدودیت‌های تراکنش</p>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                    <div>
                      <p className="text-xs text-foreground">سقف روزانه</p>
                      <p className="text-[10px] text-muted-foreground">هر ۲۴ ساعت</p>
                    </div>
                    <span className="text-xs font-bold text-gold">{formatToman(Math.round(card.dailyLimit))}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                    <div>
                      <p className="text-xs text-foreground">سقف ماهانه</p>
                      <p className="text-[10px] text-muted-foreground">هر ۳۰ روز</p>
                    </div>
                    <span className="text-xs font-bold text-gold">{formatToman(Math.round(card.monthlyLimit))}</span>
                  </div>
                </div>

                <Separator />

                {/* تغییر تم */}
                <button
                  onClick={() => setShowThemes(!showThemes)}
                  className="flex w-full items-center justify-between rounded-lg bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="size-4 text-gold" />
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">تم کارت</p>
                      <p className="text-[10px] text-muted-foreground">تغییر رنگ و طرح کارت</p>
                    </div>
                  </div>
                  <ChevronLeft className="size-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/*  انتخاب تم                                                       */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {showThemes && (
            <Card className="overflow-hidden animate-[fadeIn_0.3s_ease]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Palette className="size-4 text-gold" />
                  تم کارت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(CARD_THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => changeTheme(key)}
                      className={cn(
                        'relative overflow-hidden rounded-xl p-1 transition-all',
                        currentTheme === key ? 'ring-2 ring-gold ring-offset-2 ring-offset-background' : 'opacity-70 hover:opacity-100'
                      )}
                    >
                      <div
                        className="h-16 rounded-lg"
                        style={{ background: t.bg, border: `1px solid ${t.border}` }}
                      >
                        <div className="flex h-full items-center justify-center">
                          <CreditCard className="size-5" style={{ color: t.accent }} />
                        </div>
                      </div>
                      <p className="mt-1.5 text-center text-[10px] font-medium text-foreground">
                        {key === 'gold-dark' ? 'طلایی تیره' : key === 'gold-light' ? 'طلایی روشن' : 'پلاتینیوم'}
                      </p>
                      {currentTheme === key && (
                        <BadgeCheck className="absolute left-1 top-1 size-4 text-gold" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── درخواست کارت فیزیکی ── */}
          <Card className="overflow-hidden border-gold/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-yellow-600/10">
                  <CreditCardIcon className="size-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground">کارت فیزیکی زرین گلد</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    در آینده نزدیک امکان چاپ کارت فیزیکی با NFC و قابلیت استفاده در تمام پوز‌های بانکی فراهم می‌شود.
                  </p>
                  <Badge variant="secondary" className="mt-2 bg-amber-500/10 text-amber-600 text-[10px]">
                    به زودی...
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── نکات امنیتی ── */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="size-3.5 text-emerald-500" />
              <span className="text-[11px] font-bold text-muted-foreground">امنیت کارت</span>
            </div>
            <ul className="space-y-1.5 text-[10px] text-muted-foreground/70">
              <li className="flex items-start gap-1.5">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-emerald-500" />
                تمامی تراکنش‌ها با رمزنگاری AES-256 محافظت می‌شوند
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-emerald-500" />
                امکان فریز آنی کارت در صورت مفقودی یا سرقت
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-emerald-500" />
                اعلان لحظه‌ای برای تمامی تراکنش‌ها
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-emerald-500" />
                محدودیت‌های قابل تنظیم برای پرداخت روزانه و ماهانه
              </li>
            </ul>
          </div>

          {/* ── اطلاعات کارت ── */}
          <Card id="gc-share" className="overflow-hidden">
            <CardContent className="space-y-2.5 p-4">
              <p className="text-xs font-bold text-muted-foreground">اطلاعات کارت</p>
              {[
                { label: 'نوع کارت', value: card.cardType === 'physical' ? 'فیزیکی' : 'مجازی' },
                { label: 'شماره کارت', value: card.maskedNumber, copyable: true, copyValue: card.formattedNumber },
                { label: 'تاریخ انقضا', value: card.expiry },
                { label: 'وضعیت', value: isFrozen ? '🔴 مسدود' : '🟢 فعال' },
                { label: 'تاریخ صدور', value: new Date(card.createdAt).toLocaleDateString('fa-IR') },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground" dir={item.label === 'شماره کارت' ? 'ltr' : 'rtl'}>
                      {item.value}
                    </span>
                    {item.copyable && (
                      <button
                        onClick={() => copyToClipboard(item.copyValue!, item.label)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copied === item.label ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-12">
          <div className="mb-3 size-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      )}

      {/* ── استایل ── */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  )
}
