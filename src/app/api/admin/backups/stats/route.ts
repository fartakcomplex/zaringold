import { NextRequest, NextResponse } from 'next/server';
import { getBackupStats } from '@/lib/backup';
import { requireAdmin } from '@/lib/security/auth-guard';

/**
 * GET /api/admin/backups/stats
 * 
 * Get backup system statistics.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const stats = getBackupStats();
    return NextResponse.json({ ok: true, stats });
  } catch (error: any) {
    console.error('[API] /api/admin/backups/stats error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
