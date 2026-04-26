import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const userId = searchParams.get('userId') || undefined

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (status) where.status = status
    if (userId) where.userId = userId

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      transactions,
      total,
      page,
      totalPages,
    })
  } catch (error) {
    console.error('Admin get transactions error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تراکنش‌ها' },
      { status: 500 }
    )
  }
}
