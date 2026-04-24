import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: List all pages (with components for preview)
export async function GET() {
  try {
    const pages = await db.cMSPage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        components: {
          orderBy: { order: 'asc' },
        },
      },
    });
    
    // Attach component count to each page
    const pagesWithCount = pages.map((p) => ({
      ...p,
      componentCount: p.components.length,
    }));
    
    return NextResponse.json({ success: true, pages: pagesWithCount });
  } catch (error) {
    console.error('CMS pages GET error:', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت صفحات' }, { status: 500 });
  }
}

// POST: Create new page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, title, content, seoTitle, seoDesc } = body;

    if (!slug || !title) {
      return NextResponse.json({ success: false, message: 'عنوان و شناسه صفحه الزامی است' }, { status: 400 });
    }

    const existing = await db.cMSPage.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'شناسه صفحه تکراری است' }, { status: 400 });
    }

    const page = await db.cMSPage.create({
      data: {
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        title,
        content: content || '[]',
        seoTitle: seoTitle || null,
        seoDesc: seoDesc || null,
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('CMS pages POST error:', error);
    return NextResponse.json({ success: false, message: 'خطا در ایجاد صفحه' }, { status: 500 });
  }
}
