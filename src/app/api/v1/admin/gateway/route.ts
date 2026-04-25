import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  GET /api/v1/admin/gateway                                          */
/*  Platform overview stats: merchants, transactions, volumes          */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Merchant counts
    const [totalMerchants, activeMerchants, pendingKyc] = await Promise.all([
      db.merchant.count(),
      db.merchant.count({ where: { isActive: true, isVerified: true } }),
      db.merchant.count({ where: { kycStatus: 'pending' } }),
    ]);

    // Today's transactions
    const todayPayments = await db.gatewayPayment.findMany({
      where: { createdAt: { gte: todayStart } },
    });

    const todayTxCount = todayPayments.length;
    const todayVolumeToman = todayPayments.reduce((s, p) => s + p.amountToman, 0);
    const todayVolumeGold = todayPayments.reduce((s, p) => s + p.amountGold, 0);
    const todayFeeRevenue = todayPayments.reduce((s, p) => s + p.feeToman + p.feeGold, 0);

    // Fee settings from LoanSetting
    const feeSettings = await db.loanSetting.findMany({
      where: { key: { startsWith: 'gateway_fee_' } },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of feeSettings) {
      settingsMap[s.key] = s.value;
    }

    const defaultFeeRate = parseFloat(settingsMap['gateway_fee_default_rate'] || '1');
    const minFee = parseFloat(settingsMap['gateway_fee_min'] || '0');
    const maxFee = parseFloat(settingsMap['gateway_fee_max'] || '500000');

    // Recent payments for overview (last 10)
    const recentPayments = await db.gatewayPayment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: {
          select: { id: true, businessName: true },
        },
      },
    });

    return NextResponse.json({
      totalMerchants,
      activeMerchants,
      pendingKyc,
      todayTxCount,
      todayVolumeToman,
      todayVolumeGold,
      todayFeeRevenue,
      feeSettings: {
        defaultFeeRate,
        minFee,
        maxFee,
      },
      recentPayments,
    });
  } catch (error) {
    console.error('[Gateway Admin GET]', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/v1/admin/gateway                                          */
/*  Update fee settings (stored as LoanSetting records)                 */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { defaultFeeRate, minFee, maxFee } = body;

    const upsert = async (key: string, value: string, description: string) => {
      await db.loanSetting.upsert({
        where: { key },
        update: { value, description },
        create: { key, value, description },
      });
    };

    if (typeof defaultFeeRate === 'number') {
      await upsert('gateway_fee_default_rate', String(defaultFeeRate), 'نرخ کارمزد پیش‌فرض درگاه (درصد)');
    }
    if (typeof minFee === 'number') {
      await upsert('gateway_fee_min', String(minFee), 'حداقل کارمزد درگاه (واحد طلایی)');
    }
    if (typeof maxFee === 'number') {
      await upsert('gateway_fee_max', String(maxFee), 'حداکثر کارمزد درگاه (واحد طلایی)');
    }

    return NextResponse.json({ success: true, message: 'تنظیمات ذخیره شد' });
  } catch (error) {
    console.error('[Gateway Admin POST]', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
