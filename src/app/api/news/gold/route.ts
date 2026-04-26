import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  In-memory Cache + Cooldown                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface NewsItem {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date: string;
}

let cachedNews: NewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

// Cooldown: don't retry web_search if it recently failed
let lastErrorTime = 0;
const ERROR_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes cooldown on error

// Static fallback news (shown when API is unavailable)
const STATIC_NEWS: NewsItem[] = [
  { title: 'بازار طلا در انتظار تصمیم فدرال رزرو', url: '#', snippet: 'بازار جهانی طلا در حال حاضر در انتظار تصمیمات فدرال رزرو آمریکا قرار دارد.', source: 'اقتصاد نیوز', date: '' },
  { title: 'قیمت سکه در بازار آزاد', url: '#', snippet: 'سکه امامی امروز با افزایش نسبی قیمت روبرو شد.', source: 'خبرگزاری تسنیم', date: '' },
  { title: 'تحلیل قیمت اونس جهانی', url: '#', snippet: 'اونس جهانی طلا به بالاترین سطح خود در هفته جاری رسید.', source: 'دنیای اقتصاد', date: '' },
  { title: 'آخرین وضعیت بازار ارز', url: '#', snippet: 'دلار در بازار آزاد نسبت به روز گذشته تغییری نداشت.', source: 'ایسنا', date: '' },
  { title: 'پیش‌بینی قیمت طلا در هفته آینده', url: '#', snippet: 'کارشناسان پیش‌بینی می‌کنند قیمت طلا روند صعودی داشته باشد.', source: 'کدال', date: '' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET /api/news/gold                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function GET() {
  try {
    // Return cached results if still fresh
    const now = Date.now();
    if (cachedNews && now - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({ success: true, news: cachedNews, cached: true });
    }

    // If we recently got an error, return cached or static data without calling the API
    if (cachedNews && now - lastErrorTime < ERROR_COOLDOWN_MS) {
      return NextResponse.json({ success: true, news: cachedNews, cached: true });
    }

    // Use z-ai-web-dev-sdk to search for gold/coin news
    const zai = await ZAI.create();
    const result = await zai.functions.invoke('web_search', {
      query: 'اخبار طلا سکه ارز امروز',
      num: 8,
    });

    // Parse search results into news items
    const rawResults = result?.results || result?.data?.results || result || [];

    const news: NewsItem[] = Array.isArray(rawResults)
      ? rawResults.slice(0, 8).map((item: Record<string, string>) => {
          let source = item.source || item.domain || '';
          try {
            if (item.url) {
              const urlObj = new URL(item.url);
              source = urlObj.hostname.replace('www.', '');
            }
          } catch {
            // URL parse failed, use source as-is
          }

          return {
            title: item.title || '',
            url: item.url || '#',
            snippet: item.snippet || item.description || item.body || '',
            source,
            date: item.date || item.publishedDate || '',
          };
        })
      : [];

    // Update cache
    cachedNews = news.length > 0 ? news : STATIC_NEWS;
    cacheTimestamp = now;

    return NextResponse.json({ success: true, news: cachedNews });
  } catch (error) {
    lastErrorTime = Date.now();
    console.error('[News/Gold] Error fetching gold news (cooldown 10min):', error instanceof Error ? error.message : error);
    // Return cached or static news instead of failing
    const fallback = cachedNews || STATIC_NEWS;
    return NextResponse.json({ success: true, news: fallback, cached: true });
  }
}
