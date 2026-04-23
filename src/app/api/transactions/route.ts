import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || undefined

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { userId }
    if (type) {
      where.type = type
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
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
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تراکنش‌ها' },
      { status: 500 }
    )
  }
}
