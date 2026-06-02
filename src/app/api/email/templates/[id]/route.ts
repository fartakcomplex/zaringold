import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get template by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await db.emailTemplate.findUnique({ where: { id } })

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template,
    })
  } catch (error) {
    console.error('Error fetching email template:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت قالب' },
      { status: 500 }
    )
  }
}

// PUT: Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const template = await db.emailTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }

    const { name, slug, subject, htmlContent, type, variables, isActive, previewText } = body

    // Check slug uniqueness if changed
    if (slug && slug !== template.slug) {
      const existing = await db.emailTemplate.findUnique({ where: { slug } })
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'این شناسه قالب قبلاً استفاده شده است' },
          { status: 400 }
        )
      }
    }

    const updated = await db.emailTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(subject !== undefined && { subject }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(type !== undefined && { type }),
        ...(variables !== undefined && { variables: JSON.stringify(variables) }),
        ...(isActive !== undefined && { isActive }),
        ...(previewText !== undefined && { previewText }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'قالب با موفقیت بروزرسانی شد',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating email template:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی قالب' },
      { status: 500 }
    )
  }
}

// DELETE: Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await db.emailTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }

    await db.emailTemplate.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'قالب با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف قالب' },
      { status: 500 }
    )
  }
}
