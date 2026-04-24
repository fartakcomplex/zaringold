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
    content: 'به خانواده زرین گلد خوش آمدید {name} عزیز! 🌟',
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
    content: 'تراکنش {type} شما با مبلغ {amount} تومان انجام شد.',
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
    content: '⚡ هشدار قیمت طلا: هر گرم {price} تومان',
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
    content: '🎂 تولد شما مبارک {name} عزیز!',
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
    content: '🔐 ورود جدید از {device} در {location}',
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
    content: '💰 مبلغ {amount} تومان از کیف پول شما برداشت شد.',
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
    content: '✅ مبلغ {amount} تومان به کیف پول شما واریز شد.',
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
    content: '🔑 کد تأیید: {code} — تا {expires} دقیقه اعتبار دارد.',
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
    content: '🎁 {amount} گرم طلای آبشده به کیف پول شما واریز شد.',
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
    content: '⭐ سطح شما به {level} ارتقا یافت!',
    type: 'marketing',
    variables: ['name', 'level', 'benefits'],
    isDefault: false,
    isActive: true,
    createdAt: '2025-02-20T16:00:00Z',
    updatedAt: '2025-02-20T16:00:00Z',
  },
]

// ─── GET: Get single template ──────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = templates.find((t) => t.id === id)
    if (!template) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'جزئیات قالب',
      data: template,
    })
  } catch (error) {
    console.error('[SMS Template GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت قالب' },
      { status: 500 }
    )
  }
}

// ─── PUT: Update template ──────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, slug, content, type, variables, isActive, isDefault } = body

    const templateIndex = templates.findIndex((t) => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }

    const template = templates[templateIndex]

    // Check slug uniqueness if changed
    if (slug && slug !== template.slug) {
      const existing = templates.find((t) => t.slug === slug)
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'این شناسه قبلاً استفاده شده است' },
          { status: 409 }
        )
      }
    }

    // Extract variables from content if changed
    let finalVariables = template.variables
    if (content) {
      const variableRegex = /\{(\w+)\}/g
      const extractedVars: string[] = []
      let match
      while ((match = variableRegex.exec(content)) !== null) {
        if (!extractedVars.includes(match[1])) {
          extractedVars.push(match[1])
        }
      }
      finalVariables = variables && variables.length > 0 ? variables : extractedVars
    } else if (variables) {
      finalVariables = variables
    }

    templates[templateIndex] = {
      ...template,
      ...(name !== undefined ? { name } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(type !== undefined ? { type } : {}),
      variables: finalVariables,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isDefault !== undefined ? { isDefault } : {}),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: 'قالب با موفقیت بروزرسانی شد',
      data: templates[templateIndex],
    })
  } catch (error) {
    console.error('[SMS Template PUT]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی قالب' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Delete template ───────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const templateIndex = templates.findIndex((t) => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }

    templates.splice(templateIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'قالب با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('[SMS Template DELETE]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف قالب' },
      { status: 500 }
    )
  }
}
