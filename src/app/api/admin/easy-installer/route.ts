import { NextRequest, NextResponse } from 'next/server';
import {
import { requireAdmin } from '@/lib/security/auth-guard';
  createExportPackage,
  listPackages,
  getSystemInfo,
  cleanupOldPackages,
  ExportOptions,
} from '@/lib/easy-installer';

/* ------------------------------------------------------------------ */
/*  GET — List packages + system info                                   */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const [packages, systemInfo] = await Promise.all([
      listPackages(),
      getSystemInfo(),
    ]);

    return NextResponse.json({
      success: true,
      data: { packages, systemInfo },
    });
  } catch (err: any) {
    console.error('[easy-installer] GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create new export package                                    */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const options: ExportOptions = {
      type: body.type || 'full',
      includeDatabase: body.includeDatabase !== false,
      includeUploads: body.includeUploads === true,
      label: body.label || undefined,
    };

    const pkg = await createExportPackage(options);

    if (pkg.status === 'failed') {
      return NextResponse.json(
        { success: false, error: 'خطا در ایجاد بسته نصب' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: pkg });
  } catch (err: any) {
    console.error('[easy-installer] POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'خطا در ایجاد بسته نصب' },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Cleanup old packages                                      */
/* ------------------------------------------------------------------ */

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'cleanup') {
      const maxAge = parseInt(searchParams.get('maxAge') || '30');
      const deleted = await cleanupOldPackages(maxAge);
      return NextResponse.json({
        success: true,
        data: { deletedCount: deleted },
      });
    }

    return NextResponse.json(
      { success: false, error: 'عملیات نامعتبر' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'خطا در پاکسازی' },
      { status: 500 }
    );
  }
}
