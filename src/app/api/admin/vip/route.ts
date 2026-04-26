import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  GET /api/admin/vip — List all VIP subscriptions with user info     */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const plan = searchParams.get('plan') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (plan) {
      where.plan = plan
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'expired') {
      where.isActive = false
    }

    if (search) {
      where.user = {
        OR: [
          { phone: { contains: search } },
          { fullName: { contains: search } },
        ],
      }
    }

    const [subscriptions, total] = await Promise.all([
      db.vIPSubscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              fullName: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.vIPSubscription.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Summary stats
    const summary = await db.vIPSubscription.aggregate({
      _count: { id: true },
    })

    const activeCount = await db.vIPSubscription.count({ where: { isActive: true } })
    const silverCount = await db.vIPSubscription.count({ where: { plan: 'silver' } })
    const goldCount = await db.vIPSubscription.count({ where: { plan: 'gold' } })
    const blackCount = await db.vIPSubscription.count({ where: { plan: 'black' } })

    return NextResponse.json({
      success: true,
      data: subscriptions,
      total,
      page,
      totalPages,
      summary: {
        total: summary._count.id,
        active: activeCount,
        silver: silverCount,
        gold: goldCount,
        black: blackCount,
      },
      message: 'لیست اشتراک‌های VIP دریافت شد',
    })
  } catch (error) {
    console.error('Admin get VIP error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست اشتراک‌های VIP' },
      { status: 500 }
    )
  }
}
