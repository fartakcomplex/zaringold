import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET: List email logs with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const email = searchParams.get('email') || ''
    const phone = searchParams.get('phone') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const campaignId = searchParams.get('campaignId') || ''

    const where: Record<string, unknown> = {}

    if (type) {
      where.type = type
    }
    if (status) {
      where.status = status
    }
    if (email) {
      where.email = { contains: email }
    }
    if (campaignId) {
      where.campaignId = campaignId
    }
    if (phone) {
      // Find user by phone and get their email
      const user = await db.user.findFirst({
        where: { phone },
        select: { email: true },
      })
      if (user?.email) {
        where.email = user.email
      } else {
        where.email = '__nonexistent__'
      }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        ;(where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        ;(where.createdAt as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    const [logs, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          campaign: {
            select: { name: true, type: true },
          },
        },
      }),
      db.emailLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing email logs:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت گزارش ایمیل‌ها' },
      { status: 500 }
    )
  }
}
