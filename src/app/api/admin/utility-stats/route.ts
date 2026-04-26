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

    const [total, todayCount, successCount, failedCount, pendingCount, orders] =
      await Promise.all([
        db.utilityPayment.count(),
        db.utilityPayment.count({
          where: { createdAt: { gte: today } },
        }),
        db.utilityPayment.count({
          where: { status: 'success' },
        }),
        db.utilityPayment.count({
          where: { status: 'failed' },
        }),
        db.utilityPayment.count({
          where: { status: 'pending' },
        }),
        db.utilityPayment.findMany({
          select: { type: true, status: true, totalPrice: true },
        }),
      ]);

    const totalRevenue = orders
      .filter((o) => o.status === 'success')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const byType: Record<string, { count: number; revenue: number }> = {};
    for (const o of orders) {
      if (!byType[o.type]) byType[o.type] = { count: 0, revenue: 0 };
      byType[o.type].count++;
      if (o.status === 'success') byType[o.type].revenue += o.totalPrice;
    }

    const topupRevenue = byType['topup']?.revenue || 0;
    const internetRevenue = byType['internet']?.revenue || 0;
    const billRevenue = byType['bill']?.revenue || 0;
    const topupCount = byType['topup']?.count || 0;
    const internetCount = byType['internet']?.count || 0;
    const billCount = byType['bill']?.count || 0;

    return NextResponse.json({
      success: true,
      stats: {
        total,
        today: todayCount,
        success: successCount,
        failed: failedCount,
        pending: pendingCount,
        totalRevenue,
        topupCount,
        topupRevenue,
        internetCount,
        internetRevenue,
        billCount,
        billRevenue,
        byType,
      },
    });
  } catch (error) {
    console.error('Utility stats error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار' },
      { status: 500 }
    );
  }
}
