import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

/* ------------------------------------------------------------------ */
/*  GET /api/admin/goals — List all saving goals with user info        */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

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

    const [goals, total] = await Promise.all([
      db.savingGoal.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              fullName: true,
              avatar: true,
              goldWallet: { select: { goldGrams: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.savingGoal.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: goals,
      total,
      page,
      totalPages,
      message: 'لیست اهداف پس‌انداز دریافت شد',
    })
  } catch (error) {
    console.error('Admin get goals error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست اهداف' },
      { status: 500 }
    )
  }
}
