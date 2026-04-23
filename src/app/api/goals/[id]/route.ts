import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserAccess } from '@/lib/access'

// PATCH: update saving goal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, icon, targetAmountFiat, status, deadline } = body

    const goal = await db.savingGoal.findUnique({ where: { id } })
    if (!goal) {
      return NextResponse.json(
        { success: false, message: 'هدف پس‌انداز یافت نشد' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (icon) updateData.icon = icon
    if (status && ['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      updateData.status = status
    }
    if (deadline !== undefined) {
      updateData.deadline = deadline ? new Date(deadline) : null
    }

    if (targetAmountFiat && targetAmountFiat > 0) {
      const latestPrice = await db.goldPrice.findFirst({
        orderBy: { createdAt: 'desc' },
      })
      const buyPrice = latestPrice?.buyPrice ?? 0
      const access = await getUserAccess(goal.userId)
      const feeRate = access.buyFeeRate
      const netAmount = targetAmountFiat * (1 - feeRate)
      updateData.targetAmountFiat = targetAmountFiat
      updateData.targetGrams = buyPrice > 0 ? netAmount / buyPrice : 0
    }

    const updated = await db.savingGoal.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'هدف پس‌انداز بروزرسانی شد',
      goal: updated,
    })
  } catch (error) {
    console.error('Update saving goal error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی هدف پس‌انداز' },
      { status: 500 }
    )
  }
}

// DELETE: remove saving goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const goal = await db.savingGoal.findUnique({ where: { id } })
    if (!goal) {
      return NextResponse.json(
        { success: false, message: 'هدف پس‌انداز یافت نشد' },
        { status: 404 }
      )
    }

    await db.savingGoal.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'هدف پس‌انداز با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Delete saving goal error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف هدف پس‌انداز' },
      { status: 500 }
    )
  }
}
