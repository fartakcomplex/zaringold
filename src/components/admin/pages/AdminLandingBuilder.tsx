'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight,
  Save,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  GripVertical,
  Eye,
  EyeOff,
  Crown,
  Sparkles,
  ListOrdered,
  Calculator,
  ShieldCheck,
  Award,
  MessageSquareQuote,
  Newspaper,
  GitCompare,
  HelpCircle,
  Download,
  Rocket,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Settings2,
  Type,
  ImageIcon,
  ToggleLeft,
  Pencil,
  Loader2,
  CircleDot,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface LandingSection {
  id: string;
  sectionId: string;
  title: string;
  icon: string;
  isVisible: boolean;
  sortOrder: number;
  settings: string;
  updatedAt?: string;
}

interface SectionConfig {
  sectionId: string;
  title: string;
  icon: React.ReactNode;
  emoji: string;
  color: string;
  description: string;
  defaultSettings: Record<string, unknown>;
}

type DevicePreview = 'desktop' | 'tablet' | 'mobile';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Section Configurations                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const SECTION_CONFIGS: Record<string, SectionConfig> = {
  hero: {
    sectionId: 'hero',
    title: 'بخش اصلی (Hero)',
    icon: <Crown className="size-4" />,
    emoji: '👑',
    color: 'from-amber-500/20 to-yellow-600/10',
    description: 'بنر اصلی صفحه با عنوان، زیرعنوان و دکمه اقدام',
    defaultSettings: {
      heading: 'طلای خود را هوشمندانه مدیریت کنید',
      subtitle: 'خرید، فروش و پس‌انداز طلای نوین با امنیت بالا',
      badge: 'پلتفرم طلای دیجیتال',
      primaryCta: 'شروع کنید',
      secondaryCta: 'بیشتر بدانید',
      showPriceTicker: true,
      backgroundStyle: 'gradient',
    },
  },
  features: {
    sectionId: 'features',
    title: 'ویژگی‌ها',
    icon: <Sparkles className="size-4" />,
    emoji: '✨',
    color: 'from-violet-500/20 to-purple-600/10',
    description: 'نمایش ویژگی‌های کلیدی پلتفرم',
    defaultSettings: {
      heading: 'چرا زرین گلد؟',
      subtitle: 'مزایای منحصر‌به‌فرد پلتفرم ما',
      items: [
        { icon: '🛡️', title: 'امنیت بالا', description: 'تأیید هویت پیشرفته و رمزنگاری داده‌ها' },
        { icon: '⚡', title: 'سرعت معامله', description: 'خرید و فروش آنی طلا' },
        { icon: '📊', title: 'تحلیل بازار', description: 'نمودارهای حرفه‌ای و ابزارهای تحلیلی' },
      ],
    },
  },
  'how-it-works': {
    sectionId: 'how-it-works',
    title: 'نحوه کارکرد',
    icon: <ListOrdered className="size-4" />,
    emoji: '📋',
    color: 'from-emerald-500/20 to-green-600/10',
    description: 'مراحل ثبت‌نام و شروع استفاده از پلتفرم',
    defaultSettings: {
      heading: 'چگونه شروع کنیم؟',
      subtitle: 'در ۴ مرحله ساده شروع کنید',
      steps: [
        { number: 1, title: 'ثبت‌نام', description: 'با شماره موبایل ثبت‌نام کنید' },
        { number: 2, title: 'احراز هویت', description: 'مدارک خود را آپلود کنید' },
        { number: 3, title: 'شارژ کیف پول', description: 'کیف پول خود را شارژ کنید' },
        { number: 4, title: 'شروع معامله', description: 'خرید و فروش طلا آغاز می‌شود' },
      ],
    },
  },
  calculator: {
    sectionId: 'calculator',
    title: 'ماشین‌حساب طلا',
    icon: <Calculator className="size-4" />,
    emoji: '🧮',
    color: 'from-cyan-500/20 to-teal-600/10',
    description: 'محاسبه قیمت و مقدار طلای قابل خرید',
    defaultSettings: {
      heading: 'ماشین‌حساب طلا',
      showCalculator: true,
    },
  },
  security: {
    sectionId: 'security',
    title: 'امنیت',
    icon: <ShieldCheck className="size-4" />,
    emoji: '🛡️',
    color: 'from-red-500/20 to-rose-600/10',
    description: 'نمایش سطح امنیت و گواهینامه‌های پلتفرم',
    defaultSettings: {
      heading: 'امنیت شما اولویت ماست',
      subtitle: 'با بالاترین استانداردهای امنیتی محافظت شوید',
    },
  },
  partners: {
    sectionId: 'partners',
    title: 'شرکا و اعتماد',
    icon: <Award className="size-4" />,
    emoji: '🏆',
    color: 'from-sky-500/20 to-blue-600/10',
    description: 'نمایش شریک‌ها و اعتمادنامه‌ها',
    defaultSettings: {
      heading: 'شرکای معتمد ما',
      showStatsStrip: true,
    },
  },
  testimonials: {
    sectionId: 'testimonials',
    title: 'نظرات مشتریان',
    icon: <MessageSquareQuote className="size-4" />,
    emoji: '💬',
    color: 'from-pink-500/20 to-rose-500/10',
    description: 'نمایش نظرات و تجربیات کاربران',
    defaultSettings: {
      heading: 'نظرات کاربران ما',
      showRatings: true,
    },
  },
  blog: {
    sectionId: 'blog',
    title: 'وبلاگ',
    icon: <Newspaper className="size-4" />,
    emoji: '📰',
    color: 'from-orange-500/20 to-amber-600/10',
    description: 'نمایش آخرین مقالات و اخبار',
    defaultSettings: {
      heading: 'آخرین مقالات',
      postsCount: 3,
    },
  },
  comparison: {
    sectionId: 'comparison',
    title: 'جدول مقایسه',
    icon: <GitCompare className="size-4" />,
    emoji: '⚖️',
    color: 'from-lime-500/20 to-green-600/10',
    description: 'مقایسه زرین گلد با سایر پلتفرم‌ها',
    defaultSettings: {
      heading: 'چرا زرین گلد؟',
      showTable: true,
    },
  },
  faq: {
    sectionId: 'faq',
    title: 'سوالات متداول',
    icon: <HelpCircle className="size-4" />,
    emoji: '❓',
    color: 'from-fuchsia-500/20 to-purple-500/10',
    description: 'پاسخ به سوالات رایج کاربران',
    defaultSettings: {
      heading: 'سوالات متداول',
      items: [
        { question: 'چگونه ثبت‌نام کنم؟', answer: 'با شماره موبایل و کد تأیید ثبت‌نام کنید.' },
        { question: 'کارمزد معاملات چقدر است؟', answer: 'کارمزد بسیار پایین و شفاف.' },
      ],
    },
  },
  'app-download': {
    sectionId: 'app-download',
    title: 'دانلود اپلیکیشن',
    icon: <Download className="size-4" />,
    emoji: '📱',
    color: 'from-indigo-500/20 to-violet-600/10',
    description: 'لینک دانلود اپلیکیشن موبایل',
    defaultSettings: {
      heading: 'اپلیکیشن زرین گلد',
      subtitle: 'دانلود اپلیکیشن و مدیریت طلا از موبایل',
    },
  },
  cta: {
    sectionId: 'cta',
    title: 'دعوت به اقدام',
    icon: <Rocket className="size-4" />,
    emoji: '🚀',
    color: 'from-yellow-500/20 to-amber-600/10',
    description: 'بخش دعوت به اقدام با دکمه برجسته',
    defaultSettings: {
      heading: 'همین الان شروع کنید',
      subtitle: 'ثبت‌نام رایگان و شروع معامله طلای دیجیتال',
      buttonText: 'ثبت‌نام رایگان',
      backgroundStyle: 'gradient',
    },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getToken(): string | undefined {
  return useAppStore.getState().user?.sessionToken;
}

function parseSettings(settingsStr: string): Record<string, unknown> {
  try {
    return JSON.parse(settingsStr) || {};
  } catch {
    return {};
  }
}

function stringifySettings(obj: Record<string, unknown>): string {
  return JSON.stringify(obj);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Section Mini Preview Components                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MiniPreview({ sectionId }: { sectionId: string }) {
  switch (sectionId) {
    case 'hero':
      return (
        <div className="space-y-2 mt-2">
          <div className="h-2 w-3/4 rounded bg-gold/20 mx-auto" />
          <div className="h-1.5 w-1/2 rounded bg-muted-foreground/20 mx-auto" />
          <div className="flex justify-center gap-2 mt-1">
            <div className="h-5 w-16 rounded bg-gold/30" />
            <div className="h-5 w-16 rounded border border-muted-foreground/20" />
          </div>
        </div>
      );
    case 'features':
      return (
        <div className="grid grid-cols-3 gap-1 mt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 rounded bg-card/80 border border-muted-foreground/10 flex items-center justify-center">
              <div className="size-2 rounded-full bg-gold/30" />
            </div>
          ))}
        </div>
      );
    case 'how-it-works':
      return (
        <div className="flex items-center gap-1 mt-2 justify-center">
          {[1, 2, 3, 4].map(i => (
            <React.Fragment key={i}>
              <div className="size-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                <span className="text-[8px] text-gold/60">{i}</span>
              </div>
              {i < 4 && <div className="w-3 h-px bg-muted-foreground/20" />}
            </React.Fragment>
          ))}
        </div>
      );
    case 'calculator':
      return (
        <div className="space-y-1.5 mt-2 px-2">
          <div className="h-5 w-full rounded bg-card/80 border border-muted-foreground/10" />
          <div className="h-5 w-full rounded bg-card/80 border border-muted-foreground/10" />
          <div className="h-6 w-full rounded bg-gold/20" />
        </div>
      );
    case 'security':
      return (
        <div className="flex items-center justify-center gap-2 mt-2">
          {['🛡️', '🔒', '✅'].map((e, i) => (
            <div key={i} className="size-7 rounded bg-card/80 border border-muted-foreground/10 flex items-center justify-center text-xs">
              {e}
            </div>
          ))}
        </div>
      );
    case 'partners':
      return (
        <div className="grid grid-cols-4 gap-1 mt-2 px-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-5 rounded bg-card/80 border border-muted-foreground/10" />
          ))}
        </div>
      );
    case 'testimonials':
      return (
        <div className="mt-2 px-2">
          <div className="rounded-lg bg-card/80 border border-muted-foreground/10 p-2">
            <div className="text-[10px] text-muted-foreground/40 italic">&ldquo;نظر کاربر...&rdquo;</div>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="size-2 rounded-sm bg-amber-400/40" />
              ))}
            </div>
          </div>
        </div>
      );
    case 'blog':
      return (
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {[1, 2].map(i => (
            <div key={i} className="rounded bg-card/80 border border-muted-foreground/10 p-1.5 space-y-1">
              <div className="h-6 w-full rounded bg-muted-foreground/10" />
              <div className="h-1 w-full rounded bg-muted-foreground/10" />
              <div className="h-1 w-2/3 rounded bg-muted-foreground/10" />
            </div>
          ))}
        </div>
      );
    case 'comparison':
      return (
        <div className="mt-2 px-1">
          <div className="space-y-0.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-0.5">
                <div className="flex-1 h-3 rounded bg-muted-foreground/10" />
                <div className="flex-1 h-3 rounded bg-muted-foreground/10" />
                <div className="flex-1 h-3 rounded bg-gold/15" />
              </div>
            ))}
          </div>
        </div>
      );
    case 'faq':
      return (
        <div className="space-y-1 mt-2 px-1">
          {[1, 2].map(i => (
            <div key={i} className="rounded bg-card/80 border border-muted-foreground/10 p-1.5">
              <div className="h-2 w-3/4 rounded bg-muted-foreground/15" />
              <div className="h-1 w-full rounded bg-muted-foreground/8 mt-1" />
            </div>
          ))}
        </div>
      );
    case 'app-download':
      return (
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="w-8 h-12 rounded-lg border-2 border-gold/30 flex items-center justify-center">
            <Smartphone className="size-3 text-gold/40" />
          </div>
          <div className="space-y-1">
            <div className="h-2 w-14 rounded bg-muted-foreground/15" />
            <div className="h-2 w-12 rounded bg-muted-foreground/15" />
          </div>
        </div>
      );
    case 'cta':
      return (
        <div className="mt-2 flex flex-col items-center gap-1.5">
          <div className="h-2 w-2/3 rounded bg-muted-foreground/15" />
          <div className="h-6 w-24 rounded-lg bg-gradient-to-l from-gold/40 to-gold/20" />
        </div>
      );
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Section Settings Panel                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SectionSettingsPanel({
  section,
  settings,
  onSettingsChange,
  onTitleChange,
  onVisibilityChange,
  onReset,
}: {
  section: LandingSection;
  settings: Record<string, unknown>;
  onSettingsChange: (key: string, value: unknown) => void;
  onTitleChange: (title: string) => void;
  onVisibilityChange: (visible: boolean) => void;
  onReset: () => void;
}) {
  const config = SECTION_CONFIGS[section.sectionId];
  const [paddingTop, setPaddingTop] = useState(
    (settings.paddingTop as number) || 0
  );
  const [paddingBottom, setPaddingBottom] = useState(
    (settings.paddingBottom as number) || 0
  );
  const [cssClasses, setCssClasses] = useState(
    (settings.cssClasses as string) || ''
  );

  const handlePadTop = (val: string) => {
    const n = parseInt(val) || 0;
    setPaddingTop(n);
    onSettingsChange('paddingTop', n);
  };

  const handlePadBottom = (val: string) => {
    const n = parseInt(val) || 0;
    setPaddingBottom(n);
    onSettingsChange('paddingBottom', n);
  };

  const handleCssClasses = (val: string) => {
    setCssClasses(val);
    onSettingsChange('cssClasses', val);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-l from-gold/10 to-transparent border border-gold/20">
        <div className={cn(
          'size-10 rounded-xl flex items-center justify-center text-lg',
          'bg-gradient-to-br',
          config?.color || 'from-gray-500/20 to-gray-600/10'
        )}>
          {config?.emoji || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate">{config?.title || section.title}</h3>
          <p className="text-[10px] text-muted-foreground">{config?.description}</p>
        </div>
      </div>

      <Tabs defaultValue="general" dir="rtl">
        <TabsList className="w-full bg-muted/50 h-9">
          <TabsTrigger value="general" className="gap-1 text-[11px] flex-1">
            <Settings2 className="size-3" /> عمومی
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1 text-[11px] flex-1">
            <Type className="size-3" /> محتوا
          </TabsTrigger>
          <TabsTrigger value="style" className="gap-1 text-[11px] flex-1">
            <LayoutGrid className="size-3" /> استایل
          </TabsTrigger>
        </TabsList>

        {/* ── General Tab ── */}
        <TabsContent value="general" className="mt-4 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Pencil className="size-3" /> عنوان بخش
            </Label>
            <Input
              value={section.title}
              onChange={e => onTitleChange(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-muted-foreground/10">
            <div className="flex items-center gap-2">
              <ToggleLeft className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">نمایش بخش</p>
                <p className="text-[10px] text-muted-foreground">
                  {section.isVisible ? 'بخش در صفحه نمایش داده می‌شود' : 'بخش مخفی است'}
                </p>
              </div>
            </div>
            <Switch
              checked={section.isVisible}
              onCheckedChange={onVisibilityChange}
            />
          </div>
        </TabsContent>

        {/* ── Content Tab (Section Specific) ── */}
        <TabsContent value="content" className="mt-4 space-y-4">
          <SectionSpecificSettings
            sectionId={section.sectionId}
            settings={settings}
            onChange={onSettingsChange}
          />
        </TabsContent>

        {/* ── Style Tab ── */}
        <TabsContent value="style" className="mt-4 space-y-4">
          {/* CSS Classes */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <LayoutGrid className="size-3" /> کلاس CSS سفارشی
            </Label>
            <Input
              value={cssClasses}
              onChange={e => handleCssClasses(e.target.value)}
              placeholder="custom-class another-class"
              dir="ltr"
              className="h-9 text-xs font-mono"
            />
            <p className="text-[9px] text-muted-foreground/60">
              کلاس‌های Tailwind CSS سفارشی با فاصله جدا کنید
            </p>
          </div>

          {/* Padding */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">فاصله بالا (px)</Label>
              <Input
                type="number"
                value={paddingTop}
                onChange={e => handlePadTop(e.target.value)}
                min={0}
                max={200}
                dir="ltr"
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">فاصله پایین (px)</Label>
              <Input
                type="number"
                value={paddingBottom}
                onChange={e => handlePadBottom(e.target.value)}
                min={0}
                max={200}
                dir="ltr"
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Background Style (for sections that support it) */}
          {(section.sectionId === 'hero' || section.sectionId === 'cta') && (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ImageIcon className="size-3" /> استایل پس‌زمینه
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'gradient', label: 'گرادیانت' },
                  { value: 'solid', label: 'تک‌رنگ' },
                  { value: 'image', label: 'تصویر' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onSettingsChange('backgroundStyle', opt.value)}
                    className={cn(
                      'p-2 rounded-lg border text-[11px] text-center transition-all',
                      settings.backgroundStyle === opt.value
                        ? 'border-gold/50 bg-gold/10 text-gold'
                        : 'border-muted-foreground/15 hover:border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="w-full gap-2 text-xs text-muted-foreground border-dashed hover:border-red-400/50 hover:text-red-400"
      >
        <RotateCcw className="size-3" />
        بازگشت به پیش‌فرض
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Section-Specific Settings                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SectionSpecificSettings({
  sectionId,
  settings,
  onChange,
}: {
  sectionId: string;
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  switch (sectionId) {
    /* ── Hero ── */
    case 'hero':
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان اصلی" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <SettingsTextarea label="زیرعنوان" value={(settings.subtitle as string) || ''} onChange={v => onChange('subtitle', v)} rows={2} />
          <SettingsField label="متن برچسب (Badge)" value={(settings.badge as string) || ''} onChange={v => onChange('badge', v)} />
          <div className="grid grid-cols-2 gap-3">
            <SettingsField label="متن دکمه اصلی" value={(settings.primaryCta as string) || ''} onChange={v => onChange('primaryCta', v)} />
            <SettingsField label="متن دکمه ثانویه" value={(settings.secondaryCta as string) || ''} onChange={v => onChange('secondaryCta', v)} />
          </div>
          <SettingsSwitch label="نمایش تیکر قیمت زنده" checked={!!settings.showPriceTicker} onChange={v => onChange('showPriceTicker', v)} />
        </div>
      );

    /* ── Features ── */
    case 'features': {
      const items = (settings.items as Array<{ icon: string; title: string; description: string }>) || [];
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان بخش" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <SettingsTextarea label="زیرعنوان" value={(settings.subtitle as string) || ''} onChange={v => onChange('subtitle', v)} rows={2} />
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">آیتم‌های ویژگی</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onChange('items', [...items, { icon: '⭐', title: '', description: '' }])}
                className="h-7 text-[10px] gap-1 text-gold border-gold/30 hover:bg-gold/10"
              >
                <Plus className="size-3" /> افزودن
              </Button>
            </div>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-card/50 border border-muted-foreground/10 space-y-2 group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">ویژگی {idx + 1}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => onChange('items', items.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={item.icon}
                        onChange={e => {
                          const updated = [...items];
                          updated[idx] = { ...updated[idx], icon: e.target.value };
                          onChange('items', updated);
                        }}
                        placeholder="⭐"
                        className="h-8 w-14 text-center text-lg"
                      />
                      <Input
                        value={item.title}
                        onChange={e => {
                          const updated = [...items];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          onChange('items', updated);
                        }}
                        placeholder="عنوان"
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                    <Textarea
                      value={item.description}
                      onChange={e => {
                        const updated = [...items];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        onChange('items', updated);
                      }}
                      placeholder="توضیح..."
                      rows={2}
                      className="text-[11px]"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      );
    }

    /* ── How It Works ── */
    case 'how-it-works': {
      const steps = (settings.steps as Array<{ number: number; title: string; description: string }>) || [];
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان بخش" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <SettingsTextarea label="زیرعنوان" value={(settings.subtitle as string) || ''} onChange={v => onChange('subtitle', v)} rows={2} />
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">مراحل</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onChange('steps', [...steps, { number: steps.length + 1, title: '', description: '' }])}
                className="h-7 text-[10px] gap-1 text-gold border-gold/30 hover:bg-gold/10"
              >
                <Plus className="size-3" /> افزودن مرحله
              </Button>
            </div>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-card/50 border border-muted-foreground/10 space-y-2 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                          <span className="text-[10px] text-gold font-bold">{step.number}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">مرحله {step.number}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => onChange('steps', steps.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                    <SettingsField label="عنوان" value={step.title} onChange={v => {
                      const updated = [...steps];
                      updated[idx] = { ...updated[idx], title: v };
                      onChange('steps', updated);
                    }} />
                    <SettingsTextarea label="توضیح" value={step.description} onChange={v => {
                      const updated = [...steps];
                      updated[idx] = { ...updated[idx], description: v };
                      onChange('steps', updated);
                    }} rows={2} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      );
    }

    /* ── Calculator ── */
    case 'calculator':
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان بخش" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <SettingsSwitch label="نمایش ماشین‌حساب" checked={!!settings.showCalculator} onChange={v => onChange('showCalculator', v)} />
        </div>
      );

    /* ── Security ── */
    case 'security':
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <SettingsTextarea label="زیرعنوان" value={(settings.subtitle as string) || ''} onChange={v => onChange('subtitle', v)} rows={2} />
        </div>
      );

    /* ── Partners ── */
    case 'partners':
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <SettingsSwitch label="نمایش نوار آمار" checked={!!settings.showStatsStrip} onChange={v => onChange('showStatsStrip', v)} />
        </div>
      );

    /* ── Testimonials ── */
    case 'testimonials':
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <SettingsSwitch label="نمایش امتیاز ستاره‌ای" checked={!!settings.showRatings} onChange={v => onChange('showRatings', v)} />
        </div>
      );

    /* ── Blog ── */
    case 'blog':
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">تعداد پست‌ها</Label>
            <Input
              type="number"
              value={(settings.postsCount as number) || 3}
              onChange={e => onChange('postsCount', parseInt(e.target.value) || 3)}
              min={1}
              max={12}
              dir="ltr"
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>
      );

    /* ── Comparison ── */
    case 'comparison':
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <SettingsSwitch label="نمایش جدول" checked={!!settings.showTable} onChange={v => onChange('showTable', v)} />
        </div>
      );

    /* ── FAQ ── */
    case 'faq': {
      const faqItems = (settings.items as Array<{ question: string; answer: string }>) || [];
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">سوالات</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onChange('items', [...faqItems, { question: '', answer: '' }])}
                className="h-7 text-[10px] gap-1 text-gold border-gold/30 hover:bg-gold/10"
              >
                <Plus className="size-3" /> افزودن سوال
              </Button>
            </div>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {faqItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-card/50 border border-muted-foreground/10 space-y-2 group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">سوال {idx + 1}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => onChange('items', faqItems.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                    <SettingsField label="سوال" value={item.question} onChange={v => {
                      const updated = [...faqItems];
                      updated[idx] = { ...updated[idx], question: v };
                      onChange('items', updated);
                    }} />
                    <SettingsTextarea label="پاسخ" value={item.answer} onChange={v => {
                      const updated = [...faqItems];
                      updated[idx] = { ...updated[idx], answer: v };
                      onChange('items', updated);
                    }} rows={2} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      );
    }

    /* ── App Download ── */
    case 'app-download':
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <SettingsTextarea label="زیرعنوان" value={(settings.subtitle as string) || ''} onChange={v => onChange('subtitle', v)} rows={2} />
        </div>
      );

    /* ── CTA ── */
    case 'cta':
      return (
        <div className="space-y-4">
          <SettingsField label="عنوان" value={(settings.heading as string) || ''} onChange={v => onChange('heading', v)} />
          <SettingsTextarea label="زیرعنوان" value={(settings.subtitle as string) || ''} onChange={v => onChange('subtitle', v)} rows={2} />
          <SettingsField label="متن دکمه" value={(settings.buttonText as string) || ''} onChange={v => onChange('buttonText', v)} />
        </div>
      );

    default:
      return (
        <div className="text-center py-8 text-muted-foreground text-xs">
          تنظیمات خاصی برای این بخش وجود ندارد
        </div>
      );
  }
}

/* ── Reusable Field Components ── */

function SettingsField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 text-sm"
      />
    </div>
  );
}

function SettingsTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="text-xs resize-none"
      />
    </div>
  );
}

function SettingsSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-muted-foreground/10">
      <p className="text-xs">{label}</p>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminLandingBuilder() {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Keep a ref to initial sections for dirty comparison
  const initialSectionsRef = useRef<string>('');

  /* ── Fetch sections ── */
  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/landing', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const fetched: LandingSection[] = data.sections || [];
        setSections(fetched);
        initialSectionsRef.current = JSON.stringify(fetched.map(s => ({
          id: s.id,
          sectionId: s.sectionId,
          isVisible: s.isVisible,
          sortOrder: s.sortOrder,
          settings: s.settings,
          title: s.title,
        })));
        setIsDirty(false);
      } else {
        useAppStore.getState().addToast('خطا در دریافت اطلاعات', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  /* ── Track dirty state ── */
  useEffect(() => {
    if (!initialSectionsRef.current) return;
    const current = JSON.stringify(sections.map(s => ({
      id: s.id,
      sectionId: s.sectionId,
      isVisible: s.isVisible,
      sortOrder: s.sortOrder,
      settings: s.settings,
      title: s.title,
    })));
    setIsDirty(current !== initialSectionsRef.current);
  }, [sections]);

  /* ── Save ── */
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/landing', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections: sections.map(s => ({
            id: s.id,
            sectionId: s.sectionId,
            isVisible: s.isVisible,
            sortOrder: s.sortOrder,
            settings: s.settings,
            title: s.title,
          })),
        }),
      });
      if (res.ok) {
        useAppStore.getState().addToast('تغییرات با موفقیت ذخیره شد', 'success');
        const data = await res.json();
        const updated: LandingSection[] = data.sections || [];
        setSections(updated);
        initialSectionsRef.current = JSON.stringify(updated.map(s => ({
          id: s.id,
          sectionId: s.sectionId,
          isVisible: s.isVisible,
          sortOrder: s.sortOrder,
          settings: s.settings,
          title: s.title,
        })));
        setIsDirty(false);
      } else {
        useAppStore.getState().addToast('خطا در ذخیره‌سازی', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Section mutations ── */
  const updateSection = (id: string, updates: Partial<LandingSection>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateSectionSettings = (id: string, key: string, value: unknown) => {
    setSections(prev => prev.map(s => {
      if (s.id !== id) return s;
      const current = parseSettings(s.settings);
      current[key] = value;
      return { ...s, settings: stringifySettings(current) };
    }));
  };

  const resetSectionToDefault = (id: string) => {
    setSections(prev => prev.map(s => {
      if (s.id !== id) return s;
      const config = SECTION_CONFIGS[s.sectionId];
      return {
        ...s,
        settings: stringifySettings(config?.defaultSettings || {}),
        title: config?.title || s.title,
      };
    }));
  };

  /* ── Drag & Drop ── */
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    setDraggingId(null);

    if (!draggingId || draggingId === targetId) return;

    setSections(prev => {
      const list = [...prev];
      const fromIdx = list.findIndex(s => s.id === draggingId);
      const toIdx = list.findIndex(s => s.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;

      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);

      return list.map((s, i) => ({ ...s, sortOrder: i }));
    });
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    setDraggingId(null);
  };

  /* ── Toggle visibility ── */
  const toggleVisibility = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
  };

  /* ── Keyboard shortcut: Ctrl+S to save ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !saving) handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty, saving]);

  /* ── Selected section ── */
  const selectedSection = sections.find(s => s.id === selectedId) || null;
  const selectedSettings = selectedSection ? parseSettings(selectedSection.settings) : {};

  /* ── Render ── */
  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full flex flex-col bg-background" dir="rtl">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/*  Top Toolbar                                                      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="shrink-0 h-14 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 z-50">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => useAppStore.getState().setAdminPage('pages')}
                >
                  <ArrowRight className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">بازگشت</TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-2">
              <LayoutGrid className="size-4 text-gold" />
              <h1 className="text-sm font-bold">ویرایش لندینگ پیج</h1>
              {isDirty && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                  <CircleDot className="size-2 text-amber-400" />
                  <span className="text-[9px] text-amber-400 font-medium">تغییرات ذخیره نشده</span>
                </div>
              )}
            </div>
          </div>

          {/* Center: Device Preview */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
            {([
              { value: 'desktop' as DevicePreview, icon: Monitor, label: 'دسکتاپ' },
              { value: 'tablet' as DevicePreview, icon: Tablet, label: 'تبلت' },
              { value: 'mobile' as DevicePreview, icon: Smartphone, label: 'موبایل' },
            ]).map(d => (
              <Tooltip key={d.value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDevicePreview(d.value)}
                    className={cn(
                      'size-8 rounded-md flex items-center justify-center transition-all',
                      devicePreview === d.value
                        ? 'bg-gold/15 text-gold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <d.icon className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{d.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Right: Save + Live Preview */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/', '_blank')}
                  className="gap-1.5 text-[11px] border-muted-foreground/20 hover:border-gold/30"
                >
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">پیش‌نمایش زنده</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">باز کردن صفحه اصلی در تب جدید</TooltipContent>
            </Tooltip>
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={cn(
                'gap-1.5 text-[11px] min-w-[90px] transition-all',
                isDirty
                  ? 'bg-gradient-to-l from-gold to-amber-600 hover:from-gold-dark hover:to-amber-700 text-white shadow-lg shadow-gold/20'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/*  Main Content Area                                                */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex overflow-hidden">

          {/* ─── Left Panel: Section List (~65%) ─── */}
          <div className={cn(
            'flex flex-col border-l border-border bg-muted/20 transition-all',
            devicePreview === 'desktop' ? 'w-[65%]' : devicePreview === 'tablet' ? 'w-[55%]' : 'w-[45%]'
          )}>
            {/* Panel Header */}
            <div className="shrink-0 h-10 px-4 flex items-center justify-between border-b border-border/50 bg-card/30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  لایه‌ها
                </span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {sections.length} بخش
                </Badge>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 text-emerald-400 bg-emerald-500/10">
                  {sections.filter(s => s.isVisible).length} فعال
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>دستگیره بکشید برای جابجایی</span>
                <GripVertical className="size-3" />
              </div>
            </div>

            {/* Section Cards */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  sections.map(section => {
                    const config = SECTION_CONFIGS[section.sectionId];
                    const isSelected = selectedId === section.id;
                    const isDragOver = dragOverId === section.id;
                    const isDragging = draggingId === section.id;

                    return (
                      <Card
                        key={section.id}
                        draggable
                        onDragStart={e => handleDragStart(e, section.id)}
                        onDragOver={e => handleDragOver(e, section.id)}
                        onDrop={e => handleDrop(e, section.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedId(isSelected ? null : section.id)}
                        className={cn(
                          'cursor-pointer transition-all duration-200 group relative overflow-hidden',
                          isDragging && 'opacity-50 scale-105 shadow-2xl shadow-gold/10 z-50 cursor-grabbing',
                          !isDragging && 'cursor-grab hover:shadow-lg hover:shadow-gold/5',
                          !section.isVisible && 'opacity-50',
                          isSelected
                            ? 'border-gold/50 shadow-lg shadow-gold/10 ring-1 ring-gold/20 bg-card/80'
                            : 'border-border/50 bg-card/40 hover:border-gold/30',
                          isDragOver && !isDragging && 'border-dashed border-gold/50 border-2 scale-[1.02]'
                        )}
                      >
                        {/* Gold accent line for selected */}
                        {isSelected && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-amber-500 to-gold rounded-l" />
                        )}

                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0">
                              <GripVertical className="size-4" />
                            </div>

                            {/* Section Icon */}
                            <div className={cn(
                              'size-10 rounded-xl shrink-0 flex items-center justify-center text-lg transition-all',
                              'bg-gradient-to-br',
                              config?.color || 'from-gray-500/20 to-gray-600/10',
                              isSelected && 'ring-2 ring-gold/30'
                            )}>
                              {config?.emoji || '📦'}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium truncate">{section.title}</h3>
                                <Badge
                                  className={cn(
                                    'text-[9px] px-1.5 py-0 shrink-0',
                                    section.isVisible
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : 'bg-red-500/10 text-red-400'
                                  )}
                                >
                                  {section.isVisible ? 'فعال' : 'غیرفعال'}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                {config?.description}
                              </p>

                              {/* Mini Preview */}
                              <MiniPreview sectionId={section.sectionId} />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn(
                                      'size-7 transition-colors',
                                      section.isVisible
                                        ? 'text-gold/60 hover:text-gold hover:bg-gold/10'
                                        : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
                                    )}
                                    onClick={e => {
                                      e.stopPropagation();
                                      toggleVisibility(section.id);
                                    }}
                                  >
                                    {section.isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  {section.isVisible ? 'مخفی کردن' : 'نمایش بخش'}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* ─── Right Panel: Settings Sidebar (~35%) ─── */}
          <div className={cn(
            'flex flex-col bg-card/30 transition-all overflow-hidden',
            devicePreview === 'desktop' ? 'w-[35%]' : devicePreview === 'tablet' ? 'w-[45%]' : 'w-[55%]'
          )}>
            {selectedSection ? (
              <>
                {/* Panel Header */}
                <div className="shrink-0 h-10 px-4 flex items-center justify-between border-b border-border/50 bg-card/30">
                  <div className="flex items-center gap-2">
                    <Settings2 className="size-3.5 text-gold" />
                    <span className="text-xs font-medium">تنظیمات بخش</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setSelectedId(null)}
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">بستن تنظیمات</TooltipContent>
                  </Tooltip>
                </div>

                {/* Settings Content */}
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <SectionSettingsPanel
                      section={selectedSection}
                      settings={selectedSettings}
                      onSettingsChange={(key, value) => updateSectionSettings(selectedSection.id, key, value)}
                      onTitleChange={(title) => updateSection(selectedSection.id, { title })}
                      onVisibilityChange={(visible) => updateSection(selectedSection.id, { isVisible: visible })}
                      onReset={() => resetSectionToDefault(selectedSection.id)}
                    />
                  </div>
                </ScrollArea>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-gold/10 to-amber-600/5 border border-gold/20 flex items-center justify-center mb-4">
                  <Settings2 className="size-7 text-gold/40" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  تنظیمات بخش
                </h3>
                <p className="text-[11px] text-muted-foreground/60 max-w-[200px]">
                  برای مشاهده و ویرایش تنظیمات، روی یکی از بخش‌های سمت راست کلیک کنید
                </p>
                <div className="mt-4 flex flex-col items-center gap-2 text-[10px] text-muted-foreground/40">
                  <div className="flex items-center gap-1.5">
                    <Eye className="size-3" />
                    <span>تغییر وضعیت نمایش</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="size-3" />
                    <span>جابجایی با کشیدن</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Pencil className="size-3" />
                    <span>ویرایش محتوا و تنظیمات</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
