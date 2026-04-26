import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET: List blacklisted emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.email = { contains: search }
    }

    const [blacklist, total] = await Promise.all([
      db.emailBlacklist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.emailBlacklist.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: blacklist,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing email blacklist:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست سیاه' },
      { status: 500 }
    )
  }
}

// POST: Add email to blacklist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, reason, addedBy } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'ایمیل الزامی است' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if already blacklisted
    const existing = await db.emailBlacklist.findUnique({
      where: { email: normalizedEmail },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'این ایمیل قبلاً در لیست سیاه قرار گرفته' },
        { status: 400 }
      )
    }

    const entry = await db.emailBlacklist.create({
      data: {
        email: normalizedEmail,
        reason: reason || '',
        addedBy: addedBy || '',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'ایمیل به لیست سیاه اضافه شد',
      data: entry,
    })
  } catch (error) {
    console.error('Error adding to email blacklist:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن به لیست سیاه' },
      { status: 500 }
    )
  }
}

// DELETE: Remove email from blacklist
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || ''
    const id = searchParams.get('id') || ''

    if (id) {
      await db.emailBlacklist.delete({ where: { id } })
      return NextResponse.json({
        success: true,
        message: 'ایمیل از لیست سیاه حذف شد',
      })
    }

    if (email) {
      const normalizedEmail = email.toLowerCase().trim()
      await db.emailBlacklist.delete({
        where: { email: normalizedEmail },
      })
      return NextResponse.json({
        success: true,
        message: 'ایمیل از لیست سیاه حذف شد',
      })
    }

    return NextResponse.json(
      { success: false, message: 'شناسه یا ایمیل الزامی است' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error removing from email blacklist:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف از لیست سیاه' },
      { status: 500 }
    )
  }
}
