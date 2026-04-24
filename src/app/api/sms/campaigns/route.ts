import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List campaigns ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type
    if (search) {
      where.name = { contains: search }
    }

    const [campaigns, total] = await Promise.all([
      db.smsCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { logs: true } },
        },
      }),
      db.smsCampaign.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      message: 'لیست کمپین‌های پیامکی',
      data: {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('[SMS Campaigns GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست کمپین‌ها' },
      { status: 500 }
    )
  }
}

// ─── Helper: Calculate recipient count by segment ─────────────────────
async function getRecipientCountBySegment(segment: string, filterJson: string): Promise<number> {
  const blacklistPhones = await db.smsBlacklist.findMany({
    select: { phone: true },
  })
  const blacklistSet = new Set(blacklistPhones.map((b) => b.phone))

  const where: Record<string, unknown> = {
    isActive: true,
    isFrozen: false,
    ...(blacklistSet.size > 0 ? { phone: { notIn: Array.from(blacklistSet) } } : {}),
  }

  try {
    const filters = JSON.parse(filterJson || '{}')
    if (filters.level) where.userLevel = filters.level
    if (filters.province) {
      where.profile = { province: filters.province }
    }
  } catch {
    // ignore invalid JSON
  }

  switch (segment) {
    case 'active':
      where.isActive = true
      break
    case 'vip':
      where.userLevel = { in: ['gold', 'platinum'] }
      break
    case 'new_users': {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      where.createdAt = { gte: thirtyDaysAgo }
      break
    }
    case 'kyc_verified':
      where.kyc = { status: 'approved' }
      break
    case 'gold_holders':
      where.goldWallet = { goldGrams: { gt: 0 } }
      break
    case 'all':
    default:
      break
  }

  return db.user.count({
    where: where as Parameters<typeof db.user.count>[0]['where'],
  })
}

// ─── POST: Create new campaign ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      type = 'marketing',
      message,
      segment = 'all',
      scheduledAt,
      template = '',
      filterJson = '{}',
      senderNumber = '',
      costPerSms = 35,
    } = body

    if (!name || !message) {
      return NextResponse.json(
        { success: false, message: 'نام و متن پیام الزامی است' },
        { status: 400 }
      )
    }

    const recipientCount = await getRecipientCountBySegment(segment, filterJson)
    const totalCost = recipientCount * costPerSms

    const campaign = await db.smsCampaign.create({
      data: {
        name,
        type,
        message,
        segment,
        filterJson: typeof filterJson === 'string' ? filterJson : JSON.stringify(filterJson),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        template,
        senderNumber,
        costPerSms,
        totalCost,
        recipientCount,
        status: scheduledAt ? 'scheduled' : 'draft',
        pendingCount: recipientCount,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'کمپین جدید با موفقیت ایجاد شد',
      data: campaign,
    })
  } catch (error) {
    console.error('[SMS Campaigns POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد کمپین' },
      { status: 500 }
    )
  }
}
