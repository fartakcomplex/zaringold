import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List SMS logs ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const phone = searchParams.get('phone') || ''
    const campaignId = searchParams.get('campaignId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const where: Record<string, unknown> = {}

    if (type) where.type = type
    if (status) where.status = status
    if (phone) where.phone = { contains: phone }
    if (campaignId) where.campaignId = campaignId

    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
      where.createdAt = dateFilter
    }

    const [logs, total] = await Promise.all([
      db.smsLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.smsLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      message: 'لیست گزارش پیامک‌ها',
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('[SMS Logs GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت گزارش پیامک‌ها' },
      { status: 500 }
    )
  }
}
