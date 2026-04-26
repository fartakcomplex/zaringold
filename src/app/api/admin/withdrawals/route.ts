import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const pendingWithdrawals = await db.transaction.findMany({
      where: {
        type: 'withdraw',
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
            profile: {
              select: { iban: true, bankCard: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      withdrawals: pendingWithdrawals,
      count: pendingWithdrawals.length,
    })
  } catch (error) {
    console.error('Admin get withdrawals error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت درخواست‌های برداشت' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transactionId, status, note } = await request.json()

    if (!transactionId || !status || !['completed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'شناسه تراکنش و وضعیت معتبر الزامی است' },
        { status: 400 }
      )
    }

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    if (transaction.type !== 'withdraw' || transaction.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'تراکنش نامعتبر است' },
        { status: 400 }
      )
    }

    if (status === 'rejected') {
      // Refund the amount back to wallet
      await db.wallet.update({
        where: { userId: transaction.userId },
        data: { balance: { increment: transaction.amountFiat } },
      })
    }

    const updatedTransaction = await db.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        description: note || transaction.description,
      },
    })

    // Create notification for user
    const message =
      status === 'completed'
        ? 'درخواست برداشت شما تایید و انجام شد.'
        : `درخواست برداشت شما رد شد. ${note ? `دلیل: ${note}` : ''} مبلغ به کیف پول بازگشت.`

    await db.notification.create({
      data: {
        userId: transaction.userId,
        title: status === 'completed' ? 'برداشت موفق' : 'برداشت رد شد',
        body: message,
        type: 'transaction',
      },
    })

    return NextResponse.json({
      success: true,
      message: status === 'completed' ? 'برداشت تایید شد' : 'برداشت رد شد',
      transaction: updatedTransaction,
    })
  } catch (error) {
    console.error('Admin process withdrawal error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در پردازش برداشت' },
      { status: 500 }
    )
  }
}
