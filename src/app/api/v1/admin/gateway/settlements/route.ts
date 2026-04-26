import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  GET /api/v1/admin/gateway/settlements                               */
/*  List settlements with optional status filter                        */
/*  Query: ?status=pending|processing|completed|all&limit=20            */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: Record<string, unknown> = {};
    if (statusFilter !== 'all') {
      where.status = statusFilter;
    }

    const settlements = await db.settlement.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: {
          select: { id: true, businessName: true, iban: true },
        },
      },
    });

    // Summary counts
    const [pendingCount, processingCount, completedCount] = await Promise.all([
      db.settlement.count({ where: { status: 'pending' } }),
      db.settlement.count({ where: { status: 'processing' } }),
      db.settlement.count({ where: { status: 'completed' } }),
    ]);

    return NextResponse.json({
      settlements,
      counts: { pending: pendingCount, processing: processingCount, completed: completedCount },
    });
  } catch (error) {
    console.error('[Gateway Settlements GET]', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/v1/admin/gateway/settlements                             */
/*  Approve or process a settlement                                     */
/*  Body: { settlementId, action: 'approve'|'process' }                */
/* ------------------------------------------------------------------ */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { settlementId, action } = body;

    if (!settlementId || !action) {
      return NextResponse.json({ message: 'پارامترهای نادرست' }, { status: 400 });
    }

    const settlement = await db.settlement.findUnique({ where: { id: settlementId } });
    if (!settlement) {
      return NextResponse.json({ message: 'تسویه یافت نشد' }, { status: 404 });
    }

    if (action === 'approve') {
      if (settlement.status !== 'pending') {
        return NextResponse.json({ message: 'فقط تسویه‌های در انتظار قابل تأیید هستند' }, { status: 400 });
      }
      await db.settlement.update({
        where: { id: settlementId },
        data: { status: 'processing' },
      });
      return NextResponse.json({ success: true, message: 'تسویه تأیید و در حال پردازش' });
    }

    if (action === 'process') {
      if (settlement.status !== 'processing') {
        return NextResponse.json({ message: 'فقط تسویه‌های در حال پردازش قابل تکمیل هستند' }, { status: 400 });
      }
      await db.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'completed',
          processedAt: new Date(),
        },
      });

      // Update merchant settled amounts
      await db.merchant.update({
        where: { id: settlement.merchantId },
        data: {
          totalSettled: { increment: settlement.amountToman - settlement.feeToman },
          totalSettledGold: { increment: settlement.amountGold },
          pendingSettle: { decrement: settlement.amountToman },
          pendingSettleGold: { decrement: settlement.amountGold },
        },
      });

      return NextResponse.json({ success: true, message: 'تسویه تکمیل شد' });
    }

    return NextResponse.json({ message: 'عملیات نامعتبر' }, { status: 400 });
  } catch (error) {
    console.error('[Gateway Settlements PATCH]', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
