import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

/* ── Default sections ── */
const DEFAULT_SECTIONS = [
  { sectionId: 'hero', title: 'بخش اصلی (Hero)', icon: 'Crown', sortOrder: 0, settings: '{}' },
  { sectionId: 'features', title: 'ویژگی‌ها', icon: 'Sparkles', sortOrder: 1, settings: '{}' },
  { sectionId: 'how-it-works', title: 'نحوه کارکرد', icon: 'ListOrdered', sortOrder: 2, settings: '{}' },
  { sectionId: 'calculator', title: 'ماشین‌حساب طلا', icon: 'Calculator', sortOrder: 3, settings: '{}' },
  { sectionId: 'security', title: 'امنیت', icon: 'ShieldCheck', sortOrder: 4, settings: '{}' },
  { sectionId: 'partners', title: 'شرکا و اعتماد', icon: 'Award', sortOrder: 5, settings: '{}' },
  { sectionId: 'testimonials', title: 'نظرات مشتریان', icon: 'MessageSquareQuote', sortOrder: 6, settings: '{}' },
  { sectionId: 'blog', title: 'وبلاگ', icon: 'Newspaper', sortOrder: 7, settings: '{}' },
  { sectionId: 'comparison', title: 'جدول مقایسه', icon: 'GitCompare', sortOrder: 8, settings: '{}' },
  { sectionId: 'faq', title: 'سوالات متداول', icon: 'HelpCircle', sortOrder: 9, settings: '{}' },
  { sectionId: 'app-download', title: 'دانلود اپلیکیشن', icon: 'Smartphone', sortOrder: 10, settings: '{}' },
  { sectionId: 'cta', title: 'دعوت به اقدام', icon: 'Rocket', sortOrder: 11, settings: '{}' },
];

/* ── GET: Fetch all landing sections ── */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    let sections = await db.landingSection.findMany({ orderBy: { sortOrder: 'asc' } });

    // Seed defaults if empty
    if (sections.length === 0) {
      await db.landingSection.createMany({ data: DEFAULT_SECTIONS });
      sections = await db.landingSection.findMany({ orderBy: { sortOrder: 'asc' } });
    }

    return NextResponse.json({ success: true, sections });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/* ── PUT: Update sections (visibility, order, settings) ── */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { sections } = body as {
      sections: Array<{
        id?: string;
      export async function PUT(!Array.isArray(sections): NextRequest) {
    const auth = await requireAdmin(!Array.isArray(sections));
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

      return NextResponse.json({ success: false, error: 'sections array required' }, { status: 400 });
    }

    // Update each section
    for (const sec of sections) {
      if (sec.id) {
        await db.landingSection.update({
          where: { id: sec.id },
          data: {
            ...(sec.isVisible !== undefined && { isVisible: sec.isVisible }),
            ...(sec.sortOrder !== undefined && { sortOrder: sec.sortOrder }),
            ...(sec.settings !== undefined && { settings: sec.settings }),
          },
        });
      } else if (sec.sectionId) {
        await db.landingSection.update({
          where: { sectionId: sec.sectionId },
          data: {
            ...(sec.isVisible !== undefined && { isVisible: sec.isVisible }),
            ...(sec.sortOrder !== undefined && { sortOrder: sec.sortOrder }),
            ...(sec.settings !== undefined && { settings: sec.settings }),
          },
        });
      }
    }

    const updated = await db.landingSection.findMany({ orderBy: { sortOrder: 'asc' } });
    return NextResponse.json({ success: true, sections: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
