import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET: List unsubscribed emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const unsubscribedLogs = await db.emailLog.findMany({
      where: { status: 'unsubscribed' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      distinct: ['email'],
      select: {
        id: true,
        email: true,
        subject: true,
        type: true,
        createdAt: true,
        userId: true,
      },
    })

    // Get total unique unsubscribed emails
    const allUnsubscribed = await db.emailLog.findMany({
      where: { status: 'unsubscribed' },
      distinct: ['email'],
      select: { email: true },
    })
    const total = allUnsubscribed.length

    return NextResponse.json({
      success: true,
      data: unsubscribedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching unsubscribed emails:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لغو اشتراک‌ها' },
      { status: 500 }
    )
  }
}
