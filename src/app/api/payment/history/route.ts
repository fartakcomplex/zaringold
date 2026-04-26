import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.payment.count({
        where: { userId },
      }),
    ])

    /* ── Summary stats ── */
    const successfulPayments = payments.filter((p) => p.status === 'paid')
    const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount, 0)
    const totalFee = successfulPayments.reduce((sum, p) => sum + (p.fee || 0), 0)

    return NextResponse.json({
      success: true,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        description: p.description,
        status: p.status,
        provider: p.provider,
        refId: p.refId,
        cardPan: p.cardPan
          ? p.cardPan.slice(0, 6) + '******' + p.cardPan.slice(-4)
          : null,
        fee: p.fee,
        createdAt: p.createdAt,
        verifiedAt: p.verifiedAt,
      })),
      summary: {
        total,
        successful: successfulPayments.length,
        totalPaid,
        totalFee,
      },
    })
  } catch (error) {
    console.error('Payment history error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تاریخچه پرداخت' },
      { status: 500 }
    )
  }
}
