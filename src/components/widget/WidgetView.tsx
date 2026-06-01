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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { formatToman, formatNumber, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type WidgetTheme = 'dark' | 'light' | 'gold' | 'blue';
type WidgetSize = 'small' | 'medium' | 'large';

interface PriceData {
  buyPrice: number;
  sellPrice: number;
  marketPrice: number;
  updatedAt: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Theme Configs                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const THEME_CONFIG: Record<WidgetTheme, { bg: string; text: string; border: string; accent: string; label: string }> = {
  dark: { bg: '#0f0f0f', text: '#ffffff', border: '#2a2a2a', accent: '#D4AF37', label: 'تاریک' },
  light: { bg: '#ffffff', text: '#1a1a1a', border: '#e5e7eb', accent: '#D4AF37', label: 'روشن' },
  gold: { bg: '#1a1a0a', text: '#D4AF37', border: '#3d3a1a', accent: '#FFD700', label: 'طلایی' },
  blue: { bg: '#0a1628', text: '#60A5FA', border: '#1e3a5f', accent: '#3B82F6', label: 'آبی' },
};

const SIZE_CONFIG: Record<WidgetSize, { width: string; height: string; fontSize: string; label: string; icon: React.ElementType }> = {
  small: { width: '200px', height: '120px', fontSize: '12px', label: 'کوچک', icon: Smartphone },
  medium: { width: '300px', height: '200px', fontSize: '14px', label: 'متوسط', icon: Tablet },
  large: { width: '400px', height: '280px', fontSize: '16px', label: 'بزرگ', icon: Monitor },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Widget Preview Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function WidgetPreview({
  theme,
  size,
  price,
  isLoading,
}: {
  theme: WidgetTheme;
  size: WidgetSize;
  price: PriceData | null;
  isLoading: boolean;
}) {
  const config = THEME_CONFIG[theme];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-gold/30 bg-[#1e1e1e] p-6 min-h-[320px]">
      <div
        className="transition-all duration-500 ease-out"
        style={{
          width: sizeConfig.width,
          height: sizeConfig.height,
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: '12px',
          padding: size === 'small' ? '12px' : size === 'medium' ? '16px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-vazir), IRANSans, sans-serif',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles style={{ color: config.accent, fontSize: sizeConfig.fontSize }} />
            <span style={{ color: config.accent, fontSize: sizeConfig.fontSize, fontWeight: 700 }}>
              زرین گلد
            </span>
          </div>
          {size !== 'small' && (
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 6px #22c55e',
              }}
            />
          )}
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1">
          {isLoading || !price ? (
            <>
              <Skeleton
                style={{
                  width: '60%',
                  height: sizeConfig.fontSize,
                  backgroundColor: config.border,
                }}
              />
              <Skeleton
                style={{
                  width: '40%',
                  height: `calc(${sizeConfig.fontSize} * 1.8)`,
                  backgroundColor: config.border,
                }}
              />
            </>
          ) : (
            <>
              <span
                style={{
                  color: config.text,
                  fontSize: `calc(${sizeConfig.fontSize} * 0.8)`,
                  opacity: 0.6,
                }}
              >
                قیمت لحظه‌ای طلا
              </span>
              <span
                style={{
                  color: config.accent,
                  fontSize: `calc(${sizeConfig.fontSize} * 1.6)`,
                  fontWeight: 900,
                  direction: 'rtl',
                }}
              >
                {formatToman(price.marketPrice)}
              </span>
            </>
          )}
        </div>

        {/* Footer */}
        {size !== 'small' && (
          <div
            className="flex items-center justify-between"
            style={{ fontSize: `calc(${sizeConfig.fontSize} * 0.75)` }}
          >
            <span style={{ color: config.text, opacity: 0.5 }}>
              خرید: {isLoading || !price ? '---' : formatNumber(price.buyPrice)}
            </span>
            <span style={{ color: config.text, opacity: 0.5 }}>
              فروش: {isLoading || !price ? '---' : formatNumber(price.sellPrice)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main WidgetView Component                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function WidgetView() {
  const { addToast } = useAppStore();

  /* ── State ── */
  const [selectedTheme, setSelectedTheme] = useState<WidgetTheme>('dark');
  const [selectedSize, setSelectedSize] = useState<WidgetSize>('medium');
  const [copied, setCopied] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [showCode, setShowCode] = useState(false);

  /* ── Fetch Prices ── */
  useEffect(() => {
    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        const res = await fetch('/api/gold/prices');
        const data = await res.json();
        if (data.success && data.prices) {
          setPriceData({
            buyPrice: data.prices.buy ?? 0,
            sellPrice: data.prices.sell ?? 0,
            marketPrice: data.prices.market ?? 0,
            updatedAt: data.prices.updatedAt ?? new Date().toISOString(),
          });
        }
      } catch {
        // fallback
        setPriceData({
          buyPrice: 34000000,
          sellPrice: 33800000,
          marketPrice: 33900000,
          updatedAt: new Date().toISOString(),
        });
      } finally {
        setPriceLoading(false);
      }
    };
    fetchPrices();
  }, []);

  /* ── Generated Embed Code ── */
  const embedCode = useMemo(() => {
    const sizeConfig = SIZE_CONFIG[selectedSize];
    return `<iframe
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget/gold-price"
  width="${sizeConfig.width}"
  height="${sizeConfig.height}"
  style="border:none;border-radius:12px;"
  title="زرین گلد - قیمت لحظه‌ای طلا"
></iframe>`;
  }, [selectedSize]);

  /* ── Copy Code Handler ── */
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      addToast('کد با موفقیت کپی شد', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('خطا در کپی کد', 'error');
    }
  };

  /* ── Theme Button Styles ── */
  const getThemeBtnClass = (theme: WidgetTheme) => {
    const isActive = selectedTheme === theme;
    return cn(
      'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-200',
      isActive
        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
        : 'border-border bg-background text-muted-foreground hover:border-[#D4AF37]/40 hover:text-foreground',
    );
  };

  const getSizeBtnClass = (size: WidgetSize) => {
    const isActive = selectedSize === size;
    const SizeIcon = SIZE_CONFIG[size].icon;
    return (
      <button
        key={size}
        onClick={() => setSelectedSize(size)}
        className={cn(
          'flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200',
          isActive
            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
            : 'border-border bg-background hover:border-[#D4AF37]/30',
        )}
      >
        <SizeIcon className={cn('size-5', isActive ? 'text-[#D4AF37]' : 'text-muted-foreground')} />
        <span className={cn('text-[11px] font-semibold', isActive ? 'text-[#D4AF37]' : 'text-muted-foreground')}>
          {SIZE_CONFIG[size].label}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
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
            <RefreshCw className="ml-1 size-3" />
            زنده
          </Badge>
        </CardHeader>
        <CardContent>
          <WidgetPreview
            theme={selectedTheme}
            size={selectedSize}
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['dark', 'light', 'gold', 'blue'] as WidgetTheme[]).map((theme) => (
              <button key={theme} onClick={() => setSelectedTheme(theme)} className={getThemeBtnClass(theme)}>
                <div
                  className="size-4 rounded-full border"
                  style={{
                    backgroundColor: THEME_CONFIG[theme].bg,
                    borderColor: THEME_CONFIG[theme].border,
                  }}
                />
                {THEME_CONFIG[theme].label}
              </button>
            ))}
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
            {(['small', 'medium', 'large'] as WidgetSize[]).map((size) => getSizeBtnClass(size))}
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
          <Button
            size="sm"
            onClick={handleCopyCode}
            className="gap-1.5 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]"
          >
            {copied ? (
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
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-lg border border-border bg-[#1e1e1e] p-4 text-[12px] leading-relaxed text-emerald-400/80"
            >
              {embedCode}
            </pre>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-[10px]">
              <Settings2 className="ml-1 size-3" />
              وردپرس
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              <Code2 className="ml-1 size-3" />
              HTML
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              <Globe className="ml-1 size-3" />
              React
            </Badge>
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
              ویجت به‌صورت خودکار قیمت‌ها را بروزرسانی می‌کند. می‌توانید تم و اندازه را پس از قرار دادن کد در سایت تغییر دهید.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
