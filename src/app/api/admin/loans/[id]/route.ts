import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { action, adminNote, approvedAmount } = await request.json()

    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه وام و عملیات معتبر (تأیید یا رد) الزامی است',
        },
        { status: 400 }
      )
    }

    // Fetch loan
    const loan = await db.goldLoan.findUnique({
      where: { id },
    })

    if (!loan) {
      return NextResponse.json(
        { success: false, message: 'وام مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    if (loan.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'فقط درخواست‌های در انتظار قابل بررسی هستند' },
        { status: 400 }
      )
    }

    // Handle rejection
    if (action === 'reject') {
      const updatedLoan = await db.goldLoan.update({
        where: { id },
        data: {
          status: 'rejected',
          adminNote: adminNote || 'درخواست وام توسط مدیر رد شد',
          reviewedAt: new Date(),
        },
      })

      // Notify user — use "گرم طلا" instead of "ریال"
      await db.notification.create({
        data: {
          userId: loan.userId,
          title: 'درخواست وام رد شد',
          body: `درخواست وام شما با مبلغ ${loan.amountRequested.toFixed(4)} گرم طلا رد شد. ${adminNote ? `دلیل: ${adminNote}` : ''}`,
          type: 'loan',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'درخواست وام رد شد',
        loan: updatedLoan,
      })
    }

    // Handle approval
    const finalApprovedAmount =
      approvedAmount != null ? approvedAmount : loan.amountRequested

    if (finalApprovedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'مبلغ تأیید شده (گرم طلا) باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    // Calculate due date
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + loan.durationDays)

    // Perform approval in a transaction
    const updatedLoan = await db.$transaction(async (tx) => {
      // Update loan status
      const updated = await tx.goldLoan.update({
        where: { id },
        data: {
          status: 'active',
          amountApproved: finalApprovedAmount,
          adminNote: adminNote || null,
          approvedAt: new Date(),
          reviewedAt: new Date(),
          dueDate,
        },
      })

      // Credit approved gold amount to user's GOLD wallet (NOT fiat wallet)
      const goldWallet = await tx.goldWallet.upsert({
        where: { userId: loan.userId },
        update: { goldGrams: { increment: finalApprovedAmount } },
        create: { userId: loan.userId, goldGrams: finalApprovedAmount },
      })

      // Freeze collateral gold in gold wallet
      const userGoldWallet = await tx.goldWallet.findUnique({
        where: { userId: loan.userId },
      })

      if (userGoldWallet) {
        const availableGold = userGoldWallet.goldGrams - userGoldWallet.frozenGold
        const freezeAmount = Math.min(loan.goldCollateral, availableGold)

        await tx.goldWallet.update({
          where: { userId: loan.userId },
          data: { frozenGold: { increment: freezeAmount } },
        })
      }

      // Create transaction record with amountGold
      await tx.transaction.create({
        data: {
          userId: loan.userId,
          type: 'loan_disbursement',
          amountFiat: 0,
          amountGold: finalApprovedAmount,
          goldPrice: loan.goldPriceAtLoan,
          status: 'completed',
          referenceId: crypto.randomUUID(),
          description: `واریز وام طلا - ${finalApprovedAmount.toFixed(4)} گرم طلا (وثیقه: ${loan.goldCollateral} گرم طلا)`,
        },
      })

      // Notify user — use "گرم طلا" instead of "ریال"
      await tx.notification.create({
        data: {
          userId: loan.userId,
          title: 'درخواست وام تأیید شد',
          body: `وام شما با مبلغ ${finalApprovedAmount.toFixed(4)} گرم طلا تأیید و به کیف پول طلای شما واریز شد. مهلت بازپرداخت: ${loan.durationDays} روز. تاریخ سررسید: ${dueDate.toLocaleDateString('fa-IR')}`,
          type: 'loan',
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      message: 'وام با موفقیت تأیید و مقدار طلا به کیف پول طلای کاربر واریز شد',
      loan: updatedLoan,
    })
  } catch (error) {
    console.error('Admin loan review error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بررسی درخواست وام' },
      { status: 500 }
    )
  }
}
