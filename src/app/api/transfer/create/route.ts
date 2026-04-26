import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

/**
 * POST /api/transfer/create
 * انتقال طلا کارت‌به‌کارت (بر اساس شماره کارت طلایی)
 *
 * Body:
 *   recipientCard   — شماره کارت طلایی گیرنده (۱۶ رقم، الزامی)
 *   amountGrams     — مقدار طلا به گرم (الزامی)
 *   otpCode         — کد تأیید ۴ رقمی پیامک شده (الزامی)
 *   note            — توضیحات اختیاری
 */
export async function POST(request: NextRequest) {
  try {
    // ── احراز هویت فرستنده ──
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    if (!token) {
      return NextResponse.json({ success: false, message: 'توکن ارسال نشده' }, { status: 401 })
    }

    const session = await db.userSession.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: {
        user: {
          select: { id: true, role: true, fullName: true, phone: true, isActive: true, isFrozen: true },
        },
      },
    })

    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 })
    }
    if (!session.user.isActive) {
      return NextResponse.json({ success: false, message: 'حساب کاربری شما غیرفعال شده است' }, { status: 403 })
    }
    if (session.user.isFrozen) {
      return NextResponse.json({ success: false, message: 'حساب کاربری شما مسدود شده است' }, { status: 403 })
    }

    const senderId = session.userId
    const body = await request.json()
    const { recipientCard: rawCard, amountGrams, otpCode, note = '' } = body

    // ── اعتبارسنجی کد تأیید OTP ──
    if (!otpCode || typeof otpCode !== 'string' || !/^\d{4}$/.test(otpCode)) {
      return NextResponse.json({ success: false, message: 'کد تأیید ۴ رقمی الزامی است' }, { status: 400 })
    }

    const otpRecord = await db.oTPCode.findFirst({
      where: {
        userId: senderId,
        purpose: 'gold_transfer',
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) {
      return NextResponse.json({ success: false, message: 'کد تأیید یافت نشد یا منقضی شده. لطفاً کد جدید درخواست کنید.' }, { status: 400 })
    }

    // بررسی تعداد تلاش‌ها
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await db.oTPCode.update({ where: { id: otpRecord.id }, data: { verified: true } })
      return NextResponse.json({ success: false, message: 'تعداد تلاش‌های مجاز تمام شده. لطفاً کد جدید درخواست کنید.' }, { status: 400 })
    }

    // بررسی صحت کد
    if (otpRecord.code !== otpCode) {
      await db.oTPCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      })
      const remaining = otpRecord.maxAttempts - otpRecord.attempts - 1
      return NextResponse.json(
        { success: false, message: `کد تأیید نادرست است. ${remaining} تلاش دیگر باقی‌مانده.`, remaining },
        { status: 400 }
      )
    }

    // ✅ کد صحیح — علامت‌گذاری به عنوان تأیید شده
    await db.oTPCode.update({ where: { id: otpRecord.id }, data: { verified: true } })

    // ── اعتبارسنجی شماره کارت مقصد ──
    if (!rawCard || typeof rawCard !== 'string') {
      return NextResponse.json({ success: false, message: 'شماره کارت مقصد الزامی است' }, { status: 400 })
    }
    const cardNumber = rawCard.replace(/[\s\-]/g, '')
    if (!/^\d{16}$/.test(cardNumber)) {
      return NextResponse.json({ success: false, message: 'شماره کارت باید ۱۶ رقم باشد' }, { status: 400 })
    }

    // ── بررسی کارت فرستنده ──
    const senderCard = await db.goldCard.findFirst({
      where: { userId: senderId, status: 'active' },
    })
    if (!senderCard) {
      return NextResponse.json({ success: false, message: 'شما کارت طلایی فعال ندارید. ابتدا کارت خود را صادر کنید.' }, { status: 400 })
    }

    // ── یافتن کارت گیرنده ──
    const recipientGoldCard = await db.goldCard.findFirst({
      where: { cardNumber, status: 'active' },
      include: {
        user: { select: { id: true, fullName: true, phone: true, avatar: true, referralCode: true, isActive: true, isFrozen: true } },
      },
    })

    if (!recipientGoldCard) {
      return NextResponse.json({ success: false, message: 'کارت مقصد یافت نشد یا غیرفعال است' }, { status: 404 })
    }
    if (!recipientGoldCard.user.isActive || recipientGoldCard.user.isFrozen) {
      return NextResponse.json({ success: false, message: 'حساب صاحب کارت مقصد فعال نیست' }, { status: 400 })
    }
    if (recipientGoldCard.userId === senderId) {
      return NextResponse.json({ success: false, message: 'امکان انتقال به کارت خود وجود ندارد' }, { status: 400 })
    }

    const recipient = recipientGoldCard.user

    // ── اعتبارسنجی مبلغ ──
    if (!amountGrams || typeof amountGrams !== 'number' || amountGrams <= 0) {
      return NextResponse.json({ success: false, message: 'مقدار طلا باید بزرگتر از صفر باشد' }, { status: 400 })
    }
    if (amountGrams < 0.001) {
      return NextResponse.json({ success: false, message: 'حداقل مقدار انتقال ۰.۰۰۱ گرم طلا است' }, { status: 400 })
    }
    if (amountGrams > 1000) {
      return NextResponse.json({ success: false, message: 'حداکثر مقدار انتقال ۱,۰۰۰ گرم طلا است' }, { status: 400 })
    }

    // ── بررسی موجودی طلای فرستنده ──
    const senderGoldWallet = await db.goldWallet.findUnique({ where: { userId: senderId } })
    const availableGold = senderGoldWallet ? senderGoldWallet.goldGrams - senderGoldWallet.frozenGold : 0

    if (availableGold < amountGrams) {
      return NextResponse.json(
        { success: false, message: 'موجودی طلای کافی نیست', details: { available: Math.round(availableGold * 10000) / 10000, requested: amountGrams } },
        { status: 400 }
      )
    }

    // ── محاسبه کارمزد ──
    const feeRate = 0.005
    let feeGrams = amountGrams * feeRate
    if (feeGrams > 0.01) feeGrams = 0.01
    if (feeGrams < 0.0001) feeGrams = 0
    const netAmount = amountGrams + feeGrams

    if (availableGold < netAmount) {
      return NextResponse.json(
        { success: false, message: 'موجودی طلای کافی نیست (با احتساب کارمزد)', details: { available: Math.round(availableGold * 10000) / 10000, requested: amountGrams, fee: Math.round(feeGrams * 10000) / 10000, total: Math.round(netAmount * 10000) / 10000 } },
        { status: 400 }
      )
    }

    // ── دریافت قیمت طلای فعلی ──
    let currentGoldPrice = 0
    try {
      const priceRecord = await db.goldPrice.findFirst({ orderBy: { createdAt: 'desc' } })
      if (priceRecord) currentGoldPrice = priceRecord.buyPrice || priceRecord.sellPrice || 0
    } catch { /* ignored */ }

    // ── پردازش انتقال ──
    const transferRef = `TRF-${crypto.randomBytes(6).toString('hex').toUpperCase()}`
    const senderRefId = `${transferRef}-OUT`
    const recipientRefId = `${transferRef}-IN`
    const now = new Date()

    const result = await db.$transaction(async (tx) => {
      const updatedSenderWallet = await tx.goldWallet.upsert({
        where: { userId: senderId },
        update: { goldGrams: { decrement: netAmount } },
        create: { userId: senderId, goldGrams: -netAmount },
      })

      const updatedRecipientWallet = await tx.goldWallet.upsert({
        where: { userId: recipient.id },
        update: { goldGrams: { increment: amountGrams } },
        create: { userId: recipient.id, goldGrams: amountGrams },
      })

      await tx.transaction.create({
        data: {
          userId: senderId,
          type: 'gold_transfer_out',
          amountFiat: currentGoldPrice ? Math.round(amountGrams * currentGoldPrice) : 0,
          amountGold: -netAmount,
          fee: feeGrams,
          goldPrice: currentGoldPrice || null,
          status: 'completed',
          referenceId: senderRefId,
          description: `انتقال طلا (کارت‌به‌کارت) به ${recipient.fullName || recipient.phone} — ${amountGrams} گرم`,
          toUserId: recipient.id,
        },
      })

      await tx.transaction.create({
        data: {
          userId: recipient.id,
          type: 'gold_transfer_in',
          amountFiat: currentGoldPrice ? Math.round(amountGrams * currentGoldPrice) : 0,
          amountGold: amountGrams,
          fee: 0,
          goldPrice: currentGoldPrice || null,
          status: 'completed',
          referenceId: recipientRefId,
          description: `دریافت طلا (کارت‌به‌کارت) از ${session.user.fullName || session.user.phone} — ${amountGrams} گرم${note ? ` (${note})` : ''}`,
          toUserId: senderId,
        },
      })

      await tx.notification.create({
        data: {
          userId: senderId,
          title: 'انتقال طلا موفق',
          body: `${amountGrams} گرم طلا با موفقیت به کارت ${recipient.fullName || recipient.phone} منتقل شد. کد پیگیری: ${transferRef}`,
          type: 'transfer',
        },
      })

      await tx.notification.create({
        data: {
          userId: recipient.id,
          title: 'دریافت طلا',
          body: `${amountGrams} گرم طلا از کارت ${session.user.fullName || session.user.phone} دریافت کردید. کد پیگیری: ${transferRef}`,
          type: 'transfer',
        },
      })

      return { senderWallet: updatedSenderWallet, recipientWallet: updatedRecipientWallet }
    })

    const maskedRecipientCard = `${cardNumber.slice(0, 4)}-****-****-${cardNumber.slice(-4)}`

    return NextResponse.json({
      success: true,
      message: `انتقال ${amountGrams} گرم طلا با موفقیت انجام شد`,
      data: {
        transferRef,
        amountGrams,
        feeGrams: Math.round(feeGrams * 10000) / 10000,
        senderBalance: Math.round(result.senderWallet.goldGrams * 10000) / 10000,
        senderCard: {
          maskedNumber: `${senderCard.cardNumber.slice(0, 4)}-****-****-${senderCard.cardNumber.slice(-4)}`,
        },
        recipient: {
          id: recipient.id,
          fullName: recipient.fullName || 'کاربر',
          phone: recipient.phone,
          maskedPhone: recipient.phone ? `****${recipient.phone.slice(-4)}` : '',
          avatar: recipient.avatar,
          referralCode: recipient.referralCode,
          maskedCard: maskedRecipientCard,
          designTheme: recipientGoldCard.designTheme,
        },
        goldPrice: currentGoldPrice,
        fiatEquivalent: currentGoldPrice ? Math.round(amountGrams * currentGoldPrice) : 0,
        createdAt: now.toISOString(),
      },
    })
  } catch (error) {
    console.error('Gold transfer error:', error)
    return NextResponse.json({ success: false, message: 'خطای داخلی سرور. لطفاً دوباره تلاش کنید' }, { status: 500 })
  }
}

/**
 * GET /api/transfer/preview?q=XXXX
 * پیش‌نمایش اطلاعات صاحب کارت بر اساس شماره کارت
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    if (!token) {
      return NextResponse.json({ success: false, message: 'توکن ارسال نشده' }, { status: 401 })
    }

    const session = await db.userSession.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      select: { userId: true },
    })

    if (!session) {
      return NextResponse.json({ success: false, message: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const rawQuery = searchParams.get('q') || ''
    const cardNumber = rawQuery.replace(/[\s\-]/g, '')

    if (cardNumber.length < 16) {
      return NextResponse.json({ success: false, message: cardNumber.length === 0 ? '' : 'شماره کارت باید ۱۶ رقم باشد' }, { status: 400 })
    }

    // جستجو با شماره کارت
    const goldCard = await db.goldCard.findFirst({
      where: { cardNumber, status: 'active' },
      include: {
        user: { select: { id: true, fullName: true, phone: true, avatar: true, referralCode: true, role: true, isActive: true, isFrozen: true } },
      },
    })

    if (!goldCard || !goldCard.user) {
      return NextResponse.json({ success: false, message: 'کارت مقصد یافت نشد' }, { status: 404 })
    }
    if (!goldCard.user.isActive || goldCard.user.isFrozen) {
      return NextResponse.json({ success: false, message: 'حساب صاحب کارت غیرفعال است' }, { status: 400 })
    }
    if (goldCard.userId === session.userId) {
      return NextResponse.json({ success: false, message: 'این کارت متعلق به شماست' }, { status: 400 })
    }

    const maskedCard = `${cardNumber.slice(0, 4)}-****-****-${cardNumber.slice(-4)}`

    return NextResponse.json({
      success: true,
      data: {
        id: goldCard.user.id,
        fullName: goldCard.user.fullName || 'کاربر',
        phone: goldCard.user.phone,
        maskedPhone: goldCard.user.phone ? `****${goldCard.user.phone.slice(-4)}` : '',
        avatar: goldCard.user.avatar,
        referralCode: goldCard.user.referralCode,
        role: goldCard.user.role,
        isVerified: true,
        maskedCard,
        designTheme: goldCard.designTheme,
        cardType: goldCard.cardType,
        status: goldCard.status,
      },
    })
  } catch (error) {
    console.error('Transfer preview error:', error)
    return NextResponse.json({ success: false, message: 'خطای داخلی سرور' }, { status: 500 })
  }
}
