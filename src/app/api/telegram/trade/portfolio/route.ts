import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET /api/telegram/trade/portfolio                                         */
/*  Returns gold portfolio: total grams, invested, avg price, value, P&L      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json(
        { success: false, message: 'شناسه تلگرام الزامی است' },
        { status: 400 }
      );
    }

    // Find TelegramUser with gold wallet
    const telegramUser = await db.telegramUser.findUnique({
      where: { telegramId: Number(telegramId) },
      include: {
        user: {
          include: { goldWallet: true },
        },
      },
    });

    if (!telegramUser) {
      return NextResponse.json(
        { success: false, message: 'حساب تلگرام یافت نشد' },
        { status: 404 }
      );
    }

    const userId = telegramUser.user.id;
    const totalGoldGrams = telegramUser.user.goldWallet?.goldGrams ?? 0;

    // Get all completed buy transactions to calculate total invested and avg price
    const buyTransactions = await db.transaction.findMany({
      where: {
        userId,
        type: 'buy',
        status: 'completed',
      },
      select: {
        amountFiat: true,
        amountGold: true,
        goldPrice: true,
      },
    });

    const totalInvested = buyTransactions.reduce((sum, tx) => sum + tx.amountFiat, 0);
    const totalGoldBought = buyTransactions.reduce((sum, tx) => sum + tx.amountGold, 0);
    const averageBuyPrice = totalGoldBought > 0 ? totalInvested / totalGoldBought : 0;

    // Get latest gold price for current valuation
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const currentPrice = latestPrice?.marketPrice ?? latestPrice?.buyPrice ?? 3750000;
    const currentValue = totalGoldGrams * currentPrice;

    // Calculate profit/loss
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    // Count transactions
    const buyCount = buyTransactions.length;

    // Get sell transactions count and total
    const sellTransactions = await db.transaction.findMany({
      where: {
        userId,
        type: 'sell',
        status: 'completed',
      },
      select: {
        amountFiat: true,
        amountGold: true,
      },
    });

    const totalSoldGold = sellTransactions.reduce((sum, tx) => sum + tx.amountGold, 0);
    const totalSellRevenue = sellTransactions.reduce((sum, tx) => sum + tx.amountFiat, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalGoldGrams,
        totalInvested,
        averageBuyPrice,
        currentPricePerGram: currentPrice,
        currentValue,
        profitLoss,
        profitLossPercent,
        isProfitable: profitLoss > 0,
        summary: {
          buyTransactions: buyCount,
          sellTransactions: sellTransactions.length,
          totalGoldBought,
          totalGoldSold: totalSoldGold,
          totalSellRevenue,
          totalFees: buyTransactions.reduce((sum, tx) => sum + tx.fee, 0)
            + sellTransactions.reduce((sum, tx) => sum + tx.fee, 0),
        },
      },
    });
  } catch (error) {
    console.error('Telegram trade portfolio error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت پرتفوی' },
      { status: 500 }
    );
  }
}
