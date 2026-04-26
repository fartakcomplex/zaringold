'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { toPersianDigits } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type LucideIcon,
  Brain,
  PiggyBank,
  Coins,
  Target,
  Gift,
  UsersRound,
  MessageSquare,
  TrendingUp,
  Bot,
  Crown,
  Percent,
  GraduationCap,
  Repeat,
  Video,
  MapPin,
  Send,
  AlertTriangle,
  Settings,
  Save,
  Loader2,
  Sparkles,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FeatureItem {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  enabled: boolean;
}

interface ModuleSettings {
  cashbackPercentage: number;
  vipSilverPrice: number;
  vipGoldPrice: number;
  vipBlackPrice: number;
  goldSpreadPercentage: number;
  minTradeAmount: number;
  referralRewardAmount: number;
  giftFeePercentage: number;
  checkInRewardGold: number;
  checkInRewardXP: number;
}

interface FeatureCategory {
  id: string;
  name: string;
  color: string;
  bg: string;
  border: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES: FeatureCategory[] = [
  { id: 'smart_tools', name: 'ابزارهای هوشمند', color: 'text-violet-500', bg: 'bg-violet-500/15', border: 'border-violet-500/20' },
  { id: 'saving', name: 'پس‌انداز و سرمایه‌گذاری', color: 'text-emerald-500', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' },
  { id: 'social', name: 'اجتماعی', color: 'text-blue-500', bg: 'bg-blue-500/15', border: 'border-blue-500/20' },
  { id: 'gamification', name: 'گیمیفیکیشن', color: 'text-amber-500', bg: 'bg-amber-500/15', border: 'border-amber-500/20' },
  { id: 'advanced_trading', name: 'معاملات پیشرفته', color: 'text-cyan-500', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20' },
  { id: 'system', name: 'سیستم', color: 'text-rose-500', bg: 'bg-rose-500/15', border: 'border-rose-500/20' },
];

const DEFAULT_FEATURES: FeatureItem[] = [
  { id: 'smart_buy_ai', name: 'مشاور هوشمند خرید', description: 'تحلیل هوش مصنوعی برای زمان مناسب خرید طلا', icon: Brain, category: 'smart_tools', enabled: true },
  { id: 'ai_coach', name: 'مربی هوشمند مالی', description: 'دستیار مالی شخصی‌سازی شده بر اساس سبد دارایی شما', icon: Bot, category: 'smart_tools', enabled: true },
  { id: 'education', name: 'آکادمی آموزش', description: 'دوره‌های آموزشی سرمایه‌گذاری در بازار طلا', icon: GraduationCap, category: 'smart_tools', enabled: true },
  { id: 'auto_save', name: 'پس‌انداز خودکار طلا', description: 'خرید دوره‌ای و خودکار طلا با مبلغ مشخص', icon: PiggyBank, category: 'saving', enabled: true },
  { id: 'round_up', name: 'گرد‌کردن پس‌انداز', description: 'تبدیل باقیمانده خریدهای روزانه به طلای خرد', icon: Coins, category: 'saving', enabled: true },
  { id: 'saving_goals', name: 'اهداف پس‌انداز', description: 'تعریف هدف مالی و ردیابی پیشرفت پس‌انداز', icon: Target, category: 'saving', enabled: true },
  { id: 'gold_gifts', name: 'هدیه طلایی', description: 'ارسال و دریافت طلای خرد به عنوان هدیه', icon: Gift, category: 'social', enabled: true },
  { id: 'family_wallet', name: 'کیف پول خانواده', description: 'کیف پول مشترک اعضای خانواده برای پس‌انداز', icon: UsersRound, category: 'social', enabled: false },
  { id: 'social_feed', name: 'شبکه اجتماعی', description: 'فید ناشناس سرمایه‌گذاران و اشتراک‌گذاری تجربیات', icon: MessageSquare, category: 'social', enabled: true },
  { id: 'price_prediction', name: 'بازی پیش‌بینی قیمت', description: 'مسابقه روزانه پیش‌بینی قیمت طلا و کسب جایزه', icon: TrendingUp, category: 'gamification', enabled: true },
  { id: 'gold_quest', name: 'کوئست طلایی', description: 'ماموریت‌های روزانه و هفتگی با جایزه طلا و XP', icon: MapPin, category: 'gamification', enabled: true },
  { id: 'creator_club', name: 'کلاب خالقان', description: 'برنامه همکاری در تولید محتوا و کسب درآمد', icon: Video, category: 'gamification', enabled: true },
  { id: 'vip_membership', name: 'اشتراک VIP', description: 'سطوح ویژه نقره‌ای، طلایی و مشکی با مزایا', icon: Crown, category: 'gamification', enabled: true },
  { id: 'cashback', name: 'سیستم کش‌بک', description: 'بازگشت درصدی از مبلغ خرید به کیف پول کاربر', icon: Percent, category: 'gamification', enabled: true },
  { id: 'auto_trading', name: 'معاملات خودکار', description: 'تنظیم سفارش خرید و فروش خودکار بر اساس شرایط', icon: Repeat, category: 'advanced_trading', enabled: true },
  { id: 'telegram_bot', name: 'ربات تلگرام', description: 'دریافت قیمت زنده و مدیریت حساب از طریق تلگرام', icon: Send, category: 'system', enabled: true },
  { id: 'emergency_sell', name: 'فروش اضطراری', description: 'فروش فوری طلای ذخیره شده با یک کلیک', icon: AlertTriangle, category: 'system', enabled: true },
];

const DEFAULT_SETTINGS: ModuleSettings = {
  cashbackPercentage: 2.5,
  vipSilverPrice: 150000,
  vipGoldPrice: 450000,
  vipBlackPrice: 1500000,
  goldSpreadPercentage: 1.2,
  minTradeAmount: 50000,
  referralRewardAmount: 25000,
  giftFeePercentage: 1.5,
  checkInRewardGold: 5,
  checkInRewardXP: 50,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminFeatures() {
  const addToast = useAppStore((s) => s.addToast);

  /* ---- State ---- */
  const [features, setFeatures] = useState<FeatureItem[]>(DEFAULT_FEATURES);
  const [settings, setSettings] = useState<ModuleSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  /* ---- Fetch ---- */
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/features');
      if (res.ok) {
        const data = await res.json();
        if (data.features) setFeatures(data.features);
        if (data.settings) setSettings(data.settings);
      }
    } catch {
      /* use defaults */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Handlers ---- */
  const toggleFeature = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const updateSetting = (key: keyof ModuleSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, settings }),
      });
      if (res.ok) {
        addToast('تنظیمات با موفقیت ذخیره شد', 'success');
      } else {
        addToast('خطا در ذخیره‌سازی تنظیمات', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = features.filter((f) => f.enabled).length;
  const totalCount = features.length;

  /* ---- Loading Skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-gold/25 to-gold/10 flex items-center justify-center border border-gold/20">
            <Settings className="size-5 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              مرکز کنترل ویژگی‌ها
              <Sparkles className="size-4 text-gold" />
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              مدیریت ماژول‌ها و تنظیمات سیستم
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/15 text-emerald-500 text-xs">
            {toPersianDigits(String(enabledCount))} فعال از {toPersianDigits(String(totalCount))}
          </Badge>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-l from-gold to-yellow-500 text-black font-bold hover:from-gold/90 hover:to-yellow-500/90 shadow-md"
          >
            {saving ? (
              <Loader2 className="size-4 ml-1.5 animate-spin" />
            ) : (
              <Save className="size-4 ml-1.5" />
            )}
            ذخیره همه تنظیمات
          </Button>
        </div>
      </div>

      {/* ═══ Stats Row ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'کل ویژگی‌ها', value: totalCount, color: 'text-gold', bg: 'bg-gold/15' },
          { label: 'فعال', value: enabledCount, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
          { label: 'غیرفعال', value: totalCount - enabledCount, color: 'text-red-400', bg: 'bg-red-400/15' },
          { label: 'درصد فعال‌سازی', value: Math.round((enabledCount / totalCount) * 100), suffix: '٪', color: 'text-blue-500', bg: 'bg-blue-500/15' },
        ].map((s) => (
          <Card key={s.label} className="card-spotlight">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className={cn('text-xl font-bold mt-1', s.color)}>
                    {toPersianDigits(String(s.value))}
                    {s.suffix || ''}
                  </p>
                </div>
                <div className={cn('size-10 rounded-lg flex items-center justify-center', s.bg)}>
                  <Settings className={cn('size-5', s.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ Feature Toggles Section ═══ */}
      <Card className="glass-gold">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="size-4 text-gold" />
            ویژگی‌های سیستم
            <Badge className="bg-gold/15 text-gold text-[10px] mr-auto">
              {toPersianDigits(String(totalCount))} ماژول
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-6">
              {CATEGORIES.map((cat) => {
                const catFeatures = features.filter((f) => f.category === cat.id);
                if (catFeatures.length === 0) return null;
                const catEnabled = catFeatures.filter((f) => f.enabled).length;
                const isExpanded = expandedCategory === cat.id || expandedCategory === null;

                return (
                  <div key={cat.id} className="space-y-3">
                    {/* Category Header */}
                    <button
                      onClick={() => setExpandedCategory(isExpanded && expandedCategory === cat.id ? null : cat.id)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer',
                        cat.bg, cat.border,
                        'hover:bg-opacity-80'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('size-8 rounded-lg flex items-center justify-center', cat.bg)}>
                          <span className={cn('text-sm font-bold', cat.color)}>
                            {toPersianDigits(String(catFeatures.length))}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{cat.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {toPersianDigits(String(catEnabled))} از {toPersianDigits(String(catFeatures.length))} فعال
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500',
                              catEnabled === catFeatures.length ? 'bg-emerald-500' : catEnabled > 0 ? 'bg-amber-500' : 'bg-gray-400'
                            )}
                            style={{ width: `${catFeatures.length > 0 ? (catEnabled / catFeatures.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Feature Cards Grid */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {catFeatures.map((feature) => {
                          const Icon = feature.icon;
                          return (
                            <Card
                              key={feature.id}
                              className={cn(
                                'transition-all duration-200',
                                feature.enabled
                                  ? 'border-gold/20 bg-gold/5 shadow-sm'
                                  : 'opacity-70 border-border/50 bg-muted/30'
                              )}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div className={cn(
                                      'size-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors',
                                      feature.enabled
                                        ? 'bg-gold/15 border-gold/25'
                                        : 'bg-muted border-border'
                                    )}>
                                      <Icon className={cn(
                                        'size-5 transition-colors',
                                        feature.enabled ? 'text-gold' : 'text-muted-foreground'
                                      )} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold truncate">{feature.name}</p>
                                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                                        {feature.description}
                                      </p>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={feature.enabled}
                                    onCheckedChange={() => toggleFeature(feature.id)}
                                    className="data-[state=checked]:bg-gold shrink-0"
                                  />
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-[10px]',
                                      feature.enabled
                                        ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                                        : 'border-gray-400/30 text-gray-400 bg-gray-400/10'
                                    )}
                                  >
                                    {feature.enabled ? 'فعال' : 'غیرفعال'}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ═══ Module Settings Section ═══ */}
      <Card className="glass-gold">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="size-4 text-gold" />
            تنظیمات ماژول‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* VIP Prices */}
            <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="size-4 text-gold" />
                <h4 className="text-sm font-bold">قیمت اشتراک VIP</h4>
              </div>
              {[
                { key: 'vipSilverPrice' as const, label: 'نقره‌ای (Silver)', color: 'border-gray-400/50' },
                { key: 'vipGoldPrice' as const, label: 'طلایی (Gold)', color: 'border-gold/50' },
                { key: 'vipBlackPrice' as const, label: 'مشکی (Black)', color: 'border-zinc-600/50' },
              ].map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{item.label}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      dir="ltr"
                      value={settings[item.key]}
                      onChange={(e) => updateSetting(item.key, Number(e.target.value))}
                      className={cn('text-left pr-14', item.color)}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                      واحد طلایی
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Trading Settings */}
            <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-gold" />
                <h4 className="text-sm font-bold">تنظیمات معاملات</h4>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">اسپرد طلا (درصد)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      dir="ltr"
                      step="0.1"
                      value={settings.goldSpreadPercentage}
                      onChange={(e) => updateSetting('goldSpreadPercentage', Number(e.target.value))}
                      className="text-left pr-6"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">٪</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">حداقل مبلغ معامله</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      dir="ltr"
                      value={settings.minTradeAmount}
                      onChange={(e) => updateSetting('minTradeAmount', Number(e.target.value))}
                      className="text-left pr-14"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                      واحد طلایی
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rewards Settings */}
            <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="size-4 text-gold" />
                <h4 className="text-sm font-bold">پاداش‌ها و کمیسیون‌ها</h4>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">درصد کش‌بک</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      dir="ltr"
                      step="0.1"
                      value={settings.cashbackPercentage}
                      onChange={(e) => updateSetting('cashbackPercentage', Number(e.target.value))}
                      className="text-left pr-6"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">٪</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">پاداش دعوت از دوست</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      dir="ltr"
                      value={settings.referralRewardAmount}
                      onChange={(e) => updateSetting('referralRewardAmount', Number(e.target.value))}
                      className="text-left pr-14"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                      واحد طلایی
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">کمیسیون انتقال هدیه</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      dir="ltr"
                      step="0.1"
                      value={settings.giftFeePercentage}
                      onChange={(e) => updateSetting('giftFeePercentage', Number(e.target.value))}
                      className="text-left pr-6"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">٪</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-in Settings */}
            <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="size-4 text-gold" />
                <h4 className="text-sm font-bold">پاداش چک‌این روزانه</h4>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">پاداش طلا (میلی‌گرم)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      dir="ltr"
                      value={settings.checkInRewardGold}
                      onChange={(e) => updateSetting('checkInRewardGold', Number(e.target.value))}
                      className="text-left pr-20"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                      میلی‌گرم
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">پاداش XP</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      dir="ltr"
                      value={settings.checkInRewardXP}
                      onChange={(e) => updateSetting('checkInRewardXP', Number(e.target.value))}
                      className="text-left pr-6"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                      XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3">
            <p className="text-xs text-muted-foreground">
              تغییرات پس از ذخیره‌سازی اعمال خواهند شد
            </p>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-l from-gold to-yellow-500 text-black font-bold hover:from-gold/90 hover:to-yellow-500/90 shadow-md"
            >
              {saving ? (
                <Loader2 className="size-4 ml-1.5 animate-spin" />
              ) : (
                <Save className="size-4 ml-1.5" />
              )}
              ذخیره همه تنظیمات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
