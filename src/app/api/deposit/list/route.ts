import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/deposit/list
 * User's deposit history with stats and pagination
 *
 * Query params:
 *   status? — filter by status (pending, paid, failed, expired)
 *   page?   — page number (default: 1)
 *   limit?  — items per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    // ── احراز هویت کاربر ──
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'توکن ارسال نشده' },
        { status: 401 }
      )
    }

    const session = await db.userSession.findUnique({
      where: { token },
      include: { user: { select: { id: true, isActive: true } } },
    })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'لطفاً وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    if (!session.user.isActive) {
      return NextResponse.json(
        { success: false, message: 'حساب کاربری شما غیرفعال شده است' },
        { status: 403 }
      )
    }

    // ── دریافت پارامترها ──
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // ── ساخت شرط جستجو ──
    const where: Record<string, unknown> = { userId: session.userId }
    if (status && status !== 'all') {
      where.status = status
    }

    // ── آمار کلی واریزهای کاربر ──
    const [totalAmount, pendingCount, paidCount, failedCount, expiredCount] = await Promise.all([
      db.rialDeposit.aggregate({
        where: { userId: session.userId, status: 'paid' },
        _sum: { amount: true },
      }),
      db.rialDeposit.count({ where: { userId: session.userId, status: 'pending' } }),
      db.rialDeposit.count({ where: { userId: session.userId, status: 'paid' } }),
      db.rialDeposit.count({ where: { userId: session.userId, status: 'failed' } }),
      db.rialDeposit.count({ where: { userId: session.userId, status: 'expired' } }),
    ])

    // ── دریافت لیست واریزها ──
    const [deposits, total] = await Promise.all([
      db.rialDeposit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.rialDeposit.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    const depositList = deposits.map((d) => ({
      id: d.id,
      amount: d.amount,
      status: d.status,
      authority: d.authority,
      refId: d.refId || null,
      cardPan: d.cardPan || null,
      gateway: d.gateway,
      description: d.description,
      paidAt: d.paidAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      stats: {
        totalPaidAmount: totalAmount._sum.amount || 0,
        pendingCount,
        paidCount,
        failedCount,
        expiredCount,
        totalCount: total,
      },
      deposits: depositList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Deposit list error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست واریزها' },
      { status: 500 }
    )
  }
}
