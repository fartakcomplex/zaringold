import { NextResponse } from 'next/server';
import { listBackups } from '@/lib/backup';

/**
 * GET /api/admin/backups/list
 * 
 * List all backups with metadata.
 */
export async function GET() {
  try {
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
