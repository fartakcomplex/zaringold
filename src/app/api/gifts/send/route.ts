import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// POST: send gold gift (uses GiftTransfer model with occasion + giftCardStyle)
export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverPhone, goldMg, message, occasion, giftCardStyle } = await request.json()

    if (!senderId) {
      return NextResponse.json(
        { success: false, message: 'شناسه فرستنده الزامی است' },
        { status: 400 }
      )
    }

    if (!receiverPhone) {
      return NextResponse.json(
        { success: false, message: 'شماره گیرنده الزامی است' },
        { status: 400 }
      )
    }

    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(receiverPhone)) {
      return NextResponse.json(
        { success: false, message: 'شماره گیرنده باید ۱۱ رقم و با ۰۹ شروع شود' },
        { status: 400 }
      )
    }

    if (!goldMg || goldMg <= 0 || goldMg > 100000) {
      return NextResponse.json(
        { success: false, message: 'مقدار طلا باید بین ۰.۰۰۱ تا ۱۰۰,۰۰۰ میلی‌گرم باشد' },
        { status: 400 }
      )
    }

    // Convert mg to grams
    const goldGrams = goldMg / 1000

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

    // Check sender's gold balance
    const goldWallet = await db.goldWallet.findUnique({ where: { userId: senderId } })
    if (!goldWallet || goldWallet.goldGrams < goldGrams) {
      return NextResponse.json(
        { success: false, message: 'موجودی طلای شما کافی نیست' },
        { status: 400 }
      )
    }

    // Find receiver by phone
    const receiver = await db.user.findUnique({
      where: { phone: receiverPhone },
    })

    if (!receiver) {
      return NextResponse.json(
        { success: false, message: 'کاربری با این شماره یافت نشد' },
        { status: 404 }
      )
    }

    if (receiver.id === senderId) {
      return NextResponse.json(
        { success: false, message: 'نمی‌توانید به خودتان هدیه بدهید' },
        { status: 400 }
      )
    }

    // Validate occasion
    const validOccasions = ['birthday', 'wedding', 'engagement', 'graduation', 'new_year', 'eid', 'custom']
    const validStyles = ['birthday', 'wedding', 'luxury', 'minimal', 'floral', 'modern']

    const selectedOccasion = occasion && validOccasions.includes(occasion) ? occasion : 'custom'
    const selectedStyle = giftCardStyle && validStyles.includes(giftCardStyle) ? giftCardStyle : 'birthday'

    // Deduct gold from sender
    await db.goldWallet.update({
      where: { userId: senderId },
      data: { goldGrams: { decrement: goldGrams } },
    })

    // Add gold to receiver
    const receiverGoldWallet = await db.goldWallet.upsert({
      where: { userId: receiver.id },
      update: { goldGrams: { increment: goldGrams } },
      create: { userId: receiver.id, goldGrams },
    })

    // Create GiftTransfer record
    const giftTransfer = await db.giftTransfer.create({
      data: {
        senderId,
        receiverId: receiver.id,
        goldMg,
        message: message || null,
        occasion: selectedOccasion,
        giftCardStyle: selectedStyle,
        status: 'completed',
      },
    })

    const fiatValue = goldGrams * latestPrice.sellPrice

    // Create transaction for sender
    await db.transaction.create({
      data: {
        userId: senderId,
        type: 'gift_sent',
        amountFiat: fiatValue,
        amountGold: goldGrams,
        fee: 0,
        goldPrice: latestPrice.sellPrice,
        status: 'completed',
        referenceId: crypto.randomUUID(),
        toUserId: receiver.id,
        description: `ارسال هدیه ${goldGrams.toFixed(6)} گرم طلا (${selectedOccasion})${message ? ` — ${message}` : ''}`,
      },
    })

    // Create transaction for receiver
    await db.transaction.create({
      data: {
        userId: receiver.id,
        type: 'gift_received',
        amountFiat: fiatValue,
        amountGold: goldGrams,
        fee: 0,
        goldPrice: latestPrice.sellPrice,
        status: 'completed',
        referenceId: crypto.randomUUID(),
        toUserId: senderId,
        description: `دریافت هدیه ${goldGrams.toFixed(6)} گرم طلا (${selectedOccasion})`,
      },
    })

    // Create notification for receiver
    await db.notification.create({
      data: {
        userId: receiver.id,
        title: '🎁 هدیه طلا',
        body: `شما ${goldGrams.toFixed(4)} گرم طلا به عنوان هدیه دریافت کردید.${message ? ` پیام: ${message}` : ''}`,
        type: 'gift',
      },
    })

    return NextResponse.json({
      success: true,
      message: `هدیه ${goldGrams.toFixed(4)} گرم طلا با موفقیت ارسال شد`,
      gift: giftTransfer,
      fiatValue: Number(fiatValue.toFixed(0)),
      newSenderGoldBalance: Number((goldWallet.goldGrams - goldGrams).toFixed(6)),
      newReceiverGoldBalance: Number(receiverGoldWallet.goldGrams.toFixed(6)),
    })
  } catch (error) {
    console.error('Send gift error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال هدیه طلا' },
      { status: 500 }
    )
  }
}
