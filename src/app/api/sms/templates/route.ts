import { NextRequest, NextResponse } from 'next/server'

// ─── In-Memory Mock Data ────────────────────────────────────────────────
interface Template {
  id: string
  name: string
  slug: string
  content: string
  type: string
  variables: string[]
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

let templates: Template[] = [
  {
    id: 'tpl_001',
    name: 'خوش‌آمدگویی',
    slug: 'welcome',
    content: 'به خانواده زرین گلد خوش آمدید {name} عزیز! 🌟 حساب شما با موفقیت ایجاد شد. همین حالا سرمایه‌گذاری در طلای آبشده را شروع کنید.',
    type: 'transactional',
    variables: ['name'],
    isDefault: true,
    isActive: true,
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tpl_002',
    name: 'تراکنش مالی',
    slug: 'transaction',
    content: 'تراکنش {type} شما با مبلغ {amount} تومان با موفقیت انجام شد. مانده کیف پول: {balance} تومان. شناسه تراکنش: {refId}',
    type: 'transactional',
    variables: ['type', 'amount', 'balance', 'refId'],
    isDefault: true,
    isActive: true,
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-02-15T10:00:00Z',
  },
  {
    id: 'tpl_003',
    name: 'هشدار قیمت طلا',
    slug: 'price_alert',
    content: '⚡ هشدار قیمت طلا\nقیمت لحظه‌ای هر گرم طلای آبشده: {price} تومان\nتغییر نسبت به دیروز: {change}%\n{direction}',
    type: 'notification',
    variables: ['price', 'change', 'direction'],
    isDefault: false,
    isActive: true,
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-03-01T14:00:00Z',
  },
  {
    id: 'tpl_004',
    name: 'تبریک تولد',
    slug: 'birthday',
    content: '🎂 تولد شما مبارک {name} عزیز!\nزرین گلد بهترین‌ها را برای شما آرزو می‌کند.\n🎁 ۵ گرم طلای رایگان هدیه تولد به کیف پول شما واریز شد.',
    type: 'marketing',
    variables: ['name'],
    isDefault: true,
    isActive: true,
    createdAt: '2025-01-15T12:00:00Z',
    updatedAt: '2025-01-15T12:00:00Z',
  },
  {
    id: 'tpl_005',
    name: 'امنیت حساب',
    slug: 'security',
    content: '🔐 هشدار امنیتی زرین گلد\nورود جدید از دستگاه {device} در {location}\nاگر این ورود توسط شما نبوده، فوراً رمز عبور خود را تغییر دهید.',
    type: 'transactional',
    variables: ['device', 'location'],
    isDefault: true,
    isActive: true,
    createdAt: '2025-01-05T10:00:00Z',
    updatedAt: '2025-01-05T10:00:00Z',
  },
  {
    id: 'tpl_006',
    name: 'برداشت از کیف پول',
    slug: 'withdrawal',
    content: '💰 برداشت از کیف پول\nمبلغ {amount} تومان از کیف پول زرین گلد شما برداشت شد.\nمانده فعلی: {balance} تومان\nشناسه: {refId}',
    type: 'transactional',
    variables: ['amount', 'balance', 'refId'],
    isDefault: true,
    isActive: true,
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tpl_007',
    name: 'واریز به کیف پول',
    slug: 'deposit',
    content: '✅ واریز به کیف پول\nمبلغ {amount} تومان به کیف پول زرین گلد شما واریز شد.\nمانده فعلی: {balance} تومان\nشناسه: {refId}',
    type: 'transactional',
    variables: ['amount', 'balance', 'refId'],
    isDefault: true,
    isActive: true,
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tpl_008',
    name: 'کد تأیید (OTP)',
    slug: 'otp',
    content: '🔑 کد تأیید زرین گلد: {code}\nاین کد تا {expires} دقیقه اعتبار دارد.\nهرگز این کد را به کسی ارسال نکنید.',
    type: 'transactional',
    variables: ['code', 'expires'],
    isDefault: true,
    isActive: true,
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tpl_009',
    name: 'هدیه و جایزه',
    slug: 'gift',
    content: '🎁 هدیه ویژه زرین گلد!\n{name} عزیز، {amount} گرم طلای آبشده به کیف پول شما واریز شد.\nبرای استفاده وارد پنل شوید.',
    type: 'marketing',
    variables: ['name', 'amount'],
    isDefault: false,
    isActive: true,
    createdAt: '2025-02-01T11:00:00Z',
    updatedAt: '2025-02-01T11:00:00Z',
  },
  {
    id: 'tpl_010',
    name: 'وفاداری مشتری',
    slug: 'loyalty',
    content: '⭐ سطح وفاداری شما ارتقا یافت!\n{name} عزیز، شما اکنون در سطح {level} هستید.\nمزایا: {benefits}',
    type: 'marketing',
    variables: ['name', 'level', 'benefits'],
    isDefault: false,
    isActive: true,
    createdAt: '2025-02-20T16:00:00Z',
    updatedAt: '2025-02-20T16:00:00Z',
  },
]

// ─── GET: List all templates ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''

    let filtered = templates.filter((t) => t.isActive)

    if (type) {
      filtered = filtered.filter((t) => t.type === type)
    }
    if (search) {
      filtered = filtered.filter((t) => t.name.includes(search) || t.slug.includes(search))
    }

    return NextResponse.json({
      success: true,
      message: 'لیست قالب‌های پیامکی',
      data: filtered,
    })
  } catch (error) {
    console.error('[SMS Templates GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت قالب‌های پیامکی' },
      { status: 500 }
    )
  }
}

// ─── POST: Create new template ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, content, type = 'transactional', variables = [], isDefault = false } = body

    if (!name || !slug || !content) {
      return NextResponse.json(
        { success: false, message: 'نام، شناسه و محتوای قالب الزامی است' },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const existing = templates.find((t) => t.slug === slug)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'این شناسه قبلاً استفاده شده است' },
        { status: 409 }
      )
    }

    // Extract variables from content
    const variableRegex = /\{(\w+)\}/g
    const extractedVars: string[] = []
    let match
    while ((match = variableRegex.exec(content)) !== null) {
      if (!extractedVars.includes(match[1])) {
        extractedVars.push(match[1])
      }
    }

    const now = new Date().toISOString()
    const newTemplate: Template = {
      id: `tpl_${Date.now()}`,
      name,
      slug,
      content,
      type,
      variables: variables.length > 0 ? variables : extractedVars,
      isDefault,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    templates.push(newTemplate)

    return NextResponse.json({
      success: true,
      message: 'قالب جدید با موفقیت ایجاد شد',
      data: newTemplate,
    })
  } catch (error) {
    console.error('[SMS Templates POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد قالب' },
      { status: 500 }
    )
  }
}
