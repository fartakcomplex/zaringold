import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

/**
 * GET /api/admin/security/sessions — لیست نشست‌های فعال
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const sessions = await db.userSession.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { expiresAt: { gt: new Date() } },
      include: {
        user: {
          select: { id: true, phone: true, fullName: true, role: true, avatar: true },
        },
      },
      take: 50,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('[Sessions] Error:', error);
    return NextResponse.json({ message: 'خطا' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/security/sessions — ابطال نشست
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ message: 'توکن الزامی است' }, { status: 400 });
    }

    await db.userSession.delete({ where: { token } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Revoke Session] Error:', error);
    return NextResponse.json({ message: 'خطا' }, { status: 500 });
  }
}
