import { NextRequest, NextResponse } from 'next/server'

// ─── In-Memory Mock Data ────────────────────────────────────────────────
interface BlacklistEntry {
  id: string
  phone: string
  reason: string
  addedAt: string
}

let blacklist: BlacklistEntry[] = [
  { id: 'bl1', phone: '09121234567', reason: 'درخواست کاربر', addedAt: '2024-03-10T08:00:00Z' },
  { id: 'bl2', phone: '09351234567', reason: 'شکایات مکرر', addedAt: '2024-03-12T14:30:00Z' },
  { id: 'bl3', phone: '09191234567', reason: 'شماره غیرمعتبر', addedAt: '2024-03-15T10:00:00Z' },
  { id: 'bl4', phone: '09381234567', reason: 'بازخورد منفی', addedAt: '2024-03-18T09:15:00Z' },
]

// ─── GET: List blacklisted phones ──────────────────────────────────────
export async function GET() {
  try {
    return NextResponse.json(blacklist)
  } catch (error) {
    console.error('[SMS Blacklist GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست سیاه' },
      { status: 500 }
    )
  }
}

// ─── POST: Add phone to blacklist ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, reason } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'شماره تلفن الزامی است' },
        { status: 400 }
      )
    }

    // Check if already blacklisted
    const existing = blacklist.find((b) => b.phone === phone)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'این شماره قبلاً در لیست سیاه قرار گرفته است' },
        { status: 409 }
      )
    }

    const entry: BlacklistEntry = {
      id: `bl${Date.now()}`,
      phone,
      reason: reason || '',
      addedAt: new Date().toISOString(),
    }

    blacklist.push(entry)

    return NextResponse.json(entry)
  } catch (error) {
    console.error('[SMS Blacklist POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در افزودن به لیست سیاه' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Remove phone from blacklist ───────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'شماره تلفن الزامی است' },
        { status: 400 }
      )
    }

    const entryIndex = blacklist.findIndex((b) => b.phone === phone)
    if (entryIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'شماره در لیست سیاه یافت نشد' },
        { status: 404 }
      )
    }

    blacklist.splice(entryIndex, 1)

    return NextResponse.json({ success: true, message: 'شماره با موفقیت از لیست سیاه حذف شد' })
  } catch (error) {
    console.error('[SMS Blacklist DELETE]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف از لیست سیاه' },
      { status: 500 }
    )
  }
}
