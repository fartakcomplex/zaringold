import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// POST: contribute gold (in mg) to a family wallet
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, goldMg } = await request.json()

    if (!userId || !goldMg || goldMg <= 0) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و مقدار طلا الزامی است' },
        { status: 400 }
      )
    }

    // Convert mg to grams
    const goldGrams = goldMg / 1000

    // Check wallet exists
    const wallet = await db.familyWallet.findUnique({
      where: { id },
    })

    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'کیف پول خانوادگی یافت نشد' },
        { status: 404 }
      )
    }

    // Check if user is a member
    const membership = await db.familyWalletMember.findUnique({
      where: {
        walletId_userId: { walletId: id, userId },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'شما عضو این کیف پول خانوادگی نیستید' },
        { status: 403 }
      )
    }

    // Check user's gold balance
    const goldWallet = await db.goldWallet.findUnique({ where: { userId } })
    if (!goldWallet || goldWallet.goldGrams < goldGrams) {
      return NextResponse.json(
        { success: false, message: 'موجودی طلای شما کافی نیست' },
        { status: 400 }
      )
    }

    // Get latest gold price for fiat valuation
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    const goldPrice = latestPrice?.sellPrice ?? 0
    const fiatValue = goldGrams * goldPrice

    // Deduct gold from user
    await db.goldWallet.update({
      where: { userId },
      data: { goldGrams: { decrement: goldGrams } },
    })

    // Update member contribution
    const updatedMembership = await db.familyWalletMember.update({
      where: {
        walletId_userId: { walletId: id, userId },
      },
      data: {
        contribution: { increment: goldGrams },
      },
    })

    // Create transaction record
    await db.transaction.create({
      data: {
        userId,
        type: 'family_contribute',
        amountFiat: fiatValue,
        amountGold: goldGrams,
        fee: 0,
        goldPrice,
        status: 'completed',
        referenceId: crypto.randomUUID(),
        description: `واریز ${goldGrams.toFixed(6)} گرم طلا به کیف پول خانوادگی «${wallet.name}»`,
      },
    })

    return NextResponse.json({
      success: true,
      message: `${goldGrams.toFixed(4)} گرم طلا به کیف پول خانوادگی «${wallet.name}» واریز شد`,
      contribution: Number(updatedMembership.contribution.toFixed(6)),
      newGoldBalance: Number((goldWallet.goldGrams - goldGrams).toFixed(6)),
    })
  } catch (error) {
    console.error('Contribute to family wallet error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در واریز به کیف پول خانوادگی' },
      { status: 500 }
    )
  }
}
