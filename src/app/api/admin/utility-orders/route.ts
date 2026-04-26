import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (from && to) {
      where.createdAt = { gte: new Date(from), lte: new Date(to) };
    } else if (from) {
      where.createdAt = { gte: new Date(from) };
    }

    const [orders, total] = await Promise.all([
      db.utilityPayment.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.utilityPayment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Utility orders error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت سفارشات' },
      { status: 500 }
    );
  }
}
