import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/security/auth-guard'

const DEFAULT_SETTINGS = {
  ltvRatio: 0.7,
  interestRate: 5,
  minGold: 1,
  maxDuration: 365,
  maxLoanAmount: 500, // گرم طلا
}

async function getLoanSettings() {
  const settings = await db.loanSetting.findMany()
  const settingsMap: Record<string, string> = {}
  for (const s of settings) {
    settingsMap[s.key] = s.value
  }

  return {
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
  }
}

// ── GET: Return user's loans ──
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 })
    }

    const userId = auth.user.id

    const loans = await db.goldLoan.findMany({
      where: { userId },
      include: {
        repayments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      loans,
      count: loans.length,
    })
  } catch (error) {
    console.error('Get user loans error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست وام‌ها' },
      { status: 500 }
    )
  }
}

// ── POST: Apply for a new gold loan ──
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 })
    }

    const { goldCollateral, durationDays } = await request.json()
    const userId = auth.user.id

    if (!goldCollateral || !durationDays) {
      return NextResponse.json(
        {
          success: false,
          message: 'تمامی فیلدها (میزان طلای وثیقه و مدت وام) الزامی است',
        },
        { status: 400 }
      )
    }

    if (goldCollateral <= 0) {
      return NextResponse.json(
        { success: false, message: 'میزان طلای وثیقه باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    if (durationDays <= 0) {
      return NextResponse.json(
        { success: false, message: 'مدت وام باید بیشتر از صفر روز باشد' },
        { status: 400 }
      )
    }

    // Get loan settings
    const settings = await getLoanSettings()

    // Validate goldCollateral >= minGold
    if (goldCollateral < settings.minGold) {
      return NextResponse.json(
        {
          success: false,
          message: `حداقل میزان طلای وثیقه ${settings.minGold} گرم طلا است`,
        },
        { status: 400 }
      )
    }

    // Validate durationDays <= maxDuration
    if (durationDays > settings.maxDuration) {
      return NextResponse.json(
        {
          success: false,
          message: `حداکثر مدت وام ${settings.maxDuration} روز است`,
        },
        { status: 400 }
      )
    }

    // Check user's gold wallet has enough available (non-frozen) gold
    const goldWallet = await db.goldWallet.findUnique({
      where: { userId },
    })

    if (!goldWallet) {
      return NextResponse.json(
        { success: false, message: 'کیف پول طلای شما یافت نشد' },
        { status: 400 }
      )
    }

    const availableGold = goldWallet.goldGrams - goldWallet.frozenGold
    if (availableGold < goldCollateral) {
      return NextResponse.json(
        {
          success: false,
          message: `موجودی طلای آزاد کافی نیست. موجودی آزاد: ${availableGold.toFixed(2)} گرم طلا`,
        },
        { status: 400 }
      )
    }

    // Auto-calculate gold loan amount: goldLoanAmount = goldCollateral * ltvRatio
    const goldLoanAmount = goldCollateral * settings.ltvRatio

    // Validate goldLoanAmount <= maxLoanAmount (max gold grams)
    if (goldLoanAmount > settings.maxLoanAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `مبلغ وام بیش از سقف مجاز سیستم (${settings.maxLoanAmount} گرم طلا) است`,
        },
        { status: 400 }
      )
    }

    // Get current gold price for valuation reference
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!latestPrice) {
      return NextResponse.json(
        { success: false, message: 'قیمت طلا در دسترس نیست. لطفاً بعداً تلاش کنید' },
        { status: 400 }
      )
    }

    const goldPrice = latestPrice.marketPrice

    // Create the loan with amount in gold grams
    const loan = await db.goldLoan.create({
      data: {
        userId,
        amountRequested: goldLoanAmount,
        goldCollateral,
        goldPriceAtLoan: goldPrice,
        ltvRatio: settings.ltvRatio,
        interestRate: settings.interestRate,
        durationDays,
        status: 'pending',
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'درخواست وام با موفقیت ثبت شد. منتظر تأیید مدیر باشید',
        loan: {
          ...loan,
          valuationToman: Math.floor(goldLoanAmount * goldPrice),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Apply loan error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت درخواست وام' },
      { status: 500 }
    )
  }
}
