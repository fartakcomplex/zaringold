import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SANDBOX = process.env.ZARINPAL_SANDBOX === 'true'
const VERIFY_API = SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
  : 'https://api.zarinpal.com/pg/v4/payment/verify.json'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, authority, status } = body

    if (!paymentId || !authority) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات ناقص است' },
        { status: 400 }
      )
    }

    /* ── Find Payment Record ── */
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    if (payment.status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'این تراکنش قبلاً تأیید شده است',
        data: {
          paymentId: payment.id,
          status: 'paid',
          amount: payment.amount,
          refId: payment.refId,
        },
      })
    }

    /* ── If payment was cancelled/expired on ZarinPal side ── */
    if (status === 'NOK') {
      await db.payment.update({
        where: { id: paymentId },
        data: { status: 'expired' },
      })

      return NextResponse.json(
        { success: false, message: 'تراکنش توسط کاربر لغو شده یا منقضی شده است' },
        { status: 400 }
      )
    }

    /* ── Call ZarinPal Verify API ── */
    const zarinpalResponse = await fetch(VERIFY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: process.env.ZARINPAL_MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        amount: payment.amount,
        authority: authority,
      }),
    })

    const zarinpalData = await zarinpalResponse.json()

    /* ── Verification Success (code 100 or 101) ── */
    if (
      zarinpalData.data?.code === 100 ||
      zarinpalData.data?.code === 101
    ) {
      const now = new Date()

      /* ── Update payment record ── */
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

      /* ── Credit user's fiat wallet ── */
      const userWallet = await db.wallet.findUnique({
        where: { userId: payment.userId },
      })

      if (userWallet) {
        await db.wallet.update({
          where: { userId: payment.userId },
          data: {
            balance: { increment: payment.amount },
          },
        })
      } else {
        await db.wallet.create({
          data: {
            userId: payment.userId,
            balance: payment.amount,
          },
        })
      }

      /* ── Create transaction record ── */
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

      return NextResponse.json({
        success: true,
        message: 'پرداخت با موفقیت تأیید شد',
        data: {
          paymentId: payment.id,
          status: 'paid',
          amount: payment.amount,
          refId: String(zarinpalData.data.ref_id || ''),
          cardPan: zarinpalData.data.card_pan || '',
        },
      })
    }

    /* ── Verification Failed ── */
    await db.payment.update({
      where: { id: paymentId },
      data: { status: 'failed' },
    })

    const errorMessages: Record<string, string> = {
      '-1': 'اطلاعات ارسال شده ناقص است',
      '-2': 'IP و یا مرچنت کد فعال نیست',
      '-3': 'با توجه به محدودیت‌ها امکان پرداخت وجود ندارد',
      '-11': 'درخواست نامربوط است',
      '-22': 'تراکنش ناموفق است',
      '-33': 'مبلغ تراکنش از سقف بیشتر است',
      '-54': 'درخواست مورد نظر یافت نشد',
    }

    const code = String(zarinpalData.errors?.code || zarinpalData.data?.code || 'unknown')

    return NextResponse.json(
      {
        success: false,
        message: errorMessages[code] || `پرداخت تأیید نشد: ${code}`,
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Payment verify error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تأیید پرداخت' },
      { status: 500 }
    )
  }
}
