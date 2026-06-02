'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Code2,
  Eye,
  Palette,
  Maximize2,
  Copy,
  Check,
  Sun,
  Moon,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Settings2,
  Globe,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/lib/store';
import { formatToman, formatNumber, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type WidgetTheme = 'dark' | 'light';
type WidgetSize = 'small' | 'medium' | 'large';

interface PriceData {
  buyPrice: number;
  sellPrice: number;
  marketPrice: number;
  updatedAt: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Configs                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const THEME_CONFIG: Record<WidgetTheme, { bg: string; text: string; border: string; accent: string; label: string; icon: React.ElementType }> = {
  dark: { bg: '#0f0f0f', text: '#ffffff', border: '#2a2a2a', accent: '#D4AF37', label: 'تاریک', icon: Moon },
  light: { bg: '#ffffff', text: '#1a1a1a', border: '#e5e7eb', accent: '#D4AF37', label: 'روشن', icon: Sun },
};

const SIZE_CONFIG: Record<WidgetSize, { width: string; height: string; label: string; icon: React.ElementType }> = {
  small: { width: '300px', height: '220px', label: 'کوچک', icon: Smartphone },
  medium: { width: '350px', height: '320px', label: 'متوسط', icon: Tablet },
  large: { width: '420px', height: '380px', label: 'بزرگ', icon: Monitor },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Widget Preview Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function WidgetPreviewCard({
  theme,
  size,
  showChart,
  showChange,
  price,
  isLoading,
}: {
  theme: WidgetTheme;
  size: WidgetSize;
  showChart: boolean;
  showChange: boolean;
  price: PriceData | null;
  isLoading: boolean;
}) {
  const config = THEME_CONFIG[theme];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-[#D4AF37]/30 bg-[#1e1e1e] p-6 min-h-[360px]">
      <div
        className="transition-all duration-500 ease-out overflow-hidden"
        style={{
          width: sizeConfig.width,
          maxWidth: '100%',
          minHeight: sizeConfig.height,
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-vazir), IRANSans, sans-serif',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          direction: 'rtl',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span style={{ color: config.accent, fontSize: '14px' }}>✦</span>
            <span style={{ color: config.accent, fontSize: '12px', fontWeight: 800 }}>زرین گلد</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ color: config.text, opacity: 0.5, fontSize: '10px' }}>زنده</span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-2">
          <div style={{ color: config.text, opacity: 0.5, fontSize: '10px', marginBottom: '2px' }}>قیمت لحظه‌ای طلا</div>
          {isLoading || !price ? (
            <Skeleton style={{ width: '60%', height: '28px', backgroundColor: config.border }} />
          ) : (
            <div style={{ color: config.accent, fontSize: '26px', fontWeight: 900, direction: 'rtl' }}>
              {formatToman(price.marketPrice)}
            </div>
          )}
        </div>

        {/* Change */}
        {showChange && !isLoading && price && (
          <div className="mb-3">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '3px 8px', borderRadius: '16px',
              backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981',
              fontSize: '11px', fontWeight: 700,
            }}>
              ▲ +0.35% <span style={{ fontSize: '9px', opacity: 0.6 }}>۲۴ ساعت</span>
            </div>
          </div>
        )}

        {/* Chart placeholder */}
        {showChart && (
          <div className="mb-3" style={{
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f9fafb',
            borderRadius: '8px', padding: '8px',
            border: `1px solid ${config.border}`,
          }}>
            <div style={{ fontSize: '9px', color: config.text, opacity: 0.5, marginBottom: '4px' }}>روند ۷ روز اخیر</div>
            {isLoading ? (
              <Skeleton style={{ width: '100%', height: '40px', backgroundColor: config.border }} />
            ) : (
              <svg viewBox="0 0 200 40" className="w-full" style={{ height: '40px' }}>
                <defs>
                  <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points="0,40 30,28 60,32 90,20 120,24 150,14 180,18 200,10 200,40" fill="url(#previewGrad)" />
                <polyline points="30,28 60,32 90,20 120,24 150,14 180,18 200,10" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="200" cy="10" r="2.5" fill="#10B981" />
              </svg>
            )}
          </div>
        )}

        {/* Buy/Sell */}
        {!isLoading && price && (
          <div className="flex gap-2">
            <div style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f9fafb', borderRadius: '8px', padding: '8px', border: `1px solid ${config.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: config.text, opacity: 0.5, marginBottom: '2px' }}>خرید</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: config.text, direction: 'rtl' }}>{formatNumber(price.buyPrice)}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f9fafb', borderRadius: '8px', padding: '8px', border: `1px solid ${config.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: config.text, opacity: 0.5, marginBottom: '2px' }}>فروش</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: config.text, direction: 'rtl' }}>{formatNumber(price.sellPrice)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Widget Generator Component                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function WidgetGeneratorPage() {
  const { addToast } = useAppStore();
  const [selectedTheme, setSelectedTheme] = useState<WidgetTheme>('dark');
  const [selectedSize, setSelectedSize] = useState<WidgetSize>('medium');
  const [copied, setCopied] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [showChart, setShowChart] = useState(true);
  const [showChange, setShowChange] = useState(true);

  /* ── Fetch Prices ── */
  useEffect(() => {
    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        const res = await fetch('/api/widget');
        const data = await res.json();
        if (data.price) {
          setPriceData({ buyPrice: data.buy, sellPrice: data.sell, marketPrice: data.price, updatedAt: data.updatedAt });
        }
      } catch {
        setPriceData({ buyPrice: 8_900_000, sellPrice: 8_875_000, marketPrice: 8_900_000, updatedAt: new Date().toISOString() });
      } finally {
        setPriceLoading(false);
      }
    };
    fetchPrices();
  }, []);

  /* ── Generated Embed Code ── */
  const embedCode = useMemo(() => {
    const sizeConfig = SIZE_CONFIG[selectedSize];
    const params = new URLSearchParams({ theme: selectedTheme });
    return `<iframe\n  src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget?${params.toString()}"\n  width="${sizeConfig.width}"\n  height="${sizeConfig.height}"\n  style="border:none;border-radius:12px;"\n  title="زرین گلد - قیمت لحظه‌ای طلا"\n></iframe>`;
  }, [selectedTheme, selectedSize]);

  /* ── Copy Code Handler ── */
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      addToast('کد با موفقیت کپی شد ✅', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('خطا در کپی کد', 'error');
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <Code2 className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">سازنده ویجت</h1>
          <p className="text-xs text-muted-foreground">ویجت قیمت طلا را شخصی‌سازی و در وبسایت قرار دهید</p>
        </div>
      </div>

      {/* Preview */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-[#D4AF37]" />
            <CardTitle className="text-sm font-bold">پیش‌نمایش ویجت</CardTitle>
          </div>
          <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37]">
            <RefreshCw className="ml-1 size-3" />زنده
          </Badge>
        </CardHeader>
        <CardContent>
          <WidgetPreviewCard
            theme={selectedTheme}
            size={selectedSize}
            showChart={showChart}
            showChange={showChange}
            price={priceData}
            isLoading={priceLoading}
          />
        </CardContent>
      </Card>

      {/* Theme Selector */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Palette className="size-4 text-[#D4AF37]" />
          <CardTitle className="text-sm font-bold">انتخاب تم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'light'] as WidgetTheme[]).map((theme) => {
              const ThemeIcon = THEME_CONFIG[theme].icon;
              const isActive = selectedTheme === theme;
              return (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-3 transition-all',
                    isActive ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-border hover:border-[#D4AF37]/30',
                  )}
                >
                  <div className="size-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: THEME_CONFIG[theme].bg, border: `1px solid ${THEME_CONFIG[theme].border}` }}>
                    <ThemeIcon className={cn('size-3', isActive ? 'text-[#D4AF37]' : 'text-muted-foreground')} />
                  </div>
                  <span className={cn('text-xs font-semibold', isActive ? 'text-[#D4AF37]' : 'text-muted-foreground')}>
                    {THEME_CONFIG[theme].label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Size Selector */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Maximize2 className="size-4 text-[#D4AF37]" />
          <CardTitle className="text-sm font-bold">اندازه ویجت</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(['small', 'medium', 'large'] as WidgetSize[]).map((size) => {
              const SizeIcon = SIZE_CONFIG[size].icon;
              const isActive = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all',
                    isActive ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-border hover:border-[#D4AF37]/30',
                  )}
                >
                  <SizeIcon className={cn('size-5', isActive ? 'text-[#D4AF37]' : 'text-muted-foreground')} />
                  <span className={cn('text-[11px] font-semibold', isActive ? 'text-[#D4AF37]' : 'text-muted-foreground')}>
                    {SIZE_CONFIG[size].label}
                  </span>
                  <span className="text-[9px] text-muted-foreground tabular-nums">{SIZE_CONFIG[size].width}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Settings2 className="size-4 text-[#D4AF37]" />
          <CardTitle className="text-sm font-bold">تنظیمات نمایش</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">نمایش نمودار روند</span>
            </div>
            <Switch checked={showChart} onCheckedChange={setShowChart} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">نمایش درصد تغییر</span>
            </div>
            <Switch checked={showChange} onCheckedChange={setShowChange} />
          </div>
        </CardContent>
      </Card>

      {/* Embed Code */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-[#D4AF37]" />
            <CardTitle className="text-sm font-bold">کد تعبیه (Embed)</CardTitle>
          </div>
          <Button size="sm" onClick={handleCopyCode} className="gap-1.5 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]">
            {copied ? <><Check className="size-3.5" />کپی شد!</> : <><Copy className="size-3.5" />کپی کد</>}
          </Button>
        </CardHeader>
        <CardContent>
          <pre dir="ltr" className="overflow-x-auto rounded-lg border border-border bg-[#1e1e1e] p-4 text-[12px] leading-relaxed text-emerald-400/80 font-mono">
            {embedCode}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-[10px]"><Settings2 className="ml-1 size-3" />وردپرس</Badge>
            <Badge variant="secondary" className="text-[10px]"><Code2 className="ml-1 size-3" />HTML</Badge>
            <Badge variant="secondary" className="text-[10px]"><Globe className="ml-1 size-3" />React</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-[#D4AF37]/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-[#D4AF37]" />
            <div className="text-xs leading-relaxed text-foreground/80">
              <span className="font-bold text-[#D4AF37]">نکته: </span>
              ویجت به‌صورت خودکار هر ۶۰ ثانیه قیمت‌ها را بروزرسانی می‌کند. تم و اندازه را پس از قرار دادن کد تغییر دهید. برای پشتیبانی از سمت راست، ویجت از RTL استفاده می‌کند.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
