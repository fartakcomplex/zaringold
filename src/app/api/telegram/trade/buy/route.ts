import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST /api/telegram/trade/buy                                              */
/*  Buy gold via Telegram bot — deducts from fiat wallet, adds to gold wallet  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramId, assetType, grams } = body;

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

    const buyPrice = latestPrice?.buyPrice ?? 3750000;
    const fee = 0.005; // 0.5% fee
    const cost = grams * buyPrice * (1 + fee);

    // Check if wallet has enough balance
    if (wallet.balance < cost) {
      return NextResponse.json(
        {
          success: false,
          message: 'موجودی کیف پول کافی نیست',
          data: {
            required: cost,
            available: wallet.balance,
            shortage: cost - wallet.balance,
          },
        },
        { status: 400 }
      );
    }

    // Generate a unique reference ID
    const referenceId = `TGBUY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Execute in a transaction
    const result = await db.$transaction(async (tx) => {
      // Deduct from fiat wallet
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: cost } },
      });

      // Add gold to gold wallet
      await tx.goldWallet.update({
        where: { userId: user.id },
        data: { goldGrams: { increment: grams } },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'buy',
          amountFiat: cost,
          amountGold: grams,
          fee: cost - grams * buyPrice,
          goldPrice: buyPrice,
          status: 'completed',
          referenceId,
          description: `خرید ${grams} گرم طلا از طریق ربات تلگرام — ${assetType || 'gold18'}`,
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
        pricePerGram: buyPrice,
        fee: result.fee,
        totalCost: result.amountFiat,
        newGoldBalance: (goldWallet.goldGrams ?? 0) + grams,
        newFiatBalance: (wallet.balance ?? 0) - cost,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error('Telegram trade buy error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در انجام خرید طلا' },
      { status: 500 }
    );
  }
}
