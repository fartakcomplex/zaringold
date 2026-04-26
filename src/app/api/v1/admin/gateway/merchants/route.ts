import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  GET /api/v1/admin/gateway/merchants                                 */
/*  List merchants with optional KYC filter                             */
/*  Query: ?kyc=pending|approved|rejected|all&limit=20                  */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kycFilter = searchParams.get('kyc') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: Record<string, unknown> = {};
    if (kycFilter !== 'all') {
      where.kycStatus = kycFilter;
    }

    const merchants = await db.merchant.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, phone: true, fullName: true, email: true },
        },
      },
    });

    return NextResponse.json({ merchants });
  } catch (error) {
    console.error('[Gateway Merchants GET]', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/v1/admin/gateway/merchants                               */
/*  Approve / Reject KYC for a merchant                                 */
/*  Body: { merchantId, action: 'approve'|'reject', reason? }          */
/* ------------------------------------------------------------------ */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantId, action, reason } = body;

    if (!merchantId || !action) {
      return NextResponse.json({ message: 'پارامترهای نادرست' }, { status: 400 });
    }

    const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json({ message: 'پذیرنده یافت نشد' }, { status: 404 });
    }

    if (action === 'approve') {
      await db.merchant.update({
        where: { id: merchantId },
        data: {
          kycStatus: 'approved',
          isVerified: true,
        },
      });
      return NextResponse.json({ success: true, message: 'احراز هویت تأیید شد' });
    }

    if (action === 'reject') {
      await db.merchant.update({
        where: { id: merchantId },
        data: {
          kycStatus: 'rejected',
          isVerified: false,
        },
      });
      // Store rejection reason as an audit log entry
      if (reason) {
        await db.auditLog.create({
          data: {
            action: 'merchant_kyc_rejected',
            details: JSON.stringify({ merchantId, reason }),
          },
        });
      }
      return NextResponse.json({ success: true, message: 'احراز هویت رد شد' });
    }

    return NextResponse.json({ message: 'عملیات نامعتبر' }, { status: 400 });
  } catch (error) {
    console.error('[Gateway Merchants PATCH]', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
