import { NextRequest, NextResponse } from 'next/server'

// ─── In-Memory Mock Data ────────────────────────────────────────────────
interface BirthdayContact {
  id: string
  name: string
  phone: string
  birthDate: string
  sent: boolean
  giftCode: string
}

let contacts: BirthdayContact[] = [
  { id: 'b1', name: 'علی محمدی', phone: '09121234567', birthDate: '۱۴۰۴/۰۴/۰۵', sent: false, giftCode: 'GIFT-A1B2' },
  { id: 'b2', name: 'سارا احمدی', phone: '09351234567', birthDate: '۱۴۰۴/۰۴/۰۷', sent: false, giftCode: 'GIFT-C3D4' },
  { id: 'b3', name: 'رضا کریمی', phone: '09191234567', birthDate: '۱۴۰۴/۰۴/۱۰', sent: true, giftCode: 'GIFT-E5F6' },
  { id: 'b4', name: 'مریم حسینی', phone: '09161234567', birthDate: '۱۴۰۴/۰۴/۱۲', sent: false, giftCode: 'GIFT-G7H8' },
  { id: 'b5', name: 'امیر نوری', phone: '09381234567', birthDate: '۱۴۰۴/۰۴/۱۵', sent: false, giftCode: 'GIFT-I9J0' },
  { id: 'b6', name: 'فاطمه رضایی', phone: '09131234567', birthDate: '۱۴۰۴/۰۴/۱۸', sent: false, giftCode: 'GIFT-K1L2' },
  { id: 'b7', name: 'حسین صادقی', phone: '09361234567', birthDate: '۱۴۰۴/۰۴/۲۰', sent: true, giftCode: 'GIFT-M3N4' },
  { id: 'b8', name: 'زهرا موسوی', phone: '09141234567', birthDate: '۱۴۰۴/۰۴/۲۲', sent: false, giftCode: 'GIFT-O5P6' },
]

// ─── GET: Get upcoming birthdays ───────────────────────────────────────
export async function GET() {
  try {
    return NextResponse.json({
      contacts,
      stats: {
        sentThisMonth: 12,
        totalSent: 145,
        upcomingCount: 6,
        autoSendEnabled: true,
      },
    })
  } catch (error) {
    console.error('[SMS Birthday GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تولدهای پیش‌رو' },
      { status: 500 }
    )
  }
}

// ─── POST: Send birthday SMS ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, contactId } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'متن پیام الزامی است' },
        { status: 400 }
      )
    }

    if (contactId) {
      const contact = contacts.find((c) => c.id === contactId)
      if (!contact) {
        return NextResponse.json(
          { success: false, message: 'مخاطب یافت نشد' },
          { status: 404 }
        )
      }

      contact.sent = true

      return NextResponse.json({
        success: true,
        message: `پیام تبریک برای ${contact.name} ارسال شد`,
        contact,
      })
    }

    // Send to all unsent contacts
    const unsent = contacts.filter((c) => !c.sent)
    unsent.forEach((c) => {
      c.sent = true
    })

    return NextResponse.json({
      success: true,
      message: `پیام تبریک برای ${unsent.length} نفر ارسال شد`,
      sent: unsent.length,
    })
  } catch (error) {
    console.error('[SMS Birthday POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال پیام تبریک تولد' },
      { status: 500 }
    )
  }
}
