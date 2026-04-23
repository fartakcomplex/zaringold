import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * DELETE /api/v1/merchant/api-keys/[id]
 * Revoke an API key
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

    /* ── Find merchant ── */
    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    /* ── Find API key ── */
    const apiKey = await db.apiKey.findUnique({
      where: { id },
    })

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'کلید API یافت نشد' },
        { status: 404 }
      )
    }

    if (apiKey.merchantId !== merchant.id) {
      return NextResponse.json(
        { success: false, message: 'این کلید متعلق به شما نیست' },
        { status: 403 }
      )
    }

    /* ── Deactivate (revoke) the key ── */
    await db.apiKey.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'کلید API با موفقیت لغو شد',
    })
  } catch (error) {
    console.error('API key revoke error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در لغو کلید API' },
      { status: 500 }
    )
  }
}
