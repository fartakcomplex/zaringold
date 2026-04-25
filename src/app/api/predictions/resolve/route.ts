import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

// ── POST: Resolve today's predictions ──
export async function POST(request: NextRequest) {
  try {
    const { actualPrice, targetDate } = await request.json()

    if (!actualPrice || !targetDate) {
      return NextResponse.json(
        { success: false, message: 'قیمت واقعی و تاریخ هدف الزامی است' },
        { status: 400 }
      )
    }

    if (actualPrice <= 0) {
      return NextResponse.json(
        { success: false, message: 'قیمت واقعی باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    // Find all unresolved predictions for the target date
    const predictions = await db.pricePrediction.findMany({
      where: {
        targetDate,
        resolvedAt: null,
      },
    })

    if (predictions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'پیش‌بینی فعال‌ای برای این تاریخ یافت نشد',
        resolved: 0,
      })
    }

    const ACCURACY_THRESHOLD = 2 // 2% tolerance
    let correctCount = 0
    const results: Array<{
      id: string
      userId: string
      predictedPrice: number
      priceDiffPercent: number
      isCorrect: boolean
      xpEarned: number
    }> = []

    for (const prediction of predictions) {
      const priceDiffPercent = Math.abs(
        ((prediction.predictedPrice - actualPrice) / actualPrice) * 100
      )
      const isCorrect = priceDiffPercent <= ACCURACY_THRESHOLD
      const xpEarned = isCorrect ? 50 : 5 // Bonus XP for correct, small consolation for participation

      // Update prediction
      await db.pricePrediction.update({
        where: { id: prediction.id },
        data: {
          actualPrice,
          priceDiffPercent: Math.round(priceDiffPercent * 100) / 100,
          isCorrect,
          xpEarned,
          resolvedAt: new Date(),
        },
      })

      // Update user gamification
      let gamification = await db.userGamification.findUnique({
        where: { userId: prediction.userId },
      })

      if (!gamification) {
        gamification = await db.userGamification.create({
          data: { userId: prediction.userId },
        })
      }

      const newPredictionScore = isCorrect
        ? gamification.predictionScore + 1
        : gamification.predictionScore
      const newXp = gamification.xp + xpEarned
      const newLevel = calculateLevel(newXp)

      await db.userGamification.update({
        where: { userId: prediction.userId },
        data: {
          xp: newXp,
          level: newLevel,
          predictionScore: newPredictionScore,
        },
      })

      if (isCorrect) correctCount++

      results.push({
        id: prediction.id,
        userId: prediction.userId,
        predictedPrice: prediction.predictedPrice,
        priceDiffPercent: Math.round(priceDiffPercent * 100) / 100,
        isCorrect,
        xpEarned,
      })
    }

    return NextResponse.json({
      success: true,
      message: `${predictions.length} پیش‌بینی ارزیابی شد. ${correctCount} پیش‌بینی صحیح`,
      resolved: predictions.length,
      correct: correctCount,
      results,
    })
  } catch (error) {
    console.error('Prediction resolve error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارزیابی پیش‌بینی‌ها' },
      { status: 500 }
    )
  }
}
