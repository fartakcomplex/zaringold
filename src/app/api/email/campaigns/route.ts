import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET: List campaigns with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { subject: { contains: search } },
      ]
    }

    const [campaigns, total] = await Promise.all([
      db.emailCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { logs: true },
          },
        },
      }),
      db.emailCampaign.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing email campaigns:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست کمپین‌ها' },
      { status: 500 }
    )
  }
}

// POST: Create campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      type,
      subject,
      htmlContent,
      plainText,
      segment,
      scheduledAt,
      template,
    } = body

    if (!name || !subject) {
      return NextResponse.json(
        { success: false, message: 'نام و موضوع کمپین الزامی است' },
        { status: 400 }
      )
    }

    const campaign = await db.emailCampaign.create({
      data: {
        name,
        type: type || 'marketing',
        subject,
        htmlContent: htmlContent || '',
        plainText: plainText || '',
        segment: segment || 'all',
        template: template || '',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'scheduled' : 'draft',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'کمپین با موفقیت ایجاد شد',
      data: campaign,
    })
  } catch (error) {
    console.error('Error creating email campaign:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد کمپین' },
      { status: 500 }
    )
  }
}
