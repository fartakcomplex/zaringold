import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * ZarinPal Payment Callback
 *
 * ZarinPal redirects the user here after payment completion.
 * This route verifies the payment and redirects back to the app.
 *
 * Query params from ZarinPal:
 * - Authority: the payment authority token
 * - Status: "OK" for success, "NOK" for failure/cancel
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authority = searchParams.get('Authority')
    const status = searchParams.get('Status')
    const paymentId = searchParams.get('paymentId')

    if (!authority || !paymentId) {
      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''
      return NextResponse.redirect(`${baseURL}/?payment=error&msg=missing_params`)
    }

    /* ── Find Payment Record ── */
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''
      return NextResponse.redirect(`${baseURL}/?payment=error&msg=not_found`)
    }

    /* ── If already verified ── */
    if (payment.status === 'paid') {
      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''
      return NextResponse.redirect(
        `${baseURL}/?payment=success&amount=${payment.amount}&refId=${payment.refId || ''}`
      )
    }

    /* ── If cancelled ── */
    if (status === 'NOK') {
      await db.payment.update({
        where: { id: paymentId },
        data: { status: 'expired' },
      })

      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''
      return NextResponse.redirect(`${baseURL}/?payment=cancel`)
    }

    /* ── Verify with ZarinPal ── */
    const SANDBOX = process.env.ZARINPAL_SANDBOX === 'true'
    const verifyURL = SANDBOX
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
      : 'https://api.zarinpal.com/pg/v4/payment/verify.json'

    const zarinpalResponse = await fetch(verifyURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: process.env.ZARINPAL_MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        amount: payment.amount,
        authority: authority,
      }),
    })

    const zarinpalData = await zarinpalResponse.json()
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''

    /* ── Success ── */
    if (
      zarinpalData.data?.code === 100 ||
      zarinpalData.data?.code === 101
    ) {
      const now = new Date()

      await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'paid',
          refId: String(zarinpalData.data.ref_id || ''),
          cardPan: zarinpalData.data.card_pan || '',
          fee: zarinpalData.data.fee || 0,
          verifiedAt: now,
          paidAt: now,
        },
      })

      /* Credit user wallet */
      const userWallet = await db.wallet.findUnique({
        where: { userId: payment.userId },
      })

      if (userWallet) {
        await db.wallet.update({
          where: { userId: payment.userId },
          data: { balance: { increment: payment.amount } },
        })
      } else {
        await db.wallet.create({
          data: { userId: payment.userId, balance: payment.amount },
        })
      }

      /* Transaction record */
      await db.transaction.create({
        data: {
          userId: payment.userId,
          type: 'deposit',
          amountFiat: payment.amount,
          amountGold: 0,
          fee: 0,
          status: 'success',
          referenceId: `PAY-${payment.id.slice(0, 8)}`,
          description: `واریز از درگاه زرین‌پال — کد پیگیری: ${zarinpalData.data.ref_id || ''}`,
        },
      })

      return NextResponse.redirect(
        `${baseURL}/?payment=success&amount=${payment.amount}&refId=${zarinpalData.data.ref_id || ''}`
      )
    }

    /* ── Failed ── */
    await db.payment.update({
      where: { id: paymentId },
      data: { status: 'failed' },
    })

    return NextResponse.redirect(`${baseURL}/?payment=error&msg=verify_failed`)
  } catch (error) {
    console.error('Payment callback error:', error)
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''
    return NextResponse.redirect(`${baseURL}/?payment=error&msg=server_error`)
  }
}
