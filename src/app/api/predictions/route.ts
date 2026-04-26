import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── POST: Submit price prediction ──
export async function POST(request: NextRequest) {
  try {
    const { userId, predictedPrice, targetDate } = await request.json()

    if (!userId || !predictedPrice || !targetDate) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر، قیمت پیش‌بینی و تاریخ هدف الزامی است' },
        { status: 400 }
      )
    }

    if (predictedPrice <= 0) {
      return NextResponse.json(
        { success: false, message: 'قیمت پیش‌بینی باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    // Validate targetDate is in the future (ISO date string)
    const target = new Date(targetDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (target <= today) {
      return NextResponse.json(
        { success: false, message: 'تاریخ هدف باید در آینده باشد' },
        { status: 400 }
      )
    }

    // Check if user already has a prediction for this target date
    const existing = await db.pricePrediction.findFirst({
      where: {
        userId,
        targetDate,
        resolvedAt: null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'شما قبلاً برای این تاریخ پیش‌بینی ثبت کرده‌اید' },
        { status: 400 }
      )
    }

    // Create prediction
    const prediction = await db.pricePrediction.create({
      data: {
        userId,
        predictedPrice: Math.round(predictedPrice * 100) / 100,
        targetDate,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'پیش‌بینی قیمت با موفقیت ثبت شد',
      prediction: {
        id: prediction.id,
        predictedPrice: prediction.predictedPrice,
        targetDate: prediction.targetDate,
        createdAt: prediction.createdAt.toISOString(),
        status: 'pending',
      },
    })
  } catch (error) {
    console.error('Prediction submit error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت پیش‌بینی' },
      { status: 500 }
    )
  }
}
