import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  GET /api/admin/gifts — List all gift transfers                     */
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
        { sender: { phone: { contains: search } } },
        { sender: { fullName: { contains: search } } },
        { receiver: { phone: { contains: search } } },
        { receiver: { fullName: { contains: search } } },
      ]
    }

    const [gifts, total] = await Promise.all([
      db.giftTransfer.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              phone: true,
              fullName: true,
              avatar: true,
            },
          },
          receiver: {
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
      db.giftTransfer.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Summary stats
    const summary = await db.giftTransfer.aggregate({
      _sum: { goldMg: true },
      _count: { id: true },
    })

    return NextResponse.json({
      success: true,
      data: gifts,
      total,
      page,
      totalPages,
      summary: {
        totalTransfers: summary._count.id,
        totalGoldMg: summary._sum.goldMg || 0,
      },
      message: 'لیست انتقال هدایا دریافت شد',
    })
  } catch (error) {
    console.error('Admin get gifts error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست هدایا' },
      { status: 500 }
    )
  }
}
