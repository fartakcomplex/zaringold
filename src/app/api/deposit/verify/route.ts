import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

/**
 * GET /api/deposit/verify
 * ZarinPal callback endpoint (user return + server callback)
 *
 * Query params:
 *   Authority — ZarinPal authority string
 *   Status    — "OK" or "NOK"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const authority = searchParams.get('Authority') || ''
    const status = searchParams.get('Status') || ''

    if (!authority) {
      return new Response(generateResultPage('error', 'اطلاعات پرداخت نامعتبر', 'شناسه تراکنش ارسال نشده است.'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // ── پیدا کردن واریز ──
    const deposit = await db.rialDeposit.findUnique({
      where: { authority },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
      },
    })

    if (!deposit) {
      return new Response(generateResultPage('error', 'تراکنش یافت نشد', 'تراکنش با این شناسه در سیستم موجود نیست.'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // ── اگر تراکنش قبلاً تأیید شده ──
    if (deposit.status === 'paid') {
      return new Response(
        generateResultPage('success', 'پرداخت تأیید شده', `این تراکنش قبلاً با موفقیت انجام شده است.<br>شماره پیگیری: <strong>${deposit.refId || '—'}</strong><br>مبلغ: <strong>${deposit.amount.toLocaleString('fa-IR')} واحد طلایی</strong>`),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // ── اگر کاربر لغو کرده ──
    if (status !== 'OK') {
      await db.rialDeposit.update({
        where: { id: deposit.id },
        data: { status: 'failed' },
      })

      return new Response(
        generateResultPage('error', 'پرداخت لغو شد', 'شما عملیات پرداخت را لغو کردید. در صورت کسر مبلغ از حساب بانکی، مبلغ ظرف ۷۲ ساعت بازگردانده می‌شود.'),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // ── دریافت تنظیمات درگاه ──
    const configMap: Record<string, string> = {}
    try {
      if (db.gatewayConfig) {
        const configs = await db.gatewayConfig.findMany()
        for (const c of configs) {
          configMap[c.key] = c.value
        }
      }
    } catch {
      console.log('gatewayConfig table not available, using defaults')
    }

    const merchantId = configMap['zarinpal_merchant_code'] || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    const mode = configMap['zarinpal_mode'] || 'sandbox'
    const isSandbox = mode !== 'production'
    const apiUrl = isSandbox
      ? 'https://sandbox.zarinpal.com/pg/rest/WebGate'
      : 'https://www.zarinpal.com/pg/rest/WebGate'

    // ── تأیید پرداخت نزد زرین‌پال ──
    const verifyResponse = await fetch(`${apiUrl}/PaymentVerification.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        MerchantID: merchantId,
        Amount: Math.round(deposit.amount),
        Authority: authority,
      }),
    })

    const verifyData = await verifyResponse.json()

    // ZarinPal v4: { Status: 100, RefID: ..., ... }
    const isPaid = verifyData.Status === 100 || verifyData.data?.code === 100
    const refId = String(verifyData.RefID || verifyData.data?.ref_id || '')
    const cardPan = verifyData.CardPan || verifyData.data?.card_pan || null

    if (isPaid && refId) {

      // ── شروع تراکنش دیتابیس ──
      const updatedDeposit = await db.$transaction(async (tx) => {
        // 1. بروزرسانی وضعیت واریز
        const updated = await tx.rialDeposit.update({
          where: { id: deposit.id },
          data: {
            status: 'paid',
            refId,
            cardPan,
            paidAt: new Date(),
          },
        })

        // 2. افزایش موجودی کیف پول واحد طلایی
        const wallet = await tx.wallet.upsert({
          where: { userId: deposit.userId },
          update: { balance: { increment: deposit.amount } },
          create: { userId: deposit.userId, balance: deposit.amount },
        })

        // 3. ایجاد تراکنش مالی
        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: 'deposit_rial',
            amountFiat: deposit.amount,
            amountGold: 0,
            fee: 0,
            status: 'completed',
            referenceId: crypto.randomUUID(),
            description: `واریز واحد طلایی از درگاه زرین‌پال — شماره پیگیری: ${refId}`,
          },
        })

        // 4. ایجاد اعلان
        await tx.notification.create({
          data: {
            userId: deposit.userId,
            title: 'واریز موفق',
            body: `مبلغ ${deposit.amount.toLocaleString('fa-IR')} واحد طلایی با موفقیت به کیف پول شما واریز شد. شماره پیگیری: ${refId}`,
            type: 'deposit',
          },
        })

        return { updated, walletBalance: wallet.balance }
      })

      return new Response(
        generateResultPage(
          'success',
          'پرداخت موفق',
          `مبلغ <strong>${deposit.amount.toLocaleString('fa-IR')} واحد طلایی</strong> با موفقیت به کیف پول زرین گلد واریز شد.
          <br><br>
          <div style="direction:rtl; text-align:right; background:rgba(212,175,55,0.08); border-radius:12px; padding:16px; margin:12px 0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:#94a3b8;">شماره پیگیری:</span>
              <span style="font-weight:600; color:#d4af37;">${refId}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:#94a3b8;">موجودی فعلی:</span>
              <span style="font-weight:600;">${updatedDeposit.walletBalance.toLocaleString('fa-IR')} واحد طلایی</span>
            </div>
            ${cardPan ? `<div style="display:flex; justify-content:space-between;">
              <span style="color:#94a3b8;">کارت پرداخت:</span>
              <span style="font-weight:600; font-family:monospace;">${maskCardPan(cardPan)}</span>
            </div>` : ''}
          </div>`
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // ── خطای تأیید پرداخت ──
    const errorCode = verifyData.errors?.code || verifyData.Status || verifyData.data?.code
    await db.rialDeposit.update({
      where: { id: deposit.id },
      data: { status: 'failed' },
    })

    const errorMessages: Record<string, string> = {
      '-21': 'هیچ عملیات مالی برای این تراکنش یافت نشد',
      '-22': 'تراکنش ناموفق — مبلغ از حساب شما کسر نشده',
      '-33': 'مبلغ پرداخت با مبلغ ثبت‌شده مطابقت ندارد',
      '-34': 'شماره تراکنش نامعتبر',
      '-40': 'رمز تأیید پرداخت نامعتبر',
      '-41': 'بیش از حد مجاز مبلغ تراکنش',
      '-42': 'مدت زمان مجاز به پایان رسیده',
      '101': 'تراکنش قبلاً تأیید شده — مبلغ به کیف پول اضافه شده',
      '102': 'تراکنش تأیید نشده',
      '103': 'تراکنش توسط کاربر لغو شده',
    }

    const errorMsg = (errorCode ? errorMessages[String(errorCode)] : null) || 'خطای ناشناخته در تأیید پرداخت'

    return new Response(
      generateResultPage('error', 'پرداخت ناموفق', `دلیل: ${errorMsg}<br>در صورت کسر مبلغ از حساب بانکی، مبلغ ظرف ۷۲ ساعت بازگردانده می‌شود.`),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (error) {
    console.error('Deposit verify error:', error)
    return new Response(
      generateResultPage('error', 'خطای سرور', 'خطای داخلی سرور رخ داد. لطفاً با پشتیبانی تماس بگیرید.'),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

/** ایجاد صفحه نتیجه HTML فارسی */
function generateResultPage(type: 'success' | 'error', title: string, message: string): string {
  const isSuccess = type === 'success'
  const iconColor = isSuccess ? '#d4af37' : '#ef4444'
  const iconSvg = isSuccess
    ? `<svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>نتیجه پرداخت | زرین گلد</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Vazirmatn', system-ui, sans-serif;
      background: #0a0a0f;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: rgba(20, 20, 30, 0.95);
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: 20px;
      padding: 40px 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    .icon { margin: 0 auto 20px; }
    .icon svg { display: block; margin: 0 auto; }
    ${isSuccess ? `
    .icon svg polyline, .icon svg path {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      animation: draw 0.6s ease forwards 0.2s;
    }
    @keyframes draw {
      to { stroke-dashoffset: 0; }
    }
    ` : ''}
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 12px;
      color: ${isSuccess ? '#d4af37' : '#ef4444'};
    }
    .message {
      font-size: 15px;
      line-height: 1.8;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .message strong { color: #e2e8f0; }
    .btn {
      display: inline-block;
      padding: 12px 32px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      font-family: inherit;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #d4af37, #b8941e);
      color: #0a0a0f;
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary {
      background: rgba(255,255,255,0.06);
      color: #94a3b8;
      margin-right: 8px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
    .footer-text { margin-top: 20px; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${iconSvg}</div>
    <h1>${title}</h1>
    <div class="message">${message}</div>
    <button class="btn btn-primary" onclick="window.close(); window.location.href='/';">بازگشت به زرین گلد</button>
    <div class="footer-text">زرین گلد — درگاه پرداخت زرین‌پال</div>
  </div>
</body>
</html>`
}

/** ماسک کردن شماره کارت بانکی */
function maskCardPan(pan: string): string {
  if (!pan || pan.length < 8) return pan
  return `****-****-****-${pan.slice(-4)}`
}
