import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/tickets/stats — Dashboard statistics
export async function GET() {
  try {
    const [total, open, inProgress, answered, closed, urgent, avgRating] = await Promise.all([
      db.supportTicket.count(),
      db.supportTicket.count({ where: { status: 'open' } }),
      db.supportTicket.count({ where: { status: 'in_progress' } }),
      db.supportTicket.count({ where: { status: 'answered' } }),
      db.supportTicket.count({ where: { status: 'closed' } }),
      db.supportTicket.count({ where: { priority: 'urgent' } }),
      db.supportTicket.aggregate({ where: { rating: { not: null } }, _avg: { rating: true } }),
    ]);

    // Average resolution time (closed tickets)
    const closedTickets = await db.supportTicket.findMany({
      where: { status: 'closed', closedAt: { not: null } },
      select: { createdAt: true, closedAt: true },
      take: 50,
    });
    const avgResolutionMs = closedTickets.length > 0
      ? closedTickets.reduce((sum, t) => sum + ((t.closedAt!.getTime() - t.createdAt.getTime())), 0) / closedTickets.length
      : 0;

    // SLA breach count
    const now = new Date();
    const slaBreached = await db.supportTicket.count({
      where: { slaDeadline: { lt: now }, status: { not: 'closed' } },
    });

    // Tickets by category
    const byCategory = await db.supportTicket.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Tickets by department
    const byDepartment = await db.supportTicket.groupBy({
      by: ['department'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Recent trend (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const recentTrend = await db.supportTicket.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        total, open, inProgress, answered, closed, urgent, slaBreached,
        avgRating: avgRating._avg.rating || 0,
        avgResolutionHours: Math.round(avgResolutionMs / 3600000),
        byCategory,
        byDepartment,
        recentTrend,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
