import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET: List templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const active = searchParams.get('active') || ''

    const where: Record<string, unknown> = {}

    if (type) {
      where.type = type
    }
    if (active === 'true') {
      where.isActive = true
    } else if (active === 'false') {
      where.isActive = false
    }

    const templates = await db.emailTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error('Error listing email templates:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست قالب‌ها' },
      { status: 500 }
    )
  }
}

// POST: Create template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, subject, htmlContent, type, variables, previewText } = body

    if (!name || !slug || !subject || !htmlContent) {
      return NextResponse.json(
        { success: false, message: 'نام، شناسه، موضوع و محتوای قالب الزامی است' },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const existing = await db.emailTemplate.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'این شناسه قالب قبلاً استفاده شده است' },
        { status: 400 }
      )
    }

    const template = await db.emailTemplate.create({
      data: {
        name,
        slug,
        subject,
        htmlContent,
        type: type || 'transactional',
        variables: JSON.stringify(variables || []),
        previewText: previewText || '',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'قالب با موفقیت ایجاد شد',
      data: template,
    })
  } catch (error) {
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد قالب' },
      { status: 500 }
    )
  }
}
