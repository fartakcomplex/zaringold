import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, successCount, pendingCount, cancelledCount, orders] =
      await Promise.all([
        db.carServiceOrder.count(),
        db.carServiceOrder.count({
          where: { createdAt: { gte: today } },
        }),
        db.carServiceOrder.count({
          where: { status: 'completed' },
        }),
        db.carServiceOrder.count({
          where: { status: 'pending' },
        }),
        db.carServiceOrder.count({
          where: { status: 'cancelled' },
        }),
        db.carServiceOrder.findMany({
          select: { status: true, finalPrice: true, categoryId: true },
        }),
      ]);

    const totalRevenue = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + (o.finalPrice || 0), 0);

    const categories = await db.carServiceCategory.findMany({
      select: { id: true, name: true, slug: true },
    });

    const byCategory: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const cat of categories) {
      byCategory[cat.id] = { name: cat.name, count: 0, revenue: 0 };
    }
    for (const o of orders) {
      if (byCategory[o.categoryId]) {
        byCategory[o.categoryId].count++;
        if (o.status === 'completed') {
          byCategory[o.categoryId].revenue += o.finalPrice || 0;
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        total,
        today: todayCount,
        success: successCount,
        pending: pendingCount,
        cancelled: cancelledCount,
        totalRevenue,
        byCategory,
      },
    });
  } catch (error) {
    console.error('Car stats error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار' },
      { status: 500 }
    );
  }
}
