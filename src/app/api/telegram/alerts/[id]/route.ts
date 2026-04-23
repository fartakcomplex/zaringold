import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── DELETE: Remove alert ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const alert = await db.telegramAlert.findUnique({
      where: { id },
    })

    if (!alert) {
      return NextResponse.json(
        { success: false, message: 'هشدار یافت نشد' },
        { status: 404 }
      )
    }

    await db.telegramAlert.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'هشدار با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Telegram alert DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف هشدار' },
      { status: 500 }
    )
  }
}

// ── PUT: Toggle alert active/inactive ──
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    const alert = await db.telegramAlert.findUnique({
      where: { id },
    })

    if (!alert) {
      return NextResponse.json(
        { success: false, message: 'هشدار یافت نشد' },
        { status: 404 }
      )
    }

    const updatedAlert = await db.telegramAlert.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : !alert.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAlert.id,
        isActive: updatedAlert.isActive,
        updatedAt: updatedAlert.updatedAt,
      },
    })
  } catch (error) {
    console.error('Telegram alert PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی هشدار' },
      { status: 500 }
    )
  }
}
