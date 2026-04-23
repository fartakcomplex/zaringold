import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ltvRatio, interestRate, minGold, maxDuration, maxLoanAmount } = body

    // At least one field must be provided
    if (
      ltvRatio === undefined &&
      interestRate === undefined &&
      minGold === undefined &&
      maxDuration === undefined &&
      maxLoanAmount === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'حداقل یکی از تنظیمات باید ارسال شود',
        },
        { status: 400 }
      )
    }

    // Validate values if provided
    if (ltvRatio !== undefined && (ltvRatio <= 0 || ltvRatio > 1)) {
      return NextResponse.json(
        {
          success: false,
          message: 'نسبت وثیقه به وام (LTV) باید بین ۰ و ۱ باشد',
        },
        { status: 400 }
      )
    }

    if (interestRate !== undefined && (interestRate < 0 || interestRate > 100)) {
      return NextResponse.json(
        {
          success: false,
          message: 'نرخ سود باید بین ۰ تا ۱۰۰ باشد',
        },
        { status: 400 }
      )
    }

    if (minGold !== undefined && minGold <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'حداقل طلای وثیقه باید بیشتر از صفر باشد',
        },
        { status: 400 }
      )
    }

    if (maxDuration !== undefined && (maxDuration <= 0 || maxDuration > 3650)) {
      return NextResponse.json(
        {
          success: false,
          message: 'حداکثر مدت وام باید بین ۱ تا ۳۶۵۰ روز باشد',
        },
        { status: 400 }
      )
    }

    if (maxLoanAmount !== undefined && maxLoanAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'حداکثر مبلغ وام (گرم طلا) باید بیشتر از صفر باشد',
        },
        { status: 400 }
      )
    }

    // Upsert each setting
    const settings = [
      { key: 'ltvRatio', value: ltvRatio, description: 'نسبت وثیقه به وام (LTV)' },
      { key: 'interestRate', value: interestRate, description: 'نرخ سود سالانه وام' },
      { key: 'minGold', value: minGold, description: 'حداقل طلای وثیقه (گرم)' },
      { key: 'maxDuration', value: maxDuration, description: 'حداکثر مدت وام (روز)' },
      { key: 'maxLoanAmount', value: maxLoanAmount, description: 'حداکثر مبلغ وام (گرم طلا)' },
    ]

    const updatedSettings: Array<{ key: string; value: string }> = []

    for (const setting of settings) {
      if (setting.value !== undefined) {
        const result = await db.loanSetting.upsert({
          where: { key: setting.key },
          update: { value: String(setting.value) },
          create: {
            key: setting.key,
            value: String(setting.value),
            description: setting.description,
          },
        })
        updatedSettings.push({ key: result.key, value: result.value })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تنظیمات وام با موفقیت بروزرسانی شد',
      updatedSettings,
    })
  } catch (error) {
    console.error('Update loan settings error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی تنظیمات وام' },
      { status: 500 }
    )
  }
}
