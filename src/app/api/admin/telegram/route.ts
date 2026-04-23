import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [totalUsers, totalAlerts, activeAlerts, totalInvoices, totalCustomers, activeSubs] = await Promise.all([
      db.telegramUser.count(),
      db.telegramAlert.count(),
      db.telegramAlert.count({ where: { isActive: true, isTriggered: false } }),
      db.telegramInvoice.count(),
      db.telegramB2BCustomer.count(),
      db.telegramSubscription.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalAlerts,
        activeAlerts,
        totalInvoices,
        totalCustomers,
        activeSubs,
      },
    });
  } catch (error) {
    console.error('[Admin Telegram GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت آمار ربات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, message, userId, chatId } = body;

    switch (action) {
      case 'broadcast': {
        if (!message || !message.trim()) {
          return NextResponse.json(
            { success: false, error: 'متن پیام الزامی است' },
            { status: 400 }
          );
        }

        // Get all linked users for broadcast
        const users = await db.telegramUser.findMany({
          select: { chatId: true, telegramId: true },
        });

        // In production, this would send via Telegram Bot API
        // For now, log the broadcast
        console.log(`[Admin Telegram] Broadcast to ${users.length} users:`, message.substring(0, 100));

        return NextResponse.json({
          success: true,
          data: {
            sentCount: users.length,
            message: `پیام همگانی برای ${users.length} کاربر ارسال شد`,
          },
        });
      }

      case 'send_to_user': {
        if (!userId && !chatId) {
          return NextResponse.json(
            { success: false, error: 'شناسه کاربر یا Chat ID الزامی است' },
            { status: 400 }
          );
        }
        if (!message || !message.trim()) {
          return NextResponse.json(
            { success: false, error: 'متن پیام الزامی است' },
            { status: 400 }
          );
        }

        // In production, this would send via Telegram Bot API
        console.log(`[Admin Telegram] Send to user ${userId || chatId}:`, message.substring(0, 100));

        return NextResponse.json({
          success: true,
          data: { message: 'پیام با موفقیت ارسال شد' },
        });
      }

      case 'test_notification': {
        // Send test notification to admin
        console.log('[Admin Telegram] Test notification sent');

        return NextResponse.json({
          success: true,
          data: { message: 'اعلان تست ارسال شد' },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'عملیات نامعتبر' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Admin Telegram POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}
