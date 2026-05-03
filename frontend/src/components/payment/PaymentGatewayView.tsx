
import React, { useState, useEffect, useCallback } from 'react';
import {Landmark, Coins, ArrowLeftRight, Link2, QrCode, Clock, Radio, FileText, Key, ExternalLink, ShieldCheck, Lock, Eye, Headphones, ChevronLeft, Sparkles, Zap, Code2, Store, Users, TrendingUp, Activity, CheckCircle2, Copy, Check} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {useAppStore} from '@/lib/store';
import {formatNumber, formatToman} from '@/lib/helpers';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                           */
/* ═══════════════════════════════════════════════════════════════ */

interface MerchantDashboard {
  todaySales: number;
  monthlySales: number;
  totalTransactions: number;
  successRate: number;
  pendingSettlement: number;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Data                                                           */
/* ═══════════════════════════════════════════════════════════════ */

const FEATURES = [
  {
    icon: Coins,
    title: 'پرداخت طلایی',
    desc: 'پذیرش پرداخت مستقیم با گرم طلا',
    gradient: 'from-amber-500/20 to-yellow-600/10',
  },
  {
    icon: ArrowLeftRight,
    title: 'پرداخت ترکیبی',
    desc: 'ترکیب طلا و واحد طلایی در یک تراکنش',
    gradient: 'from-orange-500/20 to-amber-600/10',
  },
  {
    icon: Link2,
    title: 'لینک پرداخت',
    desc: 'ایجاد لینک پرداخت و ارسال فوری',
    gradient: 'from-yellow-500/20 to-amber-500/10',
  },
  {
    icon: QrCode,
    title: 'QR کد',
    desc: 'پرداخت آسان با اسکن بارکد',
    gradient: 'from-gold/20 to-amber-400/10',
  },
  {
    icon: Clock,
    title: 'تسویه خودکار',
    desc: 'تسویه حساب خودکار و روزانه',
    gradient: 'from-emerald-500/20 to-teal-600/10',
  },
  {
    icon: Radio,
    title: 'وب‌هوک',
    desc: 'اطلاع‌رسانی لحظه‌ای تراکنش‌ها',
    gradient: 'from-violet-500/20 to-purple-600/10',
  },
];

const STEPS = [
  {
    num: '۱',
    title: 'ثبت‌نام و دریافت API Key',
    desc: 'با تکمیل فرم ثبت‌نام، کلید API اختصاصی خود را دریافت کنید',
  },
  {
    num: '۲',
    title: 'اتصال به سایت یا اپلیکیشن',
    desc: 'با مستندات ما، درگاه را به سایت یا اپلیکیشن خود متصل کنید',
  },
  {
    num: '۳',
    title: 'شروع پذیرش پرداخت طلایی',
    desc: 'از همین لحظه پرداخت‌های طلایی دریافت کنید',
  },
];

const TRUST_BADGES = [
  { icon: Lock, title: 'SSL رمزگذاری', desc: 'اتصال رمزگذاری‌شده ۲۵۶ بیتی' },
  { icon: ShieldCheck, title: 'PCI DSS', desc: 'استاندارد امنیت پرداخت' },
  { icon: Eye, title: 'ضد تقلب', desc: 'سیستم هوشمند تشخیص تقلب' },
  { icon: Headphones, title: 'پشتیبانی ۲۴/۷', desc: 'پاسخگویی شبانه‌روزی' },
];

const CODE_SNIPPET = `// JavaScript Example
const response = await fetch('https://zarringold.ir/api/v1/payment/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    amount: 5000000,
    callback_url: 'https://yoursite.ir/callback',
    description: 'سفارش #1234'
  })
});`;

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                   */
/* ═══════════════════════════════════════════════════════════════ */

export default function PaymentGatewayView() {
  const { user, addToast } = useAppStore();

  /* ── State ── */
  const [isMerchant, setIsMerchant] = useState<boolean | null>(null);
  const [dashboard, setDashboard] = useState<MerchantDashboard | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  /* ── Fetch merchant dashboard ── */
  const fetchMerchantData = useCallback(async () => {
    if (!user?.id) {
      setIsMerchant(false);
      return;
    }
    setDashLoading(true);
    try {
      const res = await fetch(`/api/v1/merchant/dashboard?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
        setIsMerchant(true);
      } else {
        setIsMerchant(false);
      }
    } catch {
      setIsMerchant(false);
    } finally {
      setDashLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMerchantData();
  }, [fetchMerchantData]);

  /* ── Copy code ── */
  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(CODE_SNIPPET).then(() => {
      setCodeCopied(true);
      addToast('کد با موفقیت کپی شد', 'success');
      setTimeout(() => setCodeCopied(false), 2000);
    }).catch(() => {
      addToast('خطا در کپی کردن', 'error');
    });
  }, [addToast]);

  /* ── Handle CTA buttons ── */
  const handleRegister = useCallback(() => {
    addToast('فرم ثبت‌نام فروشنده به زودی فعال می‌شود', 'info');
  }, [addToast]);

  const handleDocs = useCallback(() => {
    addToast('مستندات API در حال آماده‌سازی است', 'info');
  }, [addToast]);

  /* ═══════════════════════════════════════════════════════════════ */
  /*  Loading State                                                  */
  /* ═══════════════════════════════════════════════════════════════ */

  if (isMerchant === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 pb-28">
        <div className="flex flex-col items-center gap-3 py-8">
          <Skeleton className="skeleton-gold size-20 rounded-3xl" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="skeleton-gold h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="skeleton-gold h-40 rounded-2xl" />
        <Skeleton className="skeleton-gold h-60 rounded-2xl" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  Render                                                         */
  /* ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4 pb-28">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 1: Hero Header                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="glass-gold-strong relative overflow-hidden rounded-3xl p-6 text-center">
        {/* Decorative background circles */}
        <div className="pointer-events-none absolute -top-12 -left-12 size-40 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 size-32 rounded-full bg-gold/5 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Gold gradient icon */}
          <div className="gold-glow flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-gold via-amber-400 to-yellow-600 shadow-xl shadow-gold/25">
            <Landmark className="size-10 text-gold-dark" />
          </div>

          <div>
            <h1 className="gold-gradient-text text-2xl font-extrabold leading-relaxed sm:text-3xl">
              درگاه پرداخت طلایی زرین گلد
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              پذیرش پرداخت بر اساس طلا — برای وبسایت‌ها و اپلیکیشن‌ها
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleRegister}
              className="btn-gold-glow h-12 flex-1 gap-2 rounded-xl text-base font-bold"
            >
              <Sparkles className="size-5" />
              ثبت‌نام فروشنده
            </Button>
            <Button
              onClick={handleDocs}
              variant="outline"
              className="btn-gold-outline h-12 flex-1 gap-2 rounded-xl text-base font-bold"
            >
              <FileText className="size-5" />
              مستندات API
            </Button>
          </div>
        </div>

        {/* Top gold line accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-gold via-amber-400 to-gold" />
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 2: Stats Cards                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isMerchant ? (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="size-5 text-gold" />
            <h2 className="text-lg font-bold text-foreground">داشبورد فروش</h2>
          </div>

          {dashLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="skeleton-gold h-28 rounded-2xl" />
              ))}
            </div>
          ) : dashboard ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {/* فروش امروز */}
              <Card className="card-gold-border overflow-hidden">
                <CardContent className="p-4">
                  <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-gold/15">
                    <TrendingUp className="size-5 text-gold" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">فروش امروز</p>
                  <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                    {formatToman(dashboard.todaySales)}
                  </p>
                </CardContent>
              </Card>

              {/* فروش ماهانه */}
              <Card className="card-gold-border overflow-hidden">
                <CardContent className="p-4">
                  <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-500/15">
                    <Coins className="size-5 text-emerald-500" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">فروش ماهانه</p>
                  <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                    {formatToman(dashboard.monthlySales)}
                  </p>
                </CardContent>
              </Card>

              {/* تراکنش‌ها */}
              <Card className="card-gold-border overflow-hidden">
                <CardContent className="p-4">
                  <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-500/15">
                    <Zap className="size-5 text-sky-500" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">تراکنش‌ها</p>
                  <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                    {formatNumber(dashboard.totalTransactions)}
                  </p>
                </CardContent>
              </Card>

              {/* نرخ موفقیت */}
              <Card className="card-gold-border overflow-hidden">
                <CardContent className="p-4">
                  <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-500/15">
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">نرخ موفقیت</p>
                  <p className="mt-1 text-base font-bold tabular-nums text-emerald-500">
                    {formatNumber(dashboard.successRate)}%
                  </p>
                </CardContent>
              </Card>

              {/* تسویه در انتظار */}
              <Card className="card-gold-border overflow-hidden sm:col-span-2">
                <CardContent className="p-4">
                  <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-amber-500/15">
                    <Clock className="size-5 text-amber-500" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">تسویه در انتظار</p>
                  <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                    {formatToman(dashboard.pendingSettlement)}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-gold/20">
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <div className="flex size-14 items-center justify-center rounded-full bg-gold/10">
                  <Store className="size-7 text-gold" />
                </div>
                <p className="text-sm text-muted-foreground">اطلاعاتی موجود نیست</p>
                <Button onClick={fetchMerchantData} variant="outline" className="btn-gold-outline gap-2">
                  <Activity className="size-4" />
                  بروزرسانی
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      ) : (
        <section>
          <Card className="card-glass-premium overflow-hidden border-gold/20">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-gold via-amber-400 to-gold" />
            <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber-500/10">
                <Users className="size-8 text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">هنوز فروشنده نیستید؟</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  همین الان ثبت‌نام کنید و شروع به پذیرش پرداخت طلایی کنید
                </p>
              </div>
              <Button onClick={handleRegister} className="btn-gold-glow gap-2 rounded-xl font-bold">
                <Sparkles className="size-4" />
                ثبت‌نام به عنوان فروشنده
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 3: Feature Cards Grid (3x2)                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-5 text-gold" />
          <h2 className="text-lg font-bold text-foreground">ویژگی‌های درگاه</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="card-spotlight-gold group cursor-default overflow-hidden border-gold/15 transition-all duration-300 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5"
              >
                <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
                  <div
                    className={cn(
                      'flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110',
                      feature.gradient
                    )}
                  >
                    <Icon className="size-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{feature.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 4: How It Works (3 steps)                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Zap className="size-5 text-gold" />
          <h2 className="text-lg font-bold text-foreground">نحوه استفاده</h2>
        </div>

        <div className="relative space-y-4">
          {/* Vertical connecting line */}
          <div className="absolute right-6 top-6 bottom-6 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent" />

          {STEPS.map((step, idx) => (
            <div key={step.num} className="relative flex gap-4">
              {/* Step number circle */}
              <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold via-amber-400 to-yellow-600 text-sm font-extrabold text-gold-dark shadow-lg shadow-gold/20">
                {step.num}
              </div>

              {/* Step content */}
              <Card className="card-gold-border flex-1 overflow-hidden transition-all duration-300 hover:border-gold/40">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Badge className="badge-gold text-[10px]">
                      مرحله {step.num}
                    </Badge>
                    {idx === 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Sparkles className="ml-1 size-3" />
                        شروع
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 5: API Integration Preview (code snippet)          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="size-5 text-gold" />
            <h2 className="text-lg font-bold text-foreground">نمونه کد اتصال</h2>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-lg border border-gold/20 bg-gold/5 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/10"
          >
            {codeCopied ? (
              <>
                <Check className="size-3.5" />
                کپی شد!
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                کپی کد
              </>
            )}
          </button>
        </div>

        <Card className="overflow-hidden border-gold/20">
          {/* Code header */}
          <div className="flex items-center gap-2 border-b border-gold/10 bg-muted/30 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-red-500/80" />
              <div className="size-3 rounded-full bg-yellow-500/80" />
              <div className="size-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="mr-2 text-xs text-muted-foreground">JavaScript — API Request</span>
          </div>

          {/* Code block */}
          <div className="scrollbar-gold max-h-72 overflow-y-auto bg-zinc-950 p-4 dark:bg-zinc-950">
            <pre className="text-xs leading-relaxed text-zinc-300" dir="ltr">
              <code>
                <span className="text-emerald-400">{'// JavaScript Example'}</span>
                {'\n'}
                <span className="text-sky-400">{'const response'}</span>
                <span className="text-zinc-400">{' = '}</span>
                <span className="text-sky-400">{'await fetch'}</span>
                <span className="text-zinc-400">{'('}</span>
                <span className="text-amber-300">
                  {`'https://zarringold.ir/api/v1/payment/request'`}
                </span>
                <span className="text-zinc-400">{`, {`}</span>
                {'\n'}
                <span className="text-zinc-400">{'  '}</span>
                <span className="text-purple-400">method</span>
                <span className="text-zinc-400">{': '}</span>
                <span className="text-amber-300">{'POST'}</span>
                <span className="text-zinc-400">{','}</span>
                {'\n'}
                <span className="text-zinc-400">{'  '}</span>
                <span className="text-purple-400">headers</span>
                <span className="text-zinc-400">{': {'}</span>
                {'\n'}
                <span className="text-zinc-400">{'    '}</span>
                <span className="text-amber-300">{"'Content-Type'"}</span>
                <span className="text-zinc-400">{': '}</span>
                <span className="text-amber-300">{"'application/json'"}</span>
                <span className="text-zinc-400">{','}</span>
                {'\n'}
                <span className="text-zinc-400">{'    '}</span>
                <span className="text-amber-300">{"'Authorization'"}</span>
                <span className="text-zinc-400">{': '}</span>
                <span className="text-amber-300">{"`Bearer YOUR_API_KEY`"}</span>
                {'\n'}
                <span className="text-zinc-400">{'  '}</span>
                <span className="text-zinc-400">{'}'}</span>
                <span className="text-zinc-400">{','}</span>
                {'\n'}
                <span className="text-zinc-400">{'  '}</span>
                <span className="text-purple-400">body</span>
                <span className="text-zinc-400">{': '}</span>
                <span className="text-sky-400">{'JSON.stringify'}</span>
                <span className="text-zinc-400">{'({'}</span>
                {'\n'}
                <span className="text-zinc-400">{'    '}</span>
                <span className="text-purple-400">amount</span>
                <span className="text-zinc-400">{': '}</span>
                <span className="text-orange-300">{'5000000'}</span>
                <span className="text-zinc-400">{','}</span>
                {'\n'}
                <span className="text-zinc-400">{'    '}</span>
                <span className="text-purple-400">callback_url</span>
                <span className="text-zinc-400">{': '}</span>
                <span className="text-amber-300">{"'https://yoursite.ir/callback'"}</span>
                <span className="text-zinc-400">{','}</span>
                {'\n'}
                <span className="text-zinc-400">{'    '}</span>
                <span className="text-purple-400">description</span>
                <span className="text-zinc-400">{': '}</span>
                <span className="text-amber-300">{"'سفارش #1234'"}</span>
                {'\n'}
                <span className="text-zinc-400">{'  '}</span>
                <span className="text-zinc-400">{'}'}</span>
                <span className="text-zinc-400">{')'}</span>
                {'\n'}
                <span className="text-zinc-400">{'}'}</span>
                <span className="text-zinc-400">{');'}</span>
              </code>
            </pre>
          </div>
        </Card>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 6: Merchant Quick Actions (only if merchant)        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isMerchant && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Store className="size-5 text-gold" />
            <h2 className="text-lg font-bold text-foreground">دسترسی سریع</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => addToast('پنل فروشندگان در حال توسعه است', 'info')}
              className="card-gold-border group flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all duration-300 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gold/15 transition-transform duration-300 group-hover:scale-110">
                <Store className="size-6 text-gold" />
              </div>
              <p className="text-sm font-bold text-foreground">پنل فروشندگان</p>
              <p className="text-[10px] text-muted-foreground">مدیریت کامل فروش</p>
            </button>

            <button
              onClick={() => addToast('ایجاد لینک پرداخت به زودی فعال می‌شود', 'info')}
              className="card-gold-border group flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all duration-300 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 transition-transform duration-300 group-hover:scale-110">
                <Link2 className="size-6 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-foreground">ایجاد لینک پرداخت</p>
              <p className="text-[10px] text-muted-foreground">لینک پرداخت فوری</p>
            </button>

            <button
              onClick={() => addToast('مدیریت API Keys به زودی فعال می‌شود', 'info')}
              className="card-gold-border group flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all duration-300 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 transition-transform duration-300 group-hover:scale-110">
                <Key className="size-6 text-amber-500" />
              </div>
              <p className="text-sm font-bold text-foreground">مدیریت API Keys</p>
              <p className="text-[10px] text-muted-foreground">کلیدهای اختصاصی</p>
            </button>

            <button
              onClick={handleDocs}
              className="card-gold-border group flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all duration-300 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/15 transition-transform duration-300 group-hover:scale-110">
                <FileText className="size-6 text-sky-500" />
              </div>
              <p className="text-sm font-bold text-foreground">مشاهده مستندات</p>
              <p className="text-[10px] text-muted-foreground">راهنمای کامل API</p>
            </button>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 7: Security Trust Badges                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="size-5 text-gold" />
          <h2 className="text-lg font-bold text-foreground">امنیت و اعتماد</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TRUST_BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <Card
                key={badge.title}
                className="glass-gold group overflow-hidden border-gold/15 transition-all duration-300 hover:border-gold/30"
              >
                <CardContent className="flex flex-col items-center gap-2.5 p-4 text-center">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gold/10 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{badge.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      {badge.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Footer divider ── */}
      <div className="gold-divider-animated" />

      {/* ── Footer text ── */}
      <footer className="flex flex-col items-center gap-2 pb-4 text-center">
        <p className="text-xs text-muted-foreground">
          <Landmark className="mr-1 inline size-3 text-gold" />
          میلّی گلد — درگاه پرداخت طلایی هوشمند
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          تمامی تراکنش‌ها با امنیت بالا و رمزگذاری SSL انجام می‌شوند
        </p>
      </footer>
    </div>
  );
}
