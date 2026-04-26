'use client';

import { ArrowRight, Landmark, Gem, ShoppingBag, BarChart3, Brain, Target, Calculator, TrendingUp, PiggyBank, Flag, CreditCard, Star, Gift, CircleDollarSign, Briefcase, User, Settings, Wallet, Receipt, Shield, Award, Zap, Lock, Bell, FileCheck, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useCMSPage } from '@/hooks/useCMSPage';
import RenderHTML from '@/components/shared/RenderHTML';

/* ------------------------------------------------------------------ */
/*  Default Data                                                       */
/* ------------------------------------------------------------------ */

interface SitemapItem {
  icon: typeof Landmark;
  label: string;
  page?: string;
}

interface SitemapSection {
  title: string;
  icon: typeof Landmark;
  accent: string;
  items: SitemapItem[];
}

const DEFAULT_INTRO = 'دسترسی سریع به تمامی بخش‌ها و صفحات زرین گلد. با کلیک روی هر مورد به صفحه مربوطه منتقل می‌شوید.';

const DEFAULT_SITEMAP_SECTIONS: SitemapSection[] = [
  {
    title: 'معاملات طلا',
    icon: ShoppingBag,
    accent: 'from-gold/20 via-yellow-500/10 to-amber-500/20',
    items: [
      { icon: ShoppingBag, label: 'خرید و فروش', page: 'trade' },
      { icon: BarChart3, label: 'بازار', page: 'market' },
      { icon: TrendingUp, label: 'نمودار پیشرفته', page: 'advancedChart' },
      { icon: Zap, label: 'قیمت زنده', page: 'livePrice' },
    ],
  },
  {
    title: 'ابزارهای هوشمند',
    icon: Brain,
    accent: 'from-amber-500/20 via-gold/10 to-yellow-600/20',
    items: [
      { icon: Brain, label: 'خرید هوشمند', page: 'smartBuy' },
      { icon: Calculator, label: 'شبیه‌ساز سود', page: 'profitSimulator' },
      { icon: Target, label: 'تحلیل پرتفوی', page: 'analytics' },
      { icon: Landmark, label: 'مربی هوش', page: 'aiCoach' },
    ],
  },
  {
    title: 'پس‌انداز و وام',
    icon: PiggyBank,
    accent: 'from-yellow-600/20 via-gold/10 to-amber-400/20',
    items: [
      { icon: PiggyBank, label: 'پس‌انداز خودکار', page: 'autosave' },
      { icon: Flag, label: 'اهداف', page: 'goals' },
      { icon: CreditCard, label: 'وام طلایی', page: 'loans' },
    ],
  },
  {
    title: 'خدمات ویژه',
    icon: Star,
    accent: 'from-gold/20 via-yellow-500/10 to-orange-500/20',
    items: [
      { icon: Star, label: 'اشتراک VIP', page: 'vip' },
      { icon: CircleDollarSign, label: 'کش‌بک', page: 'cashback' },
      { icon: Gem, label: 'صندوق طلای من', page: 'vault' },
      { icon: Award, label: 'باشگاه خلاقیت', page: 'creatorClub' },
    ],
  },
  {
    title: 'حساب کاربری',
    icon: User,
    accent: 'from-orange-500/20 via-amber-500/10 to-gold/20',
    items: [
      { icon: User, label: 'پروفایل', page: 'profile' },
      { icon: Settings, label: 'تنظیمات', page: 'settings' },
      { icon: Wallet, label: 'کیف پول', page: 'wallet' },
      { icon: Receipt, label: 'تراکنش‌ها', page: 'transactions' },
    ],
  },
  {
    title: 'امنیت و احراز هویت',
    icon: Shield,
    accent: 'from-gold/20 via-yellow-600/10 to-amber-500/20',
    items: [
      { icon: Shield, label: 'امنیت حساب', page: 'profile' },
      { icon: FileCheck, label: 'احراز هویت (KYC)', page: 'kyc' },
      { icon: Lock, label: 'تأیید دو مرحله‌ای', page: 'settings' },
      { icon: Bell, label: 'اعلان‌ها', page: 'notifications' },
    ],
  },
  {
    title: 'آموزش و جامعه',
    icon: BookOpen,
    accent: 'from-amber-400/20 via-gold/10 to-yellow-600/20',
    items: [
      { icon: BookOpen, label: 'آکادمی طلا', page: 'education' },
      { icon: Gift, label: 'هدایای طلایی', page: 'gifts' },
      { icon: Briefcase, label: 'مأموریت طلایی', page: 'goldQuest' },
      { icon: BarChart3, label: 'فید اجتماعی', page: 'socialFeed' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SitemapPage() {
  const { content: cmsContent, loading: cmsLoading } = useCMSPage('sitemap');
  const { t } = useTranslation();
  const setLandingPage = useAppStore((s) => s.setLandingPage);
  const setPage = useAppStore((s) => s.setPage);

  const handleBack = () => {
    setLandingPage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (page?: string) => {
    if (page) {
      setLandingPage(null);
      setPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (cmsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  // Merge CMS content with defaults
  const intro = (cmsContent.intro as string) || DEFAULT_INTRO;

  const cmsGroups = cmsContent.groups as Array<{ title: string; links: Array<{ title: string; page: string }> }> | undefined;
  const sitemapSections: SitemapSection[] = cmsGroups?.length
    ? DEFAULT_SITEMAP_SECTIONS.map((section, i) => ({
        ...section,
        title: cmsGroups[i]?.title || section.title,
        items: cmsGroups[i]?.links?.length
          ? cmsGroups[i].links.map((link, j) => ({
              icon: section.items[j]?.icon || Landmark,
              label: link.title,
              page: link.page,
            }))
          : section.items,
      }))
    : DEFAULT_SITEMAP_SECTIONS;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-2 text-sm font-medium text-gold transition-colors duration-200 hover:bg-gold/10"
          >
            <ArrowRight className="h-4 w-4" />
            {t('common.back')}
          </button>
          <h1 className="text-lg font-bold">نقشه سایت</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Hero */}
        <section className="mb-12 text-center">
          <Badge variant="outline" className="mb-4 border-gold/30 bg-gold/10 text-gold">
            راهنمای دسترسی
          </Badge>
          <h2 className="mb-4 text-3xl font-extrabold sm:text-4xl">
            <span className="gold-gradient-text">نقشه سایت</span>
          </h2>
          <RenderHTML html={intro} className="mx-auto max-w-2xl leading-relaxed text-muted-foreground" />
        </section>

        {/* Sitemap Sections */}
        <div className="space-y-8">
          {sitemapSections.map((section, sectionIdx) => (
            <Card key={sectionIdx} className="glass-card group overflow-hidden border-border/60 transition-all duration-300 hover:border-gold/30">
              {/* Section Header with Gold Accent */}
              <div className={`flex items-center gap-3 bg-gradient-to-l ${section.accent} p-4 sm:p-5`}>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/15">
                  <section.icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="text-base font-bold">{section.title}</h3>
                {/* Gold accent line */}
                <div className="mr-auto h-0.5 w-16 bg-gradient-to-l from-gold via-gold/60 to-transparent" />
              </div>
              <CardContent className="p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {section.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      onClick={() => handleNavClick(item.page)}
                      className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-card px-3 py-2.5 text-right text-sm transition-all duration-200 hover:border-gold/30 hover:bg-gold/5 hover:text-gold"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-gold" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-10 bg-border/60" />

        {/* Info Cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="glass-card border-border/60">
            <CardContent className="flex items-start gap-3 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
                <ShoppingBag className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h4 className="mb-1 text-sm font-bold">پیشنهاد ویژه</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  برای شروع سرمایه‌گذاری در طلا، ابتدا ثبت‌نام کرده و کیف پول خود را شارژ کنید.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/60">
            <CardContent className="flex items-start gap-3 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
                <Landmark className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h4 className="mb-1 text-sm font-bold">نیاز به راهنمایی؟</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  در صورتی که در یافتن صفحه مورد نظر مشکل دارید، از بخش پرسش‌های متداول یا تماس با ما استفاده کنید.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
