import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/v1/wallet/info?userId=xxx
 * Return user's gold and toman wallet balance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    /* ── Verify user exists ── */
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    /* ── Fetch both wallets in parallel ── */
    const [fiatWallet, goldWallet] = await Promise.all([
      db.wallet.findUnique({ where: { userId } }),
      db.goldWallet.findUnique({ where: { userId } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        goldBalance: goldWallet?.goldGrams ?? 0,
        tomanBalance: fiatWallet?.balance ?? 0,
        frozenGold: goldWallet?.frozenGold ?? 0,
        frozenToman: fiatWallet?.frozenBalance ?? 0,
      },
    })
  } catch (error) {
    console.error('Wallet info error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات کیف پول' },
      { status: 500 }
    )
  }
}
