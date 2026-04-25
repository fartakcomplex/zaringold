import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// POST - Pay bill
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const body = await req.json();
    const { billType, billNumber, billId, amount, action = 'pay' } = body;

    if (!billType || !billNumber) {
      return NextResponse.json(
        { error: 'نوع قبض و شماره قبض الزامی است' },
        { status: 400 }
      );
    }

    // Inquiry mode - just return bill info
    if (action === 'inquiry') {
      // Simulate bill inquiry
      const billAmounts: Record<string, number> = {
        water: Math.round(Math.random() * 200000 + 30000),
        electricity: Math.round(Math.random() * 500000 + 50000),
        gas: Math.round(Math.random() * 300000 + 40000),
        landline: Math.round(Math.random() * 150000 + 20000),
      };

      const simulatedAmount = billAmounts[billType] || Math.round(Math.random() * 200000 + 50000);

      return NextResponse.json({
        success: true,
        data: {
          billType,
          billNumber,
          billId: billId || '',
          amount: simulatedAmount,
          status: 'pending',
          inquiry: true,
          description: `قبض ${billType} - ${billNumber}`,
        },
      });
    }

    // Payment mode
    const finalAmount = amount || 0;
    const fee = Math.round(finalAmount * 0.005); // 0.5% fee
    const referenceCode = 'BL-' + randomBytes(6).toString('hex').toUpperCase();

    const payment = await db.utilityPayment.create({
      data: {
        userId,
        type: 'bill',
        billType,
        billNumber,
        billId: billId || '',
        amount: finalAmount,
        fee,
        totalPrice: finalAmount + fee,
        status: 'success',
        paymentMethod: 'wallet',
        referenceCode,
        description: `پرداخت قبض ${billType}`,
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error('Error paying bill:', error);
    return NextResponse.json({ error: 'خطا در پرداخت قبض' }, { status: 500 });
  }
}
