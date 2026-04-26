import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
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
