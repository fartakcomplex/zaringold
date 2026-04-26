import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH: toggle active/pause, update amount
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isActive, amountFiat } = body

    const plan = await db.autoBuyPlan.findUnique({ where: { id } })
    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'طرح خرید خودکار یافت نشد' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (typeof amountFiat === 'number' && amountFiat > 0) updateData.amountFiat = amountFiat

    const updated = await db.autoBuyPlan.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: isActive === false ? 'طرح خرید خودکار متوقف شد' : 'طرح خرید خودکار بروزرسانی شد',
      plan: updated,
    })
  } catch (error) {
    console.error('Update auto buy plan error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی طرح خرید خودکار' },
      { status: 500 }
    )
  }
}

// DELETE: cancel plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const plan = await db.autoBuyPlan.findUnique({ where: { id } })
    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'طرح خرید خودکار یافت نشد' },
        { status: 404 }
      )
    }

    await db.autoBuyPlan.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'طرح خرید خودکار با موفقیت لغو شد',
    })
  } catch (error) {
    console.error('Delete auto buy plan error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در لغو طرح خرید خودکار' },
      { status: 500 }
    )
  }
}
