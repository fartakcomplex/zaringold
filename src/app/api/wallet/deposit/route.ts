import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و مبلغ الزامی است' },
        { status: 400 }
      )
    }

    // Find or create wallet
    const wallet = await db.wallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount },
    })

    // Create transaction record
    await db.transaction.create({
      data: {
        userId,
        type: 'deposit',
        amountFiat: amount,
        status: 'completed',
        referenceId: crypto.randomUUID(),
        description: 'واریز به کیف پول',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'واریز با موفقیت انجام شد',
      balance: wallet.balance,
    })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در واریز' },
      { status: 500 }
    )
  }
}
