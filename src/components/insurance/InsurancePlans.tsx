'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ArrowUpDown,
  Shield,
  Check,
  BadgeCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { motion } from '@/lib/framer-compat';
import type { InsurancePlan, InsuranceCategory, SortOption } from './types';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Fallback Plans                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const FALLBACK_PLANS: InsurancePlan[] = [
  {
    id: 'p1', name: 'بیمه شخص ثالث پایه', categoryId: '1', providerId: 'ir1',
    provider: { id: 'ir1', name: 'بیمه ایران', slug: 'iran', color: '#D4AF37' },
    basePrice: 2500000, sellingPrice: 2800000, duration: '۱ ساله', durationDays: 365,
    coverages: [
      { title: 'خسارت مالی اشخاص ثالث', amount: '۱,۰۰۰,۰۰۰,۰۰۰ ریال', description: 'پوشش خسارت مالی وارد شده به اشخاص ثالث' },
      { title: 'خسارت بدنی اشخاص ثالث', amount: '۷۰۰,۰۰۰,۰۰۰ ریال به ازای هر نفر', description: 'پوشش دیه و هزینه‌های درمانی' },
      { title: 'خسارت به راننده مقصر', amount: '۱۵۰,۰۰۰,۰۰۰ ریال', description: 'پوشش خسارت بدنی راننده مقصر حادثه' },
    ],
    status: 'active', isPopular: false,
  },
  {
    id: 'p2', name: 'بیمه شخص ثالث طلایی', categoryId: '1', providerId: 'asia',
    provider: { id: 'asia', name: 'بیمه آسیا', slug: 'asia', color: '#10B981' },
    basePrice: 3200000, sellingPrice: 3500000, duration: '۱ ساله', durationDays: 365,
    coverages: [
      { title: 'خسارت مالی اشخاص ثالث', amount: '۱,۰۰۰,۰۰۰,۰۰۰ ریال', description: 'پوشش خسارت مالی وارد شده به اشخاص ثالث' },
      { title: 'خسارت بدنی اشخاص ثالث', amount: '۷۰۰,۰۰۰,۰۰۰ ریال به ازای هر نفر', description: 'پوشش دیه و هزینه‌های درمانی' },
      { title: 'خسارت به راننده مقصر', amount: '۲۵۰,۰۰۰,۰۰۰ ریال', description: 'پوشش خسارت بدنی راننده مقصر حادثه' },
      { title: 'سرویس امداد و نجات', amount: 'رایگان', description: '۱۲ ماه امداد جاده‌ای رایگان' },
      { title: 'خسارت سرقت', amount: 'تا ۵۰٪ قیمت خودرو', description: 'پوشش سرقت دربسته یا قطعات خودرو' },
    ],
    status: 'active', isPopular: true,
  },
  {
    id: 'p3', name: 'بیمه شخص ثالث نقره‌ای', categoryId: '1', providerId: 'dana',
    provider: { id: 'dana', name: 'بیمه دانا', slug: 'dana', color: '#8B5CF6' },
    basePrice: 2300000, sellingPrice: 2550000, duration: '۱ ساله', durationDays: 365,
    coverages: [
      { title: 'خسارت مالی اشخاص ثالث', amount: '۱,۰۰۰,۰۰۰,۰۰۰ ریال', description: 'پوشش خسارت مالی وارد شده به اشخاص ثالث' },
      { title: 'خسارت بدنی اشخاص ثالث', amount: '۷۰۰,۰۰۰,۰۰۰ ریال به ازای هر نفر', description: 'پوشش دیه و هزینه‌های درمانی' },
      { title: 'خسارت به راننده مقصر', amount: '۱۰۰,۰۰۰,۰۰۰ ریال', description: 'پوشش خسارت بدنی راننده مقصر حادثه' },
    ],
    status: 'active', isPopular: false,
  },
  {
    id: 'p4', name: 'بیمه شخص ثالث الماسی', categoryId: '1', providerId: 'alborz',
    provider: { id: 'alborz', name: 'بیمه البرز', slug: 'alborz', color: '#F59E0B' },
    basePrice: 3800000, sellingPrice: 4100000, duration: '۱ ساله', durationDays: 365,
    coverages: [
      { title: 'خسارت مالی اشخاص ثالث', amount: '۱,۰۰۰,۰۰۰,۰۰۰ ریال', description: 'پوشش خسارت مالی وارد شده به اشخاص ثالث' },
      { title: 'خسارت بدنی اشخاص ثالث', amount: '۷۰۰,۰۰۰,۰۰۰ ریال به ازای هر نفر', description: 'پوشش دیه و هزینه‌های درمانی' },
      { title: 'خسارت به راننده مقصر', amount: '۳۰۰,۰۰۰,۰۰۰ ریال', description: 'پوشش خسارت بدنی راننده مقصر حادثه' },
      { title: 'سرویس امداد و نجات', amount: 'رایگان', description: '۱۲ ماه امداد جاده‌ای رایگان' },
      { title: 'خسارت سرقت', amount: 'تا ۷۰٪ قیمت خودرو', description: 'پوشش سرقت دربسته یا قطعات خودرو' },
      { title: 'پرداخت خسارت آنی', amount: 'زیر ۴۸ ساعت', description: 'پرداخت خسارت در کمتر از ۴۸ ساعت' },
    ],
    status: 'active', isPopular: false,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Formatter                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PlanCard                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PlanCard({
  plan,
  onSelect,
  index,
}: {
  plan: InsurancePlan;
  onSelect: (plan: InsurancePlan) => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const providerName = plan.provider?.name || 'نامشخص';
  const providerColor = plan.provider?.color || '#D4AF37';
  const providerInitial = providerName.charAt(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <Card className={`relative border-border/50 bg-card transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 overflow-hidden ${
        plan.isPopular ? 'ring-1 ring-gold/20' : ''
      }`}>
        {/* Popular badge */}
        {plan.isPopular && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-gold to-gold/60" />
        )}

        <CardContent className="p-5">
          {/* Provider + Plan Name */}
          <div className="flex items-start gap-3 mb-4">
            {/* Provider Avatar */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: providerColor }}
            >
              {providerInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground truncate">
                  {/* i18n */}{plan.name}
                </h3>
                {plan.isPopular && (
                  <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px] shrink-0">
                    {/* i18n */}پیشنهاد ویژه
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{providerName}</p>
            </div>
          </div>

          {/* Price + Duration */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">
                {/* i18n */}حق بیمه سالانه
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold gold-gradient-text">
                  {formatPrice(plan.sellingPrice)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {/* i18n */}تومان
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-border/50">
              {/* i18n */}{plan.duration}
            </Badge>
          </div>

          {/* Quick coverage summary */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {plan.coverages.slice(0, 3).map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                <Check className="h-2.5 w-2.5 text-emerald-500" />
                {c.title}
              </span>
            ))}
            {plan.coverages.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-[10px] text-gold">
                +{plan.coverages.length - 3} {/* i18n */}بیشتر
              </span>
            )}
          </div>

          <Separator className="mb-4" />

          {/* Expandable Coverages */}
          <div className="mb-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                {/* i18n */}جزئیات پوشش‌ها
              </span>
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
                className="mt-3 space-y-3 rounded-lg bg-muted/30 p-3"
              >
                {plan.coverages.map((cov, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-2.5 w-2.5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-foreground">
                          {cov.title}
                        </span>
                        {cov.amount && (
                          <span className="text-[10px] text-gold font-medium">
                            {cov.amount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {cov.description}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Buy Button */}
          <Button
            onClick={() => onSelect(plan)}
            className="w-full bg-gold text-black hover:bg-gold/90 font-bold gap-2"
          >
            <BadgeCheck className="h-4 w-4" />
            {/* i18n */}مشاهده و خرید
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PlansSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-start gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface InsurancePlansProps {
  category: InsuranceCategory;
  onSelectPlan: (plan: InsurancePlan) => void;
  onBack: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'cheapest', label: 'ارزان‌ترین' },
  { value: 'expensive', label: 'گران‌ترین' },
  { value: 'popular', label: 'محبوب‌ترین' },
];

export default function InsurancePlans({
  category,
  onSelectPlan,
  onBack,
}: InsurancePlansProps) {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('cheapest');

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch(`/api/insurance/plans?categoryId=${category.id}`);
        if (res.ok) {
          const data = await res.json();
          const list: InsurancePlan[] = data.plans || data || [];
          if (list.length > 0) {
            setPlans(list.filter((p) => p.status === 'active'));
          } else {
            setPlans(FALLBACK_PLANS);
          }
        } else {
          setPlans(FALLBACK_PLANS);
        }
      } catch {
        setPlans(FALLBACK_PLANS);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, [category.id]);

  const sortedPlans = useMemo(() => {
    const sorted = [...plans];
    switch (sortBy) {
      case 'cheapest':
        sorted.sort((a, b) => a.sellingPrice - b.sellingPrice);
        break;
      case 'expensive':
        sorted.sort((a, b) => b.sellingPrice - a.sellingPrice);
        break;
      case 'popular':
        sorted.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
        break;
    }
    return sorted;
  }, [plans, sortBy]);

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
            {/* i18n */}طرح‌های بیمه {category.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            {/* i18n */}{sortedPlans.length} طرح از شرکت‌های بیمه مختلف
          </p>
        </div>
      </div>

      {/* Sort Buttons */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground ml-1">
          {/* i18n */}مرتب‌سازی:
        </span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              sortBy === opt.value
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
            }`}
          >
            {/* i18n */}{opt.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <PlansSkeleton />}

      {/* Empty */}
      {!loading && sortedPlans.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Shield className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-bold text-foreground mb-1">
            {/* i18n */}طرحی یافت نشد
          </h3>
          <p className="text-xs text-muted-foreground">
            {/* i18n */}در حال حاضر طرح بیمه‌ای برای این دسته‌بندی موجود نیست
          </p>
        </div>
      )}

      {/* Plans List */}
      {!loading && sortedPlans.length > 0 && (
        <div className="space-y-4">
          {sortedPlans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={onSelectPlan}
              index={i}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
