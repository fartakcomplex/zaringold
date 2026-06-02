import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Iranian gold unit conversion factors (relative to gram of pure gold).
 * These are approximate market conventions:
 *  - seke (سکه)    = 1 gold coin ≈ 7.336 grams of 22k gold
 *  - abbasi (عباسی) = half coin ≈ 3.668 grams of 22k gold
 *  - mithqal (مثقال) = ≈ 4.608 grams of 20k gold
 *
 * We convert everything through "gram of pure gold" as the base unit,
 * then apply coin premiums from the latest GoldPrice data.
 */

// Weight multipliers: how many grams of pure gold per unit
const UNIT_TO_GRAM: Record<string, number> = {
  gram: 1,
  seke: 7.336 * 0.916,       // 7.336g of 22k → ~6.723g pure
  abbasi: 3.668 * 0.916,     // 3.668g of 22k → ~3.362g pure
  mithqal: 4.608 * 0.833,    // 4.608g of 20k → ~3.839g pure
};

// Coin premium multipliers relative to pure gold gram price
const COIN_PREMIUM: Record<string, number> = {
  gram: 1,
  seke: 1.12,     // Coins carry ~12% premium over melt value
  abbasi: 1.10,   // Half coins ~10% premium
  mithqal: 1.05,  // Mithqal ~5% premium
};

const VALID_UNITS = ['gram', 'seke', 'abbasi', 'mithqal'];

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/gold-calculator — Convert between gold units          */
/* ═══════════════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amountStr = searchParams.get('amount');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!amountStr || !from || !to) {
      return NextResponse.json(
        { error: 'پارامترهای amount, from و to الزامی هستند' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount < 0) {
      return NextResponse.json(
        { error: 'مقدار وارد شده نامعتبر است' },
        { status: 400 }
      );
    }

    if (!VALID_UNITS.includes(from) || !VALID_UNITS.includes(to)) {
      return NextResponse.json(
        {
          error: `واحدهای مجاز: ${VALID_UNITS.join('، ')}`,
        },
        { status: 400 }
      );
    }

    // Fetch latest gold price from DB
    const latestPrice = await prisma.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const gramPrice = latestPrice?.marketPrice ?? 8_900_000;

    // Step 1: Convert source amount to pure gold grams
    const sourceGrams = amount * (UNIT_TO_GRAM[from] ?? 1);

    // Step 2: Convert source value in fiat
    const sourceValueFiat = sourceGrams * gramPrice * (COIN_PREMIUM[from] ?? 1);

    // Step 3: Calculate rate per target unit
    const targetGramsPerUnit = UNIT_TO_GRAM[to] ?? 1;
    const targetValuePerUnit = targetGramsPerUnit * gramPrice * (COIN_PREMIUM[to] ?? 1);

    // Step 4: Convert to target amount
    const result = targetValuePerUnit !== 0 ? sourceValueFiat / targetValuePerUnit : 0;
    const ratePerUnit = targetValuePerUnit;

    return NextResponse.json({
      result: Math.round(result * 100) / 100,
      rate: Math.round(ratePerUnit),
      from,
      to,
      amount,
      basePrice: gramPrice,
      updatedAt: latestPrice?.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /api/gold-calculator] Error:', error);
    return NextResponse.json(
      { error: 'خطا در محاسبه تبدیل طلا' },
      { status: 500 }
    );
  }
}
