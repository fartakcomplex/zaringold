import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const wallet = await db.wallet.findUnique({
      where: { userId },
    })

    const goldWallet = await db.goldWallet.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      fiat: {
        balance: wallet?.balance ?? 0,
        frozenBalance: wallet?.frozenBalance ?? 0,
        available: (wallet?.balance ?? 0) - (wallet?.frozenBalance ?? 0),
      },
      gold: {
        grams: goldWallet?.goldGrams ?? 0,
        frozenGold: goldWallet?.frozenGold ?? 0,
        available: (goldWallet?.goldGrams ?? 0) - (goldWallet?.frozenGold ?? 0),
      },
    })
  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت موجودی' },
      { status: 500 }
    )
  }
}
