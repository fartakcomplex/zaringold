import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Single invoice details ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await db.telegramInvoice.findUnique({
      where: { id },
      include: {
        telegramUser: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
          },
        },
      },
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
        sentToTelegram: invoice.sentToTelegram,
        sentAt: invoice.sentAt?.toISOString() || null,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
        telegramUser: invoice.telegramUser,
      },
    })
  } catch (error) {
    console.error('Telegram invoice GET error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت جزئیات فاکتور' },
      { status: 500 }
    )
  }
}

// ── PUT: Update invoice status ──
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, sentToTelegram } = body

    const invoice = await db.telegramInvoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (status && ['draft', 'sent', 'paid', 'cancelled'].includes(status)) {
      updateData.status = status
      if (status === 'sent') {
        updateData.sentAt = new Date()
        updateData.sentToTelegram = true
      }
    }
    if (sentToTelegram !== undefined) {
      updateData.sentToTelegram = sentToTelegram
      if (sentToTelegram && !invoice.sentAt) {
        updateData.sentAt = new Date()
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'فیلدی برای به‌روزرسانی مشخص نشده است' },
        { status: 400 }
      )
    }

    const updatedInvoice = await db.telegramInvoice.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        status: updatedInvoice.status,
        sentToTelegram: updatedInvoice.sentToTelegram,
        sentAt: updatedInvoice.sentAt?.toISOString() || null,
        updatedAt: updatedInvoice.updatedAt,
      },
    })
  } catch (error) {
    console.error('Telegram invoice PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی فاکتور' },
      { status: 500 }
    )
  }
}

// ── DELETE: Delete invoice ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await db.telegramInvoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    // Only allow deleting draft invoices
    if (invoice.status !== 'draft' && invoice.status !== 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'فقط فاکتورهای پیش‌نویس یا لغو‌شده قابل حذف هستند' },
        { status: 400 }
      )
    }

    await db.telegramInvoice.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'فاکتور با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Telegram invoice DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف فاکتور' },
      { status: 500 }
    )
  }
}
