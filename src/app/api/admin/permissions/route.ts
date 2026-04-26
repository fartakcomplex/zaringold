import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/permissions — List all permissions grouped by module
export async function GET() {
  try {
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
