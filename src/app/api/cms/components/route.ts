import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: List components for a page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ success: false, message: 'شناسه صفحه الزامی است' }, { status: 400 });
    }

    const components = await db.cMSComponent.findMany({
      where: { pageId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ success: true, components });
  } catch (error) {
    console.error('CMS components GET error:', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت کامپوننت‌ها' }, { status: 500 });
  }
}

// POST: Add component to page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, type, props, order } = body;

    if (!pageId || !type) {
      return NextResponse.json({ success: false, message: 'شناسه صفحه و نوع کامپوننت الزامی است' }, { status: 400 });
    }

    const page = await db.cMSPage.findUnique({ where: { id: pageId } });
    if (!page) {
      return NextResponse.json({ success: false, message: 'صفحه یافت نشد' }, { status: 404 });
    }

    // Determine order: if not specified, append to end
    let componentOrder = order;
    if (componentOrder === undefined || componentOrder === null) {
      const maxOrder = await db.cMSComponent.findFirst({
        where: { pageId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      componentOrder = (maxOrder?.order ?? -1) + 1;
    }

    const component = await db.cMSComponent.create({
      data: {
        pageId,
        type,
        order: componentOrder,
        props: typeof props === 'string' ? props : JSON.stringify(props || {}),
      },
    });

    return NextResponse.json({ success: true, component });
  } catch (error) {
    console.error('CMS component POST error:', error);
    return NextResponse.json({ success: false, message: 'خطا در ایجاد کامپوننت' }, { status: 500 });
  }
}

// PUT: Update / reorder components
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { components } = body;

    if (!Array.isArray(components)) {
      return NextResponse.json({ success: false, message: 'فرمت نامعتبر' }, { status: 400 });
    }

    // Batch update order
    for (const comp of components) {
      await db.cMSComponent.update({
        where: { id: comp.id },
        data: { order: comp.order, props: comp.props ? (typeof comp.props === 'string' ? comp.props : JSON.stringify(comp.props)) : undefined },
      });
    }

    return NextResponse.json({ success: true, message: 'کامپوننت‌ها بروزرسانی شدند' });
  } catch (error) {
    console.error('CMS component PUT error:', error);
    return NextResponse.json({ success: false, message: 'خطا در بروزرسانی کامپوننت‌ها' }, { status: 500 });
  }
}

// DELETE: Remove component
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'شناسه کامپوننت الزامی است' }, { status: 400 });
    }

    await db.cMSComponent.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'کامپوننت حذف شد' });
  } catch (error) {
    console.error('CMS component DELETE error:', error);
    return NextResponse.json({ success: false, message: 'خطا در حذف کامپوننت' }, { status: 500 });
  }
}
