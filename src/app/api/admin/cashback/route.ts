import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  GET /api/admin/cashback — List all cashback rewards               */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { user: { phone: { contains: search } } },
        { user: { fullName: { contains: search } } },
      ]
    }

    const [rewards, total] = await Promise.all([
      db.cashbackReward.findMany({
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
      db.cashbackReward.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Summary stats
    const summary = await db.cashbackReward.aggregate({
      _sum: { rewardValue: true },
      _count: { id: true },
    })

    const pendingCount = await db.cashbackReward.count({ where: { status: 'pending' } })
    const claimedCount = await db.cashbackReward.count({ where: { status: 'claimed' } })

    return NextResponse.json({
      success: true,
      data: rewards,
      total,
      page,
      totalPages,
      summary: {
        totalRewards: summary._count.id,
        totalValue: summary._sum.rewardValue || 0,
        pending: pendingCount,
        claimed: claimedCount,
      },
      message: 'لیست پاداش‌های کش‌بک دریافت شد',
    })
  } catch (error) {
    console.error('Admin get cashback error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست کش‌بک' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/cashback — Create a new cashback reward           */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, rewardType, rewardValue, expiresAt } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'عنوان پاداش الزامی است' },
        { status: 400 }
      )
    }

    if (!rewardValue || rewardValue <= 0) {
      return NextResponse.json(
        { success: false, message: 'مقدار پاداش باید مثبت باشد' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر پیدا نشد' },
        { status: 404 }
      )
    }

    const reward = await db.cashbackReward.create({
      data: {
        userId,
        title: title.trim(),
        rewardType: rewardType || 'fiat',
        rewardValue: Number(rewardValue),
        status: 'pending',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: reward,
      message: 'پاداش کش‌بک با موفقیت ایجاد شد',
    })
  } catch (error) {
    console.error('Admin create cashback error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد پاداش کش‌بک' },
      { status: 500 }
    )
  }
}
