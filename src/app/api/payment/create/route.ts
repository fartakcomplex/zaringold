import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ── ZarinPal v4 Configuration ── */
const ZARINPAL_API = 'https://api.zarinpal.com/pg/v4/payment/request.json'
const ZARINPAL_START = 'https://www.zarinpal.com/pg/StartPay/'
// Merchant ID — replace with your real ZarinPal merchant code
const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
// Sandbox mode for testing (uses ZarinPal sandbox)
const SANDBOX = process.env.ZARINPAL_SANDBOX === 'true'
const SANDBOX_API = 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
const SANDBOX_START = 'https://sandbox.zarinpal.com/pg/StartPay/'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, description } = body

    /* ── Validation ── */
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const amountNum = Number(amount)
    if (!amountNum || amountNum < 10000) {
      return NextResponse.json(
        { success: false, message: 'مبلغ باید حداقل ۱۰,۰۰۰ واحد طلایی باشد' },
        { status: 400 }
      )
    }

    if (amountNum > 100000000) {
      return NextResponse.json(
        { success: false, message: 'حداکثر مبلغ تراکنش ۱۰۰,۰۰۰,۰۰۰ واحد طلایی است' },
        { status: 400 }
      )
    }

    /* ── Create Payment Record in DB ── */
    const payment = await db.payment.create({
      data: {
        userId,
        amount: amountNum,
        description: description || 'شارژ کیف پول زرین گلد',
        status: 'pending',
        provider: SANDBOX ? 'zarinpal-sandbox' : 'zarinpal',
      },
    })

    /* ── Call ZarinPal API ── */
    const apiURL = SANDBOX ? SANDBOX_API : ZARINPAL_API
    const merchantId = SANDBOX
      ? 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      : MERCHANT_ID

    const zarinpalResponse = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: amountNum,
        description: description || 'شارژ کیف پول زرین گلد',
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/payment/callback?paymentId=${payment.id}`,
        metadata: {
          order_id: payment.id,
        },
      }),
    })

    const zarinpalData = await zarinpalResponse.json()

    if (zarinpalData.data?.code === 100 && zarinpalData.data.authority) {
      /* ── Success: Update payment with authority ── */
      await db.payment.update({
        where: { id: payment.id },
        data: { authority: zarinpalData.data.authority },
      })

      const startURL = (SANDBOX ? SANDBOX_START : ZARINPAL_START) + zarinpalData.data.authority

      return NextResponse.json({
        success: true,
        message: 'درگاه پرداخت ایجاد شد',
        data: {
          paymentId: payment.id,
          authority: zarinpalData.data.authority,
          paymentURL: startURL,
          fee: 0, // ZarinPal fee is deducted from merchant
        },
      })
    }

    /* ── ZarinPal Error ── */
    const errors: Record<string, string> = {
      '-1': 'اطلاعات ارسال شده ناقص است',
      '-2': 'IP و یا مرچنت کد فعال نیست',
      '-3': 'با توجه به محدودیت‌های شاپ، امکان پرداخت با درگاه بانکی مربوطه وجود ندارد',
      '-4': 'سطح تأیید‌کنندگی پایین‌تر از سطح نقره‌ای است',
      '-11': 'درخواست نامربوط است',
      '-12': 'امکان ویرایش درخواست وجود ندارد',
      '-21': 'هیچ نوع پرداختی برای این درخواست یافت نشد',
      '-22': 'تراکنش ناموفق است',
      '-33': 'مبلغ تراکنش از سقف تعریف شده بیشتر است',
      '-34': 'سقف پرداختی شاپ تکمیل شده است',
      '-40': 'خطا در اطلاعات پارامترهای ارسال شده',
      '-41': 'داده‌های ارسالی نامعتبر است (علی‌رغم موفقیت آمیز بودن فرایند پرداخت از نظر بانک، تراکنش به عنوان تراکنش ناموفق در زرین‌پال ثبت شده است)',
      '-42': 'مدت زمان معتبر برای پرداخت سپری شده است',
      '-54': 'درخواست مورد نظر یافت نشد',
    }

    const errorCode = String(zarinpalData.errors?.code || zarinpalData.data?.code || 'unknown')
    const errorMessage = errors[errorCode] || `خطای ناشناخته زرین‌پال: ${errorCode}`

    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'failed' },
    })

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 400 }
    )
  } catch (error) {
    console.error('Payment create error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد درگاه پرداخت' },
      { status: 500 }
    )
  }
}
