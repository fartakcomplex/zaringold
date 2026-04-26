'use client';

import React from 'react';
import {
  ArrowRight,
  Shield,
  User,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Circle,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from '@/lib/framer-compat';
import type { InsuranceOrder } from './types';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Status Config                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  dotClass: string;
}> = {
  pending: {
    label: 'در حال بررسی',
    icon: Clock,
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    dotClass: 'bg-amber-500',
  },
  active: {
    label: 'فعال',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
  },
  expired: {
    label: 'منقضی',
    icon: AlertTriangle,
    badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
    dotClass: 'bg-red-500',
  },
  cancelled: {
    label: 'لغو شده',
    icon: AlertTriangle,
    badgeClass: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    dotClass: 'bg-gray-500',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Formatter                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Info Row                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={`text-xs font-medium text-foreground truncate ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Timeline                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function Timeline({ order }: { order: InsuranceOrder }) {
  const isPending = order.status === 'pending';
  const isActive = order.status === 'active';

  const steps = [
    { label: 'ثبت سفارش', done: true, current: isPending },
    { label: 'بررسی و تأیید', done: isActive, current: false },
    { label: 'صدور بیمه‌نامه', done: isActive, current: isActive },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          {/* Line + Dot */}
          <div className="flex flex-col items-center">
            <div className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center ${
              step.done
                ? 'bg-gold/10 border-2 border-gold'
                : 'bg-muted border-2 border-muted-foreground/20'
            }`}>
              {step.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
              ) : step.current ? (
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              ) : (
                <Circle className="h-3 w-3 text-muted-foreground/30" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-0.5 h-8 ${step.done ? 'bg-gold/30' : 'bg-border'}`} />
            )}
          </div>

          {/* Label */}
          <div className="pb-4">
            <span className={`text-xs font-medium ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
              {/* i18n */}{step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface InsuranceOrderDetailProps {
  order: InsuranceOrder;
  onBack: () => void;
}

export default function InsuranceOrderDetail({
  order,
  onBack,
}: InsuranceOrderDetailProps) {
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

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
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">
            {/* i18n */}جزئیات بیمه‌نامه
          </h2>
          <p className="text-xs text-muted-foreground">
            {order.policyNumber || `#${order.id.slice(0, 8)}`}
          </p>
        </div>
        <Badge className={`${statusCfg.badgeClass} text-xs gap-1.5 px-3 py-1`}>
          <StatusIcon className="h-3.5 w-3.5" />
          {statusCfg.label}
        </Badge>
      </div>

      {/* Policy Info Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-gold" />
            </div>
            {/* i18n */}اطلاعات بیمه‌نامه
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoRow icon={Hash} label="شماره بیمه‌نامه" value={order.policyNumber || `#${order.id.slice(0, 8)}`} mono />
          <InfoRow icon={Shield} label="شرکت بیمه" value={order.providerName || '—'} />
          {order.plan?.name && (
            <InfoRow icon={FileText} label="نوع طرح" value={order.plan.name} />
          )}
          {order.category?.name && (
            <InfoRow icon={FileText} label="دسته‌بندی" value={order.category.name} />
          )}
          <Separator className="my-2" />
          <InfoRow icon={CreditCard} label="مبلغ پرداختی" value={`${formatPrice(order.amountPaid)} تومان`} mono />
          <InfoRow icon={Calendar} label="تاریخ شروع" value={order.startDate || '—'} />
          <InfoRow icon={Calendar} label="تاریخ پایان" value={order.endDate || '—'} />
          <InfoRow icon={Clock} label="تاریخ ثبت" value={
            order.createdAt
              ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(order.createdAt))
              : '—'
          } />
        </CardContent>
      </Card>

      {/* Holder Info Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-gold" />
            </div>
            {/* i18n */}اطلاعات گیرنده
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoRow icon={User} label="نام گیرنده" value={order.personalInfo?.holderName || '—'} />
          <InfoRow icon={Phone} label="شماره موبایل" value={order.personalInfo?.holderPhone || '—'} mono />
          <InfoRow icon={Hash} label="کد ملی" value={order.personalInfo?.holderNationalId || '—'} mono />
          {order.personalInfo?.holderEmail && (
            <InfoRow icon={Mail} label="ایمیل" value={order.personalInfo.holderEmail} mono />
          )}
        </CardContent>
      </Card>

      {/* Coverage Details */}
      {order.plan?.coverages && order.plan.coverages.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center">
                <FileText className="h-3.5 w-3.5 text-gold" />
              </div>
              {/* i18n */}پوشش‌های بیمه‌نامه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.plan.coverages.map((cov, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg bg-muted/30 p-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">{cov.title}</span>
                    {cov.amount && (
                      <span className="text-[10px] text-gold font-medium">{cov.amount}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{cov.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-gold" />
            </div>
            {/* i18n */}وضعیت سفارش
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline order={order} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
