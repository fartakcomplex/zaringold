import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserAccess } from '@/lib/access'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { userId, recipientPhone, goldGrams, message } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    if (!recipientPhone) {
      return NextResponse.json(
        { success: false, message: 'شماره گیرنده الزامی است' },
        { status: 400 }
      )
    }

    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(recipientPhone)) {
      return NextResponse.json(
        { success: false, message: 'شماره گیرنده باید ۱۱ رقم و با ۰۹ شروع شود' },
        { status: 400 }
      )
    }

    if (!goldGrams || goldGrams <= 0) {
      return NextResponse.json(
        { success: false, message: 'مقدار طلا باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    // Check gift limit (diamond = unlimited)
    const access = await getUserAccess(userId)
    if (goldGrams > access.maxGiftGrams) {
      return NextResponse.json(
        { success: false, message: access.isSuperAdmin ? '' : `حداکثر ${access.maxGiftGrams} گرم طلا قابل ارسال است` },
        { status: 400 }
      )
    }

    // Get latest gold price
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!latestPrice) {
      return NextResponse.json(
        { success: false, message: 'قیمت طلا در دسترس نیست' },
        { status: 400 }
      )
    }

    const giftPrice = latestPrice.sellPrice
    const fiatValue = goldGrams * giftPrice

    // Check sender's gold balance
    const goldWallet = await db.goldWallet.findUnique({ where: { userId } })
    if (!goldWallet || goldWallet.goldGrams < goldGrams) {
      return NextResponse.json(
        { success: false, message: 'موجودی طلای شما کافی نیست' },
        { status: 400 }
      )
    }

    // Find recipient by phone
    const recipient = await db.user.findUnique({
      where: { phone: recipientPhone },
    })

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: 'کاربری با این شماره یافت نشد' },
        { status: 404 }
      )
    }

    if (recipient.id === userId) {
      return NextResponse.json(
        { success: false, message: 'نمی‌توانید به خودتان هدیه بدهید' },
        { status: 400 }
      )
    }

    // Deduct gold from sender
    await db.goldWallet.update({
      where: { userId },
      data: { goldGrams: { decrement: goldGrams } },
    })

    // Add gold to recipient
    const recipientGoldWallet = await db.goldWallet.upsert({
      where: { userId: recipient.id },
      update: { goldGrams: { increment: goldGrams } },
      create: { userId: recipient.id, goldGrams },
    })

    // Create transaction record for sender (gift_sent)
    const referenceId = crypto.randomUUID()
    await db.transaction.create({
      data: {
        userId,
        type: 'gift_sent',
        amountFiat: fiatValue,
        amountGold: goldGrams,
        fee: 0,
        goldPrice: giftPrice,
        status: 'completed',
        referenceId,
        toUserId: recipient.id,
        description: `ارسال هدیه ${goldGrams.toFixed(6)} گرم طلا به شماره ${recipientPhone}${message ? ` — ${message}` : ''}`,
      },
    })

    // Create transaction record for recipient (gift_received)
    await db.transaction.create({
      data: {
        userId: recipient.id,
        type: 'gift_received',
        amountFiat: fiatValue,
        amountGold: goldGrams,
        fee: 0,
        goldPrice: giftPrice,
        status: 'completed',
        referenceId: crypto.randomUUID(),
        toUserId: userId,
        description: `دریافت هدیه ${goldGrams.toFixed(6)} گرم طلا${message ? ` — ${message}` : ''}`,
      },
    })

    // Create notification for recipient
    await db.notification.create({
      data: {
        userId: recipient.id,
        title: '🎁 هدیه طلا',
        body: `شما ${goldGrams.toFixed(6)} گرم طلا به عنوان هدیه دریافت کردید.${message ? ` پیام: ${message}` : ''}`,
        type: 'gift',
      },
    })

    return NextResponse.json({
      success: true,
      message: `هدیه ${goldGrams.toFixed(6)} گرم طلا با موفقیت ارسال شد`,
      transaction: {
        referenceId,
        goldGrams: Number(goldGrams.toFixed(6)),
        fiatValue: Number(fiatValue.toFixed(0)),
        goldPrice: giftPrice,
        recipientPhone,
        recipientName: recipient.fullName || recipient.phone,
      },
      newSenderGoldBalance: Number((goldWallet.goldGrams - goldGrams).toFixed(6)),
      newRecipientGoldBalance: Number(recipientGoldWallet.goldGrams.toFixed(6)),
    })
  } catch (error) {
    console.error('Gift gold error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال هدیه طلا' },
      { status: 500 }
    )
  }
}
