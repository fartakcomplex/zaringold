import { NextRequest, NextResponse } from 'next/server'

// ─── In-Memory Mock Data ────────────────────────────────────────────────
interface Campaign {
  id: string
  name: string
  type: string
  segment: string
  status: string
  recipientCount: number
  deliveredCount: number
  failedCount: number
  message: string
  scheduledAt?: string
  createdAt: string
  cost: number
}

let campaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'تخفیف نوروزی',
    type: 'marketing',
    segment: 'all',
    status: 'completed',
    recipientCount: 1200,
    deliveredCount: 1150,
    failedCount: 50,
    message: 'عید نوروز مبارک! تخفیف ویژه زرین گلد',
    createdAt: '2024-03-15T10:00:00Z',
    cost: 54000,
  },
  {
    id: 'c2',
    name: 'هشدار افزایش قیمت',
    type: 'price_alert',
    segment: 'active',
    status: 'sending',
    recipientCount: 800,
    deliveredCount: 340,
    failedCount: 12,
    message: 'قیمت طلا افزایش یافت! همین الان خرید کنید',
    createdAt: '2024-03-20T14:30:00Z',
    cost: 15660,
  },
  {
    id: 'c3',
    name: 'کمپین VIP',
    type: 'promotional',
    segment: 'vip',
    status: 'scheduled',
    recipientCount: 200,
    deliveredCount: 0,
    failedCount: 0,
    message: 'پیشنهاد ویژه فقط برای شما!',
    scheduledAt: '2024-03-25T09:00:00Z',
    createdAt: '2024-03-22T11:00:00Z',
    cost: 0,
  },
  {
    id: 'c4',
    name: 'خوش‌آمدگویی',
    type: 'marketing',
    segment: 'new',
    status: 'completed',
    recipientCount: 500,
    deliveredCount: 490,
    failedCount: 10,
    message: 'به زرین گلد خوش آمدید!',
    createdAt: '2024-03-10T08:00:00Z',
    cost: 22500,
  },
  {
    id: 'c5',
    name: 'یادآوری KYC',
    type: 'transactional',
    segment: 'all',
    status: 'draft',
    recipientCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    message: 'لطفاً احراز هویت خود را تکمیل کنید',
    createdAt: '2024-03-28T16:00:00Z',
    cost: 0,
  },
  {
    id: 'c6',
    name: 'کمپین هدیه',
    type: 'birthday',
    segment: 'all',
    status: 'completed',
    recipientCount: 150,
    deliveredCount: 145,
    failedCount: 5,
    message: 'تولدت مبارک! هدیه ویژه زرین گلد',
    createdAt: '2024-03-18T10:00:00Z',
    cost: 6750,
  },
]

// ─── GET: List campaigns ──────────────────────────────────────────────
export async function GET() {
  try {
    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('[SMS Campaigns GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست کمپین‌ها' },
      { status: 500 }
    )
  }
}

// ─── POST: Create new campaign ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, type, segment, message, scheduledAt, templateId } = body

    if (!name || !message) {
      return NextResponse.json(
        { success: false, message: 'نام و متن پیام الزامی است' },
        { status: 400 }
      )
    }

    const segmentCounts: Record<string, number> = {
      all: 2400,
      active: 1800,
      vip: 450,
      new: 320,
    }

    const recipientCount = segmentCounts[segment] || 0
    const newCampaign: Campaign = {
      id: `c${Date.now()}`,
      name,
      type: type || 'marketing',
      segment: segment || 'all',
      status: scheduledAt ? 'scheduled' : 'draft',
      recipientCount,
      deliveredCount: 0,
      failedCount: 0,
      message,
      createdAt: new Date().toISOString(),
      cost: 0,
    }

    if (scheduledAt) {
      newCampaign.scheduledAt = scheduledAt
    }

    campaigns.push(newCampaign)

    return NextResponse.json(newCampaign)
  } catch (error) {
    console.error('[SMS Campaigns POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد کمپین' },
      { status: 500 }
    )
  }
}
