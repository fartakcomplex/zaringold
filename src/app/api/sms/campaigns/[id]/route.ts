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

// ─── POST: Campaign actions (send, cancel, duplicate) ──────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const action = body.action as string

    if (!action || !['send', 'cancel', 'duplicate'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'اکشن نامعتبر. اکشن‌های مجاز: send, cancel, duplicate' },
        { status: 400 }
      )
    }

    const campaignIndex = campaigns.findIndex((c) => c.id === id)
    if (campaignIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'کمپین یافت نشد' },
        { status: 404 }
      )
    }

    const campaign = campaigns[campaignIndex]

    if (action === 'send') {
      if (campaign.status === 'sending' || campaign.status === 'completed') {
        return NextResponse.json(
          { success: false, message: 'این کمپین قبلاً ارسال یا در حال ارسال است' },
          { status: 400 }
        )
      }

      const failedCount = Math.floor(campaign.recipientCount * (Math.random() * 0.06))
      const deliveredCount = campaign.recipientCount - failedCount

      campaigns[campaignIndex] = {
        ...campaign,
        status: 'sending',
        deliveredCount,
        failedCount,
      }

      // Simulate completion after a short delay for demo purposes
      campaigns[campaignIndex] = {
        ...campaigns[campaignIndex],
        status: 'completed',
      }

      return NextResponse.json(campaigns[campaignIndex])
    }

    if (action === 'cancel') {
      if (campaign.status !== 'scheduled' && campaign.status !== 'draft') {
        return NextResponse.json(
          { success: false, message: 'فقط کمپین‌های پیش‌نویس یا زمان‌بندی‌شده قابل لغو هستند' },
          { status: 400 }
        )
      }

      campaigns[campaignIndex] = {
        ...campaign,
        status: 'cancelled',
      }

      return NextResponse.json(campaigns[campaignIndex])
    }

    if (action === 'duplicate') {
      const duplicated: Campaign = {
        ...campaign,
        id: `c${Date.now()}`,
        name: `${campaign.name} (کپی)`,
        status: 'draft',
        deliveredCount: 0,
        failedCount: 0,
        cost: 0,
        createdAt: new Date().toISOString(),
      }

      // Remove scheduledAt on duplicate
      delete duplicated.scheduledAt

      campaigns.push(duplicated)

      return NextResponse.json(duplicated)
    }

    return NextResponse.json(
      { success: false, message: 'اکشن نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[SMS Campaign POST action]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اجرای عملیات کمپین' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Delete campaign ───────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const campaignIndex = campaigns.findIndex((c) => c.id === id)
    if (campaignIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'کمپین یافت نشد' },
        { status: 404 }
      )
    }

    campaigns.splice(campaignIndex, 1)

    return NextResponse.json({ success: true, message: 'کمپین با موفقیت حذف شد' })
  } catch (error) {
    console.error('[SMS Campaign DELETE]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف کمپین' },
      { status: 500 }
    )
  }
}
