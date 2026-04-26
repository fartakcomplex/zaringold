import { NextRequest, NextResponse } from 'next/server';
import { deleteBackup } from '@/lib/backup';
import { requireAdmin } from '@/lib/security/auth-guard';

/**
 * DELETE /api/admin/backups/delete
 * 
 * Delete a specific backup file.
 * Body: { filename: string }
 */
export async function DELETE(request: NextRequest) {
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

    const result = deleteBackup(filename);

    return NextResponse.json({
      ok: result.success,
      message: result.message,
    });
  } catch (error: any) {
    console.error('[API] /api/admin/backups/delete error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'خطای ناشناخته' },
      { status: 500 }
    );
  }
}
