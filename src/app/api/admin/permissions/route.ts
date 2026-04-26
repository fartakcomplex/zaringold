import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

// GET /api/admin/permissions — List all permissions grouped by module
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const permissions = await db.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });

    // Group by module
    const grouped: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return NextResponse.json({
      success: true,
      data: {
        all: permissions,
        grouped,
        modules: Object.keys(grouped).sort(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست دسترسی‌ها' },
      { status: 500 }
    );
  }
}
