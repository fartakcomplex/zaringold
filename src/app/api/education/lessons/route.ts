import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Seed demo lessons for education center
 */
const SEED_LESSONS = [
  {
    title: 'Introduction to Gold Trading',
    titleFa: 'آشنایی با معامله طلا',
    description: 'Learn the basics of gold trading in the Iranian market',
    descriptionFa: 'با اصول اولیه معامله طلا در بازار ایران آشنا شوید',
    type: 'video',
    category: 'technical_analysis',
    url: 'https://example.com/lessons/intro-gold',
    content: '<h1>Introduction to Gold Trading</h1><p>Gold trading basics...</p>',
    contentFa: '<h1>آشنایی با معامله طلا</h1><p>اصول اولیه معامله طلا...</p>',
    thumbnail: '/images/lessons/intro-gold.jpg',
    duration: 1800,
    sortOrder: 1,
    views: 1250,
    isActive: true,
    isPremium: false,
  },
  {
    title: 'Technical Analysis: RSI Indicator',
    titleFa: 'تحلیل تکنیکال: اندیکاتور RSI',
    description: 'Learn how to use the RSI indicator for gold trading',
    descriptionFa: 'یادگیری استفاده از اندیکاتور RSI در معاملات طلا',
    type: 'video',
    category: 'technical_analysis',
    url: 'https://example.com/lessons/rsi',
    content: '<h1>RSI Indicator</h1><p>Detailed guide to RSI...</p>',
    contentFa: '<h1>اندیکاتور RSI</h1><p>راهنمای جامع اندیکاتور RSI...</p>',
    thumbnail: '/images/lessons/rsi.jpg',
    duration: 2400,
    sortOrder: 2,
    views: 980,
    isActive: true,
    isPremium: false,
  },
  {
    title: 'Understanding Gold Price Drivers',
    titleFa: 'شناخت عوامل تأثیرگذار بر قیمت طلا',
    description: 'Key factors that affect gold prices globally and locally',
    descriptionFa: 'عوامل کلیدی که بر قیمت طلا در سطح جهانی و داخلی تأثیر می‌گذارند',
    type: 'article',
    category: 'economy',
    url: 'https://example.com/lessons/price-drivers',
    content: '<h1>Gold Price Drivers</h1><p>Factors affecting gold prices...</p>',
    contentFa: '<h1>عوامل تأثیرگذار بر قیمت طلا</h1><p>عوامل مؤثر بر قیمت طلا...</p>',
    thumbnail: '/images/lessons/price-drivers.jpg',
    duration: 900,
    sortOrder: 3,
    views: 750,
    isActive: true,
    isPremium: false,
  },
  {
    title: 'Risk Management in Gold Trading',
    titleFa: 'مدیریت ریسک در معاملات طلا',
    description: 'Essential risk management strategies for gold traders',
    descriptionFa: 'استراتژی‌های ضروری مدیریت ریسک برای معامله‌گران طلا',
    type: 'video',
    category: 'risk_management',
    url: 'https://example.com/lessons/risk-management',
    content: '<h1>Risk Management</h1><p>Risk strategies...</p>',
    contentFa: '<h1>مدیریت ریسک</h1><p>استراتژی‌های ریسک...</p>',
    thumbnail: '/images/lessons/risk.jpg',
    duration: 3000,
    sortOrder: 4,
    views: 620,
    isActive: true,
    isPremium: true,
  },
  {
    title: 'MACD: Moving Average Convergence Divergence',
    titleFa: 'اندیکاتور MACD: واگرایی و همگرایی میانگین متحرک',
    description: 'Master the MACD indicator for better trading decisions',
    descriptionFa: 'تسلط بر اندیکاتور MACD برای تصمیم‌گیری بهتر در معاملات',
    type: 'video',
    category: 'technical_analysis',
    url: 'https://example.com/lessons/macd',
    content: '<h1>MACD Indicator</h1><p>MACD explained...</p>',
    contentFa: '<h1>اندیکاتور MACD</h1><p>توضیح کامل MACD...</p>',
    thumbnail: '/images/lessons/macd.jpg',
    duration: 2100,
    sortOrder: 5,
    views: 540,
    isActive: true,
    isPremium: false,
  },
  {
    title: 'How to Buy Gold: Beginner Guide',
    titleFa: 'راهنمای خرید طلا برای مبتدیان',
    description: 'Complete guide for beginners on how to buy gold safely',
    descriptionFa: 'راهنمای کامل برای مبتدیان درباره خرید امن طلا',
    type: 'article',
    category: 'buying_tips',
    url: 'https://example.com/lessons/buy-gold',
    content: '<h1>Buying Gold Guide</h1><p>Step by step...</p>',
    contentFa: '<h1>راهنمای خرید طلا</h1><p>مرحله به مرحله...</p>',
    thumbnail: '/images/lessons/buy-gold.jpg',
    duration: 1200,
    sortOrder: 6,
    views: 1580,
    isActive: true,
    isPremium: false,
  },
  {
    title: 'Bollinger Bands Strategy',
    titleFa: 'استراتژی باندهای بولینگر',
    description: 'Using Bollinger Bands for gold price analysis',
    descriptionFa: 'استفاده از باندهای بولینگر برای تحلیل قیمت طلا',
    type: 'video',
    category: 'technical_analysis',
    url: 'https://example.com/lessons/bollinger',
    content: '<h1>Bollinger Bands</h1><p>Bollinger explained...</p>',
    contentFa: '<h1>باندهای بولینگر</h1><p>توضیح باندهای بولینگر...</p>',
    thumbnail: '/images/lessons/bollinger.jpg',
    duration: 2700,
    sortOrder: 7,
    views: 430,
    isActive: true,
    isPremium: true,
  },
  {
    title: 'Gold Investment Portfolio Diversification',
    titleFa: 'تنوع‌بخشی سبد سرمایه‌گذاری با طلا',
    description: 'How to diversify your portfolio with gold investments',
    descriptionFa: 'چگونه سبد سرمایه‌گذاری خود را با طلا متنوع کنید',
    type: 'article',
    category: 'economy',
    url: 'https://example.com/lessons/diversification',
    content: '<h1>Portfolio Diversification</h1><p>Diversification with gold...</p>',
    contentFa: '<h1>تنوع‌بخشی سبد سرمایه‌گذاری</h1><p>تنوع‌بخشی با طلا...</p>',
    thumbnail: '/images/lessons/diversification.jpg',
    duration: 1500,
    sortOrder: 8,
    views: 890,
    isActive: true,
    isPremium: false,
  },
  {
    title: 'Candlestick Patterns for Gold Trading',
    titleFa: 'الگوهای شمعی در معاملات طلا',
    description: 'Common candlestick patterns and their signals in gold market',
    descriptionFa: 'الگوهای شمعی رایج و سیگنال‌های آن‌ها در بازار طلا',
    type: 'video',
    category: 'technical_analysis',
    url: 'https://example.com/lessons/candlestick',
    content: '<h1>Candlestick Patterns</h1><p>Pattern guide...</p>',
    contentFa: '<h1>الگوهای شمعی</h1><p>راهنمای الگوها...</p>',
    thumbnail: '/images/lessons/candlestick.jpg',
    duration: 3300,
    sortOrder: 9,
    views: 670,
    isActive: true,
    isPremium: false,
  },
  {
    title: 'Setting Stop Loss and Take Profit',
    titleFa: 'تنظیم حد ضرر و حد سود',
    description: 'Learn how to set stop loss and take profit levels effectively',
    descriptionFa: 'یادگیری نحوه تنظیم مؤثر حد ضرر و حد سود',
    type: 'video',
    category: 'risk_management',
    url: 'https://example.com/lessons/stop-loss',
    content: '<h1>Stop Loss & Take Profit</h1><p>Setting levels...</p>',
    contentFa: '<h1>حد ضرر و حد سود</h1><p>تنظیم سطوح...</p>',
    thumbnail: '/images/lessons/stop-loss.jpg',
    duration: 1800,
    sortOrder: 10,
    views: 1100,
    isActive: true,
    isPremium: false,
  },
]

/**
 * GET /api/education/lessons — List lessons with filters and pagination
 * POST /api/education/lessons — Seed demo lessons
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const where: Record<string, unknown> = { isActive: true }
    if (category) where.category = category
    if (type) where.type = type

    const skip = (page - 1) * limit

    const [lessons, total] = await Promise.all([
      db.educationLesson.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      db.educationLesson.count({ where }),
    ])

    // Get user's favorite and progress data if userId provided
    let userFavorites: Set<string> = new Set()
    let userProgress: Map<string, { progress: number; isCompleted: boolean }> = new Map()

    if (userId && lessons.length > 0) {
      const lessonIds = lessons.map((l) => l.id)

      const [favorites, progresses] = await Promise.all([
        db.userFavoriteLesson.findMany({
          where: { userId, lessonId: { in: lessonIds } },
          select: { lessonId: true },
        }),
        db.userLessonProgress.findMany({
          where: { userId, lessonId: { in: lessonIds } },
          select: { lessonId: true, progress: true, isCompleted: true },
        }),
      ])

      userFavorites = new Set(favorites.map((f) => f.lessonId))
      userProgress = new Map(
        progresses.map((p) => [p.lessonId, { progress: p.progress, isCompleted: p.isCompleted }])
      )
    }

    const lessonsWithUserData = lessons.map((lesson) => {
      const progress = userProgress.get(lesson.id)
      return {
        id: lesson.id,
        title: lesson.title,
        titleFa: lesson.titleFa,
        description: lesson.description,
        descriptionFa: lesson.descriptionFa,
        type: lesson.type,
        category: lesson.category,
        thumbnail: lesson.thumbnail,
        duration: lesson.duration,
        views: lesson.views,
        isPremium: lesson.isPremium,
        isFavorite: userFavorites.has(lesson.id),
        userProgress: progress?.progress || 0,
        isCompleted: progress?.isCompleted || false,
        createdAt: lesson.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        lessons: lessonsWithUserData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('[Education/Lessons GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست دروس' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Seed demo lessons
    if (action === 'seed') {
      const existingCount = await db.educationLesson.count()

      if (existingCount > 0) {
        return NextResponse.json({
          success: true,
          message: `دروس از قبل وجود دارند (${existingCount} درس)`,
          seeded: false,
        })
      }

      // Seed lessons
      for (const lesson of SEED_LESSONS) {
        await db.educationLesson.create({ data: lesson })
      }

      return NextResponse.json({
        success: true,
        message: `${SEED_LESSONS.length} درس نمونه با موفقیت ایجاد شد`,
        seeded: true,
      })
    }

    return NextResponse.json(
      { success: false, error: 'عملیات نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Education/Lessons POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد دروس نمونه' },
      { status: 500 }
    )
  }
}
