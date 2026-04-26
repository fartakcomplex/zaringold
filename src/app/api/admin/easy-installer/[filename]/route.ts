import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getPackagePath, deletePackage } from '@/lib/easy-installer';
import { requireAdmin } from '@/lib/security/auth-guard';

const PROJECT_ROOT = process.cwd();

/* ------------------------------------------------------------------ */
/*  GET — Download package file                                        */
/* ------------------------------------------------------------------ */

export async function GET(_request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const auth = await requireAdmin(_request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { filename } = await params;

    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { success: false, error: 'نام فایل نامعتبر' },
        { status: 400 }
      );
    }

    const filePath = await getPackagePath(filename);
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'فایل یافت نشد' },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('[easy-installer] Download error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'خطا در دانلود فایل' },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Delete a specific package                                 */
/* ------------------------------------------------------------------ */

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await export async function DELETE(filename.includes('..') || filename.includes('/') || filename.includes('\\'): NextRequest) {
    const auth = await requireAdmin(filename.includes('..') || filename.includes('/') || filename.includes('\\'));
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

      return NextResponse.json(
        { success: false, error: 'نام فایل نامعتبر' },
        { status: 400 }
      );
    }

    const success = await deletePackage(filename);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'فایل یافت نشد یا حذف نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'بسته با موفقیت حذف شد',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'خطا در حذف فایل' },
      { status: 500 }
    );
  }
}
