import { NextRequest, NextResponse } from 'next/server'

// ─── In-Memory Mock Data ────────────────────────────────────────────────
interface Template {
  id: string
  name: string
  slug: string
  content: string
  type: string
  variables: string[]
  active: boolean
}

let templates: Template[] = [
  {
    id: 't1',
    name: 'خوش‌آمدگویی',
    slug: 'welcome',
    content: 'به زرین گلد خوش آمدید {name} عزیز!',
    type: 'marketing',
    variables: ['{name}'],
    active: true,
  },
  {
    id: 't2',
    name: 'تراکنش',
    slug: 'transaction',
    content: 'تراکنش {type} به مبلغ {amount} تومان انجام شد',
    type: 'transactional',
    variables: ['{type}', '{amount}'],
    active: true,
  },
  {
    id: 't3',
    name: 'هشدار قیمت',
    slug: 'price_alert',
    content: 'قیمت طلا {direction}: خرید {buyPrice} / فروش {sellPrice}',
    type: 'price_alert',
    variables: ['{direction}', '{buyPrice}', '{sellPrice}'],
    active: true,
  },
  {
    id: 't4',
    name: 'تولد',
    slug: 'birthday',
    content: 'تولدت مبارک {name}! زرین گلد یه هدیه ویژه برات داره 🎂',
    type: 'birthday',
    variables: ['{name}', '{gift_code}'],
    active: true,
  },
  {
    id: 't5',
    name: 'امنیتی',
    slug: 'security',
    content: 'ورود جدید به حساب شما از {ip}. اگر شما نیستید سریعاً اقدام کنید',
    type: 'security',
    variables: ['{ip}'],
    active: true,
  },
  {
    id: 't6',
    name: 'برداشت',
    slug: 'withdrawal',
    content: 'مبلغ {amount} تومان از کیف پول شما برداشت شد. موجودی: {balance}',
    type: 'transactional',
    variables: ['{amount}', '{balance}'],
    active: true,
  },
  {
    id: 't7',
    name: 'واریز',
    slug: 'deposit',
    content: 'مبلغ {amount} تومان به کیف پول شما واریز شد. موجودی: {balance}',
    type: 'transactional',
    variables: ['{amount}', '{balance}'],
    active: true,
  },
  {
    id: 't8',
    name: 'کد تایید',
    slug: 'otp',
    content: 'کد تایید شما: {code}. این کد ۲ دقیقه اعتبار دارد',
    type: 'otp',
    variables: ['{code}'],
    active: true,
  },
  {
    id: 't9',
    name: 'هدیه',
    slug: 'gift',
    content: '{sender} عزیز یه هدیه طلا برات فرستاده! کد هدیه: {gift_code}',
    type: 'gift',
    variables: ['{sender}', '{gift_code}'],
    active: true,
  },
  {
    id: 't10',
    name: 'وفاداری',
    slug: 'loyalty',
    content: '{x} امتیاز وفاداری به حساب شما اضافه شد! مجموع: {total} امتیاز',
    type: 'loyalty',
    variables: ['{x}', '{total}'],
    active: true,
  },
]

// ─── PUT: Update template by ID ──────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, slug, content, type, variables, active } = body

    const templateIndex = templates.findIndex((t) => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }

    // Check slug uniqueness if changed
    if (slug) {
      const existing = templates.find((t) => t.slug === slug && t.id !== id)
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'این شناسه قبلاً استفاده شده است' },
          { status: 409 }
        )
      }
    }

    templates[templateIndex] = {
      ...templates[templateIndex],
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(content !== undefined && { content }),
      ...(type !== undefined && { type }),
      ...(variables !== undefined && { variables }),
      ...(active !== undefined && { active }),
    }

    return NextResponse.json(templates[templateIndex])
  } catch (error) {
    console.error('[SMS Template PUT]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی قالب' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Delete template by ID ───────────────────────────────────
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

    return NextResponse.json({ success: true, message: 'قالب با موفقیت حذف شد' })
  } catch (error) {
    console.error('[SMS Template DELETE]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف قالب' },
      { status: 500 }
    )
  }
}
