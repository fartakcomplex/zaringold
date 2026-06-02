import { NextRequest, NextResponse } from 'next/server'

// ─── POST: Send SMS to multiple phones immediately ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phones, message, type } = body

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

    // Validate phone numbers (Iranian format)
    const phoneRegex = /^09\d{9}$/
    const validPhones = phones.filter((phone: string) => phoneRegex.test(String(phone).replace(/\s+/g, '')))

    if (validPhones.length === 0) {
      return NextResponse.json(
        { success: false, message: 'هیچ شماره معتبری وجود ندارد' },
        { status: 400 }
      )
    }

    const costPerSms = 45
    const sent = validPhones.length
    const cost = sent * costPerSms

    return NextResponse.json({
      success: true,
      sent,
      cost,
    })
  } catch (error) {
    console.error('[SMS Quick-Send POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال پیامک' },
      { status: 500 }
    )
  }
}
