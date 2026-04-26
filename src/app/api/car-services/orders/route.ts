import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List user's orders
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      db.carServiceOrder.findMany({
        where,
        include: {
          car: true,
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.carServiceOrder.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'خطا در دریافت سفارشات' }, { status: 500 });
  }
}

// POST - Create new order
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const body = await req.json();
    const { carId, categoryId, urgency = 'normal', description = '', location = '' } = body;

    if (!carId || !categoryId) {
      return NextResponse.json(
        { error: 'خودرو و دسته‌بندی خدمت الزامی است' },
        { status: 400 }
      );
    }

    // Verify car belongs to user
    const car = await db.userCar.findFirst({
      where: { id: carId, userId, isActive: true },
    });

    if (!car) {
      return NextResponse.json({ error: 'خودرو یافت نشد' }, { status: 404 });
    }

    // Get category info for pricing
    const category = await db.carServiceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }

    // Calculate estimated price (urgent = 1.5x)
    const urgencyMultiplier = urgency === 'urgent' ? 1.5 : 1.0;
    const estimatedPrice = category.basePrice * urgencyMultiplier;

    const order = await db.carServiceOrder.create({
      data: {
        userId,
        carId,
        categoryId,
        urgency,
        description,
        location,
        estimatedPrice,
      },
      include: {
        car: true,
        category: true,
      },
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'خطا در ثبت درخواست' }, { status: 500 });
  }
}
