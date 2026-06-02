import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Fetch user gold wallet, fiat wallet, and transactions in parallel
    const [goldWallet, fiatWallet, transactions, priceHistory] =
      await Promise.all([
        db.goldWallet.findUnique({ where: { userId } }),
        db.wallet.findUnique({ where: { userId } }),
        db.transaction.findMany({
          where: { userId, status: 'completed' },
          orderBy: { createdAt: 'desc' },
        }),
        db.priceHistory.findMany({
          orderBy: { timestamp: 'desc' },
          take: 2000,
        }),
      ])

    // ── Portfolio snapshot ──
    const goldGrams = goldWallet?.goldGrams ?? 0
    const frozenGold = goldWallet?.frozenGold ?? 0
    const fiatBalance = fiatWallet?.balance ?? 0

    // Current gold price (latest entry)
    const currentPrice = priceHistory.length > 0 ? priceHistory[0].closePrice : 0
    const portfolioValueToman = goldGrams * currentPrice
    const frozenValueToman = frozenGold * currentPrice

    // ── Price history helpers ──
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const priceAt = (targetDate: Date) => {
      // Find the closest priceHistory entry at or before the target date
      for (const ph of priceHistory) {
        if (new Date(ph.timestamp) <= targetDate) {
          return ph.closePrice
        }
      }
      return 0
    }

    const price7d = priceAt(sevenDaysAgo)
    const price30d = priceAt(thirtyDaysAgo)
    const price90d = priceAt(ninetyDaysAgo)

    // ── Return calculations (assuming user held gold the entire period) ──
    const return7d =
      price7d > 0 ? (((currentPrice - price7d) / price7d) * 100).toFixed(2) : '0.00'
    const return30d =
      price30d > 0 ? (((currentPrice - price30d) / price30d) * 100).toFixed(2) : '0.00'
    const return90d =
      price90d > 0 ? (((currentPrice - price90d) / price90d) * 100).toFixed(2) : '0.00'

    const profitLoss =
      transactions.length > 0
        ? transactions.reduce((sum, tx) => {
            // Buy transactions add gold (positive), sell subtract (negative)
            return sum + (tx.amountGold > 0 ? tx.amountGold : -tx.amountGold)
          }, 0) * currentPrice -
          transactions
            .filter((tx) => tx.amountGold > 0)
            .reduce((sum, tx) => sum + tx.amountFiat, 0)
        : 0

    // ── Trade stats ──
    const buyTrades = transactions.filter((tx) => tx.amountGold > 0)
    const sellTrades = transactions.filter((tx) => tx.amountGold < 0)
    const totalTrades = transactions.length

    // Win rate: profitable sells
    const winningSells = sellTrades.filter((tx) => {
      if (!tx.goldPrice) return false
      return currentPrice > tx.goldPrice
    })
    const winRate =
      sellTrades.length > 0
        ? ((winningSells.length / sellTrades.length) * 100).toFixed(1)
        : '0.0'

    // ── Rank vs other users (based on gold holding) ──
    const totalGoldHolders = await db.goldWallet.count({
      where: { goldGrams: { gt: 0 } },
    })

    const usersWithMoreGold = await db.goldWallet.count({
      where: { goldGrams: { gt: goldGrams } },
    })

    const rank = totalGoldHolders > 0 ? usersWithMoreGold + 1 : 0
    const percentile =
      totalGoldHolders > 0
        ? (((totalGoldHolders - usersWithMoreGold) / totalGoldHolders) * 100).toFixed(1)
        : '0.0'

    return NextResponse.json({
      success: true,
      portfolio: {
        goldGrams: parseFloat(goldGrams.toFixed(4)),
        frozenGold: parseFloat(frozenGold.toFixed(4)),
        fiatBalance: parseFloat(fiatBalance.toFixed(0)),
        portfolioValueToman: parseFloat(portfolioValueToman.toFixed(0)),
        frozenValueToman: parseFloat(frozenValueToman.toFixed(0)),
        currentPricePerGram: parseFloat(currentPrice.toFixed(0)),
      },
      returns: {
        return7d: parseFloat(return7d as string),
        return30d: parseFloat(return30d as string),
        return90d: parseFloat(return90d as string),
        profitLoss: parseFloat(profitLoss.toFixed(0)),
        profitLossPercent:
          goldGrams > 0
            ? parseFloat(
                (
                  (profitLoss /
                    (goldGrams * currentPrice)) *
                  100
                ).toFixed(2)
              )
            : 0,
      },
      stats: {
        totalTrades,
        buyTrades: buyTrades.length,
        sellTrades: sellTrades.length,
        winRate: parseFloat(winRate as string),
        rank,
        totalGoldHolders,
        topPercentile: parseFloat(percentile as string),
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تحلیل‌ها' },
      { status: 500 }
    )
  }
}
