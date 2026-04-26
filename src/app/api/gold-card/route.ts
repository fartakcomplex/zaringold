import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/gold-card — Fetch card info                           */
/* ═══════════════════════════════════════════════════════════════ */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 });
    }

    const card = await db.goldCard.findUnique({
      where: { userId },
    });

    if (!card) {
      return NextResponse.json({ hasCard: false });
    }

  // Mask card number: 6219-XXXX-XX43-4332
  const cn = card.cardNumber.replace(/-/g, '');
  const masked = `${cn.slice(0, 4)}-XXXX-XX${cn.slice(-6, -4)}-${cn.slice(-4)}`;

  // Get recent 5 transactions
  const recentTx = await db.goldCardTransaction.findMany({
    where: { cardId: card.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return NextResponse.json({
    hasCard: true,
    card: {
      id: card.id,
      cardNumber: card.cardNumber,
      fullCardNumber: card.cardNumber,
      cvv: card.cvv,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      pin: card.pin,
      cardType: card.cardType,
      status: card.status,
      balanceFiat: card.balanceFiat,
      linkedGoldGram: card.linkedGoldGram,
      dailyLimit: card.dailyLimit,
      monthlyLimit: card.monthlyLimit,
      spentToday: card.spentToday,
      spentThisMonth: card.spentThisMonth,
      lastUsedAt: card.lastUsedAt,
      design: card.design,
      issuedAt: card.issuedAt,
      expiresAt: card.expiresAt,
    },
    recentTransactions: recentTx.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      goldGrams: tx.goldGrams,
      description: tx.description,
      merchant: tx.merchant,
      status: tx.status,
      createdAt: tx.createdAt,
    })),
  });
  } catch (error) {
    console.error('[GoldCard GET Error]', error);
    return NextResponse.json({ error: 'خطای سرور', hasCard: false }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/*  POST /api/gold-card — Various card actions                     */
/* ═══════════════════════════════════════════════════════════════ */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      /* ── Request new card ── */
      case 'request': {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 });
        }

        const existing = await db.goldCard.findUnique({ where: { userId } });
        if (existing) {
          return NextResponse.json({ error: 'کارت قبلاً صادر شده است' }, { status: 409 });
        }

        // Generate card number (16 digits: XXXX-XXXX-XXXX-XXXX)
        const r1 = String(Math.floor(1000 + Math.random() * 9000));
        const r2 = String(Math.floor(1000 + Math.random() * 9000));
        const r3 = String(Math.floor(1000 + Math.random() * 9000));
        const cardNumber = `6219-${r1}-${r2}-${r3}`;
        const cvv = String(Math.floor(100 + Math.random() * 900));

        const now = new Date();
        const expiresAt = new Date(now.getFullYear() + 3, now.getMonth(), now.getMonth());

        const card = await db.goldCard.create({
          data: {
            userId,
            cardNumber,
            cvv,
            expiryMonth: now.getMonth() + 1,
            expiryYear: now.getFullYear() + 3,
            pin: '1234',
            cardType: 'virtual',
            status: 'active',
            design: 'gold-gradient',
            expiresAt,
          },
        });

        return NextResponse.json({
          success: true,
          card: {
            id: card.id,
            cardNumber: card.cardNumber,
            cvv: card.cvv,
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
            status: card.status,
            design: card.design,
            cardType: card.cardType,
            balanceFiat: 0,
            linkedGoldGram: 0,
          },
        });
      }

      /* ── Freeze / Unfreeze ── */
      case 'freeze': {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 });
        }

        const card = await db.goldCard.findUnique({ where: { userId } });
        if (!card) {
          return NextResponse.json({ error: 'کارت یافت نشد' }, { status: 404 });
        }

        const newStatus = card.status === 'frozen' ? 'active' : 'frozen';
        await db.goldCard.update({
          where: { id: card.id },
          data: { status: newStatus },
        });

        return NextResponse.json({ success: true, status: newStatus });
      }

      /* ── Charge from gold wallet ── */
      case 'charge': {
        const { userId, grams } = body;
        if (!userId || !grams || grams <= 0) {
          return NextResponse.json({ error: 'مقدار طلای نامعتبر' }, { status: 400 });
        }

        const card = await db.goldCard.findUnique({ where: { userId } });
        if (!card) {
          return NextResponse.json({ error: 'کارت یافت نشد' }, { status: 404 });
        }
        if (card.status === 'frozen' || card.status === 'blocked') {
          return NextResponse.json({ error: 'کارت مسدود است' }, { status: 400 });
        }

        // Get gold price
        const goldPrice = await db.goldPrice.findFirst({ orderBy: { createdAt: 'desc' } });
        const pricePerGram = goldPrice?.buyPrice || 8900000;
        const fiatAmount = grams * pricePerGram;

        // Deduct from gold wallet
        const goldWallet = await db.goldWallet.findUnique({ where: { userId } });
        if (!goldWallet || goldWallet.goldGrams < grams) {
          return NextResponse.json({ error: 'موجودی طلای کافی نیست' }, { status: 400 });
        }

        await db.goldWallet.update({
          where: { userId },
          data: { goldGrams: { decrement: grams } },
        });

        // Add to card
        await db.goldCard.update({
          where: { id: card.id },
          data: {
            balanceFiat: { increment: fiatAmount },
            linkedGoldGram: { increment: grams },
          },
        });

        // Create transaction
        await db.goldCardTransaction.create({
          data: {
            cardId: card.id,
            userId,
            type: 'charge',
            amount: fiatAmount,
            goldGrams: grams,
            description: `شارژ ${grams} گرم طلا`,
            merchant: 'زرین گلد',
            status: 'completed',
          },
        });

        const updated = await db.goldCard.findUnique({ where: { id: card.id } });
        return NextResponse.json({
          success: true,
          newBalance: updated?.balanceFiat || 0,
          newGoldGrams: updated?.linkedGoldGram || 0,
        });
      }

      /* ── Change PIN ── */
      case 'pin': {
        const { userId, oldPin, newPin } = body;
        if (!userId || !oldPin || !newPin) {
          return NextResponse.json({ error: 'اطلاعات ناقص' }, { status: 400 });
        }
        if (!/^\d{4}$/.test(newPin)) {
          return NextResponse.json({ error: 'PIN باید ۴ رقم باشد' }, { status: 400 });
        }

        const card = await db.goldCard.findUnique({ where: { userId } });
        if (!card) {
          return NextResponse.json({ error: 'کارت یافت نشد' }, { status: 404 });
        }
        if (card.pin !== oldPin) {
          return NextResponse.json({ error: 'PIN فعلی اشتباه است' }, { status: 400 });
        }

        await db.goldCard.update({
          where: { id: card.id },
          data: { pin: newPin },
        });

        return NextResponse.json({ success: true, message: 'PIN با موفقیت تغییر کرد' });
      }

      /* ── Change design ── */
      case 'design': {
        const { userId, design } = body;
        const validDesigns = ['gold-gradient', 'black-premium', 'diamond', 'rose-gold'];
        if (!validDesigns.includes(design)) {
          return NextResponse.json({ error: 'طرح نامعتبر' }, { status: 400 });
        }

        const card = await db.goldCard.findUnique({ where: { userId } });
        if (!card) {
          return NextResponse.json({ error: 'کارت یافت نشد' }, { status: 404 });
        }

        await db.goldCard.update({
          where: { id: card.id },
          data: { design },
        });

        return NextResponse.json({ success: true, design });
      }

      /* ── Update limits ── */
      case 'limits': {
        const { userId, dailyLimit, monthlyLimit } = body;
        if (!userId) {
          return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 });
        }

        const card = await db.goldCard.findUnique({ where: { userId } });
        if (!card) {
          return NextResponse.json({ error: 'کارت یافت نشد' }, { status: 404 });
        }

        const updateData: Record<string, number> = {};
        if (dailyLimit !== undefined) updateData.dailyLimit = dailyLimit;
        if (monthlyLimit !== undefined) updateData.monthlyLimit = monthlyLimit;

        await db.goldCard.update({
          where: { id: card.id },
          data: updateData,
        });

        return NextResponse.json({ success: true });
      }

      /* ── Simulate purchase ── */
      case 'purchase': {
        const { userId, amount, merchant, description } = body;
        if (!userId || !amount || amount <= 0) {
          return NextResponse.json({ error: 'مبلغ نامعتبر' }, { status: 400 });
        }

        const card = await db.goldCard.findUnique({ where: { userId } });
        if (!card) {
          return NextResponse.json({ error: 'کارت یافت نشد' }, { status: 404 });
        }
        if (card.status !== 'active') {
          return NextResponse.json({ error: 'کارت فعال نیست' }, { status: 400 });
        }
        if (card.balanceFiat < amount) {
          return NextResponse.json({ error: 'موجودی کافی نیست' }, { status: 400 });
        }
        if (card.spentToday + amount > card.dailyLimit) {
          return NextResponse.json({ error: 'سقف روزانه رد شده' }, { status: 400 });
        }
        if (card.spentThisMonth + amount > card.monthlyLimit) {
          return NextResponse.json({ error: 'سقف ماهانه رد شده' }, { status: 400 });
        }

        await db.goldCard.update({
          where: { id: card.id },
          data: {
            balanceFiat: { decrement: amount },
            spentToday: { increment: amount },
            spentThisMonth: { increment: amount },
            lastUsedAt: new Date(),
          },
        });

        const tx = await db.goldCardTransaction.create({
          data: {
            cardId: card.id,
            userId,
            type: 'purchase',
            amount,
            description: description || 'خرید',
            merchant: merchant || 'فروشگاه',
            status: 'completed',
          },
        });

        const updated = await db.goldCard.findUnique({ where: { id: card.id } });
        return NextResponse.json({
          success: true,
          transaction: tx,
          newBalance: updated?.balanceFiat || 0,
        });
      }

      /* ── Close / Delete card ── */
      case 'close': {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 });
        }

        const card = await db.goldCard.findUnique({ where: { userId } });
        if (!card) {
          return NextResponse.json({ error: 'کارت یافت نشد' }, { status: 404 });
        }
        if (card.balanceFiat > 0) {
          return NextResponse.json({ error: 'ابتدا موجودی کارت را صفر کنید' }, { status: 400 });
        }

        await db.goldCardTransaction.deleteMany({ where: { cardId: card.id } });
        await db.goldCard.delete({ where: { id: card.id } });

        return NextResponse.json({ success: true, message: 'کارت با موفقیت بسته شد' });
      }

      default:
        return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 });
    }
  } catch (error) {
    console.error('[GoldCard API Error]', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
