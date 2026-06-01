import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock AI response templates about gold investment
function generateMockReply(message: string): string {
  const lowerMsg = message.toLowerCase()

  // Topic detection for contextual responses
  if (lowerMsg.includes('خرید') || lowerMsg.includes('buy')) {
    return 'با توجه به شرایط فعلی بازار طلا، پیشنهاد می‌کنم خرید خود را به صورت مرحله‌ای و در بازه‌های زمانی مختلف انجام دهید (Dollar Cost Averaging). این استراتژی ریسک نوسانات قیمتی را کاهش می‌دهد. اگر مبتدی هستید، از خرید خرد طلا (Micro-Gold) برای شروع استفاده کنید.'
  }

  if (lowerMsg.includes('فروش') || lowerMsg.includes('sell')) {
    return 'قبل از فروش طلا، به این نکات توجه کنید: ۱) قیمت فعلی را با میانگین خرید خود مقایسه کنید ۲) اگر سود خوبی دارید، فروش بخشی از دارایی (Take Profit) توصیه می‌شود ۳) نیاز فوری به نقدینگی خود را ارزیابی کنید. تحلیل پورتفولیو در بخش آنالیزهای حساب کاربری شما در دسترس است.'
  }

  if (lowerMsg.includes('قیمت') || lowerMsg.includes('price') || lowerMsg.includes('نوسان')) {
    return 'قیمت طلا تحت تأثیر عوامل متعددی مانند نرخ ارز، سیاست‌های فدرال رزرو آمریکا، تورم جهانی و تقاضای بازار ایران قرار دارد. برای پیش‌بینی بهتر، تقویم اقتصادی و رویدادهای مهم مانند FOMC و NFP را دنبال کنید. سیستم هشدار قیمت ما هم می‌تواند به شما در رصد نوسانات کمک کند.'
  }

  if (lowerMsg.includes('سپرده') || lowerMsg.includes('deposit') || lowerMsg.includes('سود')) {
    return 'سپرده طلایی (Gold Deposit) یک روش عالی برای کسب سود از دارایی طلا است. بر اساس مدت زمان سپرده‌گذاری، سود متفاوتی دریافت می‌کنید:\n• ۳ ماه: ۱۲٪ سالانه\n• ۶ ماه: ۱۵٪ سالانه\n• ۱۲ ماه: ۲۰٪ سالانه\nسپرده‌های بلندمدت سود بیشتری دارند و قابلیت تمدید خودکار نیز وجود دارد.'
  }

  if (lowerMsg.includes('همتا') || lowerMsg.includes('p2p') || lowerMsg.includes('معامله')) {
    return 'بازار همتا به همتا (P2P) طلا به شما امکان می‌دهد مستقیماً با سایر کاربران معامله کنید. مزایا: قیمت‌گذاری انعطاف‌پذیر، کارمزد کمتر و تنوع در روش‌های پرداخت. حتماً قبل از معامله، سوابق طرف مقابل و میزان اطمینان او را بررسی کنید. حداقل و حداکثر مقدار معامله قابل تعیین است.'
  }

  if (lowerMsg.includes('خرد') || lowerMsg.includes('micro')) {
    return 'خرید خرد طلا (Micro-Gold) بهترین راه برای شروع سرمایه‌گذاری در طلا با مبالغ کوچک است. هر خرید خرد به صورت خودکار گرد شده و مابه‌التفاوت به طلای خرد تبدیل می‌شود. این روش سرمایه‌گذاری پیوسته و بدون نیاز به مبلغ بالا، در بلندمدت نتایج بسیار خوبی دارد.'
  }

  if (lowerMsg.includes('ریسک') || lowerMsg.includes('risk') || lowerMsg.includes('خطر')) {
    return 'مدیریت ریسک در سرمایه‌گذاری طلا بسیار مهم است:\n۱) متنوع‌سازی: بیش از ۳۰٪ سرمایه را در یک دارایی سرمایه‌گذاری نکنید\n۲) حد ضرر: برای هر معامله حد ضرر تعیین کنید\n۳) DCA: خرید مرحله‌ای ریسک را کاهش می‌دهد\n۴) دانش: تقویم اقتصادی و اخبار بازار را دنبال کنید\n۵) صبور: سرمایه‌گذاری در طلا دیدگاه میان‌مدت و بلندمدت نیاز دارد'
  }

  // Default response
  return 'سلام! من دستیار هوشمند زرین‌گلد هستم. می‌توانم در زمینه‌های زیر به شما کمک کنم:\n\n🔹 تحلیل و پیش‌بینی قیمت طلا\n🔹 استراتژی خرید و فروش\n🔹 سپرده طلایی و کسب سود\n🔹 خرید خرد طلا\n🔹 بازار همتا به همتا (P2P)\n🔹 مدیریت ریسک و پورتفولیو\n🔹 تقویم اقتصادی و رویدادهای مهم\n\nلطفاً سؤال خود را بپرسید!'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, message } = body

    if (!userId || !message) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و پیام الزامی است' },
        { status: 400 }
      )
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'پیام نمی‌تواند خالی باشد' },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, message: 'طول پیام نباید بیش از ۲۰۰۰ کاراکتر باشد' },
        { status: 400 }
      )
    }

    // Save user message to chat history
    await db.aIChatMessage.create({
      data: {
        userId,
        role: 'user',
        content: message.trim(),
      },
    })

    // Generate mock AI reply
    const reply = generateMockReply(message)

    // Save AI reply to chat history
    await db.aIChatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: reply,
      },
    })

    return NextResponse.json({
      success: true,
      reply,
    })
  } catch (error) {
    console.error('AI Advisor error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت پاسخ مشاور هوشمند' },
      { status: 500 }
    )
  }
}
