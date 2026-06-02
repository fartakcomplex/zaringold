import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// POST - Purchase internet package
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const body = await req.json();
    const { operator, phoneNumber, packageTitle, amount, packageDays, packageDataMb } = body;

    if (!operator || !phoneNumber || !packageTitle || !amount) {
      return NextResponse.json(
        { error: 'اپراتور، شماره تلفن و بسته الزامی است' },
        { status: 400 }
      );
    }

    if (!/^09\d{9}$/.test(phoneNumber)) {
      return NextResponse.json({ error: 'شماره تلفن نامعتبر است' }, { status: 400 });
    }

    const fee = Math.round(amount * 0.01);
    const referenceCode = 'IN-' + randomBytes(6).toString('hex').toUpperCase();

    const payment = await db.utilityPayment.create({
      data: {
        userId,
        type: 'internet',
        operator,
        phoneNumber,
        amount,
        fee,
        totalPrice: amount + fee,
        status: 'success',
        paymentMethod: 'wallet',
        packageTitle,
        packageDays: packageDays || 0,
        packageDataMb: packageDataMb || 0,
        referenceCode,
        description: `بسته ${packageTitle} - ${operator}`,
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error('Error purchasing internet package:', error);
    return NextResponse.json({ error: 'خطا در خرید بسته اینترنت' }, { status: 500 });
  }
}
