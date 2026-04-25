import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ── Helpers ── */

const VALID_CURRENCIES = ['toman', 'gold', 'mixed']
const VALID_INTERVALS = ['daily', 'weekly', 'monthly', 'yearly']

function addInterval(date: Date, interval: string): Date {
  const next = new Date(date)
  switch (interval) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  return next
}

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PATCH /api/v1/merchant/subscriptions/[id]
 * Toggle active/inactive or update amount
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { userId, action, amountToman, amountGold, planName, description, interval, maxCharges, currency } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Verify merchant ownership
    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    const subscription = await db.subscription.findFirst({
      where: { id, merchantId: merchant.id },
    })
    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'طرح اشتراک یافت نشد' },
        { status: 404 }
      )
    }

    // Toggle active/inactive
    if (action === 'toggle_active') {
      const updated = await db.subscription.update({
        where: { id },
        data: { isActive: !subscription.isActive },
      })
      return NextResponse.json({
        success: true,
        message: updated.isActive ? 'اشتراک فعال شد' : 'اشتراک غیرفعال شد',
        data: { id: updated.id, isActive: updated.isActive },
      })
    }

    // Update subscription fields
    const updateData: Record<string, any> = {}

    if (planName !== undefined) updateData.planName = planName.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (amountToman !== undefined) updateData.amountToman = Number(amountToman)
    if (amountGold !== undefined) updateData.amountGold = Number(amountGold)
    if (maxCharges !== undefined) updateData.maxCharges = Math.max(0, Number(maxCharges))

    if (currency !== undefined) {
      if (!VALID_CURRENCIES.includes(currency)) {
        return NextResponse.json(
          { success: false, message: 'ارز نامعتبر' },
          { status: 400 }
        )
      }
      updateData.currency = currency
    }

    if (interval !== undefined) {
      if (!VALID_INTERVALS.includes(interval)) {
        return NextResponse.json(
          { success: false, message: 'بازه نامعتبر' },
          { status: 400 }
        )
      }
      updateData.interval = interval
      // Recalculate next charge date based on new interval
      updateData.nextChargeAt = addInterval(new Date(), interval)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'حداقل یک فیلد برای ویرایش ارسال کنید' },
        { status: 400 }
      )
    }

    const updated = await db.subscription.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'طرح اشتراک به‌روزرسانی شد',
      data: {
        id: updated.id,
        planName: updated.planName,
        description: updated.description,
        amountToman: updated.amountToman,
        amountGold: updated.amountGold,
        currency: updated.currency,
        interval: updated.interval,
        trialDays: updated.trialDays,
        maxCharges: updated.maxCharges,
        isActive: updated.isActive,
        nextChargeAt: updated.nextChargeAt,
        totalCharges: updated.totalCharges,
        subscribeUrl: `/subscription/${updated.id}/subscribe`,
      },
    })
  } catch (error) {
    console.error('Subscription update error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی طرح اشتراک' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/merchant/subscriptions/[id]?userId=xxx
 * Delete a subscription plan
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    // Verify ownership
    const subscription = await db.subscription.findFirst({
      where: { id, merchantId: merchant.id },
    })
    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'طرح اشتراک یافت نشد' },
        { status: 404 }
      )
    }

    // Check if there are active subscribers
    const activeCount = await db.subscriptionCustomer.count({
      where: {
        subscriptionId: id,
        status: 'active',
      },
    })
    if (activeCount > 0) {
      return NextResponse.json(
        { success: false, message: `این طرح ${activeCount} مشترک فعال دارد. ابتدا آن‌ها را لغو کنید.` },
        { status: 400 }
      )
    }

    // Delete charges and customers first (cascade), then the subscription
    await db.subscription.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'طرح اشتراک حذف شد',
    })
  } catch (error) {
    console.error('Subscription delete error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف طرح اشتراک' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/merchant/subscriptions/[id]
 * Process next charge (manual trigger)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    const subscription = await db.subscription.findFirst({
      where: { id, merchantId: merchant.id, isActive: true },
    })
    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'طرح اشتراک فعال یافت نشد' },
        { status: 404 }
      )
    }

    // Get active customers whose trial has ended
    const customers = await db.subscriptionCustomer.findMany({
      where: {
        subscriptionId: id,
        status: 'active',
      },
    })

    if (customers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'مشترک فعالی برای این طرح وجود ندارد' },
        { status: 400 }
      )
    }

    let chargedCount = 0
    let failedCount = 0

    for (const customer of customers) {
      // Skip if in trial period
      if (customer.trialEndsAt && new Date() < customer.trialEndsAt) {
        continue
      }

      // Check max charges
      if (subscription.maxCharges > 0 && customer.totalCharged >= subscription.maxCharges) {
        // Auto-cancel if max charges reached
        await db.subscriptionCustomer.update({
          where: { id: customer.id },
          data: { status: 'completed', cancelledAt: new Date() },
        })
        continue
      }

      try {
        // Create charge record (simulated — in production, process actual payment)
        await db.subscriptionCharge.create({
          data: {
            subscriptionId: id,
            customerId: customer.id,
            amountToman: subscription.amountToman,
            amountGold: subscription.amountGold,
            status: 'completed',
            chargedAt: new Date(),
          },
        })

        // Update customer next charge date
        await db.subscriptionCustomer.update({
          where: { id: customer.id },
          data: {
            totalCharged: { increment: 1 },
            nextChargeAt: addInterval(new Date(), subscription.interval),
          },
        })

        chargedCount++
      } catch {
        failedCount++
      }
    }

    // Update subscription totals
    await db.subscription.update({
      where: { id },
      data: {
        totalCharges: { increment: chargedCount },
        nextChargeAt: addInterval(new Date(), subscription.interval),
      },
    })

    return NextResponse.json({
      success: true,
      message: `${chargedCount} پرداخت موفق، ${failedCount} ناموفق`,
      data: { chargedCount, failedCount, totalCustomers: customers.length },
    })
  } catch (error) {
    console.error('Subscription charge error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در پردازش اشتراک' },
      { status: 500 }
    )
  }
}
