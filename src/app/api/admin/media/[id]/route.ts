import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/* ═══════════════════════════════════════════════════════════════════════════
 *  GET /api/admin/media — List all media (paginated)
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const folder = searchParams.get('folder') || undefined;
    const type = searchParams.get('type') || undefined; // image, video, all

    const where: Record<string, unknown> = {};
    if (folder) where.folder = folder;
    if (type && type !== 'all') {
      if (type === 'image') {
        where.mimeType = { startsWith: 'image/' };
      } else if (type === 'video') {
        where.mimeType = { startsWith: 'video/' };
      }
    }

    const [media, total] = await Promise.all([
      db.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.media.count({ where }),
    ]);

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Media List] Error:', error);
    return NextResponse.json({ message: 'خطا در دریافت رسانه‌ها' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  DELETE /api/admin/media/[id] — Delete a media file
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { id } = await params;
    const media = await db.media.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ message: 'رسانه یافت نشد' }, { status: 404 });
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), 'public', media.url);
    if (existsSync(filePath)) {
      try { await unlink(filePath); } catch { /* ignore */ }
    }

    // Delete from database
    await db.media.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Media Delete] Error:', error);
    return NextResponse.json({ message: 'خطا در حذف رسانه' }, { status: 500 });
  }
}
