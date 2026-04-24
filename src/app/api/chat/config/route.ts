import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Config API — GET (get config) / PUT (update config)                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Default system prompt for Zarin Gold AI assistant */
const DEFAULT_SYSTEM_PROMPT =
  'تو دستیار هوشمند پشتیبانی زرین گلد هستی. به سوالات کاربران درباره خرید و فروش طلا، کیف پول، کارت طلایی، وام، حساب کاربری و سایر خدمات پاسخ بده. پاسخ‌ها باید مختصر، دوستانه و به زبان فارسی باشند.';

const DEFAULT_FALLBACK = 'متشکرم از پیام شما. به زودی یک اپراتور پاسخ خواهد داد.';
const DEFAULT_GREETING = 'سلام! 👋 من دستیار هوشمند زرین گلد هستم. چطور می‌تونم کمکتون کنم؟';
const DEFAULT_OFFLINE = 'در حال حاضر اپراتور آنلاین نیست. دستیار هوشمند در خدمت شماست.';

/**
 * GET /api/chat/config
 * Get the current AI chat configuration
 */
export async function GET() {
  try {
    let config = await db.chatAIConfig.findFirst();

    if (!config) {
      // Auto-create default config
      config = await db.chatAIConfig.create({
        data: {
          isEnabled: true,
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          fallbackMessage: DEFAULT_FALLBACK,
          maxHistory: 10,
          responseDelay: 2000,
          greetingMessage: DEFAULT_GREETING,
          offlineMessage: DEFAULT_OFFLINE,
        },
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('[Chat Config GET]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تنظیمات هوش مصنوعی' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/chat/config
 * Update the AI chat configuration
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { isEnabled, systemPrompt, fallbackMessage, maxHistory, responseDelay, greetingMessage, offlineMessage } = body;

    let config = await db.chatAIConfig.findFirst();

    if (!config) {
      // Create with provided values or defaults
      config = await db.chatAIConfig.create({
        data: {
          isEnabled: isEnabled !== undefined ? isEnabled : true,
          systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
          fallbackMessage: fallbackMessage || DEFAULT_FALLBACK,
          maxHistory: maxHistory || 10,
          responseDelay: responseDelay || 2000,
          greetingMessage: greetingMessage || DEFAULT_GREETING,
          offlineMessage: offlineMessage || DEFAULT_OFFLINE,
        },
      });
    } else {
      const updateData: Record<string, unknown> = {};

      if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
      if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
      if (fallbackMessage !== undefined) updateData.fallbackMessage = fallbackMessage;
      if (maxHistory !== undefined) updateData.maxHistory = maxHistory;
      if (responseDelay !== undefined) updateData.responseDelay = responseDelay;
      if (greetingMessage !== undefined) updateData.greetingMessage = greetingMessage;
      if (offlineMessage !== undefined) updateData.offlineMessage = offlineMessage;

      config = await db.chatAIConfig.update({
        where: { id: config.id },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('[Chat Config PUT]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی تنظیمات هوش مصنوعی' },
      { status: 500 }
    );
  }
}
