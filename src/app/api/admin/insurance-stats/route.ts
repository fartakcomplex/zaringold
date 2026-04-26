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

    const [total, todayCount, activeCount, pendingCount, cancelledCount, expiredCount, orders] =
      await Promise.all([
        db.insuranceOrder.count(),
        db.insuranceOrder.count({
          where: { createdAt: { gte: today } },
        }),
        db.insuranceOrder.count({
          where: { status: 'active' },
        }),
        db.insuranceOrder.count({
          where: { status: 'pending' },
        }),
        db.insuranceOrder.count({
          where: { status: 'cancelled' },
        }),
        db.insuranceOrder.count({
          where: { status: 'expired' },
        }),
        db.insuranceOrder.findMany({
          select: { status: true, amountPaid: true, commissionEarned: true, providerName: true },
        }),
      ]);

    const totalRevenue = orders
      .filter((o) => o.status === 'active')
      .reduce((sum, o) => sum + (o.amountPaid || 0), 0);

    const totalCommission = orders
      .filter((o) => o.status === 'active')
      .reduce((sum, o) => sum + (o.commissionEarned || 0), 0);

    const byProvider: Record<string, { count: number; revenue: number }> = {};
    for (const o of orders) {
      const pName = o.providerName || 'نامشخص';
      if (!byProvider[pName]) byProvider[pName] = { count: 0, revenue: 0 };
      byProvider[pName].count++;
      if (o.status === 'active') byProvider[pName].revenue += o.amountPaid || 0;
    }

    return NextResponse.json({
      success: true,
      stats: {
        total,
        today: todayCount,
        active: activeCount,
        pending: pendingCount,
        cancelled: cancelledCount,
        expired: expiredCount,
        revenue: totalRevenue,
        commission: totalCommission,
        byProvider,
      },
    });
  } catch (error) {
    console.error('Insurance stats error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار' },
      { status: 500 }
    );
  }
}
