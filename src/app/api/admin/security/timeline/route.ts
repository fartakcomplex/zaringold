import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

/**
 * GET /api/admin/security/timeline — تایم‌لاین رویدادهای زنده و آمار ۷ روز اخیر
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    // 7-day daily event counts
    const now = new Date();
    const dailyCounts: { date: string; count: number; critical: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

      const [count, critical] = await Promise.all([
        db.securityEvent.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
        db.securityEvent.count({ where: { createdAt: { gte: dayStart, lt: dayEnd }, severity: 'critical' } }),
      ]);

      dailyCounts.push({
        date: dayStart.toISOString().split('T')[0],
        count,
        critical,
      });
    }

    // Latest 20 events for timeline
    const recentEvents = await db.securityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Threat level calculation
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [weekTotal, weekCritical, weekBots, weekAuthFail] = await Promise.all([
      db.securityEvent.count({ where: { createdAt: { gte: weekAgo } } }),
      db.securityEvent.count({ where: { createdAt: { gte: weekAgo }, severity: 'critical' } }),
      db.securityEvent.count({ where: { createdAt: { gte: weekAgo }, type: 'bot_detected' } }),
      db.securityEvent.count({ where: { createdAt: { gte: weekAgo }, type: 'auth_failure' } }),
    ]);

    let threatLevel: 'low' | 'medium' | 'high' | 'critical';
    let threatScore = 0;

    if (weekCritical >= 5 || weekAuthFail >= 50) {
      threatLevel = 'critical';
      threatScore = 90 + Math.min(weekCritical * 2, 10);
    } else if (weekCritical >= 2 || weekAuthFail >= 20) {
      threatLevel = 'high';
      threatScore = 65 + Math.min(weekCritical * 5, 25);
    } else if (weekTotal >= 10 || weekAuthFail >= 5) {
      threatLevel = 'medium';
      threatScore = 35 + Math.min(weekTotal, 30);
    } else {
      threatLevel = 'low';
      threatScore = Math.min(weekTotal * 3, 35);
    }

    return NextResponse.json({
      dailyCounts,
      recentEvents: recentEvents.map(e => ({
        ...e,
        details: e.details ? JSON.parse(e.details) : null,
      })),
      threatLevel,
      threatScore,
      weekStats: { total: weekTotal, critical: weekCritical, bots: weekBots, authFail: weekAuthFail },
    });
  } catch (error) {
    console.error('[Security Timeline] Error:', error);
    return NextResponse.json({ message: 'خطا' }, { status: 500 });
  }
}
