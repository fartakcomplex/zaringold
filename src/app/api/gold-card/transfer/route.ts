import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════ */
/*  POST /api/gold-card/transfer — Gold-based card-to-card      */
/*  Everything is in GOLD (grams). Fiat is just for display.    */
/* ═══════════════════════════════════════════════════════════════ */

export async function POST(request: Request) {
  try {
    const { userId, toCardNumber, goldGrams, description, pin } = await request.json();

    if (!userId || !toCardNumber || !goldGrams || goldGrams <= 0) {
      return NextResponse.json({ error: 'اطلاعات ناقص' }, { status: 400 });
    }

    // Validate gold amount (minimum 0.001 grams = 1 mg)
    if (goldGrams < 0.001) {
      return NextResponse.json({ error: 'حداقل مقدار انتقال ۱ میلی‌گرم طلا' }, { status: 400 });
    }

    // Validate card number (16 digits, optionally with dashes)
    const cleanCard = toCardNumber.replace(/-/g, '');
    if (!/^\d{16}$/.test(cleanCard)) {
      return NextResponse.json({ error: 'شماره کارت نامعتبر' }, { status: 400 });
    }

    // Get latest gold price
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestPrice) {
      return NextResponse.json({ error: 'قیمت طلا در دسترس نیست' }, { status: 400 });
    }

    const goldPrice = latestPrice.sellPrice;

    // Calculate fiat equivalent
    const fiatEquivalent = goldGrams * goldPrice;

    // Get user's gold card
    const card = await db.goldCard.findUnique({ where: { userId } });
    if (!card) {
      return NextResponse.json({ error: 'کارت طلایی یافت نشد' }, { status: 404 });
    }

    if (card.status !== 'active') {
      return NextResponse.json({ error: 'کارت فعال نیست — ابتدا آن را فعال کنید' }, { status: 400 });
    }

    // Verify PIN
    if (pin && pin !== card.pin) {
      return NextResponse.json({ error: 'رمز کارت اشتباه است' }, { status: 400 });
    }

    // Check if transferring to self
    const cleanOwnCard = card.cardNumber.replace(/-/g, '');
    if (cleanOwnCard === cleanCard) {
      return NextResponse.json({ error: 'امکان انتقال به خود کارت وجود ندارد' }, { status: 400 });
    }

    // Calculate fee in GOLD (0 for super_admin/diamond, otherwise 0.1% in gold)
    let feeGoldMg = 0;
    let feeFiat = 0;
    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'super_admin') {
      feeGoldMg = goldGrams * 0.001; // 0.1% fee in gold
      feeFiat = feeGoldMg * goldPrice;
    }

    const totalGold = goldGrams + feeGoldMg;
    const totalFiat = fiatEquivalent + feeFiat;

    // Check balance (fiat must cover the total)
    if (card.balanceFiat < totalFiat) {
      return NextResponse.json({ error: 'موجودی کارت کافی نیست' }, { status: 400 });
    }

    // Check daily limit
    if (card.spentToday + totalFiat > card.dailyLimit) {
      return NextResponse.json({ error: 'سقف روزانه رد شده' }, { status: 400 });
    }

    // Check monthly limit
    if (card.spentThisMonth + totalFiat > card.monthlyLimit) {
      return NextResponse.json({ error: 'سقف ماهانه رد شده' }, { status: 400 });
    }

    // Format card number for display
    const maskedToCard = cleanCard.replace(/(.{4})/g, '$1-').slice(0, -1);

    // Deduct from sender card (fiat + linked gold)
    await db.goldCard.update({
      where: { id: card.id },
      data: {
        balanceFiat: { decrement: totalFiat },
        linkedGoldGram: { decrement: totalGold },
        spentToday: { increment: totalFiat },
        spentThisMonth: { increment: totalFiat },
        lastUsedAt: new Date(),
      },
    });

    // Check if destination card is a Zarrin Gold card
    const destCard = await db.goldCard.findUnique({
      where: { cardNumber: cleanCard },
    });

    if (destCard && destCard.status === 'active') {
      // Gold-to-gold transfer within Zarrin Gold
      await db.goldCard.update({
        where: { id: destCard.id },
        data: {
          balanceFiat: { increment: fiatEquivalent },
          linkedGoldGram: { increment: goldGrams },
          lastUsedAt: new Date(),
        },
      });

      // Create incoming transaction for receiver
      await db.goldCardTransaction.create({
        data: {
          cardId: destCard.id,
          userId: destCard.userId,
          type: 'charge',
          amount: fiatEquivalent,
          goldGrams,
          description: `دریافت طلا از کارت ${card.cardNumber.replace(/(.{4})/g, '$1-').slice(0, -1)}`,
          merchant: card.cardNumber.replace(/(.{4})/g, '$1-').slice(0, -1),
          status: 'completed',
        },
      });
    }

    // Create outgoing transaction record for sender
    const tx = await db.goldCardTransaction.create({
      data: {
        cardId: card.id,
        userId,
        type: 'transfer_out',
        amount: totalFiat,
        goldGrams: totalGold,
        description: description || `انتقال طلا به کارت ${maskedToCard}`,
        merchant: maskedToCard,
        status: 'completed',
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: tx.id,
        type: 'transfer_out',
        goldGrams: totalGold,
        netGoldGrams: goldGrams,
        feeGoldMg,
        fiatEquivalent,
        feeFiat,
        totalFiat,
        toCard: maskedToCard,
        goldPrice,
        description: description || `انتقال طلا به کارت ${maskedToCard}`,
        status: 'completed',
        createdAt: tx.createdAt,
      },
      newBalance: card.balanceFiat - totalFiat,
      newGoldBalance: (card.linkedGoldGram || 0) - totalGold,
      message: `${goldGrams.toFixed(4)} گرم طلا به کارت ${maskedToCard} منتقل شد`,
      isInternalTransfer: !!destCard,
    });
  } catch (error) {
    console.error('[GoldCard Transfer Error]', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/gold-card/transfer — Transfer history & info        */
/* ═══════════════════════════════════════════════════════════════ */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 });
  }

  // Get latest gold price
  const latestPrice = await db.goldPrice.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  const goldPrice = latestPrice?.sellPrice || 8_900_000;

  // Get transfer transactions (transfer_out type)
  const transfers = await db.goldCardTransaction.findMany({
    where: {
      userId,
      type: 'transfer_out',
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Get card info
  const card = await db.goldCard.findUnique({ where: { userId } });

  return NextResponse.json({
    transfers: transfers.map(tx => ({
      id: tx.id,
      goldGrams: tx.goldGrams || 0,
      amount: tx.amount,
      toCard: tx.merchant,
      description: tx.description,
      status: tx.status,
      createdAt: tx.createdAt,
    })),
    card: card ? {
      balanceFiat: card.balanceFiat,
      linkedGoldGram: card.linkedGoldGram,
      balanceInGold: card.balanceFiat / goldPrice,
      dailySpent: card.spentToday,
      dailyLimit: card.dailyLimit,
      dailyLimitGold: card.dailyLimit / goldPrice,
      monthlySpent: card.spentThisMonth,
      monthlyLimit: card.monthlyLimit,
      monthlyLimitGold: card.monthlyLimit / goldPrice,
    } : null,
    goldPrice,
  });
}
