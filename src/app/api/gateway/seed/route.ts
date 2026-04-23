import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Seed Gold Payment Gateway — Test Data                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TEST_PHONE = '09120000001'
const TEST_PASSWORD_PLAIN = 'SeedTest@123'
const TEST_BUSINESS_NAME = 'فروشگاه تست طلایی'
const GOLD_WALLET_GRAMS = 50
const TEST_GOLD_GRAMS = 0.5
const GOLD_BUY_PRICE = 89000000
const GOLD_SELL_PRICE = 88500000
const GOLD_MARKET_PRICE = 88750000
const EXPIRY_SECONDS = 30 * 60 // 30 minutes

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Generate a random referral code (8 chars) */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[crypto.randomInt(chars.length)]
  }
  return code
}

/** Generate API key: gp_live_ + 32 hex chars */
function generateApiKey(): string {
  return `gp_live_${crypto.randomBytes(16).toString('hex')}`
}

/** Generate authority: 32 hex chars */
function generateAuthority(): string {
  return crypto.randomBytes(16).toString('hex')
}

/** Simple password hash (SHA-256) — test data only */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST Handler                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /api/gateway/seed
 *
 * Creates all data needed to test the gold payment gateway:
 *  - Test user (phone: 09120000001)
 *  - GoldWallet with 50 grams
 *  - Merchant (settlementType: gold)
 *  - ApiKey (returns full key)
 *  - GoldPrice record
 *  - Test GatewayPayment (0.5g gold, status: pending)
 *
 * Returns everything including cURL example.
 */
export async function POST() {
  try {
    /* ════════════════════════════════════════════════════════════════════════ */
    /*  1. Create / find test user                                              */
    /* ════════════════════════════════════════════════════════════════════════ */

    const existingUser = await db.user.findUnique({
      where: { phone: TEST_PHONE },
    })

    let user
    if (existingUser) {
      user = existingUser
    } else {
      const referralCode = generateReferralCode()
      user = await db.user.create({
        data: {
          phone: TEST_PHONE,
          password: hashPassword(TEST_PASSWORD_PLAIN),
          role: 'user',
          isVerified: true,
          isActive: true,
          fullName: 'کاربر تست درگاه طلایی',
          referralCode,
        },
      })
    }

    /* ════════════════════════════════════════════════════════════════════════ */
    /*  2. Create / find GoldWallet with 50 grams                               */
    /* ════════════════════════════════════════════════════════════════════════ */

    const existingWallet = await db.goldWallet.findUnique({
      where: { userId: user.id },
    })

    let goldWallet
    if (existingWallet) {
      goldWallet = existingWallet
    } else {
      goldWallet = await db.goldWallet.create({
        data: {
          userId: user.id,
          goldGrams: GOLD_WALLET_GRAMS,
        },
      })
    }

    /* ════════════════════════════════════════════════════════════════════════ */
    /*  3. Create / find Merchant                                               */
    /* ════════════════════════════════════════════════════════════════════════ */

    const existingMerchant = await db.merchant.findUnique({
      where: { userId: user.id },
    })

    let merchant
    if (existingMerchant) {
      merchant = existingMerchant
    } else {
      merchant = await db.merchant.create({
        data: {
          userId: user.id,
          businessName: TEST_BUSINESS_NAME,
          settlementType: 'gold',
          isActive: true,
          isVerified: true,
          kycStatus: 'approved',
          feeRate: 0.01,
          brandingColor: '#D4AF37',
        },
      })
    }

    /* ════════════════════════════════════════════════════════════════════════ */
    /*  4. Create ApiKey for merchant                                           */
    /* ════════════════════════════════════════════════════════════════════════ */

    const fullApiKey = generateApiKey()
    const apiKeyHash = crypto.createHash('sha256').update(fullApiKey).digest('hex')
    const apiKeyPrefix = fullApiKey.slice(0, 13) // "gp_live_" + 4 chars

    const apiKeyRecord = await db.apiKey.create({
      data: {
        merchantId: merchant.id,
        keyHash: apiKeyHash,
        keyPrefix: apiKeyPrefix,
        keyType: 'live',
        name: 'Test Seed Key',
        isActive: true,
      },
    })

    /* ════════════════════════════════════════════════════════════════════════ */
    /*  5. Seed gold price if not exists                                        */
    /* ════════════════════════════════════════════════════════════════════════ */

    const existingPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    let goldPrice
    if (existingPrice) {
      goldPrice = existingPrice
    } else {
      goldPrice = await db.goldPrice.create({
        data: {
          buyPrice: GOLD_BUY_PRICE,
          sellPrice: GOLD_SELL_PRICE,
          marketPrice: GOLD_MARKET_PRICE,
          ouncePrice: GOLD_MARKET_PRICE * 31.1035,
          spread: GOLD_BUY_PRICE - GOLD_SELL_PRICE,
          currency: 'IRR',
        },
      })
    }

    /* ════════════════════════════════════════════════════════════════════════ */
    /*  6. Create test GatewayPayment                                           */
    /* ════════════════════════════════════════════════════════════════════════ */

    const authority = generateAuthority()
    const expiresAt = new Date(Date.now() + EXPIRY_SECONDS * 1000)

    const gatewayPayment = await db.gatewayPayment.create({
      data: {
        authority,
        merchantId: merchant.id,
        userId: user.id,
        amountToman: 0, // legacy field, ignored
        amountGold: TEST_GOLD_GRAMS,
        goldGrams: TEST_GOLD_GRAMS,
        feeToman: 0,
        feeGold: TEST_GOLD_GRAMS * merchant.feeRate,
        paymentMethod: 'gold',
        status: 'pending',
        description: 'تراکنش تست درگاه طلایی',
        customerPhone: TEST_PHONE,
        customerName: 'کاربر تست',
        goldPriceAtPay: goldPrice.buyPrice,
        metadata: JSON.stringify({ isSeedTest: true }),
        expiresAt,
      },
    })

    const checkoutUrl = `/checkout/${authority}`

    /* ════════════════════════════════════════════════════════════════════════ */
    /*  7. Build cURL example                                                   */
    /* ════════════════════════════════════════════════════════════════════════ */

    const curlExample = [
      `curl -X POST /api/v1/payment/request \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -d '{`,
      `    "merchant_key": "${fullApiKey}",`,
      `    "amount": 0.5,`,
      `    "currency": "gold",`,
      `    "payment_method": "gold"`,
      `  }'`,
    ].join('\n')

    /* ════════════════════════════════════════════════════════════════════════ */
    /*  8. Return comprehensive response                                        */
    /* ════════════════════════════════════════════════════════════════════════ */

    return NextResponse.json({
      success: true,
      message: 'درگاه طلایی با موفقیت ایجاد شد',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          isVerified: user.isVerified,
        },
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          settlementType: merchant.settlementType,
          isActive: merchant.isActive,
          isVerified: merchant.isVerified,
        },
        apiKey: fullApiKey,
        apiKeyPrefix,
        goldPrice: {
          buyPrice: goldPrice.buyPrice,
          sellPrice: goldPrice.sellPrice,
          marketPrice: goldPrice.marketPrice,
        },
        goldWallet: {
          goldGrams: goldWallet.goldGrams,
        },
        testPayment: {
          authority: gatewayPayment.authority,
          goldGrams: gatewayPayment.goldGrams,
          amountGold: gatewayPayment.amountGold,
          feeGold: gatewayPayment.feeGold,
          paymentMethod: gatewayPayment.paymentMethod,
          status: gatewayPayment.status,
          checkoutUrl,
          expiresIn: EXPIRY_SECONDS,
          expiresAt: gatewayPayment.expiresAt.toISOString(),
        },
        curlExample,
      },
    })
  } catch (error) {
    console.error('[Gateway Seed] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در ایجاد داده‌های تست درگاه طلایی',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
