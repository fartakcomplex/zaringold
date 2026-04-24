import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: Get template ─────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await db.smsTemplate.findUnique({ where: { id } })
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

    const template = await db.smsTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }

    // Check slug uniqueness if changed
    if (slug && slug !== template.slug) {
      const existing = await db.smsTemplate.findUnique({ where: { slug } })
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'این شناسه قبلاً استفاده شده است' },
          { status: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (content !== undefined) updateData.content = content
    if (type !== undefined) updateData.type = type
    if (variables !== undefined) {
      updateData.variables = typeof variables === 'string' ? variables : JSON.stringify(variables)
    }
    if (isActive !== undefined) updateData.isActive = isActive
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const updated = await db.smsTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'قالب با موفقیت بروزرسانی شد',
      data: updated,
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await db.smsTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }

    await db.smsTemplate.delete({ where: { id } })

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
