import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET /api/alerts/price — List alerts + check triggered conditions       */
/* ═══════════════════════════════════════════════════════════════════════════ */

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

    // Fetch all active alerts for the user
    const alerts = await db.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get latest gold price to check triggers
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const currentBuyPrice = latestPrice?.buyPrice ?? 8_900_000;
    const currentSellPrice = latestPrice?.sellPrice ?? 8_875_000;

    // Check which alerts would be triggered
    const triggered: typeof alerts = [];
    const updatePromises: Promise<typeof alerts[number]>[] = [];

    for (const alert of alerts) {
      if (!alert.isActive || alert.isTriggered) continue;

      const priceToCheck = alert.type === 'buy' ? currentBuyPrice : currentSellPrice;
      const shouldTrigger =
        (alert.condition === 'above' && priceToCheck >= alert.targetPrice) ||
        (alert.condition === 'below' && priceToCheck <= alert.targetPrice);

      if (shouldTrigger) {
        triggered.push(alert);
        // Mark as triggered in database
        updatePromises.push(
          db.priceAlert.update({
            where: { id: alert.id },
            data: { isTriggered: true, isActive: false, updatedAt: new Date() },
          })
        );
      }
    }

    // Fire-and-forget the updates (don't await to keep response fast)
    if (updatePromises.length > 0) {
      Promise.all(updatePromises).catch((err) =>
        console.error('[PriceAlerts] Error updating triggered alerts:', err)
      );
    }

    return NextResponse.json({
      success: true,
      alerts,
      triggered: triggered.map((a) => ({
        id: a.id,
        type: a.type,
        condition: a.condition,
        targetPrice: a.targetPrice,
        currentPrice: a.type === 'buy' ? currentBuyPrice : currentSellPrice,
      })),
      currentBuyPrice,
      currentSellPrice,
    });
  } catch (error) {
    console.error('[PriceAlerts] GET error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت هشدارهای قیمت' },
      { status: 500 },
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST /api/alerts/price — Create a new price alert                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, targetPrice, direction, goldType } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 },
      );
    }

    if (!targetPrice || typeof targetPrice !== 'number' || targetPrice < 1000000) {
      return NextResponse.json(
        { success: false, message: 'قیمت هدف باید حداقل ۱,۰۰۰,۰۰۰ تومان باشد' },
        { status: 400 },
      );
    }

    if (!direction || !['above', 'below'].includes(direction)) {
      return NextResponse.json(
        { success: false, message: 'جهت باید بالاتر یا پایین‌تر باشد' },
        { status: 400 },
      );
    }

    const validGoldType = goldType === 'coin' ? 'sell' : 'buy';

    // Check max alerts (limit 10)
    const existingCount = await db.priceAlert.count({
      where: { userId, isActive: true },
    });

    if (existingCount >= 10) {
      return NextResponse.json(
        { success: false, message: 'حداکثر ۱۰ هشدار فعال قابل ثبت است' },
        { status: 400 },
      );
    }

    const alert = await db.priceAlert.create({
      data: {
        userId,
        type: validGoldType,
        condition: direction,
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
    console.error('[PriceAlerts] POST error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد هشدار قیمت' },
      { status: 500 },
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DELETE /api/alerts/price — Remove a price alert                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!alertId || !userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه هشدار و کاربر الزامی است' },
        { status: 400 },
      );
    }

    const existing = await db.priceAlert.findUnique({ where: { id: alertId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'هشدار مورد نظر یافت نشد' },
        { status: 404 },
      );
    }

    await db.priceAlert.delete({ where: { id: alertId } });

    return NextResponse.json({
      success: true,
      message: 'هشدار قیمت حذف شد',
    });
  } catch (error) {
    console.error('[PriceAlerts] DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف هشدار قیمت' },
      { status: 500 },
    );
  }
}
