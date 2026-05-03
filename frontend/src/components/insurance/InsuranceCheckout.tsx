
import React, { useState } from 'react';
import {ArrowRight, Shield, User, FileText, CreditCard, Check, Loader2, CheckCircle2} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Checkbox} from '@/components/ui/checkbox';
import {Separator} from '@/components/ui/separator';
import {motion} from '@/lib/framer-compat';
import {useAppStore} from '@/lib/store';
import type { InsurancePlan, InsuranceCategory } from './types';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Formatter                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PersonalInfo {
  holderName: string;
  holderPhone: string;
  holderNationalId: string;
  holderEmail: string;
}

interface InsuranceCheckoutProps {
  category: InsuranceCategory;
  plan: InsurancePlan;
  personalInfo: PersonalInfo;
  formData: Record<string, any>;
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Summary Row                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SummaryRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 text-gold shrink-0" />
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <span className={`text-xs font-medium text-foreground truncate ${valueClassName || ''}`}>
        {value}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function InsuranceCheckout({
  category,
  plan,
  personalInfo,
  formData,
  onBack,
  onSuccess,
}: InsuranceCheckoutProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const addToast = useAppStore((s) => s.addToast);
  const user = useAppStore((s) => s.user);

  const commission = plan.sellingPrice - plan.basePrice;
  const providerName = plan.provider?.name || 'نامشخص';
  const providerColor = plan.provider?.color || '#D4AF37';

  const handlePay = async () => {
    if (!termsAccepted) {
      addToast('لطفاً شرایط و قوانین را بپذیرید', 'error'); // i18n
      return;
    }

    setIsPaying(true);

    try {
      const res = await fetch('/api/insurance/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          planId: plan.id,
          personalInfo,
          formData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPaySuccess(true);
        addToast('بیمه‌نامه با موفقیت صادر شد!', 'success'); // i18n
        // Delay to show success animation
        setTimeout(() => {
          onSuccess(data.order?.id || data.id || 'new');
        }, 1500);
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.message || 'خطا در صدور بیمه‌نامه', 'error'); // i18n
      }
    } catch {
      addToast('خطا در برقراری ارتباط', 'error'); // i18n
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          disabled={isPaying || paySuccess}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {/* i18n */}تأیید و پرداخت
          </h2>
          <p className="text-xs text-muted-foreground">
            {/* i18n */}اطلاعات سفارش خود را بررسی کنید
          </p>
        </div>
      </div>

      {/* Success Animation */}
      {paySuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-12"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            {/* i18n */}بیمه‌نامه با موفقیت صادر شد!
          </h3>
          <p className="text-sm text-muted-foreground">
            {/* i18n */}در حال انتقال به جزئیات بیمه‌نامه...
          </p>
        </motion.div>
      )}

      {!paySuccess && (
        <>
          {/* Plan Summary */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-gold" />
                </div>
                {/* i18n */}خلاصه بیمه‌نامه
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow
                icon={Shield}
                label="نوع بیمه" // i18n
                value={category.name}
              />
              <SummaryRow
                icon={FileText}
                label="طرح بیمه" // i18n
                value={`${plan.name} - ${providerName}`}
              />
              <SummaryRow
                icon={CreditCard}
                label="مدت پوشش" // i18n
                value={plan.duration}
              />

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2 rounded-lg bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {/* i18n */}قیمت پایه
                  </span>
                  <span className="text-xs text-foreground">
                    {formatPrice(plan.basePrice)} {/* i18n */}تومان
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {/* i18n */}کارمزد
                  </span>
                  <span className="text-xs text-gold">
                    {formatPrice(commission)} {/* i18n */}تومان
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    {/* i18n */}مبلغ نهایی
                  </span>
                  <span className="text-lg font-bold gold-gradient-text">
                    {formatPrice(plan.sellingPrice)} {/* i18n */}تومان
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info Summary */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-gold" />
                </div>
                {/* i18n */}اطلاعات گیرنده
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow
                icon={User}
                label="نام گیرنده" // i18n
                value={personalInfo.holderName}
              />
              <SummaryRow
                icon={FileText}
                label="شماره موبایل" // i18n
                value={personalInfo.holderPhone}
                valueClassName="font-mono text-[11px]"
              />
              <SummaryRow
                icon={FileText}
                label="کد ملی" // i18n
                value={personalInfo.holderNationalId}
                valueClassName="font-mono text-[11px]"
              />
              {personalInfo.holderEmail && (
                <SummaryRow
                  icon={FileText}
                  label="ایمیل" // i18n
                  value={personalInfo.holderEmail}
                  valueClassName="font-mono text-[11px]"
                />
              )}
            </CardContent>
          </Card>

          {/* Terms */}
          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-4">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(v) => setTermsAccepted(v === true)}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="cursor-pointer text-xs text-muted-foreground leading-relaxed">
              {/* i18n */}شرایط و قوانین بیمه را مطالعه کرده و می‌پذیرم. با خرید بیمه‌نامه، تمامی قوانین و مقررات مربوطه را قبول دارم.
            </label>
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePay}
            disabled={!termsAccepted || isPaying}
            className="w-full bg-gold text-black hover:bg-gold/90 font-bold py-5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPaying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {/* i18n */}در حال پرداخت...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                {/* i18n */}پرداخت و صدور بیمه‌نامه
              </>
            )}
          </Button>

          {/* Security notice */}
          <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Check className="h-3 w-3 text-emerald-500" />
            {/* i18n */}پرداخت امن با رمزنگاری SSL
          </p>
        </>
      )}
    </motion.div>
  );
}
