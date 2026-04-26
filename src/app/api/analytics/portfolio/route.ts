import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: user portfolio analytics
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

    // Get user's gold wallet
    const goldWallet = await db.goldWallet.findUnique({ where: { userId } })
    const goldGrams = goldWallet?.goldGrams ?? 0
    const frozenGold = goldWallet?.frozenGold ?? 0

    // Get user's fiat wallet
    const wallet = await db.wallet.findUnique({ where: { userId } })
    const fiatBalance = wallet?.balance ?? 0

    // Get latest gold price
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    const currentPrice = latestPrice?.buyPrice ?? 0
    const sellPrice = latestPrice?.sellPrice ?? 0

    // Get all buy transactions to calculate average buy price
    const buyTransactions = await db.transaction.findMany({
      where: {
        userId,
        type: { in: ['gold_buy', 'auto_buy', 'gift_received', 'goal_contribute'] },
        status: 'completed',
        amountGold: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Calculate weighted average buy price
    let totalBuyAmountFiat = 0
    let totalBuyGold = 0
    for (const tx of buyTransactions) {
      totalBuyAmountFiat += tx.amountFiat
      totalBuyGold += tx.amountGold
    }

    const avgBuyPrice = totalBuyGold > 0 ? totalBuyAmountFiat / totalBuyGold : 0

    // Get all sell transactions
    const sellTransactions = await db.transaction.findMany({
      where: {
        userId,
        type: 'gold_sell',
        status: 'completed',
        amountGold: { gt: 0 },
      },
    })

    const totalSellAmountFiat = sellTransactions.reduce((sum, tx) => sum + tx.amountFiat, 0)
    const totalSellGold = sellTransactions.reduce((sum, tx) => sum + tx.amountGold, 0)

    // Portfolio valuation
    const currentGoldValue = goldGrams * sellPrice
    const investedAmount = totalBuyAmountFiat - totalSellAmountFiat
    const unrealizedPL = currentGoldValue - investedAmount
    const roiPercent = investedAmount > 0 ? ((unrealizedPL / investedAmount) * 100) : 0

    // Auto-save stats
    const autoSavePlans = await db.autoBuyPlan.findMany({
      where: { userId },
    })
    const activePlans = autoSavePlans.filter((p) => p.isActive).length
    const totalAutoSaveSpent = autoSavePlans.reduce((sum, p) => sum + p.totalSpent, 0)
    const totalAutoSaveGold = autoSavePlans.reduce((sum, p) => sum + p.totalGoldBought, 0)

    // Goal progress
    const goals = await db.savingGoal.findMany({
      where: { userId },
    })
    const activeGoals = goals.filter((g) => g.status === 'active').length
    const completedGoals = goals.filter((g) => g.status === 'completed').length
    const totalGoalContributed = goals.reduce((sum, g) => sum + g.currentAmountFiat, 0)

    // Gift stats
    const sentGifts = await db.giftTransfer.findMany({
      where: { senderId: userId },
    })
    const receivedGifts = await db.giftTransfer.findMany({
      where: { receiverId: userId },
    })
    const totalGiftSentMg = sentGifts.reduce((sum, g) => sum + g.goldMg, 0)
    const totalGiftReceivedMg = receivedGifts.reduce((sum, g) => sum + g.goldMg, 0)

    // Total fees paid
    const allTransactions = await db.transaction.findMany({
      where: { userId, status: 'completed' },
    })
    const totalFeesPaid = allTransactions.reduce((sum, tx) => sum + (tx.fee || 0), 0)

    // Transaction count by type
    const transactionCount = {
      buy: buyTransactions.length,
      sell: sellTransactions.length,
      autoBuy: autoSavePlans.reduce((sum, p) => sum + p.totalExecutions, 0),
      giftsSent: sentGifts.length,
      giftsReceived: receivedGifts.length,
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        // Current holdings
        goldGrams: Number(goldGrams.toFixed(6)),
        frozenGold: Number(frozenGold.toFixed(6)),
        fiatBalance: Number(fiatBalance.toFixed(0)),
        currentGoldValue: Number(currentGoldValue.toFixed(0)),
        totalPortfolioValue: Number((currentGoldValue + fiatBalance).toFixed(0)),

        // Price info
        currentGoldPrice: currentPrice,
        avgBuyPrice: Number(avgBuyPrice.toFixed(0)),
        sellPrice,

        // Performance
        investedAmount: Number(investedAmount.toFixed(0)),
        totalSoldValue: Number(totalSellAmountFiat.toFixed(0)),
        unrealizedPL: Number(unrealizedPL.toFixed(0)),
        roiPercent: Number(roiPercent.toFixed(2)),
        isProfit: unrealizedPL >= 0,

        // Auto-save
        activePlans,
        totalPlans: autoSavePlans.length,
        totalAutoSaveSpent: Number(totalAutoSaveSpent.toFixed(0)),
        totalAutoSaveGold: Number(totalAutoSaveGold.toFixed(6)),

        // Goals
        totalGoals: goals.length,
        activeGoals,
        completedGoals,
        totalGoalContributed: Number(totalGoalContributed.toFixed(0)),

        // Gifts
        totalGiftSentMg: Number(totalGiftSentMg.toFixed(2)),
        totalGiftReceivedMg: Number(totalGiftReceivedMg.toFixed(2)),

        // Fees
        totalFeesPaid: Number(totalFeesPaid.toFixed(0)),

        // Transaction summary
        totalTransactions: allTransactions.length,
        transactionCount,
      },
    })
  } catch (error) {
    console.error('Get portfolio analytics error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تحلیل پرتفوی' },
      { status: 500 }
    )
  }
}
