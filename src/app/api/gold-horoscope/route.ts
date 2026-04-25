import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  In-memory Cache (4-hour slots)                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface HoroscopeData {
  fortune: string;
  buyLuck: number;       // 0-100
  sellLuck: number;      // 0-100
  luckyNumber: number;   // 1-99
  luckyColor: string;
  luckyGemstone: string;
  motivationalQuote: string;
}

let cachedHoroscope: { date: string; horoscope: HoroscopeData } | null = null;
let cacheKey = '';

function getCacheSlot(): string {
  // 4-hour slots: days since epoch / 4
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return String(Math.floor(daysSinceEpoch / 4));
}

function getTodayPersianDate(): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  } catch {
    return new Date().toLocaleDateString('fa-IR');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Fallback horoscope (static, used when LLM is unavailable)                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getFallbackHoroscope(): HoroscopeData {
  const fortunes = [
    'امروز ستارگان به تو لبخند می‌زنند! 🌟 انرژی مثبت در بازار طلا حس می‌شود. فرصت‌های خوبی در انتظار توست، فقط باید با دقت نگاه کنی. طلای امروز می‌درخشد! ✨',
    'سیارات در وضعیت عالی قرار دارند! 🪐 بازار طلا امروز پر از سورپرایز است. صبر و حوصله کلید موفقیت توست. منتظر یک فرصت ویژه باش! 💫',
    'کائنات پیامی برای تو دارد! 🌌 امروز روز خوبی برای بررسی گزینه‌های سرمایه‌گذاری است. ستاره بخت تو می‌درخشد! 🌠',
  ];

  const quotes = [
    'سرمایه‌گذار واقعی کسی است که در طوفان آرامش خود را حفظ کند. 🏆',
    'هر گرم طلا، قطره‌ای از تلاش و هوشمندی توست. 💎',
    'صبر بهترین دوست سرمایه‌گذار است. زمان طلای تو را ارزشمندتر می‌کند. ⏳',
  ];

  const gemstones = ['عقیق', 'فیروزه', 'یشم', 'عنبر', 'الماس', 'یشم سبز', '/topaz', 'سرپنتین'];
  const colors = ['طلایی', 'سبز زمردی', 'آبی فیروزه‌ای', 'قرمز یاقوتی', 'بنفش آمیتیست', 'سفید نقره‌ای'];

  return {
    fortune: fortunes[Math.floor(Math.random() * fortunes.length)],
    buyLuck: 60 + Math.floor(Math.random() * 30),
    sellLuck: 55 + Math.floor(Math.random() * 30),
    luckyNumber: 1 + Math.floor(Math.random() * 99),
    luckyColor: colors[Math.floor(Math.random() * colors.length)],
    luckyGemstone: gemstones[Math.floor(Math.random() * gemstones.length)],
    motivationalQuote: quotes[Math.floor(Math.random() * quotes.length)],
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET /api/gold-horoscope                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const currentSlot = getCacheSlot();

    // Return cached horoscope if still in same 4-hour slot
    if (cachedHoroscope && cacheKey === currentSlot) {
      return NextResponse.json({
        success: true,
        date: cachedHoroscope.date,
        horoscope: cachedHoroscope.horoscope,
        cached: true,
      });
    }

    // Generate new horoscope via LLM
    let horoscope: HoroscopeData;

    try {
      const zai = await ZAI.create();
      const response = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'تو یک فالگیر طلای حرفه‌ای هستی. هر روز یک پیش‌بینی سرگرم‌کننده درباره بازار طلا بنویس. شامل: شانس خرید/فروش، عدد شانس طلایی، رنگ شانس، یک جمله انگیزشی درباره سرمایه‌گذاری، و یک پیش‌بینی سرگرم‌کننده. همیشه به فارسی بنویس و لحنش شاد و انرژی‌بخش باشد. از ایموجی استفاده کن.',
          },
          {
            role: 'user',
            content: `لطفاً فال امروز طلا را بنویس. دقیقاً به صورت JSON با فیلدهای زیر پاسخ بده:
{
  "fortune": "متن اصلی فال طلا (۲ تا ۴ جمله سرگرم‌کننده و انرژی‌بخش درباره بازار طلا امروز)",
  "buyLuck": 75,
  "sellLuck": 60,
  "luckyNumber": 42,
  "luckyColor": "رنگ شانس به فارسی",
  "luckyGemstone": "نام سنگ شانس به فارسی",
  "motivationalQuote": "یک جمله انگیزشی کوتاه درباره سرمایه‌گذاری و طلا"
}

buyLuck و sellLuck باید عددی بین ۰ تا ۱۰۰ باشند. luckyNumber باید بین ۱ تا ۹۹ باشد. فقط JSON برگردان.`,
          },
        ],
      });

      const content = response?.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        horoscope = {
          fortune: parsed.fortune || parsed.prediction || 'ستارگان امروزی به نفع توست! ✨',
          buyLuck: Math.min(100, Math.max(0, Number(parsed.buyLuck) || 70)),
          sellLuck: Math.min(100, Math.max(0, Number(parsed.sellLuck) || 65)),
          luckyNumber: Math.min(99, Math.max(1, Number(parsed.luckyNumber) || 7)),
          luckyColor: parsed.luckyColor || 'طلایی',
          luckyGemstone: parsed.luckyGemstone || 'عقیق',
          motivationalQuote: parsed.motivationalQuote || 'سرمایه‌گذار واقعی، کسی است که صبور باشد. 🏆',
        };
      } else {
        horoscope = getFallbackHoroscope();
      }
    } catch (aiError) {
      console.warn(
        '[GoldHoroscope] LLM failed, using fallback:',
        aiError instanceof Error ? aiError.message : aiError
      );
      horoscope = getFallbackHoroscope();
    }

    // Update cache
    cachedHoroscope = {
      date: getTodayPersianDate(),
      horoscope,
    };
    cacheKey = currentSlot;

    return NextResponse.json({
      success: true,
      date: cachedHoroscope.date,
      horoscope: cachedHoroscope.horoscope,
      cached: false,
    });
  } catch (error) {
    console.error('[GoldHoroscope] Error:', error);
    const fallback = getFallbackHoroscope();
    return NextResponse.json({
      success: true,
      date: getTodayPersianDate(),
      horoscope: fallback,
      cached: true,
    });
  }
}
