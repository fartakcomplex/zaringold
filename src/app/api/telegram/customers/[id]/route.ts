import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── PUT: Update customer ──
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, note } = body

    const customer = await db.telegramB2BCustomer.findUnique({
      where: { id },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone || null
    if (note !== undefined) updateData.note = note || null

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'فیلدی برای به‌روزرسانی مشخص نشده است' },
        { status: 400 }
      )
    }

    const updatedCustomer = await db.telegramB2BCustomer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        note: updatedCustomer.note,
        totalInvoices: updatedCustomer.totalInvoices,
        totalSpent: updatedCustomer.totalSpent,
        updatedAt: updatedCustomer.updatedAt,
      },
    })
  } catch (error) {
    console.error('Telegram customer PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی مشتری' },
      { status: 500 }
    )
  }
}

// ── DELETE: Delete customer ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await db.telegramB2BCustomer.findUnique({
      where: { id },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    await db.telegramB2BCustomer.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'مشتری با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Telegram customer DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف مشتری' },
      { status: 500 }
    )
  }
}
