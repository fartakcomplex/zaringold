import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه وام الزامی است' },
        { status: 400 }
      )
    }

    const loan = await db.goldLoan.findUnique({
      where: { id },
      include: {
        repayments: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
          },
        },
      },
    })

    if (!loan) {
      return NextResponse.json(
        { success: false, message: 'وام مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    // Calculate remaining amount (principal + interest - repaid)
    const interest =
      loan.amountApproved != null
        ? loan.amountApproved * (loan.interestRate / 100)
        : 0
    const totalOwed =
      loan.amountApproved != null ? loan.amountApproved + interest : 0
    const remaining = totalOwed - loan.repaidAmount

    return NextResponse.json({
      success: true,
      loan: {
        ...loan,
        calculatedInterest: interest,
        totalOwed,
        remaining,
      },
    })
  } catch (error) {
    console.error('Get loan details error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت جزئیات وام' },
      { status: 500 }
    )
  }
}
