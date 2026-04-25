/**
 * Single Fraud Risk Event API — Get & Resolve
 * GET   /api/v1/admin/fraud/[id]
 * PATCH /api/v1/admin/fraud/[id]  { isResolved: true, note: "..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRiskLevel, resolveRiskEvent } from '@/lib/fraud-detector';

// GET — single risk event details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await db.riskEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'رویداد ریسک یافت نشد' },
        { status: 404 }
      );
    }

    // Get merchant name if merchantId exists
    let merchantName: string | null = null;
    if (event.merchantId) {
      const merchant = await db.merchant.findUnique({
        where: { id: event.merchantId },
        select: { businessName: true },
      });
      merchantName = merchant?.businessName || null;
    }

    return NextResponse.json({
      ...event,
      riskLevel: getRiskLevel(event.riskScore),
      merchantName,
    });
  } catch (error) {
    console.error('[Fraud API] GET [id] error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت جزئیات رویداد' },
      { status: 500 }
    );
  }
}

// PATCH — resolve risk event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isResolved, note } = body;

    // Check event exists
    const existing = await db.riskEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'رویداد ریسک یافت نشد' },
        { status: 404 }
      );
    }

    if (isResolved) {
      const event = await resolveRiskEvent(id, note);
      return NextResponse.json({ event });
    }

    // Allow updating details as well
    const event = await db.riskEvent.update({
      where: { id },
      data: {
        ...(note !== undefined && { resolveNote: note }),
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('[Fraud API] PATCH [id] error:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی رویداد' },
      { status: 500 }
    );
  }
}
