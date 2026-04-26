import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST /api/admin/landing/sync                                              */
/*  Syncs CMSComponent data back to SiteSettings                              */
/*  Body: { components: Array<{type: string, order: number, props: string, isVisible?: boolean}> } */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface IncomingComponent {
  type: string;
  order: number;
  props: string;
  isVisible?: boolean;
}

/* ── Mapping: widget type → SiteSetting group ── */
const WIDGET_TO_GROUP: Record<string, string> = {
  'hero-section': 'hero',
  'features-grid': 'features',
  'steps': 'how_it_works',
  'partners-logos': 'partners',
  'testimonials-carousel': 'testimonials',
  'faq-section': 'faq',
  'cta-section': 'cta',
  'stats-counter': 'hero',
  'heading': 'landing_general',
};

/* ── Label map for SiteSetting entries ── */
const KEY_LABELS: Record<string, Record<string, string>> = {
  hero: { heading: 'عنوان اصلی', subtitle: 'زیرعنوان', badge: 'برچسب', primaryCta: 'دکمه اصلی', secondaryCta: 'دکمه ثانویه', backgroundStyle: 'سبک پس‌زمینه', showPriceTicker: 'نمایش قیمت', enabled: 'فعال' },
  features: { heading: 'عنوان بخش', subtitle: 'زیرعنوان', items: 'آیتم‌ها', enabled: 'فعال' },
  how_it_works: { heading: 'عنوان بخش', subtitle: 'زیرعنوان', steps: 'مراحل', enabled: 'فعال' },
  partners: { heading: 'عنوان', columns: 'تعداد ستون', items: 'آیتم‌ها', enabled: 'فعال' },
  testimonials: { heading: 'عنوان', items: 'نظرات', enabled: 'فعال' },
  faq: { heading: 'عنوان بخش', items: 'سوالات', enabled: 'فعال' },
  cta: { heading: 'عنوان', subtitle: 'زیرعنوان', buttonText: 'متن دکمه', backgroundStyle: 'سبک پس‌زمینه', enabled: 'فعال' },
  landing_general: { heading: 'عنوان', enabled: 'فعال' },
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { components }: { components: IncomingComponent[] } = body;

    if (!Array.isArray(components) || components.length === 0) {
      return NextResponse.json({ error: 'آرایه کامپوننت‌ها خالی است' }, { status: 400 });
    }

    const allSettings: Array<{
      group: string;
      key: string;
      value: string;
      type: string;
      label: string;
      sortOrder: number;
    }> = [];

    let sortOrder = 0;

    for (const comp of components) {
      let props: Record<string, unknown>;
      try {
        props = typeof comp.props === 'string' ? JSON.parse(comp.props) : comp.props;
      } catch {
        continue;
      }

      const widgetType = comp.type;
      const group = WIDGET_TO_GROUP[widgetType];

      if (!group) continue;

      const isVisible = comp.isVisible !== false;

      switch (widgetType) {
        case 'hero-section': {
          if (props.heading !== undefined) allSettings.push({ group, key: 'heading', value: String(props.heading), type: 'text', label: KEY_LABELS[group]?.heading || 'عنوان', sortOrder: sortOrder++ });
          if (props.subtitle !== undefined) allSettings.push({ group, key: 'subtitle', value: String(props.subtitle), type: 'textarea', label: KEY_LABELS[group]?.subtitle || 'زیرعنوان', sortOrder: sortOrder++ });
          if (props.badge !== undefined) allSettings.push({ group, key: 'badge', value: String(props.badge), type: 'text', label: KEY_LABELS[group]?.badge || 'برچسب', sortOrder: sortOrder++ });
          if (props.primaryCtaText !== undefined) allSettings.push({ group, key: 'primaryCta', value: String(props.primaryCtaText), type: 'text', label: KEY_LABELS[group]?.primaryCta || 'دکمه اصلی', sortOrder: sortOrder++ });
          if (props.secondaryCtaText !== undefined) allSettings.push({ group, key: 'secondaryCta', value: String(props.secondaryCtaText), type: 'text', label: KEY_LABELS[group]?.secondaryCta || 'دکمه ثانویه', sortOrder: sortOrder++ });
          if (props.backgroundStyle !== undefined) allSettings.push({ group, key: 'backgroundStyle', value: String(props.backgroundStyle), type: 'text', label: KEY_LABELS[group]?.backgroundStyle || 'سبک پس‌زمینه', sortOrder: sortOrder++ });
          if (props.showStats !== undefined) allSettings.push({ group, key: 'showPriceTicker', value: String(props.showStats), type: 'boolean', label: KEY_LABELS[group]?.showPriceTicker || 'نمایش قیمت', sortOrder: sortOrder++ });
          allSettings.push({ group, key: 'enabled', value: isVisible ? 'true' : 'false', type: 'boolean', label: KEY_LABELS[group]?.enabled || 'فعال', sortOrder: 0 });
          break;
        }

        case 'features-grid': {
          if (props.heading !== undefined) allSettings.push({ group, key: 'heading', value: String(props.heading), type: 'text', label: KEY_LABELS[group]?.heading || 'عنوان', sortOrder: sortOrder++ });
          if (props.subtitle !== undefined) allSettings.push({ group, key: 'subtitle', value: String(props.subtitle), type: 'text', label: KEY_LABELS[group]?.subtitle || 'زیرعنوان', sortOrder: sortOrder++ });
          if (props.items !== undefined) allSettings.push({ group, key: 'items', value: JSON.stringify(props.items), type: 'json', label: KEY_LABELS[group]?.items || 'آیتم‌ها', sortOrder: sortOrder++ });
          allSettings.push({ group, key: 'enabled', value: isVisible ? 'true' : 'false', type: 'boolean', label: KEY_LABELS[group]?.enabled || 'فعال', sortOrder: 0 });
          break;
        }

        case 'steps': {
          if (props.heading !== undefined) allSettings.push({ group, key: 'heading', value: String(props.heading), type: 'text', label: KEY_LABELS[group]?.heading || 'عنوان', sortOrder: sortOrder++ });
          if (props.subtitle !== undefined) allSettings.push({ group, key: 'subtitle', value: String(props.subtitle), type: 'text', label: KEY_LABELS[group]?.subtitle || 'زیرعنوان', sortOrder: sortOrder++ });
          if (props.items !== undefined) {
            /* Remap: number→number, title→title, description→description (already matches) */
            allSettings.push({ group, key: 'steps', value: JSON.stringify(props.items), type: 'json', label: KEY_LABELS[group]?.steps || 'مراحل', sortOrder: sortOrder++ });
          }
          allSettings.push({ group, key: 'enabled', value: isVisible ? 'true' : 'false', type: 'boolean', label: KEY_LABELS[group]?.enabled || 'فعال', sortOrder: 0 });
          break;
        }

        case 'partners-logos': {
          if (props.heading !== undefined) allSettings.push({ group, key: 'heading', value: String(props.heading), type: 'text', label: KEY_LABELS[group]?.heading || 'عنوان', sortOrder: sortOrder++ });
          if (props.columns !== undefined) allSettings.push({ group, key: 'columns', value: String(props.columns), type: 'text', label: KEY_LABELS[group]?.columns || 'تعداد ستون', sortOrder: sortOrder++ });
          if (props.items !== undefined) allSettings.push({ group, key: 'items', value: JSON.stringify(props.items), type: 'json', label: KEY_LABELS[group]?.items || 'آیتم‌ها', sortOrder: sortOrder++ });
          allSettings.push({ group, key: 'enabled', value: isVisible ? 'true' : 'false', type: 'boolean', label: KEY_LABELS[group]?.enabled || 'فعال', sortOrder: 0 });
          break;
        }

        case 'testimonials-carousel': {
          if (props.items !== undefined && Array.isArray(props.items) && props.items.length > 0) {
            const firstItem = props.items[0] as Record<string, unknown>;
            if (firstItem.text) {
              allSettings.push({ group, key: 'heading', value: 'نظرات کاربران', type: 'text', label: KEY_LABELS[group]?.heading || 'عنوان', sortOrder: sortOrder++ });
            }
          }
          if (props.items !== undefined) allSettings.push({ group, key: 'items', value: JSON.stringify(props.items), type: 'json', label: KEY_LABELS[group]?.items || 'نظرات', sortOrder: sortOrder++ });
          allSettings.push({ group, key: 'enabled', value: isVisible ? 'true' : 'false', type: 'boolean', label: KEY_LABELS[group]?.enabled || 'فعال', sortOrder: 0 });
          break;
        }

        case 'faq-section': {
          if (props.heading !== undefined) allSettings.push({ group, key: 'heading', value: String(props.heading), type: 'text', label: KEY_LABELS[group]?.heading || 'عنوان', sortOrder: sortOrder++ });
          if (props.items !== undefined) {
            /* Remap: question→question, answer→answer (already matches) */
            allSettings.push({ group, key: 'items', value: JSON.stringify(props.items), type: 'json', label: KEY_LABELS[group]?.items || 'سوالات', sortOrder: sortOrder++ });
          }
          allSettings.push({ group, key: 'enabled', value: isVisible ? 'true' : 'false', type: 'boolean', label: KEY_LABELS[group]?.enabled || 'فعال', sortOrder: 0 });
          break;
        }

        case 'cta-section': {
          /* cta-section can map to either app_download or cta group.
             We use order to differentiate: first cta-section → app_download, second → cta.
             Or we check the buttonText for download keywords. */
          const buttonText = String(props.buttonText || '');
          const targetGroup = buttonText.includes('دانلود') ? 'app_download' : group;
          const labels = KEY_LABELS[targetGroup] || KEY_LABELS[group];

          if (props.heading !== undefined) allSettings.push({ group: targetGroup, key: 'heading', value: String(props.heading), type: 'text', label: labels?.heading || 'عنوان', sortOrder: sortOrder++ });
          if (props.subtitle !== undefined) allSettings.push({ group: targetGroup, key: 'subtitle', value: String(props.subtitle), type: 'text', label: labels?.subtitle || 'زیرعنوان', sortOrder: sortOrder++ });
          if (props.buttonText !== undefined) allSettings.push({ group: targetGroup, key: 'buttonText', value: String(props.buttonText), type: 'text', label: labels?.buttonText || 'متن دکمه', sortOrder: sortOrder++ });
          if (props.backgroundStyle !== undefined) allSettings.push({ group: targetGroup, key: 'backgroundStyle', value: String(props.backgroundStyle), type: 'text', label: labels?.backgroundStyle || 'سبک پس‌زمینه', sortOrder: sortOrder++ });
          allSettings.push({ group: targetGroup, key: 'enabled', value: isVisible ? 'true' : 'false', type: 'boolean', label: labels?.enabled || 'فعال', sortOrder: 0 });
          break;
        }

        case 'heading': {
          /* Generic heading → landing_general.heading */
          if (props.text !== undefined) allSettings.push({ group, key: 'heading', value: String(props.text), type: 'text', label: KEY_LABELS[group]?.heading || 'عنوان', sortOrder: sortOrder++ });
          break;
        }

        /* spacer, divider, icon-list, table, etc. → skip */
        default:
          break;
      }
    }

    if (allSettings.length === 0) {
      return NextResponse.json({ error: 'هیچ تنظیمی قابل همگام‌سازی نبود' }, { status: 400 });
    }

    /* Upsert all settings */
    const results = await Promise.all(
      allSettings.map((item) =>
        db.siteSetting.upsert({
          where: {
            group_key: { group: item.group, key: item.key },
          },
          create: item,
          update: {
            value: item.value,
            type: item.type,
            label: item.label,
            sortOrder: item.sortOrder,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      synced: results.length,
      groups: [...new Set(allSettings.map(s => s.group))],
    });
  } catch (error) {
    console.error('[Landing Sync] POST error:', error);
    return NextResponse.json({ error: 'خطا در همگام‌سازی تنظیمات' }, { status: 500 });
  }
}
