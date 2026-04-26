import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET /api/telegram/trade/balance                                           */
/*  Returns fiat wallet, gold wallet, gold value, gold card info & recent tx  */
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

    // Find TelegramUser with full user data
    const telegramUser = await db.telegramUser.findUnique({
      where: { telegramId: Number(telegramId) },
      include: {
        user: {
          include: {
            wallet: true,
            goldWallet: true,
            goldCard: true,
          },
        },
      },
    });

    if (!telegramUser) {
      return NextResponse.json(
        { success: false, message: 'حساب تلگرام یافت نشد' },
        { status: 404 }
      );
    }

    const user = telegramUser.user;

    // Get latest gold price
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const currentPrice = latestPrice?.marketPrice ?? latestPrice?.buyPrice ?? 3750000;

    // Get recent 5 transactions
    const recentTransactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Calculate gold value in toman
    const goldGrams = user.goldWallet?.goldGrams ?? 0;
    const goldValueToman = goldGrams * currentPrice;

    // Mask card number helper
    const maskCardNumber = (cardNumber: string | null | undefined) => {
      if (!cardNumber) return null;
      return cardNumber.replace(/(.{4})/g, '$1 ').trim().replace(/(\d{4}) (?=\d{4})/g, '•••• ');
    };

    // Build gold card info (if exists)
    const goldCard = user.goldCard
      ? {
          cardNumberMasked: maskCardNumber(user.goldCard.cardNumber),
          status: user.goldCard.status,
          balance: user.goldCard.balanceFiat,
          linkedGoldGram: user.goldCard.linkedGoldGram,
          dailyLimit: user.goldCard.dailyLimit,
          monthlyLimit: user.goldCard.monthlyLimit,
          spentToday: user.goldCard.spentToday,
          spentThisMonth: user.goldCard.spentThisMonth,
          remainingDailyLimit: user.goldCard.dailyLimit - user.goldCard.spentToday,
          remainingMonthlyLimit: user.goldCard.monthlyLimit - user.goldCard.spentThisMonth,
          cardType: user.goldCard.cardType,
          expiresAt: user.goldCard.expiresAt,
        }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        fiat: {
          balance: user.wallet?.balance ?? 0,
          frozenBalance: user.wallet?.frozenBalance ?? 0,
        },
        gold: {
          grams: goldGrams,
          frozenGold: user.goldWallet?.frozenGold ?? 0,
          availableGold: goldGrams - (user.goldWallet?.frozenGold ?? 0),
          valueToman: goldValueToman,
          currentPricePerGram: currentPrice,
        },
        goldCard,
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amountFiat: tx.amountFiat,
          amountGold: tx.amountGold,
          fee: tx.fee,
          goldPrice: tx.goldPrice,
          status: tx.status,
          referenceId: tx.referenceId,
          description: tx.description,
          createdAt: tx.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Telegram trade balance error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت موجودی' },
      { status: 500 }
    );
  }
}
