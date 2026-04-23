import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/v1/merchant/settlements/request
 * Request manual settlement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount_toman, amount_gold, iban } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    /* ── Find merchant ── */
    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    if (!merchant.isActive) {
      return NextResponse.json(
        { success: false, message: 'حساب پذیرنده غیرفعال است' },
        { status: 403 }
      )
    }

    /* ── Validate amount ── */
    const requestedToman = Number(amount_toman) || 0
    const requestedGold = Number(amount_gold) || 0

    if (requestedToman <= 0 && requestedGold <= 0) {
      return NextResponse.json(
        { success: false, message: 'مبلغ تسویه باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    /* ── Check pending settle balance ── */
    if (requestedToman > merchant.pendingSettle) {
      return NextResponse.json(
        { success: false, message: `مبلغ درخواستی بیشتر از مانده قابل تسویه (${Math.round(merchant.pendingSettle).toLocaleString()} واحد طلایی) است` },
        { status: 400 }
      )
    }

    if (requestedGold > merchant.pendingSettleGold) {
      return NextResponse.json(
        { success: false, message: `مقدار طلا درخواستی بیشتر از مانده قابل تسویه (${merchant.pendingSettleGold} گرم) است` },
        { status: 400 }
      )
    }

    /* ── Minimum settlement: 500,000 toman ── */
    if (requestedToman > 0 && requestedToman < 500000) {
      return NextResponse.json(
        { success: false, message: 'حداقل مبلغ تسویه ۵۰۰,۰۰۰ واحد طلایی است' },
        { status: 400 }
      )
    }

    /* ── Calculate period ── */
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = now

    /* ── Calculate fee ── */
    const feeToman = requestedToman * 0 // No fee for manual settlement

    /* ── Create settlement ── */
    const settlement = await db.settlement.create({
      data: {
        merchantId: merchant.id,
        amountToman: requestedToman,
        amountGold: requestedGold,
        feeToman,
        type: 'manual',
        periodStart,
        periodEnd,
        status: 'pending',
        iban: iban || merchant.iban,
      },
    })

    /* ── Deduct from pending settle ── */
    await db.merchant.update({
      where: { id: merchant.id },
      data: {
        pendingSettle: { decrement: requestedToman },
        pendingSettleGold: { decrement: requestedGold },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'درخواست تسویه‌حساب با موفقیت ثبت شد',
      data: {
        id: settlement.id,
        amount_toman: settlement.amountToman,
        amount_gold: settlement.amountGold,
        type: settlement.type,
        status: settlement.status,
        iban: settlement.iban,
        created_at: settlement.createdAt,
      },
    })
  } catch (error) {
    console.error('Settlement request error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت درخواست تسویه‌حساب' },
      { status: 500 }
    )
  }
}
