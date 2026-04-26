import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';
import { logSecurityEvent } from '@/lib/security/audit-logger';

/**
 * GET /api/admin/security/events — لیست رویدادهای امنیتی
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || undefined;
    const severity = searchParams.get('severity') || undefined;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const [events, total] = await Promise.all([
      db.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.securityEvent.count({ where }),
    ]);

    return NextResponse.json({
      events: events.map(e => ({
        ...e,
        details: e.details ? JSON.parse(e.details) : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Security Events] Error:', error);
    return NextResponse.json({ message: 'خطا' }, { status: 500 });
  }
}
