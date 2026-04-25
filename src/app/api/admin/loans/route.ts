import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      where.status = status
    }

    const loans = await db.goldLoan.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
          },
        },
        repayments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      loans,
      count: loans.length,
    })
  } catch (error) {
    console.error('Admin get loans error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست وام‌ها' },
      { status: 500 }
    )
  }
}
