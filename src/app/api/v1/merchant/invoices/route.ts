import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/v1/merchant/invoices
 * Create a new invoice
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      customer_name,
      customer_phone,
      customer_email,
      items,
      amount_toman,
      amount_gold,
      tax_toman,
      discount_toman,
      due_date,
    } = body

    if (!userId || !customer_name) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و نام مشتری الزامی است' },
        { status: 400 }
      )
    }

    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    const amountToman = Number(amount_toman) || 0
    const amountGold = Number(amount_gold) || 0
    const taxToman = Number(tax_toman) || 0
    const discountToman = Number(discount_toman) || 0
    const totalToman = amountToman + taxToman - discountToman

    if (totalToman < 0) {
      return NextResponse.json(
        { success: false, message: 'مبلغ نهایی نمی‌تواند منفی باشد' },
        { status: 400 }
      )
    }

    /* ── Generate invoice number ── */
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const invoice = await db.invoice.create({
      data: {
        merchantId: merchant.id,
        invoiceNumber,
        customerName: customer_name,
        customerPhone: customer_phone || null,
        customerEmail: customer_email || null,
        items: JSON.stringify(items || []),
        amountToman,
        amountGold,
        taxToman,
        discountToman,
        totalToman,
        totalGold: amountGold,
        dueDate: due_date ? new Date(due_date) : null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'فاکتور با موفقیت ایجاد شد',
      data: {
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        customer_name: invoice.customerName,
        amount_toman: invoice.amountToman,
        amount_gold: invoice.amountGold,
        tax_toman: invoice.taxToman,
        discount_toman: invoice.discountToman,
        total_toman: invoice.totalToman,
        total_gold: invoice.totalGold,
        status: invoice.status,
        due_date: invoice.dueDate,
        created_at: invoice.createdAt,
      },
    })
  } catch (error) {
    console.error('Invoice create error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد فاکتور' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/merchant/invoices
 * List invoices for a merchant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    const where: Record<string, unknown> = { merchantId: merchant.id }
    if (status) where.status = status

    const skip = (page - 1) * limit

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.invoice.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoice_number: inv.invoiceNumber,
          customer_name: inv.customerName,
          customer_phone: inv.customerPhone,
          customer_email: inv.customerEmail,
          items: JSON.parse(inv.items),
          amount_toman: inv.amountToman,
          amount_gold: inv.amountGold,
          tax_toman: inv.taxToman,
          discount_toman: inv.discountToman,
          total_toman: inv.totalToman,
          total_gold: inv.totalGold,
          status: inv.status,
          due_date: inv.dueDate,
          paid_at: inv.paidAt,
          created_at: inv.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Invoice list error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست فاکتورها' },
      { status: 500 }
    )
  }
}
