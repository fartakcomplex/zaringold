import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ═══════════════════════════════════════════════════════════════════════ */
/*  POST /api/checkout/[authority]/pay — Process payment                 */
/* ═══════════════════════════════════════════════════════════════════════ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ authority: string }> }
) {
  try {
    const { authority } = await params
    const body = await request.json()
    const { paymentMethod, userId } = body

    if (!authority || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات ناقص است' },
        { status: 400 }
      )
    }

    if (!['toman', 'gold', 'wallet'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: 'روش پرداخت نامعتبر است' },
        { status: 400 }
      )
    }

    /* ── Find gateway payment ── */
    const payment = await db.gatewayPayment.findUnique({
      where: { authority },
      include: { merchant: true },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    /* ── Validate payment status ── */
    if (payment.status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'این تراکنش قبلاً پرداخت شده است' },
        { status: 400 }
      )
    }

    if (payment.status === 'expired') {
      return NextResponse.json(
        { success: false, message: 'تراکنش منقضی شده است' },
        { status: 400 }
      )
    }

    /* ── Check expiry ── */
    const now = new Date()
    if (payment.expiresAt && now > new Date(payment.expiresAt)) {
      await db.gatewayPayment.update({
        where: { authority },
        data: { status: 'expired' },
      })
      return NextResponse.json(
        { success: false, message: 'زمان پرداخت منقضی شده است' },
        { status: 400 }
      )
    }

    /* ── Get latest gold price ── */
    const latestGoldPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    const goldPrice = latestGoldPrice?.buyPrice || 8_900_000

    /* ════════════════════════════════════════════════════════════════ */
    /*  Payment Method: Toman (ZarinPal Gateway)                         */
    /* ════════════════════════════════════════════════════════════════ */
    if (paymentMethod === 'toman') {
      return await processTomanPayment(payment, goldPrice)
    }

    /* ── User ID is required for gold and wallet payments ── */
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'برای پرداخت با طلا یا کیف پول، ابتدا وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    /* ════════════════════════════════════════════════════════════════ */
    /*  Payment Method: Gold (deduct from GoldWallet)                   */
    /* ════════════════════════════════════════════════════════════════ */
    if (paymentMethod === 'gold') {
      return await processGoldPayment(payment, userId, goldPrice)
    }

    /* ════════════════════════════════════════════════════════════════ */
    /*  Payment Method: Wallet (deduct from fiat Wallet)                */
    /* ════════════════════════════════════════════════════════════════ */
    if (paymentMethod === 'wallet') {
      return await processWalletPayment(payment, userId, goldPrice)
    }

    return NextResponse.json(
      { success: false, message: 'روش پرداخت نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Checkout pay error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در پردازش پرداخت' },
      { status: 500 }
    )
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Process Toman Payment — Create ZarinPal request                     */
/* ═══════════════════════════════════════════════════════════════════════ */
async function processTomanPayment(payment: any, goldPrice: number) {
  const SANDBOX = process.env.ZARINPAL_SANDBOX === 'true'
  const apiURL = SANDBOX
    ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
    : 'https://api.zarinpal.com/pg/v4/payment/request.json'
  const startURLBase = SANDBOX
    ? 'https://sandbox.zarinpal.com/pg/StartPay/'
    : 'https://www.zarinpal.com/pg/StartPay/'
  const merchantId = SANDBOX
    ? 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    : (process.env.ZARINPAL_MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')

  const goldGrams = goldPrice > 0 ? payment.amountToman / goldPrice : 0

  try {
    const zarinpalResponse = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: payment.amountToman,
        description: payment.description || `پرداخت به ${payment.merchant?.businessName || 'فروشگاه'}`,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/checkout/${payment.authority}/pay?method=toman`,
        metadata: {
          authority: payment.authority,
          merchant_name: payment.merchant?.businessName,
        },
      }),
    })

    const zarinpalData = await zarinpalResponse.json()

    if (zarinpalData.data?.code === 100 && zarinpalData.data.authority) {
      /* Update payment with ZarinPal authority (separate from gateway authority) */
      await db.gatewayPayment.update({
        where: { authority: payment.authority },
        data: {
          refId: zarinpalData.data.authority,
          paymentMethod: 'toman',
          goldPriceAtPay: goldPrice,
          goldGrams: Math.round(goldGrams * 1000) / 1000,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'درگاه زرین‌پال آماده است',
        data: {
          paymentURL: `${startURLBase}${zarinpalData.data.authority}`,
          zarinAuthority: zarinpalData.data.authority,
          paymentMethod: 'toman',
        },
      })
    }

    const errorMessages: Record<string, string> = {
      '-1': 'اطلاعات ارسال شده ناقص است',
      '-2': 'IP یا مرچنت کد فعال نیست',
      '-3': 'امکان پرداخت با درگاه بانکی مربوطه وجود ندارد',
      '-11': 'درخواست نامربوط است',
      '-22': 'تراکنش ناموفق است',
      '-33': 'مبلغ تراکنش از سقف بیشتر است',
      '-54': 'درخواست مورد نظر یافت نشد',
    }
    const code = String(zarinpalData.errors?.code || 'unknown')
    return NextResponse.json(
      {
        success: false,
        message: errorMessages[code] || `خطای زرین‌پال: ${code}`,
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('ZarinPal error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اتصال به درگاه پرداخت' },
      { status: 500 }
    )
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Process Gold Payment — Deduct from user's GoldWallet                */
/* ═══════════════════════════════════════════════════════════════════════ */
async function processGoldPayment(payment: any, userId: string, goldPrice: number) {
  /* Calculate gold amount needed */
  const goldGrams = goldPrice > 0 ? payment.amountToman / goldPrice : 0

  if (goldGrams <= 0) {
    return NextResponse.json(
      { success: false, message: 'مبلغ پرداخت نامعتبر است' },
      { status: 400 }
    )
  }

  /* Find user's gold wallet */
  const goldWallet = await db.goldWallet.findUnique({
    where: { userId },
  })

  if (!goldWallet) {
    return NextResponse.json(
      { success: false, message: 'کیف پول طلایی شما یافت نشد. ابتدا کیف پول طلایی بسازید.' },
      { status: 400 }
    )
  }

  const availableGold = goldWallet.goldGrams - goldWallet.frozenGold

  if (availableGold < goldGrams) {
    return NextResponse.json(
      {
        success: false,
        message: `موجودی طلای کافی نیست. موجودی: ${availableGold.toFixed(3)} گرم، مورد نیاز: ${goldGrams.toFixed(3)} گرم`,
        data: {
          availableGold,
          requiredGold: goldGrams,
          deficit: goldGrams - availableGold,
        },
      },
      { status: 400 }
    )
  }

  /* ── Perform the deduction in a sequence ── */
  const updatedAt = new Date()

  /* Deduct from gold wallet */
  await db.goldWallet.update({
    where: { userId },
    data: {
      goldGrams: { decrement: goldGrams },
      updatedAt,
    },
  })

  /* Calculate merchant fee */
  const feeGrams = goldGrams * (payment.merchant?.feeRate || 0.01)

  /* Update gateway payment */
  await db.gatewayPayment.update({
    where: { authority: payment.authority },
    data: {
      status: 'paid',
      paymentMethod: 'gold',
      userId,
      amountGold: payment.amountToman,
      goldGrams: Math.round(goldGrams * 1000) / 1000,
      feeGold: Math.round(feeGrams * 1000) / 1000,
      feeToman: 0,
      goldPriceAtPay: goldPrice,
      paidAt: updatedAt,
      verifiedAt: updatedAt,
    },
  })

  /* Update merchant totals */
  await db.merchant.update({
    where: { id: payment.merchantId },
    data: {
      totalSales: { increment: payment.amountToman },
      totalSalesGold: { increment: goldGrams },
      pendingSettle: { increment: payment.amountToman },
      pendingSettleGold: { increment: goldGrams },
    },
  })

  /* Create transaction record */
  await db.transaction.create({
    data: {
      userId,
      type: 'gateway_payment',
      amountFiat: payment.amountToman,
      amountGold: goldGrams,
      fee: feeGrams,
      goldPrice,
      status: 'success',
      referenceId: `GP-${payment.authority.slice(0, 8)}`,
      description: `پرداخت طلایی به ${payment.merchant?.businessName || 'فروشگاه'} — ${goldGrams.toFixed(3)} گرم`,
    },
  })

  /* Fire webhook to merchant (async, non-blocking) */
  fireMerchantWebhook(payment, {
    status: 'paid',
    paymentMethod: 'gold',
    goldGrams: Math.round(goldGrams * 1000) / 1000,
    amountToman: payment.amountToman,
    feeGold: Math.round(feeGrams * 1000) / 1000,
    paidAt: updatedAt.toISOString(),
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    message: 'پرداخت طلایی با موفقیت انجام شد',
    data: {
      status: 'paid',
      paymentMethod: 'gold',
      goldGrams: Math.round(goldGrams * 1000) / 1000,
      amountToman: payment.amountToman,
      feeGold: Math.round(feeGrams * 1000) / 1000,
      remainingGold: availableGold - goldGrams,
    },
  })
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Process Wallet Payment — Deduct from user's fiat Wallet              */
/* ═══════════════════════════════════════════════════════════════════════ */
async function processWalletPayment(payment: any, userId: string, goldPrice: number) {
  /* Find user's fiat wallet */
  const wallet = await db.wallet.findUnique({
    where: { userId },
  })

  if (!wallet) {
    return NextResponse.json(
      { success: false, message: 'کیف پول شما یافت نشد. ابتدا کیف پول واحد طلایی بسازید.' },
      { status: 400 }
    )
  }

  const availableBalance = wallet.balance - wallet.frozenBalance

  if (availableBalance < payment.amountToman) {
    return NextResponse.json(
      {
        success: false,
        message: `موجودی واحد طلایی کافی نیست. موجودی: ${availableBalance.toLocaleString('fa-IR')} واحد طلایی، مورد نیاز: ${payment.amountToman.toLocaleString('fa-IR')} واحد طلایی`,
        data: {
          availableBalance,
          requiredAmount: payment.amountToman,
          deficit: payment.amountToman - availableBalance,
        },
      },
      { status: 400 }
    )
  }

  /* ── Perform the deduction ── */
  const updatedAt = new Date()
  const goldGrams = goldPrice > 0 ? payment.amountToman / goldPrice : 0
  const feeToman = Math.min(
    payment.amountToman * (payment.merchant?.feeRate || 0.01),
    payment.merchant?.maxFee || 500000
  )

  /* Deduct from fiat wallet */
  await db.wallet.update({
    where: { userId },
    data: {
      balance: { decrement: payment.amountToman },
      updatedAt,
    },
  })

  /* Update gateway payment */
  await db.gatewayPayment.update({
    where: { authority: payment.authority },
    data: {
      status: 'paid',
      paymentMethod: 'wallet',
      userId,
      feeToman,
      feeGold: 0,
      goldGrams: Math.round(goldGrams * 1000) / 1000,
      goldPriceAtPay: goldPrice,
      paidAt: updatedAt,
      verifiedAt: updatedAt,
    },
  })

  /* Update merchant totals */
  await db.merchant.update({
    where: { id: payment.merchantId },
    data: {
      totalSales: { increment: payment.amountToman },
      pendingSettle: { increment: payment.amountToman - feeToman },
    },
  })

  /* Create transaction record */
  await db.transaction.create({
    data: {
      userId,
      type: 'gateway_payment',
      amountFiat: payment.amountToman,
      amountGold: 0,
      fee: feeToman,
      goldPrice,
      status: 'success',
      referenceId: `GP-${payment.authority.slice(0, 8)}`,
      description: `پرداخت از کیف پول به ${payment.merchant?.businessName || 'فروشگاه'} — ${payment.amountToman.toLocaleString('fa-IR')} واحد طلایی`,
    },
  })

  /* Fire webhook to merchant */
  fireMerchantWebhook(payment, {
    status: 'paid',
    paymentMethod: 'wallet',
    amountToman: payment.amountToman,
    feeToman,
    paidAt: updatedAt.toISOString(),
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    message: 'پرداخت از کیف پول با موفقیت انجام شد',
    data: {
      status: 'paid',
      paymentMethod: 'wallet',
      amountToman: payment.amountToman,
      feeToman,
      remainingBalance: availableBalance - payment.amountToman,
    },
  })
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Merchant Webhook (fire and forget)                                   */
/* ═══════════════════════════════════════════════════════════════════════ */
async function fireMerchantWebhook(payment: any, payload: Record<string, any>) {
  const webhookUrl = payment.merchant?.webhookUrl
  if (!webhookUrl) return

  try {
    const webhookPayload = {
      event: 'payment.success',
      data: {
        authority: payment.authority,
        amountToman: payment.amountToman,
        description: payment.description,
        customerName: payment.customerName,
        customerPhone: payment.customerPhone,
        customerEmail: payment.customerEmail,
        ...payload,
      },
      timestamp: new Date().toISOString(),
    }

    /* Create webhook log */
    const log = await db.webhookLog.create({
      data: {
        paymentId: payment.id,
        merchantId: payment.merchantId,
        url: webhookUrl,
        method: 'POST',
        payload: JSON.stringify(webhookPayload),
        statusCode: 0,
        success: false,
      },
    })

    /* Send webhook */
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ZarrinGold-Signature': payment.merchant?.webhookSecret || '',
      },
      body: JSON.stringify(webhookPayload),
    })

    /* Update log */
    await db.webhookLog.update({
      where: { id: log.id },
      data: {
        statusCode: response.status,
        success: response.ok,
        response: await response.text().catch(() => ''),
        attempts: 1,
      },
    })
  } catch (err) {
    console.error('Webhook fire error:', err)
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  GET handler for ZarinPal callback                                     */
/* ═══════════════════════════════════════════════════════════════════════ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ authority: string }> }
) {
  const { authority } = await params
  const { searchParams } = new URL(request.url)
  const zarinStatus = searchParams.get('Status')
  const zarinAuthority = searchParams.get('Authority')

  try {
    const payment = await db.gatewayPayment.findUnique({
      where: { authority },
      include: { merchant: true },
    })

    if (!payment) {
      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''
      return NextResponse.redirect(`${baseURL}/checkout/${authority}?status=error&msg=not_found`)
    }

    if (payment.status === 'paid') {
      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''
      return NextResponse.redirect(`${baseURL}/checkout/${authority}?status=success`)
    }

    if (zarinStatus === 'NOK') {
      await db.gatewayPayment.update({
        where: { authority },
        data: { status: 'expired' },
      })
      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''
      return NextResponse.redirect(`${baseURL}/checkout/${authority}?status=cancelled`)
    }

    /* Verify with ZarinPal */
    const SANDBOX = process.env.ZARINPAL_SANDBOX === 'true'
    const verifyURL = SANDBOX
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
      : 'https://api.zarinpal.com/pg/v4/payment/verify.json'

    const zarinpalResponse = await fetch(verifyURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: process.env.ZARINPAL_MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        amount: payment.amountToman,
        authority: zarinAuthority || payment.refId,
      }),
    })

    const zarinpalData = await zarinpalResponse.json()
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''

    if (
      zarinpalData.data?.code === 100 ||
      zarinpalData.data.code === 101
    ) {
      const now = new Date()
      const goldPrice = zarinpalData.data.goldPriceAtPay || (await db.goldPrice.findFirst({ orderBy: { createdAt: 'desc' } }))?.buyPrice || 8_900_000
      const goldGrams = goldPrice > 0 ? payment.amountToman / goldPrice : 0
      const feeToman = Math.min(
        payment.amountToman * (payment.merchant?.feeRate || 0.01),
        payment.merchant?.maxFee || 500000
      )

      await db.gatewayPayment.update({
        where: { authority },
        data: {
          status: 'paid',
          paymentMethod: 'toman',
          refId: String(zarinpalData.data.ref_id || ''),
          cardPan: zarinpalData.data.card_pan || '',
          feeToman,
          goldPriceAtPay: goldPrice,
          goldGrams: Math.round(goldGrams * 1000) / 1000,
          paidAt: now,
          verifiedAt: now,
        },
      })

      /* Update merchant */
      await db.merchant.update({
        where: { id: payment.merchantId },
        data: {
          totalSales: { increment: payment.amountToman },
          pendingSettle: { increment: payment.amountToman - feeToman },
        },
      })

      /* Fire webhook */
      fireMerchantWebhook(payment, {
        status: 'paid',
        paymentMethod: 'toman',
        amountToman: payment.amountToman,
        feeToman,
        refId: zarinpalData.data.ref_id,
        cardPan: zarinpalData.data.card_pan,
        paidAt: now.toISOString(),
      }).catch(() => {})

      return NextResponse.redirect(`${baseURL}/checkout/${authority}?status=success`)
    }

    /* Failed */
    await db.gatewayPayment.update({
      where: { authority },
      data: { status: 'failed' },
    })

    return NextResponse.redirect(`${baseURL}/checkout/${authority}?status=error`)
  } catch (error) {
    console.error('Checkout callback error:', error)
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''
    return NextResponse.redirect(`${baseURL}/checkout/${authority}?status=error`)
  }
}
