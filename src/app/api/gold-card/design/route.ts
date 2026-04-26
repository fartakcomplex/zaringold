import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_DESIGNS = ['gold-gradient', 'black-premium', 'diamond', 'rose-gold'] as const

/**
 * POST /api/gold-card/design
 * Body: { userId, design }
 * Changes card design to one of the valid options
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, design } = await request.json()

    if (!userId || !design) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و طرح کارت الزامی است' },
        { status: 400 }
      )
    }

    if (!VALID_DESIGNS.includes(design)) {
      return NextResponse.json(
        {
          success: false,
          message: 'طرح کارت نامعتبر است. طرح‌های مجاز: gold-gradient, black-premium, diamond, rose-gold',
        },
        { status: 400 }
      )
    }

    const card = await db.goldCard.findUnique({
      where: { userId },
    })

    if (!card) {
      return NextResponse.json(
        { success: false, message: 'کارت طلایی یافت نشد' },
        { status: 404 }
      )
    }

    // Check if same design
    if (card.design === design) {
      return NextResponse.json(
        { success: false, message: 'کارت شما از قبل این طرح را دارد' },
        { status: 400 }
      )
    }

    const updatedCard = await db.goldCard.update({
      where: { userId },
      data: { design },
    })

    const designNames: Record<string, string> = {
      'gold-gradient': 'طلایی گرادیانت',
      'black-premium': 'مشکی پریمیوم',
      diamond: 'الماسی',
      'rose-gold': 'رزگلد',
    }

    return NextResponse.json({
      success: true,
      message: `طرح کارت با موفقیت به "${designNames[design] || design}" تغییر کرد`,
      card: {
        id: updatedCard.id,
        design: updatedCard.design,
      },
    })
  } catch (error) {
    console.error('Change design error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تغییر طرح کارت' },
      { status: 500 }
    )
  }
}
