import { NextResponse } from 'next/server';
import { getBackupStats } from '@/lib/backup';

/**
 * GET /api/admin/backups/stats
 * 
 * Get backup system statistics.
 */
export async function GET() {
  try {
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
