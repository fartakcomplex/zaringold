import { NextRequest, NextResponse } from 'next/server';
import { listBackups } from '@/lib/backup';
import { requireAdmin } from '@/lib/security/auth-guard';

/**
 * GET /api/admin/backups/list
 * 
 * List all backups with metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const data = listBackups();
    return NextResponse.json({ ok: true, ...data });
  } catch (error: any) {
    console.error('[API] /api/admin/backups/list error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
