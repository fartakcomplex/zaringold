import { NextRequest, NextResponse } from 'next/server'

// ─── In-Memory Mock Data (shared reference) ─────────────────────────────
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
  scheduledAt: string | null
  createdAt: string
  cost: number
}

// Re-declare campaigns so this route is self-contained
let campaigns: Campaign[] = [
  {
    id: 'camp_001',
    name: 'تخفیف نوروزی طلای آبشده',
    type: 'marketing',
    segment: 'all',
    status: 'completed',
    recipientCount: 2400,
    deliveredCount: 2280,
    failedCount: 120,
    message: '🎁 زرین گلد: تخفیف ویژه نوروز! خرید طلای آبشده با کارمزد صفر تا پایان فروردین.',
    scheduledAt: null,
    createdAt: '2025-03-15T10:00:00Z',
    cost: 108000,
  },
  {
    id: 'camp_002',
    name: 'خوش‌آمدگویی کاربران جدید',
    type: 'transactional',
    segment: 'new_users',
    status: 'completed',
    recipientCount: 320,
    deliveredCount: 315,
    failedCount: 5,
    message: 'به خانواده زرین گلد خوش آمدید! 🌟 با ثبت‌نام شما، ۵ گرم طلای رایگان هدیه می‌گیرید.',
    scheduledAt: null,
    createdAt: '2025-03-18T08:30:00Z',
    cost: 14400,
  },
  {
    id: 'camp_003',
    name: 'هشدار قیمت طلا - اوج تاریخی',
    type: 'notification',
    segment: 'gold_holders',
    status: 'completed',
    recipientCount: 890,
    deliveredCount: 860,
    failedCount: 30,
    message: '⚡ قیمت طلا به بالاترین حد ۶ ماه اخیر رسید!',
    scheduledAt: null,
    createdAt: '2025-03-20T14:15:00Z',
    cost: 40050,
  },
  {
    id: 'camp_004',
    name: 'کمپین تراکنش VIP',
    type: 'marketing',
    segment: 'vip',
    status: 'scheduled',
    recipientCount: 450,
    deliveredCount: 0,
    failedCount: 0,
    message: '💎 ویژه مشتریان VIP: خرید اوراق طلا با تخفیف ۲٪',
    scheduledAt: '2025-04-25T09:00:00Z',
    createdAt: '2025-03-22T11:00:00Z',
    cost: 20250,
  },
  {
    id: 'camp_005',
    name: 'تبریک عید فطر',
    type: 'marketing',
    segment: 'active',
    status: 'draft',
    recipientCount: 1800,
    deliveredCount: 0,
    failedCount: 0,
    message: '🌙 عید سعید فطر مبارک!',
    scheduledAt: null,
    createdAt: '2025-03-25T16:00:00Z',
    cost: 81000,
  },
  {
    id: 'camp_006',
    name: 'یادآوری تکمیل احراز هویت',
    type: 'notification',
    segment: 'kyc_verified',
    status: 'completed',
    recipientCount: 1200,
    deliveredCount: 1185,
    failedCount: 15,
    message: '🔐 احراز هویت شما ناقص است.',
    scheduledAt: null,
    createdAt: '2025-03-10T09:00:00Z',
    cost: 54000,
  },
  {
    id: 'camp_007',
    name: 'گزارش ماهانه سرمایه‌گذاری',
    type: 'transactional',
    segment: 'gold_holders',
    status: 'cancelled',
    recipientCount: 890,
    deliveredCount: 0,
    failedCount: 0,
    message: '📊 گزارش ماهانه سرمایه‌گذاری شما آماده است.',
    scheduledAt: '2025-04-01T07:00:00Z',
    createdAt: '2025-03-28T12:00:00Z',
    cost: 40050,
  },
  {
    id: 'camp_008',
    name: 'پیشنهاد ویژه فروش طلای آبشده',
    type: 'marketing',
    segment: 'all',
    status: 'sending',
    recipientCount: 2400,
    deliveredCount: 1450,
    failedCount: 42,
    message: '🔥 بهترین زمان فروش طلای آبشده!',
    scheduledAt: null,
    createdAt: '2025-03-29T15:30:00Z',
    cost: 108000,
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

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'اکشن مشخص نشده است' },
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

    // ─── ACTION: send ─────────────────────────────────────────────────
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
        status: 'completed',
        deliveredCount,
        failedCount,
      }

      return NextResponse.json({
        success: true,
        message: `کمپین با موفقیت ارسال شد — ${deliveredCount} پیام تحویل داده شد`,
        data: {
          delivered: deliveredCount,
          failed: failedCount,
          totalCost: campaign.cost,
        },
      })
    }

    // ─── ACTION: cancel ───────────────────────────────────────────────
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

      return NextResponse.json({
        success: true,
        message: 'کمپین با موفقیت لغو شد',
        data: campaigns[campaignIndex],
      })
    }

    // ─── ACTION: duplicate ────────────────────────────────────────────
    if (action === 'duplicate') {
      const duplicated: Campaign = {
        ...campaign,
        id: `camp_${Date.now()}`,
        name: `${campaign.name} (کپی)`,
        status: 'draft',
        deliveredCount: 0,
        failedCount: 0,
        createdAt: new Date().toISOString(),
      }

      campaigns.unshift(duplicated)

      return NextResponse.json({
        success: true,
        message: 'کمپین با موفقیت کپی شد',
        data: duplicated,
      })
    }

    return NextResponse.json(
      { success: false, message: 'اکشن نامعتبر است. اکشن‌های مجاز: send, cancel, duplicate' },
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

    const campaign = campaigns[campaignIndex]

    if (campaign.status === 'sending' || campaign.status === 'completed') {
      return NextResponse.json(
        { success: false, message: 'امکان حذف کمپین در حال ارسال یا تکمیل‌شده وجود ندارد' },
        { status: 400 }
      )
    }

    campaigns.splice(campaignIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'کمپین با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('[SMS Campaign DELETE]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف کمپین' },
      { status: 500 }
    )
  }
}
