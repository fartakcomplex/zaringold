/**
 * Fraud Risk Events API — List & Create
 * GET  /api/v1/admin/fraud?level=high&status=unresolved&limit=20&type=rapid_payment
 * POST /api/v1/admin/fraud (create manual risk event)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRiskLevel, createRiskEvent, autoResolveOldLowRiskEvents } from '@/lib/fraud-detector';

// GET — list risk events with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');       // high | medium | low
    const status = searchParams.get('status');      // resolved | unresolved
    const eventType = searchParams.get('type');     // event type filter
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const autoResolve = searchParams.get('autoResolve') === 'true';

    // Optionally auto-resolve old low-risk events
    if (autoResolve) {
      await autoResolveOldLowRiskEvents();
    }

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status === 'resolved') {
      where.isResolved = true;
    } else if (status === 'unresolved') {
      where.isResolved = false;
    }

    if (level) {
      const thresholds: Record<string, { gte?: number; lt?: number }> = {
        high: { gte: 70 },
        medium: { gte: 40, lt: 70 },
        low: { lt: 40 },
      };
      const t = thresholds[level];
      if (t) {
        where.riskScore = t;
      }
    }

    if (eventType) {
      where.eventType = eventType;
    }

    const [events, total] = await Promise.all([
      db.riskEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      db.riskEvent.count({ where }),
    ]);

    // Enrich events with computed fields
    const enriched = events.map((e) => ({
      ...e,
      riskLevel: getRiskLevel(e.riskScore),
    }));

    // Stats
    const [totalCount, unresolvedCount, highCount, mediumCount, lowCount] = await Promise.all([
      db.riskEvent.count(),
      db.riskEvent.count({ where: { isResolved: false } }),
      db.riskEvent.count({ where: { riskScore: { gte: 70 } } }),
      db.riskEvent.count({ where: { riskScore: { gte: 40, lt: 70 } } }),
      db.riskEvent.count({ where: { riskScore: { lt: 40 } } }),
    ]);

    return NextResponse.json({
      events: enriched,
      total,
      stats: {
        total: totalCount,
        unresolved: unresolvedCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
    });
  } catch (error) {
    console.error('[Fraud API] GET error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت رویدادهای ریسک' },
      { status: 500 }
    );
  }
}

// POST — create a manual risk event (admin action)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, userId, merchantId, eventType, riskScore, details } = body;

    if (!eventType || riskScore === undefined) {
      return NextResponse.json(
        { error: 'eventType و riskScore الزامی هستند' },
        { status: 400 }
      );
    }

    const event = await createRiskEvent({
      paymentId,
      userId,
      merchantId,
      eventType,
      riskScore: Math.max(0, Math.min(100, Number(riskScore))),
      details,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('[Fraud API] POST error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد رویداد ریسک' },
      { status: 500 }
    );
  }
}
