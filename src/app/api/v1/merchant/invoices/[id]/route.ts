import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/v1/merchant/invoices/[id]?userId=xxx
 * Get full invoice details with merchant info
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Verify merchant ownership
    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    const invoice = await db.invoice.findFirst({
      where: { id, merchantId: merchant.id },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        customer_name: invoice.customerName,
        customer_phone: invoice.customerPhone,
        customer_email: invoice.customerEmail,
        items: JSON.parse(invoice.items),
        amount_toman: invoice.amountToman,
        amount_gold: invoice.amountGold,
        tax_toman: invoice.taxToman,
        discount_toman: invoice.discountToman,
        total_toman: invoice.totalToman,
        total_gold: invoice.totalGold,
        status: invoice.status,
        due_date: invoice.dueDate,
        paid_at: invoice.paidAt,
        payment_id: invoice.paymentId,
        created_at: invoice.createdAt,
        updated_at: invoice.updatedAt,
        merchant: {
          businessName: merchant.businessName,
          phone: merchant.phone,
          email: merchant.email,
        },
      },
    })
  } catch (error) {
    console.error('Invoice get error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات فاکتور' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/v1/merchant/invoices/[id]
 * Update invoice — mark as paid or update details
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { userId, status, customer_name, customer_phone, customer_email, due_date, items } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Verify merchant ownership
    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    const invoice = await db.invoice.findFirst({
      where: { id, merchantId: merchant.id },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    // Mark as paid
    if (status === 'paid') {
      if (invoice.status === 'paid') {
        return NextResponse.json(
          { success: false, message: 'این فاکتور قبلاً پرداخت شده است' },
          { status: 400 }
        )
      }
      updateData.status = 'paid'
      updateData.paidAt = new Date()
    }

    // Update customer info
    if (customer_name !== undefined) updateData.customerName = customer_name.trim()
    if (customer_phone !== undefined) updateData.customerPhone = customer_phone ? String(customer_phone).trim() : null
    if (customer_email !== undefined) updateData.customerEmail = customer_email ? String(customer_email).trim() : null
    if (due_date !== undefined) updateData.dueDate = due_date ? new Date(due_date) : null

    // Update items and recalculate totals
    if (items && Array.isArray(items)) {
      const amountToman = items.reduce(
        (sum: number, item: { unitPrice?: number; quantity?: number }) =>
          sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
        0
      )
      updateData.items = JSON.stringify(items)
      updateData.amountToman = amountToman
      updateData.totalToman = amountToman + invoice.taxToman - invoice.discountToman
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'حداقل یک فیلد برای ویرایش ارسال کنید' },
        { status: 400 }
      )
    }

    const updated = await db.invoice.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: status === 'paid' ? 'فاکتور به‌عنوان پرداخت شده ثبت شد' : 'فاکتور به‌روزرسانی شد',
      data: {
        id: updated.id,
        invoice_number: updated.invoiceNumber,
        status: updated.status,
        paid_at: updated.paidAt,
        updated_at: updated.updatedAt,
      },
    })
  } catch (error) {
    console.error('Invoice update error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی فاکتور' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/merchant/invoices/[id]?userId=xxx
 * Delete invoice — only if unpaid
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Verify merchant ownership
    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    const invoice = await db.invoice.findFirst({
      where: { id, merchantId: merchant.id },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    // Only allow deleting unpaid invoices
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'فاکتور پرداخت شده قابل حذف نیست' },
        { status: 400 }
      )
    }

    await db.invoice.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'فاکتور با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Invoice delete error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف فاکتور' },
      { status: 500 }
    )
  }
}
