import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: try to find page by slug, then by id
async function findPage(param: string) {
  // Try slug first
  let page = await db.cMSPage.findUnique({
    where: { slug: param },
    include: { components: { orderBy: { order: 'asc' } } },
  });
  if (page) return { page, lookedUpBy: 'slug' as const };

  // Try id
  page = await db.cMSPage.findUnique({
    where: { id: param },
    include: { components: { orderBy: { order: 'asc' } } },
  });
  if (page) return { page, lookedUpBy: 'id' as const };

  return { page: null, lookedUpBy: null as const };
}

// GET: Get page by slug or ID
// Public: returns published pages only when queried by slug
// Admin: returns any page when queried by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { page, lookedUpBy } = await findPage(slug);

    if (!page) {
      return NextResponse.json({ success: false, message: 'صفحه یافت نشد' }, { status: 404 });
    }

    // When looked up by slug (public route), only return published pages
    if (lookedUpBy === 'slug' && !page.isPublished) {
      return NextResponse.json({ success: false, message: 'صفحه منتشر نشده است' }, { status: 404 });
    }

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('CMS page GET error:', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت صفحه' }, { status: 500 });
  }
}

// PUT: Update page (by slug or ID)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { title, content, seoTitle, seoDesc, isPublished } = body;

    const { page: existing } = await findPage(slug);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'صفحه یافت نشد' }, { status: 404 });
    }

    // If a new slug is provided in the body, check uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await db.cMSPage.findUnique({ where: { slug: body.slug } });
      if (slugExists) {
        return NextResponse.json({ success: false, message: 'شناسه صفحه تکراری است' }, { status: 400 });
      }
    }

    const page = await db.cMSPage.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDesc !== undefined && { seoDesc }),
        ...(isPublished !== undefined && { isPublished }),
        ...(body.slug && body.slug !== existing.slug && { slug: body.slug }),
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('CMS page PUT error:', error);
    return NextResponse.json({ success: false, message: 'خطا در بروزرسانی صفحه' }, { status: 500 });
  }
}

// DELETE: Delete page (by slug or ID)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { page: existing } = await findPage(slug);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'صفحه یافت نشد' }, { status: 404 });
    }

    await db.cMSPage.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, message: 'صفحه حذف شد' });
  } catch (error) {
    console.error('CMS page DELETE error:', error);
    return NextResponse.json({ success: false, message: 'خطا در حذف صفحه' }, { status: 500 });
  }
}
