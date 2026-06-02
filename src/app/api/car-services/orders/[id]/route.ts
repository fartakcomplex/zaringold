import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single order
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const order = await db.carServiceOrder.findFirst({
      where: { id, userId },
      include: {
        car: true,
        category: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
}

// PUT - Update order
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const body = await req.json();

    const existingOrder = await db.carServiceOrder.findFirst({
      where: { id, userId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.rating !== undefined) {
      updateData.rating = Math.min(5, Math.max(1, body.rating));
    }
    if (body.userFeedback !== undefined) {
      updateData.userFeedback = body.userFeedback;
    }
    if (body.status === 'cancelled' && existingOrder.status === 'pending') {
      updateData.status = 'cancelled';
      updateData.cancelledAt = new Date();
    }

    const order = await db.carServiceOrder.update({
      where: { id },
      data: updateData,
      include: {
        car: true,
        category: true,
      },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی سفارش' }, { status: 500 });
  }
}
