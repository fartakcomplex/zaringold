import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  POST /api/admin/users/[id]/action                                  */
/*  Freeze / Unfreeze / Change Role                                    */
/* ------------------------------------------------------------------ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await req.json();
    const { action, role } = body;

    if (!userId || !action) {
      return NextResponse.json({ message: 'پارامترهای ناقص' }, { status: 400 });
    }

    // Validate user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: 'کاربر یافت نشد' }, { status: 404 });
    }

    switch (action) {
      case 'freeze': {
        const updated = await db.user.update({
          where: { id: userId },
          data: { isFrozen: true },
        });
        return NextResponse.json({ message: 'حساب کاربر مسدود شد', user: updated });
      }

      case 'unfreeze': {
        const updated = await db.user.update({
          where: { id: userId },
          data: { isFrozen: false },
        });
        return NextResponse.json({ message: 'حساب کاربر باز شد', user: updated });
      }

      case 'change_role': {
        if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
          return NextResponse.json({ message: 'نقش نامعتبر' }, { status: 400 });
        }
        const updated = await db.user.update({
          where: { id: userId },
          data: { role },
        });
        return NextResponse.json({ message: 'نقش کاربر بروزرسانی شد', user: updated });
      }

      default:
        return NextResponse.json({ message: 'عملیات نامعتبر' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Admin User Action]', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
