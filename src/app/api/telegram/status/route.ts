import { NextResponse } from 'next/server';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET /api/telegram/status                                                  */
/*  Returns the Telegram bot status information for the user-facing page      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function GET() {
  try {
    // Mock bot status data — in production this would query the DB / bot service
    const botStatus = {
      isConnected: true,
      botUsername: '@ZarrinGoldBot',
      botName: 'ربات زرین گلد',
      version: '2.1.0',
      uptime: '99.8%',
      lastPing: new Date().toISOString(),
      stats: {
        totalUsers: 1247,
        messagesToday: 8432,
        activeAlerts: 312,
        dailyReports: 456,
        b2bInvoices: 89,
      },
    };

    return NextResponse.json({
      success: true,
      data: botStatus,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت وضعیت ربات' },
      { status: 500 }
    );
  }
}
