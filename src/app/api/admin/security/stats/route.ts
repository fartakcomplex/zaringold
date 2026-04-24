import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

/**
 * GET /api/admin/security/stats — آمار امنیتی داشبورد
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      todayEvents, weekEvents, criticalEvents,
      authFailures, botDetections, blockedIPs,
      activeSessions, frozenUsers, recentEvents,
      eventsByType,
    ] = await Promise.all([
      db.securityEvent.count({ where: { createdAt: { gte: today } } }),
      db.securityEvent.count({ where: { createdAt: { gte: weekAgo } } }),
      db.securityEvent.count({ where: { severity: 'critical', createdAt: { gte: weekAgo } } }),
      db.securityEvent.count({ where: { type: 'auth_failure', createdAt: { gte: today } } }),
      db.securityEvent.count({ where: { type: 'bot_detected', createdAt: { gte: weekAgo } } }),
      db.blockedIP.count({ where: { isActive: true } }),
      db.userSession.count({ where: { expiresAt: { gt: now } } }),
      db.user.count({ where: { isFrozen: true } }),
      db.securityEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      db.securityEvent.groupBy({
        by: ['type'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
        where: { createdAt: { gte: weekAgo } },
      }),
    ]);

    return NextResponse.json({
      today: todayEvents,
      week: weekEvents,
      critical: criticalEvents,
      authFailures,
      botDetections,
      blockedIPs,
      activeSessions,
      frozenUsers,
      recentEvents: recentEvents.map(e => ({
        ...e,
        details: e.details ? JSON.parse(e.details) : null,
      })),
      eventsByType: eventsByType.map(e => ({ type: e.type, count: e._count.id })),
    });
  } catch (error) {
    console.error('[Security Stats] Error:', error);
    return NextResponse.json({ message: 'خطا' }, { status: 500 });
  }
}
