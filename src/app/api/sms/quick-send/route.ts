import { NextRequest, NextResponse } from 'next/server'

// ─── POST: Send SMS to multiple phones immediately ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phones, message, type = 'marketing', senderNumber = '' } = body

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json(
        { success: false, message: 'حداقل یک شماره تلفن وارد کنید' },
        { status: 400 }
      )
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'متن پیام نمی‌تواند خالی باشد' },
        { status: 400 }
      )
    }

    if (phones.length > 500) {
      return NextResponse.json(
        { success: false, message: 'حداکثر ۵۰۰ شماره در هر ارسال مجاز است' },
        { status: 400 }
      )
    }

    // Validate phone numbers (Iranian format)
    const validPhones: string[] = []
    const invalidPhones: string[] = []
    const phoneRegex = /^09\d{9}$/

    for (const phone of phones) {
      const cleaned = String(phone).replace(/\s+/g, '')
      if (phoneRegex.test(cleaned)) {
        validPhones.push(cleaned)
      } else {
        invalidPhones.push(String(phone))
      }
    }

    // Mock blacklist check
    const blacklistPhones = new Set(['09121234567', '09351234567', '09191234567'])
    const filteredPhones = validPhones.filter((p) => !blacklistPhones.has(p))
    const skippedByBlacklist = validPhones.length - filteredPhones.length

    if (filteredPhones.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: invalidPhones.length > 0
            ? 'هیچ شماره معتبری وجود ندارد. شماره‌ها باید با 09 شروع شوند و ۱۱ رقم باشند.'
            : 'تمام شماره‌ها در لیست سیاه هستند',
        },
        { status: 400 }
      )
    }

    const costPerSms = 45
    const failedCount = Math.floor(filteredPhones.length * (Math.random() * 0.04))
    const deliveredCount = filteredPhones.length - failedCount
    const totalCost = deliveredCount * costPerSms

    const results = filteredPhones.map((phone, idx) => ({
      phone,
      status: idx < deliveredCount ? 'delivered' : 'failed',
      messageId: `msg_${Date.now()}_${idx}`,
      sentAt: new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      message: `پیامک با موفقیت ارسال شد — ${deliveredCount} پیام تحویل داده شد`,
      data: {
        results,
        delivered: deliveredCount,
        failed: failedCount,
        skipped: {
          blacklist: skippedByBlacklist,
          invalid: invalidPhones.length,
        },
        totalCost,
        costPerSms,
      },
    })
  } catch (error) {
    console.error('[SMS Quick-Send POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال پیامک' },
      { status: 500 }
    )
  }
}
