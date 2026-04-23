import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: return gold reserve info (vault transparency)
export async function GET() {
  try {
    const reserve = await db.goldReserve.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!reserve) {
      return NextResponse.json({
        success: true,
        reserve: {
          totalGrams: 0,
          todayAddedGrams: 0,
          reserveRatio: 1.0,
          lastAuditDate: null,
          auditFirm: null,
        },
      })
    }

    // Get latest gold price for valuation
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    const goldPrice = latestPrice?.marketPrice ?? 0
    const totalFiatValue = reserve.totalGrams * goldPrice

    return NextResponse.json({
      success: true,
      reserve: {
        ...reserve,
        totalFiatValue: Number(totalFiatValue.toFixed(0)),
        goldPrice,
      },
    })
  } catch (error) {
    console.error('Get gold reserve error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات ذخایر طلایی' },
      { status: 500 }
    )
  }
}
