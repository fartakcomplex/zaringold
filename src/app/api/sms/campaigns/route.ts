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
  scheduledAt: string | null
  createdAt: string
  cost: number
}

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
    message: '🎁 زرین گلد: تخفیف ویژه نوروز! خرید طلای آبشده با کارمزد صفر تا پایان فروردین. همین حالا سفارش دهید.',
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
    message: '⚡ قیمت طلا به بالاترین حد ۶ ماه اخیر رسید! هر گرم طلای آبشده: ۳,۲۴۰,۰۰۰ تومان',
    scheduledAt: null,
    createdAt: '2025-03-20T14:15:00Z',
    cost: 40050,
  },
  {
    id: 'camp_004',
    name: 'کمپین تراکنش VIP - خرید اوراق',
    type: 'marketing',
    segment: 'vip',
    status: 'scheduled',
    recipientCount: 450,
    deliveredCount: 0,
    failedCount: 0,
    message: '💎 ویژه مشتریان VIP: خرید اوراق طلا با تخفیف ۲٪ و کارمزد صفر. مهلت محدود تا ۱۰ اردیبهشت.',
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
    message: '🌙 عید سعید فطر مبارک! زرین گلد آرزوی سلامتی و موفقیت برای شما و خانواده محترمتان دارد.',
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
    message: '🔐 احراز هویت شما ناقص است. برای استفاده از تمام خدمات زرین گلد، لطفاً احراز هویت خود را تکمیل کنید.',
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
    message: '📊 گزارش ماهانه سرمایه‌گذاری شما در زرین گلد آماده است. برای مشاهده وارد پنل شوید.',
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
    message: '🔥 بهترین زمان فروش طلای آبشده! قیمت هر گرم: ۳,۲۶۰,۰۰۰ تومان. فروش آنی و واریز فوری.',
    scheduledAt: null,
    createdAt: '2025-03-29T15:30:00Z',
    cost: 108000,
  },
]

// ─── GET: List campaigns with pagination and filters ────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''

    let filtered = [...campaigns]

    if (status) {
      filtered = filtered.filter((c) => c.status === status)
    }
    if (type) {
      filtered = filtered.filter((c) => c.type === type)
    }
    if (search) {
      filtered = filtered.filter((c) => c.name.includes(search))
    }

    const total = filtered.length
    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)

    return NextResponse.json({
      success: true,
      message: 'لیست کمپین‌های پیامکی',
      data: {
        campaigns: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
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
    const {
      name,
      type = 'marketing',
      message,
      segment = 'all',
      scheduledAt,
      template = '',
      senderNumber = '',
      costPerSms = 45,
    } = body

    if (!name || !message) {
      return NextResponse.json(
        { success: false, message: 'نام و متن پیام الزامی است' },
        { status: 400 }
      )
    }

    // Estimate recipient count by segment
    const segmentCounts: Record<string, number> = {
      all: 2400,
      active: 1800,
      vip: 450,
      new_users: 320,
      kyc_verified: 1200,
      gold_holders: 890,
    }
    const recipientCount = segmentCounts[segment] || 2400
    const totalCost = recipientCount * costPerSms

    const newCampaign: Campaign = {
      id: `camp_${Date.now()}`,
      name,
      type,
      segment,
      status: scheduledAt ? 'scheduled' : 'draft',
      recipientCount,
      deliveredCount: 0,
      failedCount: 0,
      message,
      scheduledAt: scheduledAt || null,
      createdAt: new Date().toISOString(),
      cost: totalCost,
    }

    campaigns.unshift(newCampaign)

    return NextResponse.json({
      success: true,
      message: 'کمپین جدید با موفقیت ایجاد شد',
      data: newCampaign,
    })
  } catch (error) {
    console.error('[SMS Campaigns POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد کمپین' },
      { status: 500 }
    )
  }
}
