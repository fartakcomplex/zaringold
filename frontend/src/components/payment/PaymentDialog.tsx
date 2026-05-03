
import React, { useState, useCallback } from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {CreditCard, ShieldCheck, Loader2, CheckCircle, XCircle, Wallet, Info, ExternalLink, ArrowLeftRight, Clock, BadgePercent, Building2} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {useAppStore} from '@/lib/store';
import {formatToman, formatNumber} from '@/lib/helpers';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants                                                       */
/* ═══════════════════════════════════════════════════════════════ */

const QUICK_AMOUNTS = [
  { value: 50000, label: '۵۰ هزار' },
  { value: 100000, label: '۱۰۰ هزار' },
  { value: 500000, label: '۵۰۰ هزار' },
  { value: 1000000, label: '۱ میلیون' },
  { value: 5000000, label: '۵ میلیون' },
  { value: 10000000, label: '۱۰ میلیون' },
  { value: 50000000, label: '۵۰ میلیون' },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Component                                                       */
/* ═══════════════════════════════════════════════════════════════ */

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentDialog({ open, onOpenChange }: PaymentDialogProps) {
  const { user, addToast, setFiatWallet, fiatWallet } = useAppStore();

  /* ── State ── */
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error' | 'history'>('form');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    paymentURL: string;
    paymentId: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<Array<{
    id: string;
    amount: number;
    status: string;
    refId: string | null;
    cardPan: string | null;
    createdAt: string;
  }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const amountNum = Number(amount) || 0;

  /* ── Handlers ── */
  const handleSubmit = useCallback(async () => {
    if (!user?.id || amountNum < 10000) {
      setError('مبلغ باید حداقل ۱۰,۰۰۰ واحد طلایی باشد');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: amountNum,
          description: `شارژ کیف پول — ${formatToman(amountNum)}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentResult({
          paymentURL: data.data.paymentURL,
          paymentId: data.data.paymentId,
        });
        window.open(data.data.paymentURL, '_blank', 'noopener,noreferrer');
        setStep('processing');
        addToast('درگاه پرداخت باز شد. پس از پرداخت، وضعیت را بررسی کنید.', 'success');
      } else {
        setError(data.message || 'خطا در ایجاد درگاه پرداخت');
      }
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, amountNum, addToast]);

  const handleCheckPayment = useCallback(async () => {
    if (!paymentResult?.paymentId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentResult.paymentId,
          authority: '',
          status: 'OK',
        }),
      });
      const data = await res.json();
      if (data.success && data.data.status === 'paid') {
        setStep('success');
        setFiatWallet({
          ...fiatWallet,
          balance: fiatWallet.balance + data.data.amount,
        });
        addToast(`مبلغ ${formatToman(data.data.amount)} با موفقیت واریز شد!`, 'success');
      } else {
        addToast('پرداخت هنوز انجام نشده یا لغو شده است', 'warning');
      }
    } catch {
      addToast('خطا در بررسی وضعیت پرداخت', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [paymentResult, fiatWallet, setFiatWallet, addToast]);

  const handleFetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/payment/history?userId=${user.id}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setPaymentHistory(data.payments || []);
      }
    } catch {
      /* silent */
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id]);

  const handleTabChange = useCallback(
    (newStep: typeof step) => {
      if (newStep === 'history') handleFetchHistory();
      setStep(newStep);
    },
    [handleFetchHistory]
  );

  const handleReset = useCallback(() => {
    setStep('form');
    setAmount('');
    setError('');
    setPaymentResult(null);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setTimeout(handleReset, 300);
  }, [onOpenChange, handleReset]);

  /* ── Status badge helper ── */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px]">
            <CheckCircle className="ml-1 size-3" />
            موفق
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-[10px]">
            <Clock className="ml-1 size-3" />
            در انتظار
          </Badge>
        );
      case 'failed':
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-[10px]">
            <XCircle className="ml-1 size-3" />
            ناموفق
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
    }
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  Render                                                          */
  /* ═══════════════════════════════════════════════════════════════ */

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-gold/20 p-0">
        {/* Gold accent top bar */}
        <div className="h-1 w-full bg-gradient-to-l from-gold via-amber-400 to-gold" />

        <DialogHeader className="px-6 pb-2 pt-4 text-right">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gold/10">
                <CreditCard className="size-5 text-gold" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">درگاه پرداخت</p>
                <p className="text-[11px] text-muted-foreground">زرین‌پال — امن و سریع</p>
              </div>
            </div>

            {/* Tab buttons */}
            <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={() => handleTabChange('form')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
                  step !== 'history'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Wallet className="ml-1 inline size-3" />
                پرداخت
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('history')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
                  step === 'history'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Clock className="ml-1 inline size-3" />
                تاریخچه
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6 pb-6">
          <AnimatePresence mode="wait">
            {/* ═══════════════════════════════════════════ */}
            {/*  PAYMENT FORM                                 */}
            {/* ═══════════════════════════════════════════ */}
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                {/* Security badge */}
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      پرداخت امن با رمز دوم
                    </p>
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70">
                      تمامی تراکنش‌ها توسط زرین‌پال تأمین می‌شوند
                    </p>
                  </div>
                </div>

                {/* Amount input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">مبلغ واریز (واحد طلایی)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setError('');
                      }}
                      placeholder="مثلاً ۱,۰۰۰,۰۰۰"
                      className="h-14 rounded-xl border-gold/20 bg-muted/30 text-left text-lg font-bold tabular-nums placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-gold/30"
                      min={10000}
                      max={100000000}
                      dir="ltr"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      واحد طلایی
                    </span>
                  </div>

                  {/* Quick amounts */}
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_AMOUNTS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setAmount(String(item.value));
                          setError('');
                        }}
                        className={cn(
                          'rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all',
                          Number(amount) === item.value
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border bg-muted/30 text-muted-foreground hover:border-gold/30 hover:bg-gold/5'
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Amount preview */}
                  {amountNum >= 10000 && (
                    <div className="flex items-center gap-2 rounded-lg bg-gold/5 p-2.5">
                      <Info className="size-4 text-gold" />
                      <p className="text-[11px] text-muted-foreground">
                        معادل{' '}
                        <span className="font-semibold text-gold">
                          {formatNumber(amountNum)}
                        </span>{' '}
                        واحد طلایی
                      </p>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                    <XCircle className="size-4 text-red-500" />
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || amountNum < 10000}
                  className="h-14 w-full rounded-xl bg-gold text-gold-dark text-base font-bold hover:bg-gold/90 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="ml-2 size-5 animate-spin" />
                      در حال اتصال به درگاه...
                    </>
                  ) : (
                    <>
                      <CreditCard className="ml-2 size-5" />
                      پرداخت با زرین‌پال
                    </>
                  )}
                </Button>

                {/* Footer */}
                <div className="space-y-2">
                  <Separator />
                  <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="size-3" />
                      SSL رمزگذاری
                    </span>
                    <span className="flex items-center gap-1">
                      <BadgePercent className="size-3" />
                      بدون کارمزد
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3" />
                      تمام بانک‌ها
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/*  PROCESSING / SUCCESS / ERROR               */}
            {/* ═══════════════════════════════════════════ */}
            {(step === 'processing' || step === 'success' || step === 'error') && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5 py-2"
              >
                {step === 'processing' && (
                  <>
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className="relative">
                        <div className="size-20 rounded-full border-4 border-gold/20" />
                        <div className="absolute inset-0 size-20 animate-spin rounded-full border-4 border-transparent border-t-gold" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CreditCard className="size-7 text-gold" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-foreground">در انتظار پرداخت شما</p>
                        <p className="mt-1 text-sm text-muted-foreground">مبلغ: {formatToman(amountNum)} واحد طلایی</p>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">
                        درگاه پرداخت در تب جدید باز شده. پس از انجام پرداخت، دکمه زیر را بزنید.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleCheckPayment}
                        disabled={submitting}
                        className="flex-1 bg-gold text-gold-dark font-bold hover:bg-gold/90"
                      >
                        {submitting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle className="ml-1 size-4" />
                        )}
                        بررسی وضعیت
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (paymentResult?.paymentURL) {
                            window.open(paymentResult.paymentURL, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="flex-1"
                      >
                        <ExternalLink className="ml-1 size-4" />
                        بازگشت به درگاه
                      </Button>
                    </div>

                    <Button variant="ghost" onClick={handleReset} className="w-full text-muted-foreground">
                      <ArrowLeftRight className="ml-1 size-3" />
                      مبلغ دیگری واریز کنم
                    </Button>
                  </>
                )}

                {step === 'success' && (
                  <>
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                        <CheckCircle className="size-10 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">پرداخت موفق!</p>
                        <p className="mt-1 text-sm text-muted-foreground">مبلغ به کیف پول شما اضافه شد</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                      <div className="space-y-2 text-center">
                        <p className="text-sm text-muted-foreground">مبلغ واریز شده</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatToman(amountNum)}</p>
                        <p className="text-xs text-muted-foreground">واحد طلایی</p>
                      </div>
                    </div>
                    <Button onClick={handleReset} className="w-full bg-gold text-gold-dark font-bold hover:bg-gold/90">
                      واریز مجدد
                    </Button>
                  </>
                )}

                {step === 'error' && (
                  <>
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className="flex size-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
                        <XCircle className="size-10 text-red-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-500">پرداخت انجام نشد</p>
                        <p className="mt-1 text-sm text-muted-foreground">لطفاً دوباره تلاش کنید</p>
                      </div>
                    </div>
                    <Button onClick={handleReset} className="w-full bg-gold text-gold-dark font-bold hover:bg-gold/90">
                      تلاش مجدد
                    </Button>
                  </>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/*  PAYMENT HISTORY                             */}
            {/* ═══════════════════════════════════════════ */}
            {step === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-2"
              >
                {historyLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="size-6 animate-spin text-gold" />
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted/50">
                      <Clock className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">هنوز پرداختی انجام نشده</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentHistory.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl border bg-muted/10 p-3">
                        <div
                          className={cn(
                            'flex size-9 items-center justify-center rounded-lg',
                            p.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                              : p.status === 'pending'
                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                          )}
                        >
                          {p.status === 'paid' ? (
                            <CheckCircle className="size-4" />
                          ) : p.status === 'pending' ? (
                            <Clock className="size-4" />
                          ) : (
                            <XCircle className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold tabular-nums text-foreground">{formatToman(p.amount)}</p>
                            {getStatusBadge(p.status)}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{p.cardPan || '—'}</span>
                            {p.refId && <span>• {p.refId}</span>}
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" onClick={() => setStep('form')} className="w-full">
                  <Wallet className="ml-1 size-3" />
                  پرداخت جدید
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
