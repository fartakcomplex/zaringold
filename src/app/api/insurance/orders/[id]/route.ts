import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Single order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await db.insuranceOrder.findUnique({
      where: { id },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            description: true,
            durationLabel: true,
            durationLabelEn: true,
            durationDays: true,
            coverageAmount: true,
            coverages: true,
            terms: true,
          },
        },
        provider: {
          select: { id: true, name: true, nameEn: true, logo: true },
        },
        category: {
          select: { id: true, name: true, nameEn: true, slug: true, icon: true, color: true },
        },
        user: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'سفارش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('[Insurance Order GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت جزئیات سفارش' },
      { status: 500 }
    )
  }
}

// PATCH: Update order status (payment callback, issue, cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const order = await db.insuranceOrder.findUnique({ where: { id } })

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'سفارش یافت نشد' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (body.status) {
      const validStatuses = ['pending', 'paid', 'issued', 'active', 'expired', 'cancelled']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, message: 'وضعیت نامعتبر' },
          { status: 400 }
        )
      }
      updateData.status = body.status

      // Set timestamps based on status
      if (body.status === 'paid') {
        updateData.startDate = body.startDate || new Date()
      }
      if (body.status === 'issued') {
        updateData.issuedAt = new Date()
        if (!order.startDate) updateData.startDate = new Date()
        // Calculate end date based on plan duration
        const plan = await db.insurancePlan.findUnique({ where: { id: order.planId } })
        if (plan) {
          const start = (updateData.startDate as Date) || new Date()
          updateData.endDate = new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
        }
      }
      if (body.status === 'cancelled') {
        updateData.cancelledAt = new Date()
      }
    }

    if (body.policyNumber) updateData.policyNumber = body.policyNumber
    if (body.paymentRef) updateData.paymentRef = body.paymentRef
    if (body.externalOrderId) updateData.externalOrderId = body.externalOrderId
    if (body.startDate) updateData.startDate = new Date(body.startDate)
    if (body.endDate) updateData.endDate = new Date(body.endDate)
    if (body.adminNote !== undefined) updateData.adminNote = body.adminNote
    if (body.reviewedBy) updateData.reviewedBy = body.reviewedBy

    const updatedOrder = await db.insuranceOrder.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'سفارش با موفقیت بروزرسانی شد',
    })
  } catch (error) {
    console.error('[Insurance Order PATCH]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی سفارش' },
      { status: 500 }
    )
  }
}
