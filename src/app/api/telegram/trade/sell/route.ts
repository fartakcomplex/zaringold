import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST /api/telegram/trade/sell                                             */
/*  Sell gold via Telegram bot — deducts from gold wallet, adds to fiat wallet */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramId, grams } = body;

    if (!telegramId || !grams || grams <= 0) {
      return NextResponse.json(
        { success: false, message: 'شناسه تلگرام و مقدار طلا الزامی است' },
        { status: 400 }
      );
    }

    // Find TelegramUser by telegramId
    const telegramUser = await db.telegramUser.findUnique({
      where: { telegramId: Number(telegramId) },
      include: {
        user: {
          include: { wallet: true, goldWallet: true },
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
    const wallet = user.wallet;
    const goldWallet = user.goldWallet;

    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'کیف پول ریالی یافت نشد' },
        { status: 404 }
      );
    }

    if (!goldWallet) {
      return NextResponse.json(
        { success: false, message: 'کیف پول طلایی یافت نشد' },
        { status: 404 }
      );
    }

    // Get latest gold price (fallback if none exists)
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const sellPrice = latestPrice?.sellPrice ?? 3650000;
    const fee = 0.005; // 0.5% fee
    const payout = grams * sellPrice * (1 - fee);

    // Check if gold wallet has enough gold (available = goldGrams - frozenGold)
    const availableGold = (goldWallet.goldGrams ?? 0) - (goldWallet.frozenGold ?? 0);
    if (availableGold < grams) {
      return NextResponse.json(
        {
          success: false,
          message: 'موجودی طلای کافی نیست',
          data: {
            required: grams,
            available: availableGold,
            shortage: grams - availableGold,
          },
        },
        { status: 400 }
      );
    }

    // Generate a unique reference ID
    const referenceId = `TGSELL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Execute in a transaction
    const result = await db.$transaction(async (tx) => {
      // Deduct from gold wallet
      await tx.goldWallet.update({
        where: { userId: user.id },
        data: { goldGrams: { decrement: grams } },
      });

      // Add to fiat wallet
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { increment: payout } },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'sell',
          amountFiat: payout,
          amountGold: grams,
          fee: grams * sellPrice * fee,
          goldPrice: sellPrice,
          status: 'completed',
          referenceId,
          description: `فروش ${grams} گرم طلا از طریق ربات تلگرام`,
        },
      });

      // Update last activity
      await tx.telegramUser.update({
        where: { id: telegramUser.id },
        data: { lastActivityAt: new Date() },
      });

      return transaction;
    });

    return NextResponse.json({
      success: true,
      data: {
        transactionId: result.id,
        referenceId: result.referenceId,
        type: result.type,
        grams: result.amountGold,
        pricePerGram: sellPrice,
        fee: result.fee,
        totalPayout: result.amountFiat,
        newGoldBalance: (goldWallet.goldGrams ?? 0) - grams,
        newFiatBalance: (wallet.balance ?? 0) + payout,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error('Telegram trade sell error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در انجام فروش طلا' },
      { status: 500 }
    );
  }
}
