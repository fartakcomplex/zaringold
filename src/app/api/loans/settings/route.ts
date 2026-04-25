import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_SETTINGS = {
  ltvRatio: 0.7,
  interestRate: 5,
  minGold: 1,
  maxDuration: 365,
  maxLoanAmount: 500, // گرم طلا
}

export async function GET() {
  try {
    const settings = await db.loanSetting.findMany()

    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }

    return NextResponse.json({
      success: true,
      settings: {
        ltvRatio: settingsMap['ltvRatio']
          ? parseFloat(settingsMap['ltvRatio'])
          : DEFAULT_SETTINGS.ltvRatio,
        interestRate: settingsMap['interestRate']
          ? parseFloat(settingsMap['interestRate'])
          : DEFAULT_SETTINGS.interestRate,
        minGold: settingsMap['minGold']
          ? parseFloat(settingsMap['minGold'])
          : DEFAULT_SETTINGS.minGold,
        maxDuration: settingsMap['maxDuration']
          ? parseInt(settingsMap['maxDuration'])
          : DEFAULT_SETTINGS.maxDuration,
        maxLoanAmount: settingsMap['maxLoanAmount']
          ? parseFloat(settingsMap['maxLoanAmount'])
          : DEFAULT_SETTINGS.maxLoanAmount,
      },
    })
  } catch (error) {
    console.error('Get loan settings error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تنظیمات وام' },
      { status: 500 }
    )
  }
}
