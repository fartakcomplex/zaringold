'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe, Home, Sparkles, ListOrdered, Calculator, Shield, Handshake,
  MessageSquareQuote, GitCompareArrows, HelpCircle, Smartphone,
  MousePointerClick, Settings, Eye, EyeOff, Edit, RotateCcw,
  Save, ChevronDown, ChevronUp, GripVertical, AlertCircle, Check,
  Layers, Trash2, Plus, X, Info, Wand2, Loader2, Pencil,
  FileText, ExternalLink,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { CMSPageItem, CMSComponentItem } from './ElementorBuilder';

const ElementorBuilder = dynamic(
  () => import('./ElementorBuilder'),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-gold" /></div> },
);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Section Definitions                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SectionDef {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'landing_general', label: 'تنظیمات عمومی', icon: Settings, description: 'تنظیمات کلی صفحه لندینگ و SEO' },
  { id: 'hero', label: 'بخش اصلی (Hero)', icon: Home, description: 'هدر، عنوان و آمار اصلی صفحه' },
  { id: 'features', label: 'ویژگی‌ها', icon: Sparkles, description: 'مزایا و قابلیت‌های پلتفرم' },
  { id: 'how_it_works', label: 'نحوه کار', icon: ListOrdered, description: 'مراحل ثبت‌نام و شروع کار' },
  { id: 'calculator', label: 'محاسبهگر', icon: Calculator, description: 'ابزار محاسبه قیمت طلا' },
  { id: 'security', label: 'امنیت', icon: Shield, description: 'ویژگی‌های امنیتی و گواهینامه‌ها' },
  { id: 'partners', label: 'شرکا و اعتماد', icon: Handshake, description: 'نمادها و مجوزهای اعتماد' },
  { id: 'testimonials', label: 'نظرات کاربران', icon: MessageSquareQuote, description: 'نظرات و تجربیات کاربران' },
  { id: 'comparison', label: 'مقایسه پلتفرم‌ها', icon: GitCompareArrows, description: 'جدول مقایسه با رقبا' },
  { id: 'faq', label: 'سوالات متداول', icon: HelpCircle, description: 'پاسخ سوالات رایج' },
  { id: 'app_download', label: 'اپلیکیشن', icon: Smartphone, description: 'دعوت به دانلود اپلیکیشن' },
  { id: 'cta', label: 'دعوت به اقدام (CTA)', icon: MousePointerClick, description: 'بخش نهایی دعوت به ثبت‌نام' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SettingItem {
  group: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
  sortOrder: number;
}

type SettingsMap = Record<string, Record<string, SettingItem>>;

type BuilderSource = 'landing' | 'cms';

/* ── Helper: safely parse JSON ── */
function safeParseJSON<T = unknown>(str: string | undefined | null, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; }
  catch { return fallback; }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminPages() {
  const { addToast } = useAppStore();

  const [allSettings, setAllSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSection, setEditorSection] = useState<SectionDef | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [globalSaving, setGlobalSaving] = useState(false);
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});
  const [editingWithBuilder, setEditingWithBuilder] = useState(false);
  const [builderPage, setBuilderPage] = useState<CMSPageItem | null>(null);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderSource, setBuilderSource] = useState<BuilderSource>('landing');
  const syncDoneRef = useRef(false);

  /* ── Tab state ── */
  const [activeTab, setActiveTab] = useState('landing');

  /* ── CMS Pages state ── */
  const [cmsPages, setCmsPages] = useState<CMSPageItem[]>([]);
  const [cmsPagesLoading, setCmsPagesLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetPage, setDeleteTargetPage] = useState<CMSPageItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);

  /* ── Fetch ── */
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/site-settings');
      if (res.ok) {
        const data = await res.json();
        const map: SettingsMap = {};
        for (const g of data.groups || []) {
          map[g.group] = {};
          for (const s of g.settings) {
            map[g.group][s.key] = s;
          }
        }
        setAllSettings(map);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const seedSettings = useCallback(async () => {
    try {
      await fetch('/api/admin/site-settings/seed', { method: 'POST' });
      await fetchSettings();
    } catch { /* ignore */ }
  }, [fetchSettings]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/site-settings');
        if (res.ok && mounted) {
          const data = await res.json();
          const map: SettingsMap = {};
          for (const g of data.groups || []) {
            map[g.group] = {};
            for (const s of g.settings) {
              map[g.group][s.key] = s;
            }
          }
          setAllSettings(map);
          // Auto-seed if empty
          if (Object.keys(map).length === 0) {
            await fetch('/api/admin/site-settings/seed', { method: 'POST' });
            const res2 = await fetch('/api/admin/site-settings');
            if (res2.ok && mounted) {
              const data2 = await res2.json();
              const map2: SettingsMap = {};
              for (const g of data2.groups || []) {
                map2[g.group] = {};
                for (const s of g.settings) {
                  map2[g.group][s.key] = s;
                }
              }
              setAllSettings(map2);
            }
          }
        }
      } catch { /* ignore */ }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  /* ── Fetch CMS Pages ── */
  const fetchCmsPages = useCallback(async () => {
    setCmsPagesLoading(true);
    try {
      const res = await fetch('/api/cms/pages');
      if (res.ok) {
        const data = await res.json();
        setCmsPages(data.pages || []);
      }
    } catch { /* ignore */ }
    setCmsPagesLoading(false);
  }, []);

  /* Fetch pages when switching to the pages tab */
  useEffect(() => {
    if (activeTab !== 'pages') return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/cms/pages');
        if (res.ok && mounted) {
          const data = await res.json();
          setCmsPages(data.pages || []);
        }
      } catch { /* ignore */ }
      if (mounted) setCmsPagesLoading(false);
    })();
    return () => { mounted = false; };
  }, [activeTab]);

  /* ── Create New Page ── */
  const handleCreatePage = async () => {
    setCreatingPage(true);
    try {
      const slug = 'page-' + Date.now();
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title: 'صفحه جدید' }),
      });
      if (res.ok) {
        const data = await res.json();
        const newPage = data.page as CMSPageItem;
        if (newPage) {
          addToast('صفحه جدید ایجاد شد', 'success');
          /* Open it in Elementor immediately */
          setBuilderPage(newPage);
          setBuilderSource('cms');
          syncDoneRef.current = false;
          setEditingWithBuilder(true);
        }
      } else {
        addToast('خطا در ایجاد صفحه', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setCreatingPage(false);
  };

  /* ── Delete Page ── */
  const handleDeletePage = async () => {
    if (!deleteTargetPage) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cms/pages?id=${deleteTargetPage.id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('صفحه حذف شد', 'success');
        setDeleteConfirmOpen(false);
        setDeleteTargetPage(null);
        await fetchCmsPages();
      } else {
        addToast('خطا در حذف صفحه', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setDeleting(false);
  };

  /* ── Open CMS Page in Elementor ── */
  const openCmsPageBuilder = async (page: CMSPageItem) => {
    setBuilderLoading(true);
    try {
      /* Fetch fresh page data with components */
      const detailRes = await fetch(`/api/cms/pages/${page.id}`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        if (detailData.success && detailData.page) {
          setBuilderPage(detailData.page);
          setBuilderSource('cms');
          syncDoneRef.current = false;
          setEditingWithBuilder(true);
          return;
        }
      }
      /* Fallback: use the page from the list */
      setBuilderPage(page);
      setBuilderSource('cms');
      syncDoneRef.current = false;
      setEditingWithBuilder(true);
    } catch {
      addToast('خطا در بارگذاری صفحه', 'error');
    }
    setBuilderLoading(false);
  };

  /* ── Helpers ── */
  const isEnabled = (groupId: string): boolean =>
    allSettings[groupId]?.['enabled']?.value === 'true';

  const getEnabledCount = (): number =>
    SECTIONS.filter(s => isEnabled(s.id) && s.id !== 'landing_general').length;

  const getVal = (group: string, key: string): string =>
    allSettings[group]?.[key]?.value || '';

  const openEditor = (section: SectionDef) => {
    setEditorSection(section);
    const form: Record<string, string> = {};
    const groupSettings = allSettings[section.id] || {};
    for (const [key, item] of Object.entries(groupSettings)) {
      form[key] = item.value;
    }
    setEditForm(form);
    setJsonErrors({});
    setEditorOpen(true);
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  seedBuilderFromSettings                                                 */
  /*  Creates/recreates a CMS page with all landing sections as widgets       */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /* ── Helper to get a setting value ── */
  function getValFrom(settings: SettingsMap, group: string, key: string, fallback: string): string {
    return settings[group]?.[key]?.value || fallback;
  }

  const seedBuilderFromSettings = useCallback(async (currentSettings: SettingsMap): Promise<CMSPageItem | null> => {
    try {
      let page: CMSPageItem | null = null;
      const BUILDER_SLUG = 'main-landing-builder';

      /* Find or create page */
      const listRes = await fetch('/api/cms/pages');
      if (listRes.ok) {
        const listData = await listRes.json();
        const existing = (listData.pages || []).find((p: CMSPageItem) => p.slug === BUILDER_SLUG);
        if (existing) page = existing;
      }

      if (!page) {
        const createRes = await fetch('/api/cms/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: BUILDER_SLUG, title: 'صفحه لندینگ (ویرایش بصری)' }),
        });
        if (createRes.ok) {
          page = (await createRes.json()).page;
        }
      }

      if (!page) return null;

      /* Check if page already has components — skip re-seeding */
      const compListRes = await fetch(`/api/cms/components?pageId=${page.id}`);
      if (compListRes.ok) {
        const compData = await compListRes.json();
        const existingComps = (compData.components || []) as CMSComponentItem[];
        if (existingComps.length > 0) {
          /* Page already has components, just return it (don't destroy user edits) */
          const detailRes = await fetch(`/api/cms/pages/${page.id}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            if (detailData.success) return detailData.page;
          }
          return page;
        }
      }

      /* No components yet — seed from settings */
      const compListRes2 = await fetch(`/api/cms/components?pageId=${page.id}`);
      if (compListRes2.ok) {
        const compData = await compListRes2.json();
        const existingComps = (compData.components || []) as CMSComponentItem[];
        for (const comp of existingComps) {
          await fetch(`/api/cms/components?id=${comp.id}`, { method: 'DELETE' });
        }
      }

      /* Build component list from settings */
      const s = currentSettings;
      const widgetComponents: Array<{ type: string; props: Record<string, unknown>; order: number }> = [];
      let order = 0;

      /* Helper: is section visible? */
      const isVisible = (groupId: string) => s[groupId]?.['enabled']?.value !== 'false';

      /* ── Hero ── */
      widgetComponents.push({
        type: 'hero-section',
        props: {
          heading: getValFrom(s, 'hero', 'heading', 'خرید و فروش طلای هوشمند'),
          subtitle: getValFrom(s, 'hero', 'subtitle', 'سرمایه‌گذاری امن و آسان در بازار طلا'),
          badge: getValFrom(s, 'hero', 'badge', '🔥 محبوب‌ترین'),
          primaryCtaText: getValFrom(s, 'hero', 'primaryCta', 'شروع کنید'),
          secondaryCtaText: getValFrom(s, 'hero', 'secondaryCta', 'بیشتر بدانید'),
          backgroundStyle: getValFrom(s, 'hero', 'backgroundStyle', 'gradient'),
          showStats: getValFrom(s, 'hero', 'showPriceTicker', 'true') === 'true',
        },
        order: order++,
      });

      /* ── Features ── */
      const featureItems = safeParseJSON<Array<{ icon: string; title: string; description: string }>>(
        s.features?.items?.value,
        [
          { icon: 'Shield', title: 'امنیت بالا', description: 'حفاظت کامل از دارایی‌های شما' },
          { icon: 'Zap', title: 'سرعت بالا', description: 'معاملات آنی و لحظه‌ای' },
          { icon: 'Headphones', title: 'پشتیبانی ۲۴/۷', description: 'تیم پشتیبانی همیشه در کنار شماست' },
        ],
      );
      widgetComponents.push({
        type: 'features-grid',
        props: {
          heading: getValFrom(s, 'features', 'heading', 'ویژگی‌های زرین گلد'),
          subtitle: getValFrom(s, 'features', 'subtitle', 'چرا زرین گلد را انتخاب کنید؟'),
          columns: '3',
          items: featureItems,
        },
        order: order++,
      });

      /* ── How It Works ── */
      const stepsItems = safeParseJSON<Array<{ number: string; title: string; description: string }>>(
        s.how_it_works?.steps?.value,
        [
          { number: '۱', title: 'ثبت‌نام', description: 'حساب خود را به سرعت بسازید' },
          { number: '۲', title: 'احراز هویت', description: 'مراحل ساده تأیید هویت' },
          { number: '۳', title: 'شارژ حساب', description: 'حساب خود را شارژ کنید' },
          { number: '۴', title: 'خرید طلا', description: 'شروع به سرمایه‌گذاری کنید' },
        ],
      );
      widgetComponents.push({
        type: 'steps',
        props: {
          heading: getValFrom(s, 'how_it_works', 'heading', 'نحوه شروع'),
          subtitle: getValFrom(s, 'how_it_works', 'subtitle', 'در چند مرحله ساده شروع کنید'),
          items: stepsItems,
        },
        order: order++,
      });

      /* ── Calculator → heading + icon-list (two components) ── */
      widgetComponents.push({
        type: 'heading',
        props: {
          text: getValFrom(s, 'calculator', 'heading', 'ماشین‌حساب طلا'),
          tag: 'h2',
          alignment: 'center',
          color: '#ffffff',
          fontSize: '24',
        },
        order: order++,
      });
      widgetComponents.push({
        type: 'icon-list',
        props: {
          items: [{ icon: 'Calculator', text: 'ماشین‌حساب طلای هوشمند با قیمت لحظه‌ای' }],
          color: '#D4AF37',
          iconSize: '18',
        },
        order: order++,
      });

      /* ── Security → heading + icon-list ── */
      widgetComponents.push({
        type: 'heading',
        props: {
          text: getValFrom(s, 'security', 'heading', 'امنیت و حفاظت'),
          tag: 'h2',
          alignment: 'center',
          color: '#ffffff',
          fontSize: '24',
        },
        order: order++,
      });
      widgetComponents.push({
        type: 'icon-list',
        props: {
          items: [{ icon: 'Shield', text: 'حفاظت از دارایی شما با بالاترین استانداردهای امنیتی' }],
          color: '#D4AF37',
          iconSize: '18',
        },
        order: order++,
      });

      /* ── Partners ── */
      const partnerItems = safeParseJSON<Array<{ name: string; logo: string; link: string }>>(
        s.partners?.items?.value,
        [
          { name: 'بانک مرکزی', logo: '', link: '#' },
          { name: 'فرابورس', logo: '', link: '#' },
          { name: 'شرکت ثبت‌شده', logo: '', link: '#' },
          { name: 'ISO 27001', logo: '', link: '#' },
        ],
      );
      widgetComponents.push({
        type: 'partners-logos',
        props: {
          heading: getValFrom(s, 'partners', 'heading', 'مجوزها و شرکای ما'),
          columns: '4',
          items: partnerItems,
        },
        order: order++,
      });

      /* ── Testimonials ── */
      const testimonialItems = safeParseJSON<Array<{ name: string; role: string; text: string; rating: string; avatar: string }>>(
        s.testimonials?.items?.value,
        [
          { name: 'علی محمدی', role: 'سرمایه‌گذار', text: 'بهترین پلتفرم خرید و فروش طلا!', rating: '5', avatar: '' },
          { name: 'سارا رضایی', role: 'کاربر عادی', text: 'رابط کاربری عالی و پشتیبانی قوی', rating: '5', avatar: '' },
        ],
      );
      widgetComponents.push({
        type: 'testimonials-carousel',
        props: {
          heading: 'نظرات کاربران',
          items: testimonialItems,
        },
        order: order++,
      });

      /* ── Comparison → table ── */
      widgetComponents.push({
        type: 'table',
        props: {
          headers: 'ویژگی,زرین گلد,پلتفرم A,پلتفرم B',
          rows: [
            'کارمزد خرید,۰.۵٪,۱.۵٪,۲٪',
            'کارمزد فروش,۰.۵٪,۱٪,۱.۵٪',
            'واریز آنی,✅,❌,⏳',
            'برداشت سریع,✅,⏳,❌',
            'پشتیبانی ۲۴/۷,✅,⏳,❌',
            'هشدار قیمت,✅,❌,❌',
            'پس‌انداز خودکار,✅,❌,❌',
            'کارت طلایی,✅,❌,❌',
          ].join('\n'),
          bordered: true,
          striped: true,
        },
        order: order++,
      });

      /* ── FAQ ── */
      const faqItems = safeParseJSON<Array<{ question: string; answer: string }>>(
        s.faq?.items?.value,
        [
          { question: 'چگونه می‌توانم طلا بخرم؟', answer: 'ثبت‌نام کنید، حساب خود را شارژ کنید و از بخش خرید طلا اقدام کنید.' },
          { question: 'آیا دارایی‌های من امن است؟', answer: 'بله، تمام دارایی‌ها با بالاترین استانداردهای امنیتی محافظت می‌شوند.' },
        ],
      );
      widgetComponents.push({
        type: 'faq-section',
        props: {
          heading: getValFrom(s, 'faq', 'heading', 'سوالات متداول'),
          items: faqItems,
        },
        order: order++,
      });

      /* ── App Download → cta-section ── */
      widgetComponents.push({
        type: 'cta-section',
        props: {
          heading: getValFrom(s, 'app_download', 'heading', 'اپلیکیشن زرین گلد را دانلود کنید'),
          subtitle: getValFrom(s, 'app_download', 'subtitle', 'در هر زمان و مکان به بازار طلا دسترسی داشته باشید'),
          buttonText: 'دانلود اپلیکیشن',
          backgroundStyle: 'gradient',
        },
        order: order++,
      });

      /* ── CTA → cta-section ── */
      widgetComponents.push({
        type: 'cta-section',
        props: {
          heading: getValFrom(s, 'cta', 'heading', 'همین الان شروع کنید!'),
          subtitle: getValFrom(s, 'cta', 'subtitle', 'ثبت‌نام رایگان و شروع سرمایه‌گذاری در طلا'),
          buttonText: getValFrom(s, 'cta', 'buttonText', 'ثبت‌نام رایگان'),
          backgroundStyle: getValFrom(s, 'cta', 'backgroundStyle', 'gradient'),
        },
        order: order++,
      });

      /* Create all components */
      for (const comp of widgetComponents) {
        await fetch('/api/cms/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: page!.id,
            type: comp.type,
            props: JSON.stringify(comp.props),
            order: comp.order,
          }),
        });
      }

      /* Fetch page with fresh components */
      const detailRes = await fetch(`/api/cms/pages/${page.id}`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        if (detailData.success) return detailData.page;
      }

      return page;
    } catch (err) {
      console.error('[seedBuilderFromSettings] error:', err);
      return null;
    }
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  syncBuilderToSettings                                                  */
  /*  Fetches components from the builder page and syncs to SiteSettings     */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const syncBuilderToSettings = useCallback(async (pageId: string) => {
    try {
      const compRes = await fetch(`/api/cms/components?pageId=${pageId}`);
      if (!compRes.ok) return;

      const compData = await compRes.json();
      const components = (compData.components || []) as CMSComponentItem[];

      /* Build the payload for sync API */
      const payload = components
        .sort((a, b) => a.order - b.order)
        .map(c => ({
          type: c.type,
          order: c.order,
          props: c.props,
          isVisible: true,
        }));

      const syncRes = await fetch('/api/admin/landing/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: payload }),
      });

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.success) {
          addToast(`تنظیمات ${syncData.synced} فیلد در ${syncData.groups.length} گروه همگام‌سازی شد`, 'success');
          await fetchSettings();
        }
      }
    } catch (err) {
      console.error('[syncBuilderToSettings] error:', err);
    }
  }, [fetchSettings, addToast]);

  /* ── Save section ── */
  const handleSaveSection = async () => {
    if (!editorSection) return;
    setSaving(true);
    try {
      const groupSettings = allSettings[editorSection.id] || {};
      const payload = Object.entries(editForm).map(([key, value]) => {
        const existing = groupSettings[key];
        return {
          group: editorSection!.id,
          key,
          value,
          type: existing?.type || 'text',
          label: existing?.label || key,
          description: existing?.description,
          sortOrder: existing?.sortOrder || 0,
        };
      });

      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });

      if (res.ok) {
        addToast(`${editorSection.label} ذخیره شد`, 'success');
        setEditorOpen(false);
        await fetchSettings();
      } else {
        addToast('خطا در ذخیره تنظیمات', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setSaving(false);
  };

  /* ── Toggle enabled ── */
  const handleToggle = async (groupId: string) => {
    const current = isEnabled(groupId);
    const newVal = String(!current);
    const existing = allSettings[groupId]?.['enabled'];

    try {
      await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [{
            group: groupId,
            key: 'enabled',
            value: newVal,
            type: existing?.type || 'boolean',
            label: existing?.label || 'فعال',
            sortOrder: existing?.sortOrder || 0,
          }],
        }),
      });
      await fetchSettings();
    } catch {
      addToast('خطا', 'error');
    }
  };

  /* ── Toggle all ── */
  const handleToggleAll = async (targetEnabled: boolean) => {
    setGlobalSaving(true);
    try {
      const payload = SECTIONS
        .filter(s => s.id !== 'landing_general')
        .map(s => {
          const existing = allSettings[s.id]?.['enabled'];
          return {
            group: s.id,
            key: 'enabled',
            value: String(targetEnabled),
            type: 'boolean',
            label: existing?.label || 'فعال',
            sortOrder: 0,
          };
        });

      await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });
      addToast(targetEnabled ? 'همه بخش‌ها فعال شدند' : 'همه بخش‌ها غیرفعال شدند', 'success');
      await fetchSettings();
    } catch {
      addToast('خطا', 'error');
    }
    setGlobalSaving(false);
  };

  /* ── Reset to defaults ── */
  const handleReset = async () => {
    if (!confirm('آیا مطمئنید؟ تمام تنظیمات به حالت پیش‌فرض بازنشانی می‌شوند.')) return;
    setGlobalSaving(true);
    try {
      await fetch('/api/admin/site-settings/seed?force=true', { method: 'POST' });
      await fetchSettings();
      addToast('تنظیمات بازنشانی شد', 'success');
    } catch {
      addToast('خطا در بازنشانی', 'error');
    }
    setGlobalSaving(false);
  };

  /* ── Validate JSON field ── */
  const validateJson = (key: string, value: string): boolean => {
    if (!value.trim()) return true;
    try {
      JSON.parse(value);
      setJsonErrors(prev => ({ ...prev, [key]: '' }));
      return true;
    } catch {
      setJsonErrors(prev => ({ ...prev, [key]: 'فرمت JSON نامعتبر است' }));
      return false;
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render Field                                                           */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderField = (key: string, item: SettingItem) => {
    const val = editForm[key] ?? item.value;

    if (item.type === 'boolean') {
      return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
          <div className="flex-1 min-w-0 ml-3">
            <Label className="text-sm font-medium">{item.label}</Label>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            )}
          </div>
          <Switch
            checked={val === 'true'}
            onCheckedChange={(checked) =>
              setEditForm(prev => ({ ...prev, [key]: String(checked) }))
            }
          />
        </div>
      );
    }

    if (item.type === 'textarea') {
      return (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{item.label}</Label>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
          <Textarea
            value={val}
            onChange={(e) => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
            className="min-h-[80px] resize-y"
            dir="rtl"
          />
        </div>
      );
    }

    if (item.type === 'json') {
      const hasError = !!jsonErrors[key];
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{item.label}</Label>
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
              JSON
            </Badge>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
          <Textarea
            value={val}
            onChange={(e) => {
              setEditForm(prev => ({ ...prev, [key]: e.target.value }));
              validateJson(key, e.target.value);
            }}
            className={cn(
              'min-h-[120px] resize-y font-mono text-xs',
              hasError && 'border-red-500 focus-visible:ring-red-500'
            )}
            dir="ltr"
          />
          {hasError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="size-3" />
              {jsonErrors[key]}
            </p>
          )}
          {val && !hasError && (
            <button
              type="button"
              onClick={() => {
                try {
                  const parsed = JSON.parse(val);
                  setEditForm(prev => ({ ...prev, [key]: JSON.stringify(parsed, null, 2) }));
                } catch { /* ignore */ }
              }}
              className="text-[10px] text-gold hover:underline"
            >
              فرمت‌سازی (Beautify)
            </button>
          )}
        </div>
      );
    }

    /* Default: text input */
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{item.label}</Label>
        {item.description && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        )}
        <Input
          value={val}
          onChange={(e) => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
          dir="rtl"
        />
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const enabledCount = getEnabledCount();

  /* ── Open Visual Builder (seeded from settings) ── */
  const openBuilder = async () => {
    setBuilderLoading(true);
    try {
      /* Re-fetch latest settings before seeding */
      const settingsRes = await fetch('/api/admin/site-settings');
      let latestSettings = allSettings;
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        const map: SettingsMap = {};
        for (const g of data.groups || []) {
          map[g.group] = {};
          for (const s of g.settings) {
            map[g.group][s.key] = s;
          }
        }
        latestSettings = map;
        setAllSettings(map);
      }

      const page = await seedBuilderFromSettings(latestSettings);
      if (page) {
        setBuilderPage(page);
        setBuilderSource('landing');
        syncDoneRef.current = false;
        setEditingWithBuilder(true);
      } else {
        addToast('خطا در ایجاد صفحه ویرایشگر', 'error');
      }
    } catch {
      addToast('خطا در بارگذاری ویرایشگر بصری', 'error');
    }
    setBuilderLoading(false);
  };

  /* ── Open Builder for specific section ── */
  const openBuilderForSection = async () => {
    await openBuilder();
  };

  /* ── Handle builder save ── */
  const handleBuilderSave = () => {
    syncDoneRef.current = false;
  };

  /* ── Handle builder back (with sync for landing, refresh for cms) ── */
  const handleBuilderBack = async () => {
    if (builderPage && !syncDoneRef.current) {
      syncDoneRef.current = true;
      setEditingWithBuilder(false);

      if (builderSource === 'landing') {
        await syncBuilderToSettings(builderPage.id);
      } else {
        addToast('تغییرات صفحه ذخیره شد', 'success');
        await fetchCmsPages();
      }

      setBuilderPage(null);
    } else {
      setEditingWithBuilder(false);
      setBuilderPage(null);
    }
  };

  /* ── Builder Mode ── */
  if (editingWithBuilder && builderPage) {
    return (
      <ElementorBuilder
        page={builderPage}
        onBack={handleBuilderBack}
        onSave={handleBuilderSave}
      />
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render Landing Section Editor (Tab 1)                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderLandingTab = () => (
    <div className="space-y-5" dir="rtl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Layers className="size-5 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold">ویرایشگر لندینگ پیج</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              بخش‌های صفحه اصلی را ویرایش کنید —{' '}
              <span className="text-gold font-bold">{enabledCount}</span> از {SECTIONS.length - 1} بخش فعال
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="bg-gold hover:bg-gold-dark text-black font-bold text-xs"
            onClick={openBuilder}
            disabled={builderLoading}
          >
            {builderLoading ? <Loader2 className="size-3.5 ml-1 animate-spin" /> : <Wand2 className="size-3.5 ml-1" />}
            ویرایش بصری (المنتوری)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gold/20 hover:bg-gold/5 text-xs"
            onClick={() => handleToggleAll(true)}
            disabled={globalSaving}
          >
            <Eye className="size-3.5 ml-1" />
            فعال کردن همه
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/20 hover:bg-red-500/5 text-red-500 text-xs"
            onClick={() => handleToggleAll(false)}
            disabled={globalSaving}
          >
            <EyeOff className="size-3.5 ml-1" />
            غیرفعال همه
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/20 hover:bg-amber-500/5 text-amber-600 text-xs"
            onClick={handleReset}
          >
            <RotateCcw className="size-3.5 ml-1" />
            بازنشانی
          </Button>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gold/5 border border-gold/15">
        <Pencil className="size-4 text-gold shrink-0" />
        <p className="text-xs text-muted-foreground">
          با کلیک روی دکمه <span className="text-gold font-bold">ویرایش بصری</span> یا آیکون ویرایش هر بخش، ویرایشگر المنتوری با تمام بخش‌ها باز می‌شود. پس از ذخیره، تغییرات به‌صورت خودکار در تنظیمات لحاظ می‌شود.
        </p>
      </div>

      {/* ── Section List ── */}
      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const SIcon = section.icon;
          const enabled = isEnabled(section.id);
          const isExpanded = expandedId === section.id;
          const groupSettings = allSettings[section.id] || {};
          const settingCount = Object.keys(groupSettings).length;

          return (
            <Card
              key={section.id}
              className={cn(
                'transition-all duration-200 overflow-hidden',
                enabled
                  ? 'border-gold/15 bg-gold/[0.02]'
                  : 'border-border/50 opacity-60',
              )}
            >
              <CardContent className="p-0">
                {/* Section header row */}
                <div
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : section.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(isExpanded ? null : section.id); } }}
                >
                  <GripVertical className="size-4 text-muted-foreground/40 shrink-0 cursor-grab" />

                  <div className={cn(
                    'size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    enabled ? 'bg-gold/10' : 'bg-muted/50',
                  )}>
                    <SIcon className={cn('size-5', enabled ? 'text-gold' : 'text-muted-foreground')} />
                  </div>

                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{section.label}</span>
                      <Badge className={cn(
                        'text-[10px]',
                        enabled ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground',
                      )}>
                        {settingCount} فیلد
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{section.description}</p>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => handleToggle(section.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-gold hover:bg-gold/10"
                      title="ویرایش بصری"
                      onClick={(e) => {
                        e.stopPropagation();
                        openBuilderForSection();
                      }}
                    >
                      <Edit className="size-3.5" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded preview */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-4 py-3 bg-muted/20">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(groupSettings)
                        .filter(([k]) => k !== 'enabled')
                        .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
                        .map(([key, item]) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 rounded-lg bg-background/60 border border-border/30 px-2.5 py-1.5"
                          >
                            <span className="text-[10px] text-muted-foreground">{item.label}:</span>
                            <span className="text-xs font-medium max-w-[180px] truncate">
                              {item.type === 'json' ? '[JSON]' : item.value.length > 40 ? item.value.slice(0, 40) + '...' : item.value}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Quick edit buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gold/20 hover:bg-gold/5 text-gold text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openBuilderForSection();
                        }}
                      >
                        <Wand2 className="size-3.5 ml-1" />
                        ویرایش بصری
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditor(section);
                        }}
                      >
                        <Edit className="size-3.5 ml-1" />
                        ویرایش فیلدها
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  Section Editor Dialog                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editorSection && (
                <>
                  <editorSection.icon className="size-5 text-gold" />
                  <span>ویرایش: {editorSection.label}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editorSection?.description}
            </DialogDescription>
          </DialogHeader>

          {editorSection && (
            <div className="space-y-4 mt-2">
              {/* Enabled toggle at top */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gold/5 border border-gold/15">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-gold" />
                  <span className="text-sm font-bold">فعال بودن بخش</span>
                </div>
                <Switch
                  checked={editForm['enabled'] === 'true'}
                  onCheckedChange={(checked) =>
                    setEditForm(prev => ({ ...prev, enabled: String(checked) }))
                  }
                />
              </div>

              <Separator />

              {/* All editable fields */}
              {Object.entries(allSettings[editorSection.id] || {})
                .filter(([key]) => key !== 'enabled')
                .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
                .map(([key, item]) => (
                  <div key={key}>{renderField(key, item)}</div>
                ))}

              {/* Save button */}
              <div className="flex gap-3 pt-2 sticky bottom-0 bg-background pb-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditorOpen(false)}
                  disabled={saving}
                >
                  انصراف
                </Button>
                <Button
                  className="flex-1 bg-gold hover:bg-gold-dark text-black font-bold"
                  onClick={handleSaveSection}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ذخیره...
                    </span>
                  ) : (
                    <>
                      <Save className="size-4 ml-1.5" />
                      ذخیره تنظیمات
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render Page Management (Tab 2)                                        */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderPagesTab = () => (
    <div className="space-y-5" dir="rtl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <FileText className="size-5 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold">مدیریت صفحات</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              ایجاد، ویرایش و حذف صفحات CMS —{' '}
              <span className="text-gold font-bold">{cmsPages.length}</span> صفحه
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-gold hover:bg-gold-dark text-black font-bold text-xs"
          onClick={handleCreatePage}
          disabled={creatingPage}
        >
          {creatingPage ? (
            <Loader2 className="size-3.5 ml-1 animate-spin" />
          ) : (
            <Plus className="size-3.5 ml-1" />
          )}
          ایجاد صفحه جدید
        </Button>
      </div>

      {/* ── Info Banner ── */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gold/5 border border-gold/15">
        <Info className="size-4 text-gold shrink-0" />
        <p className="text-xs text-muted-foreground">
          با کلیک روی <span className="text-gold font-bold">ویرایش با المنتوری</span>، ویرایشگر بصری برای هر صفحه باز می‌شود. تغییرات مستقیماً در ذخیره می‌شوند.
        </p>
      </div>

      {/* ── Loading ── */}
      {cmsPagesLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!cmsPagesLoading && cmsPages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
            <FileText className="size-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-bold mb-1">هنوز صفحه‌ای ایجاد نشده</h3>
          <p className="text-xs text-muted-foreground mb-4">اولین صفحه خود را با دکمه بالا ایجاد کنید</p>
          <Button
            size="sm"
            className="bg-gold hover:bg-gold-dark text-black font-bold text-xs"
            onClick={handleCreatePage}
            disabled={creatingPage}
          >
            {creatingPage ? <Loader2 className="size-3.5 ml-1 animate-spin" /> : <Plus className="size-3.5 ml-1" />}
            ایجاد صفحه جدید
          </Button>
        </div>
      )}

      {/* ── Pages List ── */}
      {!cmsPagesLoading && cmsPages.length > 0 && (
        <div className="space-y-2">
          {cmsPages.map((page) => (
            <Card
              key={page.id}
              className="transition-all duration-200 overflow-hidden border-border/50 hover:border-gold/20"
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Page Icon + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="size-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <FileText className="size-5 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold truncate">{page.title}</span>
                        <Badge className={cn(
                          'text-[10px]',
                          page.isPublished
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-amber-500/15 text-amber-500',
                        )}>
                          {page.isPublished ? 'منتشر شده' : 'پیش‌نویس'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1" dir="ltr">
                          <Globe className="size-3" />
                          /{page.slug}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Layers className="size-3" />
                          {(page.components?.length ?? 0)} کامپوننت
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-initial bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold text-xs px-3"
                      onClick={() => openCmsPageBuilder(page)}
                      disabled={builderLoading}
                    >
                      {builderLoading ? (
                        <Loader2 className="size-3.5 ml-1 animate-spin" />
                      ) : (
                        <Wand2 className="size-3.5 ml-1" />
                      )}
                      ویرایش با المنتوری
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-red-500 hover:bg-red-500/10"
                      title="حذف صفحه"
                      onClick={() => {
                        setDeleteTargetPage(page);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="size-5" />
              حذف صفحه
            </DialogTitle>
            <DialogDescription>
              آیا از حذف صفحه <span className="font-bold text-foreground">{deleteTargetPage?.title}</span> مطمئنید؟ این عمل قابل بازگشت نیست و تمام کامپوننت‌های آن حذف خواهند شد.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteTargetPage(null);
              }}
              disabled={deleting}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePage}
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-3.5 animate-spin" />
                  در حال حذف...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="size-3.5" />
                  حذف
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Main Render with Tabs                                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      dir="rtl"
      className="w-full"
    >
      {/* ── Tab Bar ── */}
      <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex mb-5 bg-muted/50 border border-border/50 rounded-xl p-1 h-auto">
        <TabsTrigger
          value="landing"
          className="flex items-center gap-2 rounded-lg py-2 px-4 text-xs font-medium data-[state=active]:bg-gold/15 data-[state=active]:text-gold data-[state=active]:shadow-none"
        >
          <Layers className="size-3.5" />
          ویرایش لندینگ
        </TabsTrigger>
        <TabsTrigger
          value="pages"
          className="flex items-center gap-2 rounded-lg py-2 px-4 text-xs font-medium data-[state=active]:bg-gold/15 data-[state=active]:text-gold data-[state=active]:shadow-none"
        >
          <FileText className="size-3.5" />
          مدیریت صفحات
          {cmsPages.length > 0 && (
            <Badge className="text-[9px] min-w-[18px] h-[18px] flex items-center justify-center bg-gold/20 text-gold border-0 px-1">
              {cmsPages.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      {/* ── Tab: Landing Editor ── */}
      <TabsContent value="landing" className="mt-0">
        {renderLandingTab()}
      </TabsContent>

      {/* ── Tab: Page Management ── */}
      <TabsContent value="pages" className="mt-0">
        {renderPagesTab()}
      </TabsContent>
    </Tabs>
  );
}
