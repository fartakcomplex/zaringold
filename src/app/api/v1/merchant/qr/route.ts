import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

/**
 * POST /api/v1/merchant/qr
 * Generate a QR code token for payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, amount_toman, amount_gold, is_fixed } = body

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

    if (!merchant.isActive) {
      return NextResponse.json(
        { success: false, message: 'حساب پذیرنده غیرفعال است' },
        { status: 403 }
      )
    }

    const amountToman = Number(amount_toman) || 0
    const amountGold = Number(amount_gold) || 0

    if (is_fixed && amountToman <= 0 && amountGold <= 0) {
      return NextResponse.json(
        { success: false, message: 'برای QR کد ثابت، مبلغ الزامی است' },
        { status: 400 }
      )
    }

    /* ── Generate unique token ── */
    const token = `QR-${crypto.randomBytes(12).toString('hex')}`

    const qrCode = await db.qrCode.create({
      data: {
        merchantId: merchant.id,
        title: title || 'QR پرداخت',
        amountToman: amountToman,
        amountGold,
        isFixed: is_fixed || false,
        token,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'QR کد با موفقیت ایجاد شد',
      data: {
        id: qrCode.id,
        token: qrCode.token,
        title: qrCode.title,
        amount_toman: qrCode.amountToman,
        amount_gold: qrCode.amountGold,
        is_fixed: qrCode.isFixed,
        payment_url: `/checkout/qr/${qrCode.token}`,
        created_at: qrCode.createdAt,
      },
    })
  } catch (error) {
    console.error('QR create error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد QR کد' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/merchant/qr
 * List QR codes for a merchant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
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

    const skip = (page - 1) * limit

    const [qrCodes, total] = await Promise.all([
      db.qrCode.findMany({
        where: { merchantId: merchant.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.qrCode.count({ where: { merchantId: merchant.id } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        qr_codes: qrCodes.map((qr) => ({
          id: qr.id,
          token: qr.token,
          title: qr.title,
          amount_toman: qr.amountToman,
          amount_gold: qr.amountGold,
          is_fixed: qr.isFixed,
          is_active: qr.isActive,
          scan_count: qr.scanCount,
          payment_url: `/checkout/qr/${qr.token}`,
          created_at: qr.createdAt,
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
    console.error('QR list error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست QR کدها' },
      { status: 500 }
    )
  }
}
