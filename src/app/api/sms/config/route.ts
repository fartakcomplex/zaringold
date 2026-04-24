import { NextRequest, NextResponse } from 'next/server'

// ─── In-Memory Mock Config ──────────────────────────────────────────────
let config = {
  provider: {
    name: 'kavenegar',
    apiKey: 'KVN_****_abcd',
    senderNumber: '30005050',
    status: 'connected',
    costPerSms: 45,
    dailyLimit: 10000,
    dailyUsed: 3420,
  },
  transactionSms: {
    deposit: {
      enabled: true,
      template: 'مبلغ {amount} تومان به کیف پول شما واریز شد. موجودی: {balance}',
    },
    withdrawal: {
      enabled: true,
      template: 'مبلغ {amount} تومان از کیف پول شما برداشت شد. موجودی: {balance}',
    },
    buy_gold: {
      enabled: true,
      template: 'خرید {amount} گرم طلا با موفقیت انجام شد. قیمت: {price}',
    },
    sell_gold: {
      enabled: true,
      template: 'فروش {amount} گرم طلا با موفقیت انجام شد. مبلغ: {amount} تومان',
    },
    loan: {
      enabled: false,
      template: 'وام {amount} تومان به حساب شما واریز شد',
    },
    repayment: {
      enabled: false,
      template: 'قسط {amount} تومان از حساب شما کسر شد.剩余: {remaining}',
    },
  },
  contactGroups: [
    { id: 'g1', name: 'VIP کاربران', description: 'کاربران سطح VIP', count: 156, auto: true, lastUsed: '2024-03-20' },
    { id: 'g2', name: 'کاربران جدید', description: 'ثبت‌نام در ۳۰ روز اخیر', count: 89, auto: true, lastUsed: '2024-03-19' },
    { id: 'g3', name: 'معامله‌گران فعال', description: 'بیش از ۱۰ تراکنش در ماه', count: 234, auto: true, lastUsed: '2024-03-18' },
    { id: 'g4', name: 'احراز شده', description: 'تکمیل KYC', count: 445, auto: true, lastUsed: '2024-03-17' },
    { id: 'g5', name: 'دارانگان طلا', description: 'بیشتر از ۱ گرم طلا', count: 312, auto: true, lastUsed: '2024-03-16' },
  ],
  settings: {
    autoBlacklistAfterFailed: 5,
    birthdayAutoSend: true,
    birthdayDaysBefore: 1,
    transactionMinAmount: 100000,
  },
}

// ─── GET: Return full config ──────────────────────────────────────────
export async function GET() {
  try {
    return NextResponse.json(config)
  } catch (error) {
    console.error('[SMS Config GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تنظیمات پیامکی' },
      { status: 500 }
    )
  }
}

// ─── PUT: Accept any subset of config, return updated ──────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    // Deep merge the incoming body into config
    if (body.provider) {
      config.provider = { ...config.provider, ...body.provider }
    }
    if (body.transactionSms) {
      config.transactionSms = {
        ...config.transactionSms,
        ...body.transactionSms,
        // Deep merge each transaction type
        ...(Object.fromEntries(
          Object.entries(body.transactionSms).map(([key, value]) => [
            key,
            { ...(config.transactionSms as Record<string, unknown>)[key] as object, ...(value as object) },
          ])
        ) as Record<string, unknown>),
      }
    }
    if (body.contactGroups) {
      config.contactGroups = body.contactGroups
    }
    if (body.settings) {
      config.settings = { ...config.settings, ...body.settings }
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('[SMS Config PUT]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ذخیره تنظیمات پیامکی' },
      { status: 500 }
    )
  }
}
