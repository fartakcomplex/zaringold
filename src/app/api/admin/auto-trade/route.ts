import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

/* ------------------------------------------------------------------ */
/*  GET /api/admin/auto-trade — List all auto-trade orders            */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || undefined
    const orderType = searchParams.get('orderType') || undefined
    const search = searchParams.get('search') || undefined

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (orderType) {
      where.orderType = orderType
    }

    if (search) {
      where.user = {
        OR: [
          { phone: { contains: search } },
          { fullName: { contains: search } },
        ],
      }
    }

    const [orders, total] = await Promise.all([
      db.autoTradeOrder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.autoTradeOrder.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Summary stats
    const summary = await db.autoTradeOrder.aggregate({
      _sum: { amountFiat: true, amountGrams: true },
      _count: { id: true },
    })

    const activeCount = await db.autoTradeOrder.count({
      where: { status: { in: ['active', 'pending_confirmation'] } },
    })
    const executedCount = await db.autoTradeOrder.count({ where: { status: 'executed' } })
    const buyOrders = await db.autoTradeOrder.count({ where: { orderType: 'buy' } })
    const sellOrders = await db.autoTradeOrder.count({ where: { orderType: 'sell' } })

    return NextResponse.json({
      success: true,
      data: orders,
      total,
      page,
      totalPages,
      summary: {
        totalOrders: summary._count.id,
        totalAmountFiat: summary._sum.amountFiat || 0,
        totalAmountGrams: summary._sum.amountGrams || 0,
        active: activeCount,
        executed: executedCount,
        buyOrders,
        sellOrders,
      },
      message: 'لیست سفارشات معامله خودکار دریافت شد',
    })
  } catch (error) {
    console.error('Admin get auto-trade error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست سفارشات' },
      { status: 500 }
    )
  }
}
