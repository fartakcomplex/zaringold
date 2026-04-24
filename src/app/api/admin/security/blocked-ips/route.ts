import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';
import { logSecurityEvent } from '@/lib/security/audit-logger';

/**
 * GET /api/admin/security/blocked-ips — لیست IPهای مسدود
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const ips = await db.blockedIP.findMany({
      orderBy: { createdAt: 'desc' },
      where: { isActive: true },
    });

    return NextResponse.json({ ips });
  } catch (error) {
    console.error('[Blocked IPs] Error:', error);
    return NextResponse.json({ message: 'خطا' }, { status: 500 });
  }
}

/**
 * POST /api/admin/security/blocked-ips — مسدود کردن IP
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { ip, reason, expiresAt } = await request.json();
    if (!ip) {
      return NextResponse.json({ message: 'IP الزامی است' }, { status: 400 });
    }

    const blocked = await db.blockedIP.create({
      data: {
        ip,
        reason: reason || 'محدودسازی دسترسی',
        blockedBy: auth.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await logSecurityEvent({
      type: 'ip_blocked',
      severity: 'warning',
      userId: auth.user.id,
      ip,
      details: { reason, blockedIp: ip },
    });

    return NextResponse.json({ success: true, blocked });
  } catch (error) {
    console.error('[Block IP] Error:', error);
    return NextResponse.json({ message: 'خطا' }, { status: 500 });
  }
}
