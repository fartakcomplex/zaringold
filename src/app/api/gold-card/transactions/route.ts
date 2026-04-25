import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/gold-card/transactions — Fetch card transactions       */
/* ═══════════════════════════════════════════════════════════════ */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type') || null;

  if (!userId) {
    return NextResponse.json({ error: 'userId الزامی است' }, { status: 400 });
  }

  // First get card to find cardId
  const card = await db.goldCard.findUnique({ where: { userId } });
  if (!card) {
    return NextResponse.json({ transactions: [], total: 0 });
  }

  const where: Record<string, unknown> = { cardId: card.id };
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    db.goldCardTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.goldCardTransaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions: transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      goldGrams: tx.goldGrams,
      description: tx.description,
      merchant: tx.merchant,
      status: tx.status,
      createdAt: tx.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
