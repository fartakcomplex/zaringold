import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

/**
 * POST /api/admin/security/events/resolve — علامت‌گذاری رویداد به عنوان حل‌شده
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ message: 'شناسه رویداد الزامی است' }, { status: 400 });
    }

    const event = await db.securityEvent.update({
      where: { id: eventId },
      data: { resolved: true },
    });

    return NextResponse.json({
      success: true,
      message: 'رویداد به عنوان حل‌شده علامت‌گذاری شد',
      event,
    });
  } catch (error) {
    console.error('[Security Events Resolve] Error:', error);
    return NextResponse.json({ message: 'خطا' }, { status: 500 });
  }
}
