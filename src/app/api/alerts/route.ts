import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserAccess } from '@/lib/access';

// ── GET: List user's price alerts ──
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 },
      );
    }

    const alerts = await db.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching price alerts:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت هشدارهای قیمت' },
      { status: 500 },
    );
  }
}

// ── POST: Create new price alert ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, condition, targetPrice } = body;

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 },
      );
    }

    // Validate type
    if (!type || !['buy', 'sell'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'نوع هشدار باید خرید یا فروش باشد' },
        { status: 400 },
      );
    }

    // Validate condition
    if (!condition || !['above', 'below'].includes(condition)) {
      return NextResponse.json(
        { success: false, message: 'شرط هشدار باید بالاتر یا پایین‌تر باشد' },
        { status: 400 },
      );
    }

    // Validate targetPrice (min 1,000,000 toman)
    if (!targetPrice || typeof targetPrice !== 'number' || targetPrice < 1000000) {
      return NextResponse.json(
        { success: false, message: 'قیمت هدف باید حداقل ۱,۰۰۰,۰۰۰ واحد طلایی باشد' },
        { status: 400 },
      );
    }

    // Check max alerts (diamond = unlimited)
    const existingCount = await db.priceAlert.count({
      where: { userId },
    });

    const access = await getUserAccess(userId);
    if (existingCount >= access.maxAlerts) {
      return NextResponse.json(
        { success: false, message: access.isSuperAdmin ? '' : `حداکثر ${access.maxAlerts} هشدار قیمت قابل ثبت است` },
        { status: 400 },
      );
    }

    // Create the alert
    const alert = await db.priceAlert.create({
      data: {
        userId,
        type,
        condition,
        targetPrice: Math.round(targetPrice),
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'هشدار قیمت با موفقیت ایجاد شد',
        alert,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating price alert:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد هشدار قیمت' },
      { status: 500 },
    );
  }
}
