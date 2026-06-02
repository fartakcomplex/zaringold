import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get payment history
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // topup, internet, bill
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { userId };
    if (type && type !== 'all') {
      where.type = type;
    }

    const [payments, total] = await Promise.all([
      db.utilityPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.utilityPayment.count({ where }),
    ]);

    // Calculate summary stats
    const summary = await db.utilityPayment.aggregate({
      where: { userId, status: 'success' },
      _sum: { amount: true, fee: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalSpent: summary._sum.amount || 0,
        totalFee: summary._sum.fee || 0,
        totalCount: summary._count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({ error: 'خطا در دریافت تاریخچه' }, { status: 500 });
  }
}
