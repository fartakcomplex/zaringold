import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: List invoices for a B2B user ──
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

    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const where: Record<string, unknown> = { telegramUserId }
    if (status) {
      where.status = status
    }

    const [invoices, total] = await Promise.all([
      db.telegramInvoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.telegramInvoice.count({ where }),
    ])

    // Calculate summary totals
    const totals = await db.telegramInvoice.aggregate({
      where: { telegramUserId },
      _sum: {
        totalPrice: true,
        ejratAmount: true,
        taxAmount: true,
        finalPrice: true,
        weightGrams: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        weightGrams: inv.weightGrams,
        pricePerGram: inv.pricePerGram,
        totalPrice: inv.totalPrice,
        ejratPercent: inv.ejratPercent,
        ejratAmount: inv.ejratAmount,
        taxPercent: inv.taxPercent,
        taxAmount: inv.taxAmount,
        finalPrice: inv.finalPrice,
        status: inv.status,
        sentToTelegram: inv.sentToTelegram,
        sentAt: inv.sentAt?.toISOString() || null,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      totals: {
        totalPrice: totals._sum.totalPrice || 0,
        ejratAmount: totals._sum.ejratAmount || 0,
        taxAmount: totals._sum.taxAmount || 0,
        finalPrice: totals._sum.finalPrice || 0,
        weightGrams: totals._sum.weightGrams || 0,
      },
    })
  } catch (error) {
    console.error('Telegram invoices GET error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست فاکتورها' },
      { status: 500 }
    )
  }
}

// ── POST: Create new invoice ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      telegramUserId,
      customerName,
      customerPhone,
      weightGrams,
      pricePerGram,
      ejratPercent,
      taxPercent,
    } = body

    if (!telegramUserId || !customerName || !weightGrams || !pricePerGram) {
      return NextResponse.json(
        { success: false, message: 'فیلدهای نام مشتری، وزن و قیمت هر گرم الزامی هستند' },
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

    // Calculate invoice amounts
    const totalPrice = weightGrams * pricePerGram
    const ejratPct = ejratPercent !== undefined ? ejratPercent : 3
    const taxPct = taxPercent !== undefined ? taxPercent : 9
    const ejratAmount = (totalPrice * ejratPct) / 100
    const taxAmount = (totalPrice + ejratAmount) * taxPct / 100
    const finalPrice = totalPrice + ejratAmount + taxAmount

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    const invoice = await db.telegramInvoice.create({
      data: {
        telegramUserId,
        invoiceNumber,
        customerName,
        customerPhone: customerPhone || null,
        weightGrams,
        pricePerGram,
        totalPrice,
        ejratPercent: ejratPct,
        ejratAmount,
        taxPercent: taxPct,
        taxAmount,
        finalPrice,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        weightGrams: invoice.weightGrams,
        pricePerGram: invoice.pricePerGram,
        totalPrice: invoice.totalPrice,
        ejratPercent: invoice.ejratPercent,
        ejratAmount: invoice.ejratAmount,
        taxPercent: invoice.taxPercent,
        taxAmount: invoice.taxAmount,
        finalPrice: invoice.finalPrice,
        status: invoice.status,
        createdAt: invoice.createdAt,
      },
    })
  } catch (error) {
    console.error('Telegram invoices POST error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد فاکتور' },
      { status: 500 }
    )
  }
}
