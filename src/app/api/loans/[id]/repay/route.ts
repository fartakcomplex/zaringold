import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, goldAmount } = await request.json()

    if (!id || !userId || !goldAmount) {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه وام، شناسه کاربر و میزان طلای بازپرداخت الزامی است',
        },
        { status: 400 }
      )
    }

    if (goldAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'مقدار بازپرداخت طلای باید بیشتر از صفر باشد' },
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

    // Validate user owns the loan
    if (loan.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'شما دسترسی به این وام ندارید' },
        { status: 403 }
      )
    }

    // Validate loan status is active
    if (loan.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          message: 'فقط وام‌های فعال قابلیت بازپرداخت دارند',
        },
        { status: 400 }
      )
    }

    // Calculate remaining amount in gold grams
    const approvedAmount = loan.amountApproved ?? 0
    const interest = approvedAmount * (loan.interestRate / 100)
    const totalOwed = approvedAmount + interest - loan.repaidAmount

    if (totalOwed <= 0) {
      return NextResponse.json(
        { success: false, message: 'این وام قبلاً تسویه شده است' },
        { status: 400 }
      )
    }

    const paymentAmount = Math.min(goldAmount, totalOwed)

    // Check user's gold wallet has enough gold
    const goldWallet = await db.goldWallet.findUnique({
      where: { userId },
    })

    if (!goldWallet) {
      return NextResponse.json(
        { success: false, message: 'کیف پول طلای شما یافت نشد' },
        { status: 400 }
      )
    }

    if (goldWallet.goldGrams < paymentAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `موجودی طلای کیف پول کافی نیست. موجودی فعلی: ${goldWallet.goldGrams.toFixed(2)} گرم طلا`,
        },
        { status: 400 }
      )
    }

    // Perform repayment in a transaction
    const updatedLoan = await db.$transaction(async (tx) => {
      // Deduct from gold wallet (NOT fiat wallet)
      await tx.goldWallet.update({
        where: { userId },
        data: { goldGrams: { decrement: paymentAmount } },
      })

      // Create repayment record with amount in gold grams
      const repayment = await tx.loanRepayment.create({
        data: {
          loanId: id,
          amount: paymentAmount,
          method: 'gold_wallet',
          status: 'completed',
          description: `بازپرداخت وام طلا - ${paymentAmount.toFixed(4)} گرم طلا`,
        },
      })

      // Update loan repaidAmount
      const newRepaidAmount = loan.repaidAmount + paymentAmount
      const newTotalOwed = approvedAmount + interest

      const updateData: Record<string, unknown> = {
        repaidAmount: newRepaidAmount,
      }

      // Check if fully repaid
      let isFullyRepaid = false
      if (newRepaidAmount >= newTotalOwed) {
        updateData.status = 'repaid'
        isFullyRepaid = true

        // Unfreeze collateral gold in gold wallet
        const userGoldWallet = await tx.goldWallet.findUnique({
          where: { userId },
        })

        if (userGoldWallet) {
          await tx.goldWallet.update({
            where: { userId },
            data: {
              frozenGold: Math.max(0, userGoldWallet.frozenGold - loan.goldCollateral),
            },
          })
        }
      }

      const updated = await tx.goldLoan.update({
        where: { id },
        data: updateData,
      })

      // Create transaction record with amountGold (not amountFiat)
      await tx.transaction.create({
        data: {
          userId,
          type: 'loan_repayment',
          amountFiat: 0,
          amountGold: paymentAmount,
          goldPrice: loan.goldPriceAtLoan,
          status: 'completed',
          referenceId: crypto.randomUUID(),
          description: `بازپرداخت اقساط وام طلا - ${paymentAmount.toFixed(4)} گرم طلا - شناسه وام: ${id.substring(0, 8)}`,
        },
      })

      return { ...updated, isFullyRepaid }
    })

    return NextResponse.json({
      success: true,
      message: updatedLoan.isFullyRepaid
        ? 'وام با موفقیت تسویه شد. طلای وثیقه آزاد گردید'
        : 'بازپرداخت با موفقیت انجام شد',
      loan: updatedLoan,
      paymentAmount,
      remaining: Math.max(0, (approvedAmount + interest) - (loan.repaidAmount + paymentAmount)),
    })
  } catch (error) {
    console.error('Loan repayment error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در پردازش بازپرداخت وام' },
      { status: 500 }
    )
  }
}
