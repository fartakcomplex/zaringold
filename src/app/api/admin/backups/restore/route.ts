import { NextRequest, NextResponse } from 'next/server';
import { restoreBackup } from '@/lib/backup';
import { requireAdmin } from '@/lib/security/auth-guard';

/**
 * POST /api/admin/backups/restore
 * 
 * Restore database from a backup file.
 * Body: { filename: string }
 * 
 * Creates a pre-restore safety backup automatically.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { filename } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'نام فایل بکاپ الزامی است' },
        { status: 400 }
      );
    }

    // Safety check — prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { ok: false, error: 'نام فایل نامعتبر است' },
        { status: 400 }
      );
    }

    const result = restoreBackup(filename);

    return NextResponse.json({
      ok: result.success,
      message: result.message,
      ...result,
    });
  } catch (error: any) {
    console.error('[API] /api/admin/backups/restore error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'خطای ناشناخته' },
      { status: 500 }
    );
  }
}
