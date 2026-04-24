import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List all templates ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type') || ''

    const where: Record<string, unknown> = { isActive: true }
    if (type) where.type = type

    const templates = await db.smsTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({
      success: true,
      message: 'لیست قالب‌های پیامکی',
      data: templates,
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
    const existing = await db.smsTemplate.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'این شناسه قبلاً استفاده شده است' },
        { status: 409 }
      )
    }

    const template = await db.smsTemplate.create({
      data: {
        name,
        slug,
        content,
        type,
        variables: typeof variables === 'string' ? variables : JSON.stringify(variables),
        isDefault,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'قالب جدید با موفقیت ایجاد شد',
      data: template,
    })
  } catch (error) {
    console.error('[SMS Templates POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد قالب' },
      { status: 500 }
    )
  }
}
