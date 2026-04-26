import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Supported top-up methods */
const VALID_METHODS = ['zarinpal', 'gold_to_toman', 'admin'] as const
type TopUpMethod = (typeof VALID_METHODS)[number]

/**
 * Generate a unique top-up reference ID.
 */
function generateTopUpRefId(method: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `GPG-TP-${method.toUpperCase().slice(0, 3)}-${timestamp}-${random}`
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST /api/v1/wallet/topup                                                 */
/*  Top-up toman wallet via various methods                                   */
/*  Body: { userId, amount, method, goldGrams? }                              */
/*  method: 'zarinpal' | 'gold_to_toman' | 'admin'                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      amount,
      method,
      goldGrams,
    } = body as {
      userId?: string
      amount?: number
      method?: string
      goldGrams?: number
    }

    /* ── Validate required fields ── */
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه کاربر الزامی است',
          error_code: -1,
        },
        { status: 400 }
      )
    }

    if (!method || typeof method !== 'string' || !VALID_METHODS.includes(method as TopUpMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: `روش شارژ نامعتبر است. روش‌های مجاز: ${VALID_METHODS.join(', ')}`,
          error_code: -2,
        },
        { status: 400 }
      )
    }

    const topUpMethod = method as TopUpMethod

    /* ── Verify user exists and is active ── */
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, phone: true, isFrozen: true, isActive: true, role: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'کاربر یافت نشد یا حساب غیرفعال است',
          error_code: -3,
        },
        { status: 403 }
      )
    }

    if (user.isFrozen) {
      return NextResponse.json(
        {
          success: false,
          message: 'حساب کاربری مسدود شده است',
          error_code: -4,
        },
        { status: 403 }
      )
    }

    const now = new Date()

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  Method 1: Zarinpal (Simulated)                                        */
    /* ═══════════════════════════════════════════════════════════════════════ */

    if (topUpMethod === 'zarinpal') {
      if (!amount || Number(amount) < 10000) {
        return NextResponse.json(
          {
            success: false,
            message: 'حداقل مبلغ شارژ ۱۰,۰۰۰ واحد طلایی است',
            error_code: -5,
          },
          { status: 400 }
        )
      }

      const topUpAmount = Number(amount)

      // In production this would create a Zarinpal payment session
      // Here we simulate the payment gateway flow:
      // 1. Create a Payment record in pending state
      // 2. Return authority for redirect (simulated as auto-completed)

      const authority = crypto.randomBytes(16).toString('hex')
      const refId = generateTopUpRefId('zarinpal')

      // Create the Payment record
      const payment = await db.payment.create({
        data: {
          userId,
          authority,
          amount: topUpAmount,
          description: 'شارژ کیف پول — زرین‌پال',
          status: 'paid', // Simulated as instantly paid
          provider: 'zarinpal',
          refId,
          fee: 0,
          paidAt: now,
          verifiedAt: now,
        },
      })

      // Credit the toman wallet
      const wallet = await db.wallet.upsert({
        where: { userId },
        update: { balance: { increment: topUpAmount } },
        create: { userId, balance: topUpAmount },
      })

      // Create transaction record
      await db.transaction.create({
        data: {
          userId,
          type: 'topup_zarinpal',
          amountFiat: topUpAmount,
          amountGold: 0,
          fee: 0,
          status: 'completed',
          referenceId: refId,
          description: 'شارژ کیف پول از طریق زرین‌پال',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'شارژ کیف پول با موفقیت انجام شد',
        data: {
          payment_id: payment.id,
          authority: payment.authority,
          ref_id: refId,
          amount: topUpAmount,
          method: 'zarinpal',
          status: 'completed',
          new_balance: Math.round(wallet.balance),
          paid_at: now.toISOString(),
        },
      })
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  Method 2: Gold to Toman (Convert gold → toman)                        */
    /* ═══════════════════════════════════════════════════════════════════════ */

    if (topUpMethod === 'gold_to_toman') {
      if (!goldGrams || Number(goldGrams) <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'مقدار طلا برای تبدیل الزامی است',
            error_code: -6,
          },
          { status: 400 }
        )
      }

      const gramsToConvert = Number(goldGrams)

      if (gramsToConvert < 0.001) {
        return NextResponse.json(
          {
            success: false,
            message: 'حداقل مقدار تبدیل ۰.۰۰۱ گرم طلا است',
            error_code: -7,
          },
          { status: 400 }
        )
      }

      // Check user's gold wallet balance
      const goldWallet = await db.goldWallet.findUnique({
        where: { userId },
      })

      if (!goldWallet) {
        return NextResponse.json(
          {
            success: false,
            message: 'کیف پول طلای کاربر یافت نشد',
            error_code: -8,
          },
          { status: 404 }
        )
      }

      const availableGold = goldWallet.goldGrams - goldWallet.frozenGold

      if (availableGold < gramsToConvert) {
        return NextResponse.json(
          {
            success: false,
            message: `موجودی طلا کافی نیست. قابل استفاده: ${availableGold.toFixed(4)} گرم — مورد نیاز: ${gramsToConvert.toFixed(4)} گرم`,
            error_code: -9,
            data: {
              available_gold: Math.round(availableGold * 10000) / 10000,
              required_gold: Math.round(gramsToConvert * 10000) / 10000,
            },
          },
          { status: 400 }
        )
      }

      // Get current gold price (use sell price for conversion)
      const latestPrice = await db.goldPrice.findFirst({
        orderBy: { createdAt: 'desc' },
      })

      if (!latestPrice) {
        return NextResponse.json(
          {
            success: false,
            message: 'قیمت طلا در حال حاضر در دسترس نیست',
            error_code: -10,
          },
          { status: 503 }
        )
      }

      const sellPrice = latestPrice.sellPrice // Sell price: what platform pays for gold
      const tomanAmount = gramsToConvert * sellPrice
      const feeRate = 0.005 // 0.5% conversion fee
      const fee = tomanAmount * feeRate
      const netToman = tomanAmount - fee

      if (netToman <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'مقدار طلا برای تبدیل کافی نیست',
            error_code: -11,
          },
          { status: 400 }
        )
      }

      // Freeze gold during conversion
      await db.goldWallet.update({
        where: { userId },
        data: { frozenGold: { increment: gramsToConvert } },
      })

      try {
        // Deduct gold from wallet
        await db.goldWallet.update({
          where: { userId },
          data: {
            goldGrams: { decrement: gramsToConvert },
            frozenGold: { decrement: gramsToConvert },
          },
        })

        // Credit toman wallet
        const tomanWallet = await db.wallet.upsert({
          where: { userId },
          update: { balance: { increment: netToman } },
          create: { userId, balance: netToman },
        })

        // Create transaction record (gold outflow)
        const refId = generateTopUpRefId('g2t')
        await db.transaction.create({
          data: {
            userId,
            type: 'topup_gold_to_toman',
            amountFiat: netToman,
            amountGold: -gramsToConvert,
            fee,
            goldPrice: sellPrice,
            status: 'completed',
            referenceId: refId,
            description: `تبدیل ${gramsToConvert.toFixed(4)} گرم طلا به ${Math.round(netToman).toLocaleString('fa-IR')} واحد طلایی`,
          },
        })

        const updatedGoldWallet = await db.goldWallet.findUnique({
          where: { userId },
        })

        return NextResponse.json({
          success: true,
          message: `${gramsToConvert.toFixed(4)} گرم طلا با موفقیت به ${Math.round(netToman).toLocaleString('fa-IR')} واحد طلایی تبدیل شد`,
          data: {
            reference_id: refId,
            method: 'gold_to_toman',
            gold_converted: Math.round(gramsToConvert * 10000) / 10000,
            gold_price: sellPrice,
            gross_toman: Math.round(tomanAmount),
            fee: Math.round(fee),
            fee_rate: feeRate * 100,
            net_toman: Math.round(netToman),
            new_toman_balance: Math.round(tomanWallet.balance),
            new_gold_balance: Math.round((updatedGoldWallet?.goldGrams ?? 0) * 10000) / 10000,
            converted_at: now.toISOString(),
          },
        })
      } catch (convertError) {
        // Unfreeze on failure
        console.error('[TopUp] Gold-to-toman conversion failed, unfreezing:', convertError)
        await db.goldWallet.update({
          where: { userId },
          data: { frozenGold: { decrement: gramsToConvert } },
        }).catch(() => {})

        return NextResponse.json(
          {
            success: false,
            message: 'خطا در تبدیل طلا به واحد طلایی. موجودی آزاد شد',
            error_code: -97,
          },
          { status: 500 }
        )
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  Method 3: Admin Top-up (Direct credit by admin)                       */
    /* ═══════════════════════════════════════════════════════════════════════ */

    if (topUpMethod === 'admin') {
      // Admin-only: check user role
      if (user.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            message: 'فقط مدیر سیستم امکان شارژ مستقیم را دارد',
            error_code: -12,
          },
          { status: 403 }
        )
      }

      if (!amount || Number(amount) < 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'مبلغ شارژ باید بزرگتر از صفر باشد',
            error_code: -13,
          },
          { status: 400 }
        )
      }

      const adminTopUpAmount = Number(amount)
      const refId = generateTopUpRefId('adm')

      // Credit the wallet
      const wallet = await db.wallet.upsert({
        where: { userId },
        update: { balance: { increment: adminTopUpAmount } },
        create: { userId, balance: adminTopUpAmount },
      })

      // Create transaction record
      await db.transaction.create({
        data: {
          userId,
          type: 'topup_admin',
          amountFiat: adminTopUpAmount,
          amountGold: 0,
          fee: 0,
          status: 'completed',
          referenceId: refId,
          description: 'شارژ مستقیم توسط مدیر سیستم',
        },
      })

      // Log audit event
      await db.auditLog.create({
        data: {
          userId,
          action: 'admin_wallet_topup',
          details: JSON.stringify({
            amount: adminTopUpAmount,
            reference_id: refId,
          }),
        },
      })

      return NextResponse.json({
        success: true,
        message: `شارژ ${Math.round(adminTopUpAmount).toLocaleString('fa-IR')} واحد طلایی توسط مدیر انجام شد`,
        data: {
          reference_id: refId,
          method: 'admin',
          amount: Math.round(adminTopUpAmount),
          new_balance: Math.round(wallet.balance),
          topped_up_at: now.toISOString(),
        },
      })
    }

    // Should never reach here due to type narrowing above
    return NextResponse.json(
      {
        success: false,
        message: 'روش شارژ نامشخص',
        error_code: -99,
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Wallet TopUp] POST error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطای داخلی سرور در شارژ کیف پول',
        error_code: -99,
      },
      { status: 500 }
    )
  }
}
