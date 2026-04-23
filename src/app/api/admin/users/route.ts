import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (status) {
      if (status === 'active') {
        where.isActive = true
      } else if (status === 'frozen') {
        where.isFrozen = true
      } else if (status === 'verified') {
        where.isVerified = true
      }
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          wallet: true,
          goldWallet: true,
          kyc: { select: { status: true } },
          _count: { select: { transactions: true, referrals: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      users,
      total,
      page,
      totalPages,
    })
  } catch (error) {
    console.error('Admin get users error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست کاربران' },
      { status: 500 }
    )
  }
}
