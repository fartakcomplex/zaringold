import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { maskApiKey } from '@/lib/sms';

export async function GET() {
  try {
    let config = await db.smsConfig.findFirst();

    if (!config) {
      config = await db.smsConfig.create({
        data: {
          provider: 'kavenegar',
          apiKey: '',
          senderNumber: '',
          otpTemplate: '',
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        provider: config.provider,
        apiKey: maskApiKey(config.apiKey),
        senderNumber: config.senderNumber,
        otpTemplate: config.otpTemplate,
        lastTestAt: config.lastTestAt,
        lastTestOk: config.lastTestOk,
      },
    });
  } catch (error) {
    console.error('SMS config GET error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تنظیمات پیامکی' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, senderNumber, otpTemplate } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, message: 'ارائه‌دهنده و کلید API الزامی است' },
        { status: 400 }
      );
    }

    const validProviders = ['kavenegar', 'melipayamak', 'smsir'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { success: false, message: 'ارائه‌دهنده نامعتبر است' },
        { status: 400 }
      );
    }

    let config = await db.smsConfig.findFirst();

    if (config) {
      config = await db.smsConfig.update({
        where: { id: config.id },
        data: {
          provider,
          apiKey: apiKey.startsWith('•••') ? undefined : apiKey,
          senderNumber: senderNumber || undefined,
          otpTemplate: otpTemplate || undefined,
        },
      });
    } else {
      config = await db.smsConfig.create({
        data: { provider, apiKey, senderNumber: senderNumber || '', otpTemplate: otpTemplate || '' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تنظیمات پیامکی ذخیره شد',
      config: {
        provider: config.provider,
        apiKey: maskApiKey(config.apiKey),
        senderNumber: config.senderNumber,
        otpTemplate: config.otpTemplate,
      },
    });
  } catch (error) {
    console.error('SMS config PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ذخیره تنظیمات پیامکی' },
      { status: 500 }
    );
  }
}
