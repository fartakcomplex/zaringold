import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// POST - Purchase phone topup
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const body = await req.json();
    const { operator, phoneNumber, amount } = body;

    if (!operator || !phoneNumber || !amount) {
      return NextResponse.json(
        { error: 'اپراتور، شماره تلفن و مبلغ الزامی است' },
        { status: 400 }
      );
    }

    if (!/^09\d{9}$/.test(phoneNumber)) {
      return NextResponse.json({ error: 'شماره تلفن نامعتبر است' }, { status: 400 });
    }

    const fee = Math.round(amount * 0.01); // 1% fee
    const referenceCode = 'TP-' + randomBytes(6).toString('hex').toUpperCase();

    const payment = await db.utilityPayment.create({
      data: {
        userId,
        type: 'topup',
        operator,
        phoneNumber,
        amount,
        fee,
        totalPrice: amount + fee,
        status: 'success',
        paymentMethod: 'wallet',
        referenceCode,
        description: `شارژ ${amount.toLocaleString('fa-IR')} تومان`,
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error('Error creating topup:', error);
    return NextResponse.json({ error: 'خطا در خرید شارژ' }, { status: 500 });
  }
}
