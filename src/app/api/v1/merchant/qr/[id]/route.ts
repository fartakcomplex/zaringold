import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/v1/merchant/qr/[id]
 * Fetch a single QR code by ID (for public pay page lookup)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Support lookup by both database ID and token
    const qrCode = await db.qrCode.findFirst({
      where: {
        OR: [{ id }, { token: id }],
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            isActive: true,
          },
        },
      },
    })

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR کد یافت نشد' },
        { status: 404 }
      )
    }

    // Increment scan count on each view
    await db.qrCode.update({
      where: { id: qrCode.id },
      data: { scanCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: qrCode.id,
        token: qrCode.token,
        title: qrCode.title,
        amount_toman: qrCode.amountToman,
        amount_gold: qrCode.amountGold,
        is_fixed: qrCode.isFixed,
        is_active: qrCode.isActive,
        scan_count: qrCode.scanCount + 1,
        merchant_name: qrCode.merchant?.businessName || 'فروشگاه',
        merchant_logo: qrCode.merchant?.logo,
        merchant_active: qrCode.merchant?.isActive ?? true,
        created_at: qrCode.createdAt,
      },
    })
  } catch (error) {
    console.error('QR fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات QR کد' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/v1/merchant/qr/[id]
 * Toggle active/inactive status, or update fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, action } = body

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

    const qrCode = await db.qrCode.findFirst({
      where: { id, merchantId: merchant.id },
    })

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR کد یافت نشد' },
        { status: 404 }
      )
    }

    // Handle toggle active/inactive
    if (action === 'toggle_active') {
      const updated = await db.qrCode.update({
        where: { id: qrCode.id },
        data: { isActive: !qrCode.isActive },
      })

      return NextResponse.json({
        success: true,
        message: updated.isActive ? 'QR کد فعال شد' : 'QR کد غیرفعال شد',
        data: {
          id: updated.id,
          is_active: updated.isActive,
        },
      })
    }

    // Handle update title or amount
    const { title, amount_toman, amount_gold } = body
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (amount_toman !== undefined) updateData.amountToman = Number(amount_toman) || 0
    if (amount_gold !== undefined) updateData.amountGold = Number(amount_gold) || 0

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'فیلدی برای بروزرسانی مشخص نشده' },
        { status: 400 }
      )
    }

    const updated = await db.qrCode.update({
      where: { id: qrCode.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'QR کد بروزرسانی شد',
      data: {
        id: updated.id,
        title: updated.title,
        amount_toman: updated.amountToman,
        amount_gold: updated.amountGold,
      },
    })
  } catch (error) {
    console.error('QR update error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی QR کد' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/merchant/qr/[id]
 * Delete a QR code (soft delete by removing record)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    const qrCode = await db.qrCode.findFirst({
      where: { id, merchantId: merchant.id },
    })

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR کد یافت نشد' },
        { status: 404 }
      )
    }

    await db.qrCode.delete({ where: { id: qrCode.id } })

    return NextResponse.json({
      success: true,
      message: 'QR کد با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('QR delete error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف QR کد' },
      { status: 500 }
    )
  }
}
