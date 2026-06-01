import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Interest rate tiers based on deposit duration (annual percentage)
function getInterestRate(durationMonths: number): number {
  if (durationMonths <= 3) return 0.12
  if (durationMonths <= 6) return 0.15
  if (durationMonths <= 9) return 0.18
  return 0.20 // 12 months or more
}

const VALID_DURATIONS = [3, 6, 9, 12, 18, 24]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const deposits = await db.goldDeposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      deposits,
    })
  } catch (error) {
    console.error('Get gold deposits error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست سپرده‌های طلایی' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, goldGrams, durationMonths } = body

    if (!userId || !goldGrams || !durationMonths) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر، مقدار طلا و مدت سپرده الزامی است' },
        { status: 400 }
      )
    }

    if (goldGrams <= 0.01) {
      return NextResponse.json(
        { success: false, message: 'حداقل مقدار سپرده طلایی ۰.۰۱ گرم است' },
        { status: 400 }
      )
    }

    if (!VALID_DURATIONS.includes(durationMonths)) {
      return NextResponse.json(
        {
          success: false,
          message: `مدت سپرده باید یکی از مقادیر ${VALID_DURATIONS.join('، ')} ماه باشد`,
        },
        { status: 400 }
      )
    }

    // Check user has enough gold in their wallet
    const goldWallet = await db.goldWallet.findUnique({ where: { userId } })

    if (!goldWallet || goldWallet.goldGrams < goldGrams) {
      const available = goldWallet ? goldWallet.goldGrams : 0
      return NextResponse.json(
        {
          success: false,
          message: `موجودی طلا کافی نیست. موجودی فعلی: ${available.toFixed(4)} گرم`,
        },
        { status: 400 }
      )
    }

    // Calculate interest rate and maturity date
    const interestRate = getInterestRate(durationMonths)
    const startDate = new Date()
    const maturityDate = new Date(startDate)
    maturityDate.setMonth(maturityDate.getMonth() + durationMonths)

    // Calculate matured gold grams (principal + interest)
    const goldGramsMatured = parseFloat(
      (goldGrams * (1 + interestRate * (durationMonths / 12))).toFixed(4)
    )

    // Deduct gold from wallet (freeze it)
    await db.goldWallet.update({
      where: { userId },
      data: {
        goldGrams: { decrement: goldGrams },
        frozenGold: { increment: goldGrams },
      },
    })

    // Create the gold deposit
    const deposit = await db.goldDeposit.create({
      data: {
        userId,
        goldGrams,
        interestRate,
        durationMonths,
        startDate,
        maturityDate,
        goldGramsMatured,
      },
    })

    return NextResponse.json({
      success: true,
      deposit,
      message: `سپرده طلایی ${goldGrams.toFixed(4)} گرم به مدت ${durationMonths} ماه با سود ${(interestRate * 100).toFixed(0)}٪ سالانه ایجاد شد`,
    })
  } catch (error) {
    console.error('Create gold deposit error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد سپرده طلایی' },
      { status: 500 }
    )
  }
}
