import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    const plan = await db.autoBuyPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'طرح یافت نشد' },
        { status: 404 }
      );
    }

    const updated = await db.autoBuyPlan.update({
      where: { id },
      data: { isActive: isActive !== undefined ? isActive : !plan.isActive },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: isActive ? 'طرح فعال شد' : 'طرح غیرفعال شد',
    });
  } catch (error) {
    console.error('Admin autosave plan update error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی طرح' },
      { status: 500 }
    );
  }
}
