import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Generate a unique transfer reference ID.
 */
function generateTransferRefId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `GPG-TRF-${timestamp}-${random}`
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST /api/v1/wallet/transfer                                              */
/*  Transfer gold or toman between users                                      */
/*  Body: { fromUserId, toUserId, amountGold?, amountToman?, description? }   */
/*  Support: gold transfer, toman transfer                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fromUserId,
      toUserId,
      amountGold,
      amountToman,
      description,
    } = body as {
      fromUserId?: string
      toUserId?: string
      amountGold?: number
      amountToman?: number
      description?: string
    }

    /* ── Validate required fields ── */
    if (!fromUserId || typeof fromUserId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه فرستنده الزامی است',
          error_code: -1,
        },
        { status: 400 }
      )
    }

    if (!toUserId || typeof toUserId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه گیرنده الزامی است',
          error_code: -2,
        },
        { status: 400 }
      )
    }

    // Determine transfer type and validate amount
    const isGoldTransfer = amountGold !== undefined && amountGold !== null && amountGold > 0
    const isTomanTransfer = amountToman !== undefined && amountToman !== null && amountToman > 0

    if (!isGoldTransfer && !isTomanTransfer) {
      return NextResponse.json(
        {
          success: false,
          message: 'مقدار انتقال (طلا یا واحد طلایی) باید بیشتر از صفر باشد',
          error_code: -3,
        },
        { status: 400 }
      )
    }

    if (isGoldTransfer && isTomanTransfer) {
      return NextResponse.json(
        {
          success: false,
          message: 'فقط یک نوع انتقال (طلا یا واحد طلایی) قابل انجام است',
          error_code: -4,
        },
        { status: 400 }
      )
    }

    const transferAmount = isGoldTransfer ? Number(amountGold) : Number(amountToman)
    const transferType = isGoldTransfer ? 'gold' : 'toman'

    // Minimum transfer amounts
    if (isGoldTransfer && transferAmount < 0.001) {
      return NextResponse.json(
        {
          success: false,
          message: 'حداقل مقدار انتقال طلا ۰.۰۰۱ گرم است',
          error_code: -5,
        },
        { status: 400 }
      )
    }

    if (isTomanTransfer && transferAmount < 1000) {
      return NextResponse.json(
        {
          success: false,
          message: 'حداقل مبلغ انتقال واحد طلایی ۱,۰۰۰ واحد طلایی است',
          error_code: -6,
        },
        { status: 400 }
      )
    }

    /* ── Self-transfer prevention ── */
    if (fromUserId === toUserId) {
      return NextResponse.json(
        {
          success: false,
          message: 'انتقال به خود امکان‌پذیر نیست',
          error_code: -7,
        },
        { status: 400 }
      )
    }

    /* ── Verify sender exists and is active ── */
    const sender = await db.user.findUnique({
      where: { id: fromUserId },
      select: { id: true, fullName: true, phone: true, isFrozen: true, isActive: true },
    })

    if (!sender || !sender.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'حساب فرستنده یافت نشد یا غیرفعال است',
          error_code: -8,
        },
        { status: 403 }
      )
    }

    if (sender.isFrozen) {
      return NextResponse.json(
        {
          success: false,
          message: 'حساب فرستنده مسدود شده است',
          error_code: -9,
        },
        { status: 403 }
      )
    }

    /* ── Verify receiver exists and is active ── */
    const receiver = await db.user.findUnique({
      where: { id: toUserId },
      select: { id: true, fullName: true, phone: true, isFrozen: true, isActive: true },
    })

    if (!receiver || !receiver.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'حساب گیرنده یافت نشد یا غیرفعال است',
          error_code: -10,
        },
        { status: 403 }
      )
    }

    if (receiver.isFrozen) {
      return NextResponse.json(
        {
          success: false,
          message: 'حساب گیرنده مسدود شده است',
          error_code: -11,
        },
        { status: 403 }
      )
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  Execute Transfer (with freeze/unfreeze pattern)                        */
    /* ═══════════════════════════════════════════════════════════════════════ */

    const transferRefId = generateTransferRefId()
    const now = new Date()
    const desc = description || `انتقال ${transferType === 'gold' ? 'طلا' : 'واحد طلایی'} بین کاربران`

    if (isGoldTransfer) {
      // ── Gold transfer ──

      // Check sender's gold wallet
      const senderGoldWallet = await db.goldWallet.findUnique({
        where: { userId: fromUserId },
      })

      if (!senderGoldWallet) {
        return NextResponse.json(
          {
            success: false,
            message: 'کیف پول طلای فرستنده یافت نشد',
            error_code: -12,
          },
          { status: 404 }
        )
      }

      const availableGold = senderGoldWallet.goldGrams - senderGoldWallet.frozenGold

      if (availableGold < transferAmount) {
        return NextResponse.json(
          {
            success: false,
            message: `موجودی طلا کافی نیست. قابل استفاده: ${availableGold.toFixed(4)} گرم — مورد نیاز: ${transferAmount.toFixed(4)} گرم`,
            error_code: -13,
            data: {
              available_gold: Math.round(availableGold * 10000) / 10000,
              required_gold: Math.round(transferAmount * 10000) / 10000,
              shortfall: Math.round((transferAmount - availableGold) * 10000) / 10000,
            },
          },
          { status: 400 }
        )
      }

      // Freeze the gold amount on sender's wallet
      await db.goldWallet.update({
        where: { userId: fromUserId },
        data: { frozenGold: { increment: transferAmount } },
      })

      try {
        // Deduct from sender
        await db.goldWallet.update({
          where: { userId: fromUserId },
          data: {
            goldGrams: { decrement: transferAmount },
            frozenGold: { decrement: transferAmount },
          },
        })

        // Add to receiver
        await db.goldWallet.upsert({
          where: { userId: toUserId },
          update: { goldGrams: { increment: transferAmount } },
          create: { userId: toUserId, goldGrams: transferAmount },
        })

        // Get current gold price for reference
        const latestPrice = await db.goldPrice.findFirst({
          orderBy: { createdAt: 'desc' },
        })
        const goldPrice = latestPrice?.buyPrice || 0

        // Create transaction for sender (outflow)
        await db.transaction.create({
          data: {
            userId: fromUserId,
            type: 'transfer_out_gold',
            amountGold: -transferAmount,
            amountFiat: 0,
            fee: 0,
            goldPrice,
            status: 'completed',
            referenceId: transferRefId,
            toUserId,
            description: `${desc} — گیرنده: ${receiver.fullName || receiver.phone}`,
          },
        })

        // Create transaction for receiver (inflow)
        await db.transaction.create({
          data: {
            userId: toUserId,
            type: 'transfer_in_gold',
            amountGold: transferAmount,
            amountFiat: 0,
            fee: 0,
            goldPrice,
            status: 'completed',
            referenceId: transferRefId,
            toUserId: fromUserId,
            description: `${desc} — فرستنده: ${sender.fullName || sender.phone}`,
          },
        })
      } catch (transferError) {
        // Unfreeze on failure
        console.error('[Wallet Transfer] Gold transfer failed, unfreezing:', transferError)
        await db.goldWallet.update({
          where: { userId: fromUserId },
          data: { frozenGold: { decrement: transferAmount } },
        }).catch(() => {})

        return NextResponse.json(
          {
            success: false,
            message: 'خطا در انجام انتقال. مبلغ آزاد شد',
            error_code: -98,
          },
          { status: 500 }
        )
      }
    } else {
      // ── Toman transfer ──

      // Check sender's fiat wallet
      const senderWallet = await db.wallet.findUnique({
        where: { userId: fromUserId },
      })

      if (!senderWallet) {
        return NextResponse.json(
          {
            success: false,
            message: 'کیف پول واحد طلاییی فرستنده یافت نشد',
            error_code: -14,
          },
          { status: 404 }
        )
      }

      const availableToman = senderWallet.balance - senderWallet.frozenBalance

      if (availableToman < transferAmount) {
        return NextResponse.json(
          {
            success: false,
            message: `موجودی واحد طلایی کافی نیست. قابل استفاده: ${Math.round(availableToman).toLocaleString('fa-IR')} واحد طلایی — مورد نیاز: ${Math.round(transferAmount).toLocaleString('fa-IR')} واحد طلایی`,
            error_code: -15,
            data: {
              available_toman: Math.round(availableToman),
              required_toman: Math.round(transferAmount),
              shortfall: Math.round(transferAmount - availableToman),
            },
          },
          { status: 400 }
        )
      }

      // Freeze the toman amount on sender's wallet
      await db.wallet.update({
        where: { userId: fromUserId },
        data: { frozenBalance: { increment: transferAmount } },
      })

      try {
        // Deduct from sender
        await db.wallet.update({
          where: { userId: fromUserId },
          data: {
            balance: { decrement: transferAmount },
            frozenBalance: { decrement: transferAmount },
          },
        })

        // Add to receiver
        await db.wallet.upsert({
          where: { userId: toUserId },
          update: { balance: { increment: transferAmount } },
          create: { userId: toUserId, balance: transferAmount },
        })

        // Create transaction for sender (outflow)
        await db.transaction.create({
          data: {
            userId: fromUserId,
            type: 'transfer_out_toman',
            amountFiat: -transferAmount,
            amountGold: 0,
            fee: 0,
            status: 'completed',
            referenceId: transferRefId,
            toUserId,
            description: `${desc} — گیرنده: ${receiver.fullName || receiver.phone}`,
          },
        })

        // Create transaction for receiver (inflow)
        await db.transaction.create({
          data: {
            userId: toUserId,
            type: 'transfer_in_toman',
            amountFiat: transferAmount,
            amountGold: 0,
            fee: 0,
            status: 'completed',
            referenceId: transferRefId,
            toUserId: fromUserId,
            description: `${desc} — فرستنده: ${sender.fullName || sender.phone}`,
          },
        })
      } catch (transferError) {
        // Unfreeze on failure
        console.error('[Wallet Transfer] Toman transfer failed, unfreezing:', transferError)
        await db.wallet.update({
          where: { userId: fromUserId },
          data: { frozenBalance: { decrement: transferAmount } },
        }).catch(() => {})

        return NextResponse.json(
          {
            success: false,
            message: 'خطا در انجام انتقال. مبلغ آزاد شد',
            error_code: -97,
          },
          { status: 500 }
        )
      }
    }

    /* ── Fetch updated balances for the response ── */
    const senderGoldWallet = isGoldTransfer
      ? await db.goldWallet.findUnique({ where: { userId: fromUserId } })
      : null
    const senderWallet = isTomanTransfer
      ? await db.wallet.findUnique({ where: { userId: fromUserId } })
      : null

    const formattedAmount =
      transferType === 'gold'
        ? `${transferAmount.toFixed(4)} گرم طلا`
        : `${Math.round(transferAmount).toLocaleString('fa-IR')} واحد طلایی`

    return NextResponse.json({
      success: true,
      message: `${formattedAmount} با موفقیت منتقل شد`,
      data: {
        reference_id: transferRefId,
        transfer_type: transferType,
        amount: transferType === 'gold'
          ? Math.round(transferAmount * 10000) / 10000
          : Math.round(transferAmount),
        from_user: {
          id: fromUserId,
          name: sender.fullName || sender.phone,
        },
        to_user: {
          id: toUserId,
          name: receiver.fullName || receiver.phone,
        },
        description: desc,
        created_at: now.toISOString(),
        sender_new_balance: transferType === 'gold'
          ? Math.round((senderGoldWallet?.goldGrams ?? 0) * 10000) / 10000
          : Math.round(senderWallet?.balance ?? 0),
      },
    })
  } catch (error) {
    console.error('[Wallet Transfer] POST error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطای داخلی سرور در انتقال وجه',
        error_code: -99,
      },
      { status: 500 }
    )
  }
}
