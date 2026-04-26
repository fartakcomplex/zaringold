import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      price: latestPrice || null,
    })
  } catch (error) {
    console.error('Admin get prices error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تنظیمات قیمت' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { buyPrice, sellPrice, marketPrice, ouncePrice } = await request.json()

    if (!buyPrice || !sellPrice || !marketPrice) {
      return NextResponse.json(
        { success: false, message: 'قیمت خرید، فروش و بازار الزامی است' },
        { status: 400 }
      )
    }

    const spread = buyPrice - sellPrice

    const price = await db.goldPrice.create({
      data: {
        buyPrice,
        sellPrice,
        marketPrice,
        ouncePrice: ouncePrice || marketPrice * 10,
        spread,
        currency: 'IRR',
        isManual: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'قیمت‌ها با موفقیت بروزرسانی شد',
      price,
    })
  } catch (error) {
    console.error('Admin set prices error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی قیمت‌ها' },
      { status: 500 }
    )
  }
}
