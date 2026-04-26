import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const plans = await db.autoBuyPlan.findMany({
      include: {
        user: { select: { id: true, phone: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: plans,
      total: plans.length,
      message: 'لیست طرح‌های پس‌انداز خودکار دریافت شد',
    });
  } catch (error) {
    console.error('Admin autosave plans error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت طرح‌های پس‌انداز' },
      { status: 500 }
    );
  }
}
