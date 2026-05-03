
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {Shield, Lock, Clock, Copy, Check, AlertTriangle, ArrowRight, RotateCcw, Store, ChevronLeft, FileText, Download} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {cn} from '@/lib/utils';
import TransactionReceipt from '@/components/shared/TransactionReceipt';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GatewayPaymentPageProps {
  paymentId: string;
}

interface PaymentDetail {
  id: string;
  merchantName: string;
  merchantLogo?: string;
  amountGrams: number;
  amountFiat: number;
  feeGrams: number;
  goldPrice: number;
  description: string;
  merchantOrderId: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  transactionId?: string;
}

/* ------------------------------------------------------------------ */
/*  Number Formatting (Persian-aware)                                  */
/* ------------------------------------------------------------------ */

function formatNumber(n: number, locale: 'fa' | 'en' = 'fa'): string {
  const formatted = n.toLocaleString('fa-IR');
  return locale === 'en' ? n.toLocaleString('en-US') : formatted;
}

function toPersianDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

/* ------------------------------------------------------------------ */
/*  Countdown Timer Hook                                                */
/* ------------------------------------------------------------------ */

function useCountdown(targetDate: string) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) {
        setExpired(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [targetDate]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return { minutes, seconds, expired, isUrgent: minutes < 5 && !expired };
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function GatewayPaymentPage({ paymentId }: GatewayPaymentPageProps) {
  const { token, goldWallet, setPage, addToast } = useAppStore();
  const { t, locale } = useTranslation();

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<'success' | 'error' | null>(null);
  const [copied, setCopied] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const { minutes, seconds, expired, isUrgent } = useCountdown(
    payment?.expiresAt ?? new Date().toISOString()
  );

  const isSufficient =
    payment && goldWallet.goldGrams >= payment.amountGrams + payment.feeGrams;

  /* ── Fetch payment details ── */
  const fetchPayment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gateway/pay/${paymentId}/detail`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات پرداخت');
      const data = await res.json();
      setPayment(data.payment);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setLoading(false);
    }
  }, [paymentId, token]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  /* ── Execute payment ── */
  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/gateway/pay/${paymentId}/execute`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setPayResult('success');
        addToast(t('gateway.paymentSuccess'), 'success');
      } else {
        setPayResult('error');
        setError(data.error || t('gateway.paymentFailed'));
      }
    } catch {
      setPayResult('error');
      setError(t('gateway.paymentFailed'));
    } finally {
      setPaying(false);
    }
  };

  /* ── Cancel payment ── */
  const handleCancel = async () => {
    try {
      await fetch(`/api/gateway/pay/${paymentId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast(t('gateway.paymentCancelled'), 'info');
      setPage('dashboard');
    } catch {
      addToast(t('common.error'), 'error');
    }
  };

  /* ── Copy reference ── */
  const handleCopyRef = () => {
    if (payment?.id) {
      navigator.clipboard.writeText(payment.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ── Return to merchant ── */
  const handleReturnToMerchant = () => {
    window.close();
    if (!window.closed) {
      setPage('dashboard');
    }
  };

  /* ── Timer display ── */
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timerDisplay = expired
    ? t('gateway.expired')
    : `${pad(minutes)}:${pad(seconds)}`;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="w-full max-w-md animate-pulse space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-muted" />
          <div className="h-6 w-3/4 mx-auto rounded bg-muted" />
          <div className="h-4 w-1/2 mx-auto rounded bg-muted" />
          <div className="mt-6 space-y-3 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 rounded bg-muted" style={{ width: `${60 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error && !payment) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertTriangle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{t('gateway.loadError')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-6 gap-2"
            onClick={() => setPage('dashboard')}
          >
            <ChevronLeft className="size-4" />
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (!payment) return null;

  /* ── Success state ── */
  if (payResult === 'success') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          {/* Success animation */}
          <div className="checkmark-container mx-auto mb-6">
            <div className="checkmark-circle">
              <svg className="checkmark-svg" viewBox="0 0 52 52">
                <circle
                  className="checkmark-circle-bg"
                  cx="26" cy="26" r="25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="checkmark-check"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-emerald-400">{t('gateway.paymentSuccess')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('gateway.paymentSuccessDesc')}</p>

          {/* Reference */}
          {payment.id && (
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs text-muted-foreground">{t('gateway.refNumber')}</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <code className="text-sm font-mono text-emerald-400">{payment.id.slice(0, 12)}</code>
                <button
                  onClick={handleCopyRef}
                  className="text-muted-foreground hover:text-emerald-400 transition-colors"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Payment summary */}
          <div className="mt-4 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm text-start">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('gateway.amountPaid')}</span>
              <span className="font-medium text-foreground">
                {formatNumber(payment.amountGrams + payment.feeGrams, locale)} {t('common.gram')}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">{t('gateway.merchantName')}</span>
              <span className="font-medium text-foreground">{payment.merchantName}</span>
            </div>
          </div>

          <Button
            className="mt-6 w-full gap-2 bg-gradient-to-l from-gold to-amber-500 text-black font-bold hover:opacity-90"
            onClick={handleReturnToMerchant}
          >
            <ArrowRight className="size-4" />
            {t('gateway.returnToMerchant')}
          </Button>

          {/* Invoice Download Button */}
          {payment && (
            <Button
              variant="outline"
              className="mt-3 w-full gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              onClick={() => setShowReceipt(true)}
            >
              <FileText className="size-4" />
              دانلود فاکتور PDF
            </Button>
          )}

          {/* Transaction Receipt Overlay */}
          {showReceipt && payment && (
            <TransactionReceipt
              data={{
                id: payment.id,
                type: 'gateway_payment',
                amountGold: payment.amountGrams + payment.feeGrams,
                amountFiat: payment.amountFiat,
                fee: 0,
                goldPrice: payment.goldPrice,
                status: 'completed',
                referenceId: payment.id,
                description: payment.description,
                createdAt: payment.createdAt,
                merchantName: payment.merchantName,
                merchantOrderId: payment.merchantOrderId,
              }}
              onClose={() => setShowReceipt(false)}
            />
          )}
        </div>
      </div>
    );
  }

  /* ── Main payment card ── */
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header: Merchant info */}
        <div className="rounded-t-2xl border border-border/50 border-b-0 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Logo placeholder */}
            <div className="flex size-12 items-center justify-center rounded-xl bg-gold/15">
              <Store className="size-6 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{payment.merchantName}</h3>
              <p className="text-xs text-muted-foreground">{t('gateway.goldPayment')}</p>
            </div>
            {/* Countdown */}
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-bold',
                expired
                  ? 'bg-red-500/10 text-red-500'
                  : isUrgent
                    ? 'bg-amber-500/10 text-amber-500 animate-pulse'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              <Clock className="size-3.5" />
              {timerDisplay}
            </div>
          </div>
        </div>

        {/* Amount card */}
        <div className="border-x border-border/50 bg-card/30 px-5 py-6 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('gateway.paymentAmount')}</p>
            <p className="text-3xl font-bold gold-gradient-text">
              {formatNumber(payment.amountGrams, locale)}
              <span className="ms-1 text-lg font-normal text-gold/70">{t('common.gram')}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              ≈ {formatNumber(payment.amountFiat, locale)} {t('common.toman')}
            </p>
          </div>

          <Separator className="my-4 bg-border/50" />

          {/* Details */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('gateway.fee')}</span>
              <span className="font-medium">{formatNumber(payment.feeGrams, locale)} {t('common.gram')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('gateway.goldPrice')}</span>
              <span className="font-medium">{formatNumber(payment.goldPrice, locale)} {t('common.toman')}/{t('common.gram')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('gateway.totalDeduction')}</span>
              <span className="font-bold text-foreground">
                {formatNumber(payment.amountGrams + payment.feeGrams, locale)} {t('common.gram')}
              </span>
            </div>

            {payment.description && (
              <>
                <Separator className="bg-border/30" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('gateway.description')}</p>
                  <p className="text-sm text-foreground/80">{payment.description}</p>
                </div>
              </>
            )}

            <Separator className="bg-border/30" />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>#{payment.merchantOrderId}</span>
              <span>{new Date(payment.createdAt).toLocaleDateString('fa-IR')}</span>
            </div>
          </div>
        </div>

        {/* Balance card */}
        <div
          className={cn(
            'border-x border-border/50 px-5 py-4 backdrop-blur-sm',
            isSufficient ? 'bg-card/30' : 'bg-red-500/5'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t('gateway.yourGoldBalance')}</p>
              <p className="text-lg font-bold text-foreground">
                {formatNumber(goldWallet.goldGrams, locale)}{' '}
                <span className="text-sm font-normal text-muted-foreground">{t('common.gram')}</span>
              </p>
            </div>
            {!isSufficient ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500">
                <AlertTriangle className="size-3.5" />
                {t('gateway.insufficientBalance')}
              </div>
            ) : (
              <div className="text-start">
                <p className="text-xs text-muted-foreground">{t('gateway.balanceAfter')}</p>
                <p className="text-sm font-medium text-emerald-400">
                  {formatNumber(goldWallet.goldGrams - payment.amountGrams - payment.feeGrams, locale)} {t('common.gram')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-b-2xl border border-border/50 border-t-0 bg-card/50 p-5 backdrop-blur-sm">
          {/* Error message */}
          {payResult === 'error' && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            className="w-full gap-2 bg-gradient-to-l from-gold to-amber-500 text-black font-bold text-base py-5 hover:opacity-90 disabled:opacity-50"
            onClick={handlePay}
            disabled={paying || expired || !isSufficient}
          >
            {paying ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                {t('gateway.processing')}
              </span>
            ) : expired ? (
              t('gateway.expired')
            ) : !isSufficient ? (
              t('gateway.insufficientBalance')
            ) : (
              <>
                <Lock className="size-4" />
                {t('gateway.payFromWallet')}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="mt-3 w-full gap-2"
            onClick={handleCancel}
            disabled={paying}
          >
            {t('common.cancel')}
          </Button>

          {/* Retry button on error */}
          {payResult === 'error' && (
            <Button
              variant="ghost"
              className="mt-2 w-full gap-2 text-gold hover:text-gold/80"
              onClick={() => setPayResult(null)}
            >
              <RotateCcw className="size-4" />
              {t('gateway.retry')}
            </Button>
          )}
        </div>

        {/* Security footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <Lock className="size-3" />
          <span>{t('gateway.securePayment')}</span>
        </div>

        {/* Transaction ID */}
        {payment.id && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-[10px] text-muted-foreground/40">TX:</span>
            <code className="text-[10px] font-mono text-muted-foreground/40">{payment.id.slice(0, 16)}</code>
            <button
              onClick={handleCopyRef}
              className="text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Inline CSS for checkmark animation */}
      <style jsx global>{`
        .checkmark-container {
          width: 80px;
          height: 80px;
        }
        .checkmark-circle {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .checkmark-svg {
          width: 52px;
          height: 52px;
          color: #22c55e;
        }
        .checkmark-circle-bg {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: checkmark-stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .checkmark-check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: checkmark-stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards;
        }
        @keyframes checkmark-stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
