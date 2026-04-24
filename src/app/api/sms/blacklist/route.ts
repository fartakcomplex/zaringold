import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List blacklisted phones ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const phone = searchParams.get('phone') || ''

    const where: Record<string, unknown> = {}
    if (phone) where.phone = { contains: phone }

    const [blacklist, total] = await Promise.all([
      db.smsBlacklist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.smsBlacklist.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      message: 'لیست شماره‌های مسدود',
      data: {
        blacklist,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('[SMS Blacklist GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست سیاه' },
      { status: 500 }
    )
  }
}

// ─── POST: Add phone to blacklist ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, reason = '' } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'شماره تلفن الزامی است' },
        { status: 400 }
      )
    }

    // Check if already blacklisted
    const existing = await db.smsBlacklist.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'این شماره قبلاً در لیست سیاه قرار گرفته است' },
        { status: 409 }
      )
    }

    const entry = await db.smsBlacklist.create({
      data: { phone, reason },
    })

    return NextResponse.json({
      success: true,
      message: 'شماره با موفقیت به لیست سیاه اضافه شد',
      data: entry,
    })
  } catch (error) {
    console.error('[SMS Blacklist POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در افزودن به لیست سیاه' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Remove phone from blacklist ───────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'شماره تلفن الزامی است' },
        { status: 400 }
      )
    }

    const existing = await db.smsBlacklist.findUnique({ where: { phone } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'شماره در لیست سیاه یافت نشد' },
        { status: 404 }
      )
    }

    await db.smsBlacklist.delete({ where: { phone } })

    return NextResponse.json({
      success: true,
      message: 'شماره با موفقیت از لیست سیاه حذف شد',
    })
  } catch (error) {
    console.error('[SMS Blacklist DELETE]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف از لیست سیاه' },
      { status: 500 }
    )
  }
}
