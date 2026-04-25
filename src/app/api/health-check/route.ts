import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, goldGrams, fiatBalance } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const systemPrompt = `تو یک تحلیلگر مالی متخصص در زمینه بازار طلا و سرمایه‌گذاری هستی.
این تحلیل برای یک اپلیکیشن معاملات طلا به فارسی (MiliGold / زرین گلد) انجام می‌شود.
همه پاسخ‌ها را به زبان فارسی بنویس.

اطلاعات کاربر:
- موجودی طلای کاربر: ${goldGrams ?? 0} گرم
- موجودی واحد طلایی کاربر: ${fiatBalance ?? 0} واحد طلایی

لطفاً یک تحلیل کامل از وضعیت مالی کاربر ارائه بده. پاسخت باید دقیقاً به فرمت JSON زیر باشد:
{
  "overallScore": <عدد 0 تا 100>,
  "riskLevel": "low" یا "medium" یا "high",
  "summary": "<خلاصه‌ای از وضعیت مالی کاربر در 2 تا 3 جمله>",
  "recommendations": ["<توصیه 1>", "<توصیه 2>", "<توصیه 3>", "<توصیه 4>"],
  "strengths": ["<نقطه قوت 1>", "<نقطه قوت 2>", "<نقطه قوت 3>"],
  "weaknesses": ["<نقطه ضعف 1>", "<نقطه ضعف 2>"]
}

قوانین ارزیابی:
- اگر کاربر طلای کمتر از ۱ گرم دارد، نمره را پایین‌تر در نظر بگیر.
- اگر موجودی واحد طلایی کمتر از ۵۰۰ هزار واحد طلایی است، ریسک را بالا در نظر بگیر.
- تنوع سبد (تعدیل طلا و واحد طلایی) را در نمره لحاظ کن.
- توصیه‌ها باید عملی و قابل اجرا باشند.
- فقط JSON خالص برگردان، بدون هیچ متن اضافی.`;

    const response = await zai.chat.completions.create({
      model: 'default',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `لطفاً چکاپ سلامت مالی مرا انجام بده. من ${goldGrams ?? 0} گرم طلا و ${fiatBalance ?? 0} واحد طلایی موجودی دارم.`,
        },
      ],
    });

    let analysis;
    const content = response.choices?.[0]?.message?.content ?? '';

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback analysis
    }

    // Ensure all fields exist with defaults
    if (!analysis) {
      analysis = {
        overallScore: 65,
        riskLevel: 'medium',
        summary: 'وضعیت مالی شما متوسط است. توصیه می‌شود سبد سرمایه‌گذاری خود را متنوع‌تر کنید.',
        recommendations: [
          'خرید تدریجی طلا برای کاهش ریسک',
          'نگهداری حداقل ۳۰٪ از سرمایه به صورت واحد طلایی',
          'ایجاد صندوق اضطراری معادل ۳ ماه هزینه',
          'دنبال کردن اخبار بازار طلا روزانه',
        ],
        strengths: [
          'فعالیت در بازار طلا',
          'علاقه‌مندی به سرمایه‌گذاری',
        ],
        weaknesses: [
          'تنوع کم در سبد سرمایه‌گذاری',
          'نیاز به افزایش پس‌انداز',
        ],
      };
    }

    // Validate and sanitize
    analysis.overallScore = Math.max(0, Math.min(100, Number(analysis.overallScore) || 65));
    if (!['low', 'medium', 'high'].includes(analysis.riskLevel)) {
      analysis.riskLevel = 'medium';
    }
    analysis.summary = String(analysis.summary || '').slice(0, 500);
    analysis.recommendations = Array.isArray(analysis.recommendations)
      ? analysis.recommendations.map(String).slice(0, 6)
      : ['خرید تدریجی طلا', 'متنوع‌سازی سبد'];
    analysis.strengths = Array.isArray(analysis.strengths)
      ? analysis.strengths.map(String).slice(0, 5)
      : ['فعالیت در بازار'];
    analysis.weaknesses = Array.isArray(analysis.weaknesses)
      ? analysis.weaknesses.map(String).slice(0, 5)
      : ['نیاز به بهبود'];

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('[Health Check API Error]', error);

    // Return a fallback analysis
    return NextResponse.json({
      success: true,
      analysis: {
        overallScore: 60,
        riskLevel: 'medium',
        summary: 'تحلیل اولیه نشان‌دهنده وضعیت متوسط است. برای نتیجه دقیق‌تر دوباره تلاش کنید.',
        recommendations: [
          'خرید تدریجی طلا برای کاهش ریسک زمانی',
          'نگهداری ذخیره واحد طلایی کافی',
          'مطالعه بیشتر درباره بازار طلا',
        ],
        strengths: [
          'شروع سرمایه‌گذاری در طلا',
        ],
        weaknesses: [
          'نیاز به بهبود تنوع سبد',
        ],
      },
    });
  }
}
