import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: List B2B customers ──
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramUserId = searchParams.get('telegramUserId')

    if (!telegramUserId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر تلگرام الزامی است' },
        { status: 400 }
      )
    }

    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const where: Record<string, unknown> = { telegramUserId }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [customers, total] = await Promise.all([
      db.telegramB2BCustomer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.telegramB2BCustomer.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        note: c.note,
        totalInvoices: c.totalInvoices,
        totalSpent: c.totalSpent,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Telegram customers GET error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست مشتریان' },
      { status: 500 }
    )
  }
}

// ── POST: Add new customer ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramUserId, name, phone, note } = body

    if (!telegramUserId || !name) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر تلگرام و نام مشتری الزامی است' },
        { status: 400 }
      )
    }

    // Verify TelegramUser exists
    const telegramUser = await db.telegramUser.findUnique({
      where: { id: telegramUserId },
    })

    if (!telegramUser) {
      return NextResponse.json(
        { success: false, message: 'کاربر تلگرام یافت نشد' },
        { status: 404 }
      )
    }

    // Check for duplicate customer
    const existingCustomer = await db.telegramB2BCustomer.findFirst({
      where: {
        telegramUserId,
        phone: phone || null,
        name,
      },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, message: 'این مشتری قبلاً ثبت شده است' },
        { status: 409 }
      )
    }

    const customer = await db.telegramB2BCustomer.create({
      data: {
        telegramUserId,
        name,
        phone: phone || null,
        note: note || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        note: customer.note,
        totalInvoices: customer.totalInvoices,
        totalSpent: customer.totalSpent,
        createdAt: customer.createdAt,
      },
    })
  } catch (error) {
    console.error('Telegram customers POST error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت مشتری جدید' },
      { status: 500 }
    )
  }
}
