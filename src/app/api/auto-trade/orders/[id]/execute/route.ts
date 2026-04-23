import { NextResponse } from 'next/server';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST /api/auto-trade/orders/[id]/execute — Execute order                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // In a real app, this would simulate executing the order at current market price
  // For now, return a mock success response
  return NextResponse.json({
    success: true,
    orderId: id,
    message: 'سفارش با موفقیت اجرا شد',
    executedAt: new Date().toISOString(),
    executedPrice: 4250000 + Math.floor(Math.random() * 50000),
    executedGrams: 2.38,
    executedFiat: 10100000,
    fee: 50500,
  });
}
