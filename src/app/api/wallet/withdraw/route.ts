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

    const wallet = await db.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'کیف پول یافت نشد' },
        { status: 404 }
      )
    }

    const availableBalance = wallet.balance - wallet.frozenBalance
    if (amount > availableBalance) {
      return NextResponse.json(
        { success: false, message: 'موجودی کافی نیست' },
        { status: 400 }
      )
    }

    // Deduct from wallet
    const updatedWallet = await db.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    })

    // Create pending transaction for admin approval
    await db.transaction.create({
      data: {
        userId,
        type: 'withdraw',
        amountFiat: amount,
        status: 'pending',
        referenceId: crypto.randomUUID(),
        description: 'درخواست برداشت',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'درخواست برداشت ثبت شد',
      balance: updatedWallet.balance,
    })
  } catch (error) {
    console.error('Withdraw error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در برداشت' },
      { status: 500 }
    )
  }
}
