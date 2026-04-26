import { NextRequest, NextResponse } from 'next/server';
import { createBackup } from '@/lib/backup';
import { requireAdmin } from '@/lib/security/auth-guard';

/**
 * POST /api/admin/backups/manual
 * 
 * Create a manual backup on demand.
 * Body: { type?: 'daily' | 'weekly' }  (default: 'daily')
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const type: 'daily' | 'weekly' = body.type === 'weekly' ? 'weekly' : 'daily';

    const backup = createBackup(type);

    return NextResponse.json({
      ok: true,
      message: `بکاپ ${type === 'daily' ? 'روزانه' : 'هفتگی'} با موفقیت ایجاد شد`,
      backup,
    });
  } catch (error: any) {
    console.error('[API] /api/admin/backups/manual error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'خطای ناشناخته' },
      { status: 500 }
    );
  }
}
