import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Reply API — POST (smart reply: FAQ match → LLM → fallback)           */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Normalize Persian text: remove diacritics, extra spaces, make lowercase */
function normalize(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic/Persian diacritics
    .replace(/[‌]/g, ' ')                    // Replace ZWNJ with space
    .replace(/\s+/g, ' ')                    // Collapse whitespace
    .trim()
    .toLowerCase();
}

/** Try to match user message against FAQ keywords */
async function matchFAQ(message: string): Promise<{ answer: string; faqId: string } | null> {
  const normalizedMsg = normalize(message);
  const words = normalizedMsg.split(' ').filter((w) => w.length > 1);

  if (words.length === 0) return null;

  // Fetch all active FAQs ordered by sort priority
  const faqs = await db.chatFAQ.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { views: 'desc' }],
  });

  let bestMatch: { faq: typeof faqs[0]; score: number } | null = null;

  for (const faq of faqs) {
    let score = 0;
    const keywords = faq.keywords
      .split(',')
      .map((k) => normalize(k.trim()))
      .filter(Boolean);

    // Check keyword matches
    for (const kw of keywords) {
      if (kw.length < 2) continue;
      if (normalizedMsg.includes(kw)) {
        score += 3; // Full keyword phrase match
      } else {
        // Partial: check if any word from message is in keyword
        const kwWords = kw.split(' ').filter((w) => w.length > 1);
        for (const kwWord of kwWords) {
          for (const msgWord of words) {
            if (msgWord === kwWord || msgWord.startsWith(kwWord) || kwWord.startsWith(msgWord)) {
              score += 1;
            }
          }
        }
      }
    }

    // Also check question field for keyword overlap
    const normalizedQuestion = normalize(faq.question);
    const questionWords = normalizedQuestion.split(' ').filter((w) => w.length > 1);
    for (const qw of questionWords) {
      if (words.includes(qw) || normalizedMsg.includes(qw)) {
        score += 1;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { faq, score };
    }
  }

  // Require a minimum score to consider it a match
  if (bestMatch && bestMatch.score >= 2) {
    // Increment view count
    await db.chatFAQ.update({
      where: { id: bestMatch.faq.id },
      data: { views: { increment: 1 } },
    });

    return {
      answer: bestMatch.faq.answer,
      faqId: bestMatch.faq.id,
    };
  }

  return null;
}

/** Get current AI config from DB */
async function getAIConfig() {
  let config = await db.chatAIConfig.findFirst();

  if (!config) {
    // Create default config if none exists
    config = await db.chatAIConfig.create({
      data: {
        isEnabled: true,
        systemPrompt:
          'تو دستیار هوشمند پشتیبانی زرین گلد هستی. به سوالات کاربران درباره خرید و فروش طلا، کیف پول، کارت طلایی، وام، حساب کاربری و سایر خدمات پاسخ بده. پاسخ‌ها باید مختصر، دوستانه و به زبان فارسی باشند.',
        fallbackMessage:
          'متشکرم از پیام شما. به زودی یک اپراتور پاسخ خواهد داد.',
        maxHistory: 10,
        responseDelay: 2000,
        greetingMessage:
          'سلام! 👋 من دستیار هوشمند زرین گلد هستم. چطور می‌تونم کمکتون کنم؟',
        offlineMessage:
          'در حال حاضر اپراتور آنلاین نیست. دستیار هوشمند در خدمت شماست.',
      },
    });
  }

  return config;
}

/**
 * POST /api/chat/ai-reply
 * Body: { message: string, userId?: string, context?: string }
 * Returns: { success: boolean, reply: string, source: 'faq' | 'ai' | 'fallback' }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, message: 'پیام الزامی است' },
        { status: 400 }
      );
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return NextResponse.json(
        { success: false, message: 'پیام نمی‌تواند خالی باشد' },
        { status: 400 }
      );
    }

    // Get AI config
    const config = await getAIConfig();

    if (!config.isEnabled) {
      return NextResponse.json({
        success: true,
        reply: config.fallbackMessage,
        source: 'fallback',
      });
    }

    // Step 1: Try FAQ keyword matching
    const faqMatch = await matchFAQ(trimmed);
    if (faqMatch) {
      return NextResponse.json({
        success: true,
        reply: faqMatch.answer,
        source: 'faq',
        faqId: faqMatch.faqId,
      });
    }

    // Step 2: Use LLM to generate response
    try {
      const userContext = context
        ? `\n\nاطلاعات اضافی کاربر: ${context}`
        : '';

      const systemPrompt = `${config.systemPrompt}

قوانین پاسخ‌دهی:
- همیشه به زبان فارسی پاسخ بده
- پاسخ‌ها مختصر و مفید باشند
- اگر سوال خارج از حوزه خدمات زرین گلد باشد، محترمانه توضیح بده
- اگر مطمئن نیستی، کاربر را به اپراتور انسانی ارجاع بده
- درباره خدمات: خرید و فروش طلا، کیف پول ریالی و طلایی، کارت طلایی، وام بر پایه طلا، انتقال طلا، هدیه طلا، سکه و شناسنامه طلا
- نرخ خرید و فروش طلا به صورت لحظه‌ای تغییر می‌کند
- کارمزد معاملات ۰.۵٪ است`;

      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${trimmed}${userContext}`,
        },
      ];

      const completion = await ZAI.chat.completions.create({
        model: 'default',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const reply =
        completion.choices?.[0]?.message?.content?.trim() ||
        config.fallbackMessage;

      return NextResponse.json({
        success: true,
        reply,
        source: 'ai',
      });
    } catch (aiError) {
      console.error('[Chat AI Reply LLM Error]', aiError);

      // Step 3: Fallback
      return NextResponse.json({
        success: true,
        reply: config.fallbackMessage,
        source: 'fallback',
      });
    }
  } catch (error) {
    console.error('[Chat AI Reply Error]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در پردازش پیام' },
      { status: 500 }
    );
  }
}
