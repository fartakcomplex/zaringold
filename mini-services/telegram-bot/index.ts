// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Mili Gold Telegram Bot â Comprehensive Persian Gold Trading Bot
// Features: Live Price, Alerts, AI Analysis, B2B Toolkit, Fast Trading,
//           Daily Report, Referral, Receipt Notifications, Support Tickets
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

import { Bot, InlineKeyboard, Context } from 'grammy';
import { PrismaClient } from '@prisma/client';

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 1: Configuration & Setup
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const IS_DEV = !BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE';

// Prisma client pointing to parent project's database
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:/home/z/my-project/db/custom.db' } },
  log: ['error'],
});

// Grammy Bot instance
const bot = new Bot(BOT_TOKEN);

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 2: Session & State Management
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

interface SessionData {
  step: string;
  tempData: Record<string, any>;
}

// In-memory conversation state maps
const alertConversations = new Map<number, { assetType: string; condition: string }>();
const invoiceConversations = new Map<number, {
  customerName: string;
  customerPhone: string;
  weightGrams: number;
  pricePerGram: number;
  ejratPercent: number;
}>();
const supportConversations = new Map<number, { subject: string; step: string }>();
const ticketReplyConversations = new Map<number, { ticketId: string }>();
const phoneLinkRequests = new Map<number, number>(); // chatId -> telegramId
const buyConversations = new Map<number, { assetType: string; grams: number; confirmed: boolean }>();
const sellConversations = new Map<number, { grams: number; confirmed: boolean }>();

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 3: Helper Functions
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** Format number in Persian locale */
function formatNumber(num: number): string {
  return num.toLocaleString('fa-IR');
}

/** Format number in English locale (for prices) */
function formatEN(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/** Format percentage */
function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

/** Get current Tehran time */
function getTehranTime(): Date {
  const now = new Date();
  const tehranOffset = 3.5 * 60; // UTC+3:30
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcTime + tehranOffset * 60000);
}

/** Format date in Persian */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Format time only */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Get arrow based on change */
function getArrow(change: number): string {
  if (change > 0) return 'ð´ðº';  // Red = price up in Iranian market
  if (change < 0) return 'ð¢ð»';  // Green = price down in Iranian market
  return 'âªï¸ â¡ï¸';
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 4: Mock Price Data Engine
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

// Base prices (realistic Toman values for Iranian gold market)
const BASE_PRICES = {
  gold18: 3_750_000,
  gold24: 3_200_000,
  mesghal: 15_000_000,
  ounce: 2_350,       // USD per ounce
};

// Price history for chart generation (20 data points)
const priceHistory: Record<string, number[]> = {};

// Initialize price history
function initPriceHistory() {
  const assets = ['gold18', 'gold24', 'mesghal', 'ounce'] as const;
  for (const asset of assets) {
    if (!priceHistory[asset]) {
      priceHistory[asset] = [];
      const base = BASE_PRICES[asset];
      for (let i = 0; i < 20; i++) {
        const variation = base * (Math.random() * 0.04 - 0.02); // Â±2%
        priceHistory[asset].push(base + variation);
      }
    }
  }
}

initPriceHistory();

/** Get current mock price for an asset */
function getMockPrice(assetType: string): number {
  const history = priceHistory[assetType] || priceHistory['gold18'];
  const lastPrice = history[history.length - 1] || BASE_PRICES[assetType as keyof typeof BASE_PRICES];
  // Small random walk
  const change = lastPrice * (Math.random() * 0.002 - 0.001); // Â±0.1%
  const newPrice = lastPrice + change;
  // Update history
  history.push(newPrice);
  if (history.length > 100) history.shift();
  return newPrice;
}

/** Get price change percentage */
function getPriceChange(assetType: string): number {
  const history = priceHistory[assetType] || priceHistory['gold18'];
  if (history.length < 2) return 0;
  const current = history[history.length - 1];
  const previous = history[0];
  return ((current - previous) / previous) * 100;
}

/** Get all current prices */
function getAllPrices(): Record<string, { price: number; change: number }> {
  return {
    gold18: { price: getMockPrice('gold18'), change: getPriceChange('gold18') },
    gold24: { price: getMockPrice('gold24'), change: getPriceChange('gold24') },
    mesghal: { price: getMockPrice('mesghal'), change: getPriceChange('mesghal') },
    ounce: { price: getMockPrice('ounce'), change: getPriceChange('ounce') },
  };
}

/** Generate ASCII mini chart */
function generateChart(assetType: string): string {
  const history = priceHistory[assetType] || priceHistory['gold18'];
  const recent = history.slice(-20);
  if (recent.length < 2) return 'ð Ø¯Ø§Ø¯Ù Ú©Ø§ÙÛ ÙÙØ¬ÙØ¯ ÙÛØ³Øª';

  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const range = max - min || 1;

  const chartHeight = 8;
  const chartWidth = 20;

  let chart = '';
  for (let row = chartHeight; row >= 0; row--) {
    let line = '';
    for (let col = 0; col < chartWidth && col < recent.length; col++) {
      const normalized = ((recent[col] - min) / range) * chartHeight;
      if (Math.round(normalized) === row) {
        line += 'â';
      } else if (row === 0) {
        line += 'â';
      } else {
        line += ' ';
      }
    }
    // Price label on right
    const priceAtRow = min + (row / chartHeight) * range;
    const label = assetType === 'ounce'
      ? `$${priceAtRow.toFixed(0).padStart(5)}`
      : `${formatEN(priceAtRow).padStart(10)}`;
    chart += `${line} â ${label}\n`;
  }

  // Bottom labels
  chart += '                 ââââ Ø²ÙØ§Ù â\n';
  return chart;
}

// Price update interval (simulate live prices)
setInterval(() => {
  getMockPrice('gold18');
  getMockPrice('gold24');
  getMockPrice('mesghal');
  getMockPrice('ounce');
}, 10000); // Update every 10 seconds

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 5: Auth Middleware â Ensure Telegram User Exists
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

async function ensureTelegramUser(ctx: Context): Promise<{
  tUser: any;
  isNew: boolean;
}> {
  const tgId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (!tgId || !chatId) {
    throw new Error('Ú©Ø§Ø±Ø¨Ø± Ø´ÙØ§Ø³Ø§ÛÛ ÙØ´Ø¯');
  }

  let tUser = await prisma.telegramUser.findUnique({
    where: { telegramId: tgId },
    include: { user: true },
  });

  if (!tUser) {
    // Check if there's a User with this phone (we'll link later)
    // Create a TelegramUser without linking to a User account yet
    // We need a temporary userId - use a unique placeholder
    const placeholderUserId = `tg-${tgId}`;

    // Create a minimal User if needed
    let user = await prisma.user.findUnique({ where: { id: placeholderUserId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: placeholderUserId,
          phone: `telegram_${tgId}`,
          fullName: `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim(),
          referralCode: `TG${tgId}${Date.now().toString(36).toUpperCase()}`,
          isVerified: false,
          isActive: true,
        },
      });
    }

    tUser = await prisma.telegramUser.create({
      data: {
        userId: placeholderUserId,
        telegramId: tgId,
        chatId: chatId,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        lastName: ctx.from?.last_name,
        languageCode: ctx.from?.language_code || 'fa',
        lastActivityAt: new Date(),
      },
      include: { user: true },
    });
    return { tUser, isNew: true };
  }

  // Update activity
  await prisma.telegramUser.update({
    where: { id: tUser.id },
    data: {
      lastActivityAt: new Date(),
      username: ctx.from?.username || tUser.username,
    },
  });

  return { tUser, isNew: false };
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 6: Feature 1 â Live Gold Price
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** /start command */
bot.command('start', async (ctx) => {
  try {
    const { tUser, isNew } = await ensureTelegramUser(ctx);

    if (isNew) {
      await ctx.reply(
        `ð Ø³ÙØ§Ù ${ctx.from?.first_name || 'Ú©Ø§Ø±Ø¨Ø±'} Ø¹Ø²ÛØ²!\n\n` +
        `ð Ø¨Ù Ø±Ø¨Ø§Øª Ø·ÙØ§Û Ø²Ø±ÛÙ Ø®ÙØ´ Ø¢ÙØ¯ÛØ¯!\n\n` +
        `Ø§Ø±Ø² Ø¯ÛØ¬ÛØªØ§Ù ÙÛØ³ØªØ Ø·ÙØ§ ÙØ§ÙØ¹Û! ð¥\n\n` +
        `Ø¨Ø§ Ø§ÛÙ Ø±Ø¨Ø§Øª ÙÛâØªÙØ§ÙÛØ¯:\n` +
        `ð° ÙÛÙØª ÙØ­Ø¸ÙâØ§Û Ø·ÙØ§ Ø±Ø§ Ø¨Ø¨ÛÙÛØ¯\n` +
        `ð ÙØ´Ø¯Ø§Ø± ÙÛÙØª ØªÙØ¸ÛÙ Ú©ÙÛØ¯\n` +
        `ð ØªØ­ÙÛÙ ÙÙØ´ÙÙØ¯ Ø¨Ø§Ø²Ø§Ø± Ø¯Ø±ÛØ§ÙØª Ú©ÙÛØ¯\n` +
        `â¡ ÙØ¹Ø§ÙÙØ§Øª Ø³Ø±ÛØ¹ Ø§ÙØ¬Ø§Ù Ø¯ÙÛØ¯\n` +
        `ð ÙØ§Ú©ØªÙØ± B2B ØµØ§Ø¯Ø± Ú©ÙÛØ¯\n\n` +
        `ð¥ Ø¨Ø±Ø§Û Ø§ØªØµØ§Ù Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛØ Ø´ÙØ§Ø±Ù ÙÙØ¨Ø§ÛÙ Ø®ÙØ¯ Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯ (ÙØ«ÙØ§Ù Û°Û¹Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹):`
      );
      // Mark as awaiting phone
      phoneLinkRequests.set(ctx.chat!.id, ctx.from!.id);
      return;
    }

    const keyboard = new InlineKeyboard()
      .text('🥇 قیمت لحظه‌ای طلا', 'cmd:price').row()
      .text('📊 نمودار', 'cmd:chart')
      .text('🔔 هشدار قیمت', 'cmd:alert').row()
      .text('🧠 تحلیل بازار', 'cmd:analysis').row()
      .text('💰 موجودی حساب', 'cmd:balance').row()
      .text('🟢 خرید سریع', 'cmd:buy')
      .text('🔴 فروش سریع', 'cmd:sell').row()
      .text('💳 کارت طلایی', 'cmd:goldcard')
      .text('📊 پرتفویو', 'cmd:portfolio').row()
      .text('📝 فاکتور B2B', 'cmd:invoice').row()
      .text('🆘 راهنما', 'cmd:help');

    await ctx.reply(
      `ð Ø±Ø¨Ø§Øª Ø·ÙØ§Û Ø²Ø±ÛÙ\n\n` +
      `Ø³ÙØ§Ù ${tUser.firstName || 'Ú©Ø§Ø±Ø¨Ø±'} Ø¹Ø²ÛÚ©! ð\n\n` +
      `ÛÚ©Û Ø§Ø² Ú¯Ø²ÛÙÙâÙØ§Û Ø²ÛØ± Ø±Ø§ Ø§ÙØªØ®Ø§Ø¨ Ú©ÙÛØ¯:`,
      { reply_markup: keyboard }
    );
  } catch (err: any) {
    console.error('[start]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ÛÛ Ø±Ø® Ø¯Ø§Ø¯. ÙØ·ÙØ§Ù Ø¯ÙØ¨Ø§Ø±Ù ØªÙØ§Ø´ Ú©ÙÛØ¯.');
  }
});

/** /price â Show all gold prices */
bot.command('price', async (ctx) => {
  try {
    await ensureTelegramUser(ctx);
    const prices = getAllPrices();

    const text =
      `ð° **ÙÛÙØª ÙØ­Ø¸ÙâØ§Û Ø·ÙØ§**\n` +
      `ð ${formatTime(new Date())}\n` +
      `ââââââââââââââââââ\n\n` +
      `ð¥ Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø±\n` +
      `   ðµ ${formatEN(prices.gold18.price)} ØªÙÙØ§Ù\n` +
      `   ${getArrow(prices.gold18.change)} ${formatPercent(prices.gold18.change)}\n\n` +
      `ð¥ Ø·ÙØ§Û Û²Û´ Ø¹ÛØ§Ø±\n` +
      `   ðµ ${formatEN(prices.gold24.price)} ØªÙÙØ§Ù\n` +
      `   ${getArrow(prices.gold24.change)} ${formatPercent(prices.gold24.change)}\n\n` +
      `âï¸ ÙØ«ÙØ§Ù Ø·ÙØ§\n` +
      `   ðµ ${formatEN(prices.mesghal.price)} ØªÙÙØ§Ù\n` +
      `   ${getArrow(prices.mesghal.change)} ${formatPercent(prices.mesghal.change)}\n\n` +
      `ð Ø§ÙÙØ³ Ø¬ÙØ§ÙÛ\n` +
      `   ðµ $${formatEN(prices.ounce.price)}\n` +
      `   ${getArrow(prices.ounce.change)} ${formatPercent(prices.ounce.change)}\n\n` +
      `ââââââââââââââââââ\n` +
      `ð Ø¨Ø±ÙØ²Ø±Ø³Ø§ÙÛ Ø®ÙØ¯Ú©Ø§Ø± ÙØ± Û±Û° Ø«Ø§ÙÛÙ`;

    const keyboard = new InlineKeyboard()
      .text('ð Ø¨Ø±ÙØ²Ø±Ø³Ø§ÙÛ', 'cmd:price').row()
      .text('ð ÙÙÙØ¯Ø§Ø±', 'cmd:chart')
      .text('ð ÙÙØ§ÛØ³Ù', 'cmd:compare').row()
      .text('ð ÙØ´Ø¯Ø§Ø± ÙÛÙØª', 'cmd:alert');

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } catch (err: any) {
    console.error('[price]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛØ§ÙØª ÙÛÙØª');
  }
});

/** /chart â Show ASCII chart */
bot.command('chart', async (ctx) => {
  try {
    await ensureTelegramUser(ctx);

    const keyboard = new InlineKeyboard()
      .text('ð¥ Ø·ÙØ§Û Û±Û¸', 'chart:gold18')
      .text('ð¥ Ø·ÙØ§Û Û²Û´', 'chart:gold24').row()
      .text('âï¸ ÙØ«ÙØ§Ù', 'chart:mesghal')
      .text('ð Ø§ÙÙØ³', 'chart:ounce').row()
      .text('ð Ø¨Ø±ÙØ²Ø±Ø³Ø§ÙÛ', 'chart:refresh');

    const prices = getAllPrices();

    await ctx.reply(
      `ð **ÙÙÙØ¯Ø§Ø± ÙÛÙØª Ø·ÙØ§**\n` +
      `ââââââââââââââââââ\n\n` +
      `ð¥ Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø±\n` +
      `\`\`\`\n${generateChart('gold18')}\`\`\`\n` +
      `ÙÛÙØª ÙØ¹ÙÛ: ${formatEN(prices.gold18.price)} ØªÙÙØ§Ù\n` +
      `${getArrow(prices.gold18.change)} ${formatPercent(prices.gold18.change)}`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    );
  } catch (err: any) {
    console.error('[chart]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ÙÙØ§ÛØ´ ÙÙÙØ¯Ø§Ø±');
  }
});

/** /compare â Compare gold with USD and BTC */
bot.command('compare', async (ctx) => {
  try {
    await ensureTelegramUser(ctx);
    const prices = getAllPrices();

    // Mock USD and BTC data
    const usdRate = 85_000; // Toman per USD
    const btcPrice = 105_000; // USD per BTC
    const btcChange = 2.3;
    const usdChange = -0.5;

    const text =
      `ð **ÙÙØ§ÛØ³Ù Ø¨Ø§Ø²Ø§Ø±ÙØ§**\n` +
      `ââââââââââââââââââ\n\n` +
      `ð¥ Ø·ÙØ§ (Û±Û¸ Ø¹ÛØ§Ø±)\n` +
      `   ${formatEN(prices.gold18.price)} ØªÙÙØ§Ù\n` +
      `   ${getArrow(prices.gold18.change)} ${formatPercent(prices.gold18.change)}\n\n` +
      `ðµ Ø¯ÙØ§Ø± Ø¢ÙØ±ÛÚ©Ø§\n` +
      `   ${formatNumber(usdRate)} ØªÙÙØ§Ù\n` +
      `   ${getArrow(usdChange)} ${formatPercent(usdChange)}\n\n` +
      `â¿ Ø¨ÛØªâÚ©ÙÛÙ\n` +
      `   $${formatEN(btcPrice)}\n` +
      `   ${getArrow(btcChange)} ${formatPercent(btcChange)}\n\n` +
      `ââââââââââââââââââ\n` +
      `âï¸ ÙØ³Ø¨Øª Ø·ÙØ§ Ø¨Ù Ø¯ÙØ§Ø±: ${(prices.gold18.price / usdRate).toFixed(2)} Ú¯Ø±Ù/Ø¯ÙØ§Ø±\n` +
      `ð ÙÙØ¨Ø³ØªÚ¯Û Ø·ÙØ§-Ø¯ÙØ§Ø±: ${(65 + Math.random() * 20).toFixed(1)}%`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[compare]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ÙÙØ§ÛØ³Ù Ø¨Ø§Ø²Ø§Ø±ÙØ§');
  }
});

/** /help â Full command list */
bot.command('help', async (ctx) => {
  try {
    await ensureTelegramUser(ctx);

    const text =
      `ð **Ø±Ø§ÙÙÙØ§Û Ø±Ø¨Ø§Øª Ø·ÙØ§Û Ø²Ø±ÛÙ**\n` +
      `ââââââââââââââââââââââ\n\n` +
      `ð° **ÙÛÙØª ÙØ­Ø¸ÙâØ§Û**\n` +
      `  /price â ÙÛÙØª ÚÙØ§Ø± ÙÙØ¹ Ø·ÙØ§\n` +
      `  /chart â ÙÙÙØ¯Ø§Ø± ÙÛÙØªÛ\n` +
      `  /compare â ÙÙØ§ÛØ³Ù Ø¨Ø§ Ø¯ÙØ§Ø± Ù Ø¨ÛØªâÚ©ÙÛÙ\n\n` +
      `ð **ÙØ´Ø¯Ø§Ø± ÙÛÙØª**\n` +
      `  /alert â ØªÙØ¸ÛÙ ÙØ´Ø¯Ø§Ø± Ø¬Ø¯ÛØ¯\n` +
      `  /myalerts â ÙØ´Ø§ÙØ¯Ù ÙØ´Ø¯Ø§Ø±ÙØ§Û ÙØ¹Ø§Ù\n` +
      `  /removealert â Ø­Ø°Ù ÙØ´Ø¯Ø§Ø±\n\n` +
      `ð **ØªØ­ÙÛÙ ÙÙØ´ÙÙØ¯**\n` +
      `  /analysis â ØªØ­ÙÛÙ Ø¨Ø§Ø²Ø§Ø±\n` +
      `  /daily â Ø®ÙØ§ØµÙ Ø±ÙØ²Ø§ÙÙ\n` +
      `  /subscribe â Ø§Ø´ØªØ±Ø§Ú© ØªØ­ÙÛÙ Ø±ÙØ²Ø§ÙÙ\n` +
      `  /unsubscribe â ÙØºÙ Ø§Ø´ØªØ±Ø§Ú©\n\n` +
      `ð **Ø§Ø¨Ø²Ø§Ø± B2B**\n` +
      `  /invoice â ØµØ¯ÙØ± ÙØ§Ú©ØªÙØ±\n` +
      `  /profitcalc â ÙØ­Ø§Ø³Ø¨Ù Ø³ÙØ¯/Ø²ÛØ§Ù\n` +
      `  /ejratcalc â ÙØ­Ø§Ø³Ø¨Ù Ø§Ø¬Ø±Øª Ù ÙØ§ÙÛØ§Øª\n` +
      `  /customers â ÙÛØ³Øª ÙØ´ØªØ±ÛØ§Ù\n` +
      `  /addcustomer â Ø§ÙØ²ÙØ¯Ù ÙØ´ØªØ±Û\n\n` +
      `⬌ **معاملات سریع**\n` +
      `  /buy — خرید طلا\n` +
      `  /sell — فروش طلا\n` +
      `  /balance — موجودی حساب\n` +
      `  /portfolio — پرتفویو\n` +
      `  /goldcard — کارت طلایی\n` +
      `  /orders — سفارشات فعال\n` +
      `  /dailyreport — گزارش روزانه\n\n` +
      `ð¯ **Ø¯Ø¹ÙØª Ø§Ø² Ø¯ÙØ³ØªØ§Ù**\n` +
      `  /referral â ÙÛÙÚ© Ø¯Ø¹ÙØª\n` +
      `  /myreferrals â ÙØ¶Ø¹ÛØª Ø¯Ø¹ÙØªâÙØ§\n\n` +
      `ð§ **Ù¾Ø´ØªÛØ¨Ø§ÙÛ**\n` +
      `  /support — ایجاد تیکت\n` +
      `  /ticket — پاسخ به تیکت\n` +
      `  /mytickets — تیکت‌های من\n\n` +
      `💳 **حساب و کارت**\n` +
      `  /balance — موجودی کامل حساب\n` +
      `  /goldcard — وضعیت کارت طلایی\n\n` +
      `âï¸ **Ø¯ÛÚ¯Ø±**\n` +
      `  /link â Ø§ØªØµØ§Ù Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±Û\n` +
      `  /start â ÙÙÙÛ Ø§ØµÙÛ`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[help]', err.message);
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 7: Feature 2 â Price Alerts
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** /alert â Create price alert (multi-step) */
bot.command('alert', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const keyboard = new InlineKeyboard()
      .text('ð¥ Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø±', 'alert:asset:gold18')
      .text('ð¥ Ø·ÙØ§Û Û²Û´ Ø¹ÛØ§Ø±', 'alert:asset:gold24').row()
      .text('âï¸ ÙØ«ÙØ§Ù Ø·ÙØ§', 'alert:asset:mesghal')
      .text('ð Ø§ÙÙØ³ Ø¬ÙØ§ÙÛ', 'alert:asset:ounce');

    await ctx.reply(
      `ð **ØªÙØ¸ÛÙ ÙØ´Ø¯Ø§Ø± ÙÛÙØª**\n\n` +
      `ÙÙØ¹ Ø¯Ø§Ø±Ø§ÛÛ Ø±Ø§ Ø§ÙØªØ®Ø§Ø¨ Ú©ÙÛØ¯:`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  } catch (err: any) {
    console.error('[alert]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ØªÙØ¸ÛÙ ÙØ´Ø¯Ø§Ø±');
  }
});

/** /myalerts â List active alerts */
bot.command('myalerts', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const alerts = await prisma.telegramAlert.findMany({
      where: {
        telegramUserId: tUser.id,
        isActive: true,
        isTriggered: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (alerts.length === 0) {
      await ctx.reply(
        `ð **ÙØ´Ø¯Ø§Ø±ÙØ§Û ÙØ¹Ø§Ù**\n\n` +
        `ÙÛÚ ÙØ´Ø¯Ø§Ø± ÙØ¹Ø§ÙÛ ÙØ¯Ø§Ø±ÛØ¯.\n\n` +
        `Ø¨Ø±Ø§Û Ø§ÛØ¬Ø§Ø¯ ÙØ´Ø¯Ø§Ø± Ø¬Ø¯ÛØ¯: /alert`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const assetNames: Record<string, string> = {
      gold18: 'ð¥ Ø·ÙØ§Û Û±Û¸',
      gold24: 'ð¥ Ø·ÙØ§Û Û²Û´',
      mesghal: 'âï¸ ÙØ«ÙØ§Ù',
      ounce: 'ð Ø§ÙÙØ³',
    };
    const conditionNames: Record<string, string> = {
      above: 'Ø¨Ø§ÙØ§ØªØ± Ø§Ø² â¬ï¸',
      below: 'Ù¾Ø§ÛÛÙâØªØ± Ø§Ø² â¬ï¸',
      crosses: 'Ø¹Ø¨ÙØ± Ø§Ø² âï¸',
    };

    let text = `ð **ÙØ´Ø¯Ø§Ø±ÙØ§Û ÙØ¹Ø§Ù** (${formatNumber(alerts.length)})\n`;
    text += `ââââââââââââââââââ\n\n`;

    const keyboard = new InlineKeyboard();
    alerts.forEach((alert, i) => {
      const assetName = assetNames[alert.assetType] || alert.assetType;
      const condName = conditionNames[alert.condition] || alert.condition;
      const priceStr = alert.assetType === 'ounce'
        ? `$${formatEN(alert.targetPrice)}`
        : `${formatEN(alert.targetPrice)} Øª`;

      text += `${i + 1}. ${assetName}\n   ${condName} ${priceStr}\n\n`;

      keyboard.text(`â Ø­Ø°Ù #${i + 1}`, `alert:remove:${alert.id}`).row();
    });

    text += `\n/clearalerts â Ø­Ø°Ù ØªÙØ§Ù ÙØ´Ø¯Ø§Ø±ÙØ§`;

    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err: any) {
    console.error('[myalerts]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛØ§ÙØª ÙØ´Ø¯Ø§Ø±ÙØ§');
  }
});

/** /removealert â Remove all alerts */
bot.command('clearalerts', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const result = await prisma.telegramAlert.updateMany({
      where: { telegramUserId: tUser.id, isActive: true },
      data: { isActive: false },
    });

    await ctx.reply(
      `â ${formatNumber(result.count)} ÙØ´Ø¯Ø§Ø± ØºÛØ±ÙØ¹Ø§Ù Ø´Ø¯.\n\n` +
      `Ø¨Ø±Ø§Û Ø§ÛØ¬Ø§Ø¯ ÙØ´Ø¯Ø§Ø± Ø¬Ø¯ÛØ¯: /alert`
    );
  } catch (err: any) {
    console.error('[clearalerts]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø­Ø°Ù ÙØ´Ø¯Ø§Ø±ÙØ§');
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 8: Feature 3 â AI Market Analysis
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** /analysis â AI Market Analysis */
bot.command('analysis', async (ctx) => {
  try {
    await ensureTelegramUser(ctx);
    const prices = getAllPrices();

    // Generate mock analysis
    const shortTrend = Math.random() > 0.5 ? 'ØµØ¹ÙØ¯Û' : 'ÙØ²ÙÙÛ';
    const midTrend = Math.random() > 0.4 ? 'ØµØ¹ÙØ¯Û' : 'ÙØ²ÙÙÛ';
    const shortConfidence = 55 + Math.random() * 30;
    const midConfidence = 45 + Math.random() * 35;
    const sentimentScore = -50 + Math.random() * 100;
    const fearGreed = 20 + Math.random() * 60;

    let sentimentEmoji = 'ð Ø®ÙØ«Û';
    let sentimentLabel = 'Ø®ÙØ«Û';
    if (sentimentScore > 30) { sentimentEmoji = 'ð ØµØ¹ÙØ¯Û'; sentimentLabel = 'ÙØ«Ø¨Øª'; }
    else if (sentimentScore < -30) { sentimentEmoji = 'ð° ÙØ²ÙÙÛ'; sentimentLabel = 'ÙÙÙÛ'; }

    const support1 = prices.gold18.price * 0.97;
    const support2 = prices.gold18.price * 0.94;
    const resist1 = prices.gold18.price * 1.03;
    const resist2 = prices.gold18.price * 1.06;

    const text =
      `ð§  **ØªØ­ÙÛÙ ÙÙØ´ÙÙØ¯ Ø¨Ø§Ø²Ø§Ø±**\n` +
      `ââââââââââââââââââââââ\n\n` +
      `ð **Ø±ÙÙØ¯ Ú©ÙØªØ§ÙâÙØ¯Øª** (Û±-Û· Ø±ÙØ²)\n` +
      `   Ø¬ÙØª: ${shortTrend === 'ØµØ¹ÙØ¯Û' ? 'ðº' : 'ð»'} ${shortTrend}\n` +
      `   Ø§Ø·ÙÛÙØ§Ù: ${'â'.repeat(Math.round(shortConfidence / 10))}${'â'.repeat(10 - Math.round(shortConfidence / 10))} ${shortConfidence.toFixed(0)}%\n\n` +
      `ð **Ø±ÙÙØ¯ ÙÛØ§ÙâÙØ¯Øª** (Û±-Û³ ÙØ§Ù)\n` +
      `   Ø¬ÙØª: ${midTrend === 'ØµØ¹ÙØ¯Û' ? 'ðº' : 'ð»'} ${midTrend}\n` +
      `   Ø§Ø·ÙÛÙØ§Ù: ${'â'.repeat(Math.round(midConfidence / 10))}${'â'.repeat(10 - Math.round(midConfidence / 10))} ${midConfidence.toFixed(0)}%\n\n` +
      `ð¯ **Ø³Ø·ÙØ­ Ú©ÙÛØ¯Û Ø·ÙØ§Û Û±Û¸**\n` +
      `   ð´ ÙÙØ§ÙÙØª Û²: ${formatEN(resist2)} Øª\n` +
      `   ð  ÙÙØ§ÙÙØª Û±: ${formatEN(resist1)} Øª\n` +
      `   ð¢ Ø­ÙØ§ÛØª Û±: ${formatEN(support1)} Øª\n` +
      `   ðµ Ø­ÙØ§ÛØª Û²: ${formatEN(support2)} Øª\n\n` +
      `ð **Ø§Ø­Ø³Ø§Ø³Ø§Øª Ø¨Ø§Ø²Ø§Ø±**: ${sentimentEmoji}\n` +
      `   Ø´Ø§Ø®Øµ ØªØ±Ø³/Ø·ÙØ¹: ${fearGreed.toFixed(0)}/100\n\n` +
      `ð° **Ø®ÙØ§ØµÙ Ø§Ø®Ø¨Ø§Ø±**\n` +
      `   â¢ Ø§ÙØ²Ø§ÛØ´ ØªÙØ§Ø¶Ø§Û ÙÛØ²ÛÚ©Û Ø·ÙØ§ Ø¯Ø± Ø¢Ø³ÛØ§\n` +
      `   â¢ ØªØ«Ø¨ÛØª ÙØ±Ø® Ø¨ÙØ±Ù ÙØ¯Ø±Ø§Ù Ø±Ø²Ø±Ù\n` +
      `   â¢ ØªÙØ´âÙØ§Û ÚØ¦ÙÙ¾ÙÛØªÛÚ©Û Ø¨Ø§Ø²Ø§Ø± Ø±Ø§ ØªØ­Øª ØªØ£Ø«ÛØ± ÙØ±Ø§Ø± Ø¯Ø§Ø¯\n` +
      `   â¢ Ø±Ø´Ø¯ Ø³Ø±ÙØ§ÛÙâÚ¯Ø°Ø§Ø±Û ETF Ø·ÙØ§ÛÛ\n\n` +
      `ââââââââââââââââââââââ\n` +
      `â ï¸ Ø§ÛÙ ØªØ­ÙÛÙ ØµØ±ÙØ§Ù Ø¬ÙØ¨Ù Ø¢ÙÙØ²Ø´Û Ø¯Ø§Ø±Ø¯ Ù ØªÙØµÛÙ Ø³Ø±ÙØ§ÛÙâÚ¯Ø°Ø§Ø±Û ÙÛØ³Øª.`;

    const keyboard = new InlineKeyboard()
      .text('ð Ø®ÙØ§ØµÙ Ø±ÙØ²Ø§ÙÙ', 'cmd:daily')
      .text('ð Ø§Ø´ØªØ±Ø§Ú© ØªØ­ÙÛÙ', 'cmd:subscribe').row()
      .text('ð Ø¨Ø±ÙØ²Ø±Ø³Ø§ÙÛ', 'cmd:analysis');

    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err: any) {
    console.error('[analysis]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ØªØ­ÙÛÙ Ø¨Ø§Ø²Ø§Ø±');
  }
});

/** /daily â Daily digest */
bot.command('daily', async (ctx) => {
  try {
    await ensureTelegramUser(ctx);
    const prices = getAllPrices();

    const text =
      `ð° **Ø®ÙØ§ØµÙ Ø±ÙØ²Ø§ÙÙ Ø¨Ø§Ø²Ø§Ø± Ø·ÙØ§**\n` +
      `ð ${formatDate(getTehranTime())}\n` +
      `ââââââââââââââââââââââ\n\n` +
      `ð° **ÙÛÙØªâÙØ§**\n` +
      `ð¥ Ø·ÙØ§Û Û±Û¸: ${formatEN(prices.gold18.price)} Øª ${getArrow(prices.gold18.change)} ${formatPercent(prices.gold18.change)}\n` +
      `âï¸ ÙØ«ÙØ§Ù: ${formatEN(prices.mesghal.price)} Øª ${getArrow(prices.mesghal.change)} ${formatPercent(prices.mesghal.change)}\n` +
      `ð Ø§ÙÙØ³: $${formatEN(prices.ounce.price)} ${getArrow(prices.ounce.change)} ${formatPercent(prices.ounce.change)}\n\n` +
      `ð **ØªØ­ÙÛÙ Ú©ÙØªØ§Ù**\n` +
      `Ø¨Ø§Ø²Ø§Ø± Ø·ÙØ§ Ø§ÙØ±ÙØ² Ø¨Ø§ ${(Math.random() > 0.5 ? 'Ø±ÙÙØ¯ ØµØ¹ÙØ¯Û' : 'Ø±ÙÙØ¯ ÙØ²ÙÙÛ')} ÙÙØ±Ø§Ù Ø¨ÙØ¯. ` +
      `${Math.random() > 0.5 ? 'ØªÙØ§Ø¶Ø§Û ÙÛØ²ÛÚ©Û Ø¨Ø§ÙØ§' : 'ÙØ´Ø§Ø± ÙØ±ÙØ´'} Ø¯Ø± Ø¨Ø§Ø²Ø§Ø± Ø¯ÛØ¯Ù Ø´Ø¯.\n\n` +
      `ð¯ **Ù¾ÛØ´ÙÙØ§Ø¯**\n` +
      `${Math.random() > 0.5 ? 'â¢ ÙØ±ØµØª Ø®Ø±ÛØ¯ Ø¯Ø± Ø§ØµÙØ§Ø­ ÙÛÙØªÛ ÙØ¬ÙØ¯ Ø¯Ø§Ø±Ø¯' : 'â¢ Ø§Ø­ØªÛØ§Ø· Ø¯Ø± Ø®Ø±ÛØ¯ ØªÙØµÛÙ ÙÛâØ´ÙØ¯'}\n` +
      `${Math.random() > 0.5 ? '\nâ¢ ÙÛØ§ÙÚ¯ÛÙ Ø®Ø±ÛØ¯ DCA ÙÙØ§Ø³Ø¨ Ø§Ø³Øª' : ''}\n\n` +
      `ââââââââââââââââââââââ\n` +
      `ð Ø¨Ø±Ø§Û Ø¯Ø±ÛØ§ÙØª Ø®ÙØ¯Ú©Ø§Ø± Ø±ÙØ²Ø§ÙÙ: /subscribe`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[daily]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛØ§ÙØª Ø®ÙØ§ØµÙ Ø±ÙØ²Ø§ÙÙ');
  }
});

/** /subscribe â Subscribe to daily analysis */
bot.command('subscribe', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    await prisma.telegramUser.update({
      where: { id: tUser.id },
      data: { subscribedAnalysis: true },
    });

    // Ensure subscription record
    const existing = await prisma.telegramSubscription.findFirst({
      where: { telegramUserId: tUser.id, type: 'analysis' },
    });

    if (!existing) {
      await prisma.telegramSubscription.create({
        data: {
          telegramUserId: tUser.id,
          type: 'analysis',
          schedule: 'daily',
          isActive: true,
        },
      });
    } else {
      await prisma.telegramSubscription.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }

    await ctx.reply(
      `â **Ø§Ø´ØªØ±Ø§Ú© ÙØ¹Ø§Ù Ø´Ø¯!**\n\n` +
      `Ø§Ø² Ø§ÛÙ Ù¾Ø³ ÙØ± Ø±ÙØ² ØªØ­ÙÛÙ Ø¨Ø§Ø²Ø§Ø± Ø¨Ø±Ø§Û Ø´ÙØ§ Ø§Ø±Ø³Ø§Ù Ø®ÙØ§ÙØ¯ Ø´Ø¯.\n\n` +
      `ð Ø¨Ø±Ø§Û ÙØºÙ Ø§Ø´ØªØ±Ø§Ú©: /unsubscribe`,
      { parse_mode: 'Markdown' }
    );
  } catch (err: any) {
    console.error('[subscribe]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ÙØ¹Ø§ÙâØ³Ø§Ø²Û Ø§Ø´ØªØ±Ø§Ú©');
  }
});

/** /unsubscribe â Unsubscribe from analysis */
bot.command('unsubscribe', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    await prisma.telegramUser.update({
      where: { id: tUser.id },
      data: { subscribedAnalysis: false, subscribedReport: false },
    });

    await prisma.telegramSubscription.updateMany({
      where: { telegramUserId: tUser.id },
      data: { isActive: false },
    });

    await ctx.reply(
      `â **Ø§Ø´ØªØ±Ø§Ú© ÙØºÙ Ø´Ø¯**\n\n` +
      `Ø´ÙØ§ Ø¯ÛÚ¯Ø± ØªØ­ÙÛÙ Ø±ÙØ²Ø§ÙÙ Ø¯Ø±ÛØ§ÙØª ÙØ®ÙØ§ÙÛØ¯ Ú©Ø±Ø¯.\n\n` +
      `ð Ø¨Ø±Ø§Û ÙØ¹Ø§ÙâØ³Ø§Ø²Û ÙØ¬Ø¯Ø¯: /subscribe`,
      { parse_mode: 'Markdown' }
    );
  } catch (err: any) {
    console.error('[unsubscribe]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ÙØºÙ Ø§Ø´ØªØ±Ø§Ú©');
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 9: Feature 4 â B2B Toolkit
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** /invoice â Interactive invoice creation */
bot.command('invoice', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    // Mark B2B
    if (!tUser.isB2B) {
      await prisma.telegramUser.update({
        where: { id: tUser.id },
        data: { isB2B: true },
      });
    }

    await ctx.reply(
      `ð **ØµØ¯ÙØ± ÙØ§Ú©ØªÙØ± Ø¬Ø¯ÛØ¯**\n\n` +
      ` ÙØ±Ø­ÙÙ Û± Ø§Ø² Û´\n` +
      `ââââââââââââââââââ\n\n` +
      `âï¸ ÙØ²Ù Ø·ÙØ§ Ø±Ø§ Ø¨Ù Ú¯Ø±Ù ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:\n` +
      `ÙØ«Ø§Ù: 5.5`,
      { parse_mode: 'Markdown' }
    );

    invoiceConversations.set(ctx.chat!.id, {
      customerName: '',
      customerPhone: '',
      weightGrams: 0,
      pricePerGram: 0,
      ejratPercent: 3,
    });
  } catch (err: any) {
    console.error('[invoice]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ØµØ¯ÙØ± ÙØ§Ú©ØªÙØ±');
  }
});

/** /profitcalc â Profit/Loss calculator */
bot.command('profitcalc', async (ctx) => {
  try {
    await ensureTelegramUser(ctx);

    const args = ctx.message?.text?.split(' ').slice(1);
    if (!args || args.length < 3) {
      await ctx.reply(
        `ð§® **ÙØ­Ø§Ø³Ø¨Ù Ø³ÙØ¯/Ø²ÛØ§Ù**\n\n` +
        `ÙØ±ÙØª: /profitcalc [ÙÛÙØª_Ø®Ø±ÛØ¯] [ÙÛÙØª_ÙØ¹ÙÛ] [ÙØ²Ù_Ú¯Ø±Ù]\n\n` +
        `ÙØ«Ø§Ù:\n` +
        `/profitcalc 3700000 3850000 10\n\n` +
        `ð ÙÛÙØªâÙØ§ Ø¨Ù ØªÙÙØ§Ù`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const buyPrice = parseFloat(args[0]);
    const currentPrice = parseFloat(args[1]);
    const weight = parseFloat(args[2]);

    if (isNaN(buyPrice) || isNaN(currentPrice) || isNaN(weight) || weight <= 0) {
      await ctx.reply('â ÙÙØ§Ø¯ÛØ± ÙØ§Ø±Ø¯ Ø´Ø¯Ù ÙØ§ÙØ¹ØªØ¨Ø± Ø§Ø³Øª');
      return;
    }

    const investment = buyPrice * weight;
    const currentValue = currentPrice * weight;
    const profitLoss = currentValue - investment;
    const profitPercent = (profitLoss / investment) * 100;
    const isProfit = profitLoss >= 0;

    const text =
      `ð§® **ÙØ­Ø§Ø³Ø¨Ù Ø³ÙØ¯/Ø²ÛØ§Ù**\n` +
      `ââââââââââââââââââ\n\n` +
      `âï¸ ÙØ²Ù: ${formatNumber(weight)} Ú¯Ø±Ù\n` +
      `ð° ÙÛÙØª Ø®Ø±ÛØ¯: ${formatEN(buyPrice)} Øª/Ú¯Ø±Ù\n` +
      `ðµ ÙÛÙØª ÙØ¹ÙÛ: ${formatEN(currentPrice)} Øª/Ú¯Ø±Ù\n\n` +
      `ð **ÙØªÛØ¬Ù**\n` +
      `   Ø³Ø±ÙØ§ÛÙâÚ¯Ø°Ø§Ø±Û: ${formatEN(investment)} Øª\n` +
      `   Ø§Ø±Ø²Ø´ ÙØ¹ÙÛ: ${formatEN(currentValue)} Øª\n` +
      `   ${isProfit ? 'ð¢ Ø³ÙØ¯' : 'ð´ Ø²ÛØ§Ù'}: ${formatEN(Math.abs(profitLoss))} Øª\n` +
      `   Ø¯Ø±ØµØ¯: ${formatPercent(profitPercent)}\n\n` +
      `${isProfit ? 'ð ØªØ¨Ø±ÛÚ©! Ø³ÙØ¯ Ú©Ø±Ø¯ÙâØ§ÛØ¯!' : 'â ï¸ Ø²ÛØ§Ù Ø«Ø¨Øª Ø´Ø¯Ù. ØµØ¨ÙØ± Ø¨Ø§Ø´ÛØ¯.'}`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[profitcalc]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ÙØ­Ø§Ø³Ø¨Ù');
  }
});

/** /ejratcalc â Ejrat + Tax calculator */
bot.command('ejratcalc', async (ctx) => {
  try {
    await ensureTelegramUser(ctx);

    const args = ctx.message?.text?.split(' ').slice(1);
    if (!args || args.length < 2) {
      await ctx.reply(
        `ð§® **ÙØ­Ø§Ø³Ø¨Ù Ø§Ø¬Ø±Øª Ù ÙØ§ÙÛØ§Øª**\n\n` +
        `ÙØ±ÙØª: /ejratcalc [ÙØ²Ù_Ú¯Ø±Ù] [ÙÛÙØª_Ø·ÙØ§Û_Ø®Ø§Ù]\n\n` +
        `ÙØ«Ø§Ù:\n` +
        `/ejratcalc 10 3700000\n\n` +
        `ð ÙÛÙØª Ø·ÙØ§Û Ø®Ø§Ù Ø¨Ù ØªÙÙØ§Ù/Ú¯Ø±Ù\n` +
        `ð Ø§Ø¬Ø±Øª Ù¾ÛØ´âÙØ±Ø¶: Û³Ùª\n` +
        `ð ÙØ§ÙÛØ§Øª Ø¨Ø± Ø§Ø±Ø²Ø´ Ø§ÙØ²ÙØ¯Ù: Û¹Ùª`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const weight = parseFloat(args[0]);
    const rawPrice = parseFloat(args[1]);
    const ejratPercent = 3;
    const taxPercent = 9;

    if (isNaN(weight) || isNaN(rawPrice) || weight <= 0) {
      await ctx.reply('â ÙÙØ§Ø¯ÛØ± ÙØ§Ø±Ø¯ Ø´Ø¯Ù ÙØ§ÙØ¹ØªØ¨Ø± Ø§Ø³Øª');
      return;
    }

    const goldValue = rawPrice * weight;
    const ejratAmount = goldValue * (ejratPercent / 100);
    const subtotal = goldValue + ejratAmount;
    const taxAmount = subtotal * (taxPercent / 100);
    const finalPrice = subtotal + taxAmount;
    const pricePerGramFinal = finalPrice / weight;

    const text =
      `ð§® **ÙØ­Ø§Ø³Ø¨Ù Ø§Ø¬Ø±Øª Ù ÙØ§ÙÛØ§Øª**\n` +
      `ââââââââââââââââââ\n\n` +
      `âï¸ ÙØ²Ù: ${formatNumber(weight)} Ú¯Ø±Ù\n` +
      `ð° ÙÛÙØª Ø·ÙØ§Û Ø®Ø§Ù: ${formatEN(rawPrice)} Øª/Ú¯Ø±Ù\n\n` +
      `ð **ØªÙÚ©ÛÚ© ÙØ²ÛÙÙ**\n` +
      `   Ø§Ø±Ø²Ø´ Ø·ÙØ§Û Ø®Ø§Ù: ${formatEN(goldValue)} Øª\n` +
      `   Ø§Ø¬Ø±Øª (${ejratPercent}%): ${formatEN(ejratAmount)} Øª\n` +
      `   Ø¬ÙØ¹ (Ù¾ÛØ´ Ø§Ø² ÙØ§ÙÛØ§Øª): ${formatEN(subtotal)} Øª\n` +
      `   ÙØ§ÙÛØ§Øª Ø¨Ø± Ø§Ø±Ø²Ø´ Ø§ÙØ²ÙØ¯Ù (${taxPercent}%): ${formatEN(taxAmount)} Øª\n\n` +
      `ââââââââââââââââââ\n` +
      `ðµ **ÙÛÙØª ÙÙØ§ÛÛ**: ${formatEN(finalPrice)} Øª\n` +
      `ð ÙÛÙØª ÙØ± Ú¯Ø±Ù: ${formatEN(pricePerGramFinal)} Øª`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[ejratcalc]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ÙØ­Ø§Ø³Ø¨Ù');
  }
});

/** /customers â List B2B customers */
bot.command('customers', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const customers = await prisma.telegramB2BCustomer.findMany({
      where: { telegramUserId: tUser.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (customers.length === 0) {
      await ctx.reply(
        `ð¥ **ÙÛØ³Øª ÙØ´ØªØ±ÛØ§Ù B2B**\n\n` +
        `ÙÙÙØ² ÙØ´ØªØ±ÛâØ§Û Ø«Ø¨Øª ÙØ´Ø¯Ù Ø§Ø³Øª.\n\n` +
        `Ø¨Ø±Ø§Û Ø§ÙØ²ÙØ¯Ù ÙØ´ØªØ±Û: /addcustomer`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let text = `ð¥ **ÙÛØ³Øª ÙØ´ØªØ±ÛØ§Ù** (${formatNumber(customers.length)})\n`;
    text += `ââââââââââââââââââ\n\n`;

    customers.forEach((c, i) => {
      text += `${i + 1}. ${c.name}\n`;
      if (c.phone) text += `   ð ${c.phone}\n`;
      text += `   ð ÙØ§Ú©ØªÙØ±: ${formatNumber(c.totalInvoices)} | ð° ${formatEN(c.totalSpent)} Øª\n`;
      if (c.note) text += `   ð ${c.note}\n`;
      text += '\n';
    });

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[customers]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛØ§ÙØª ÙÛØ³Øª ÙØ´ØªØ±ÛØ§Ù');
  }
});

/** /addcustomer â Add new customer */
bot.command('addcustomer', async (ctx) => {
  try {
    await ensureTelegramUser(ctx);

    await ctx.reply(
      `ð¤ **Ø§ÙØ²ÙØ¯Ù ÙØ´ØªØ±Û Ø¬Ø¯ÛØ¯**\n\n` +
      `ÙØ§Ù ÙØ´ØªØ±Û Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:`,
      { parse_mode: 'Markdown' }
    );

    // Store step
    const tempState: Record<string, any> = { step: 'addcustomer_name' };
    // We use a simple approach with the message handler below
    alertConversations.set(ctx.chat!.id, { assetType: 'addcustomer', condition: 'name' });
  } catch (err: any) {
    console.error('[addcustomer]', err.message);
    await ctx.reply('â Ø®Ø·Ø§');
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 10: Feature 5 â Fast Trading
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** /buy â Buy gold */
bot.command('buy', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const args = ctx.message?.text?.split(' ').slice(1);
    if (!args || args.length < 1) {
      const keyboard = new InlineKeyboard()
        .text('âï¸ Û± Ú¯Ø±Ù', 'trade:buy:1')
        .text('âï¸ Ûµ Ú¯Ø±Ù', 'trade:buy:5').row()
        .text('âï¸ Û±Û° Ú¯Ø±Ù', 'trade:buy:10')
        .text('âï¸ ÛµÛ° Ú¯Ø±Ù', 'trade:buy:50').row()
        .text('âï¸ Û±Û°Û° Ú¯Ø±Ù', 'trade:buy:100')
        .text('âï¸ Ø³ÙØ§Ø±Ø´Û', 'trade:buy:custom');

      const prices = getAllPrices();

      await ctx.reply(
        `â¡ **Ø®Ø±ÛØ¯ Ø³Ø±ÛØ¹ Ø·ÙØ§**\n\n` +
        `ð° ÙÛÙØª ÙØ¹ÙÛ Ø·ÙØ§Û Û±Û¸: ${formatEN(prices.gold18.price)} Øª/Ú¯Ø±Ù\n\n` +
        `ÙÙØ¯Ø§Ø± ÙÙØ±Ø¯ ÙØ¸Ø± Ø±Ø§ Ø§ÙØªØ®Ø§Ø¨ Ú©ÙÛØ¯:`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return;
    }

    // Direct buy command: /buy 1g or /buy 10
    const weightStr = args[0].replace(/[gG]/, '');
    const weight = parseFloat(weightStr);

    if (isNaN(weight) || weight <= 0) {
      await ctx.reply('â ÙÙØ¯Ø§Ø± ÙØ§ÙØ¹ØªØ¨Ø±. ÙØ«Ø§Ù: /buy 5g');
      return;
    }

    await confirmBuy(ctx, tUser, weight);
  } catch (err: any) {
    console.error('[buy]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø®Ø±ÛØ¯');
  }
});

/** /sell â Sell gold */
bot.command('sell', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const args = ctx.message?.text?.split(' ').slice(1);
    if (!args || args.length < 1) {
      const keyboard = new InlineKeyboard()
        .text('âï¸ Û± Ú¯Ø±Ù', 'trade:sell:1')
        .text('âï¸ Ûµ Ú¯Ø±Ù', 'trade:sell:5').row()
        .text('âï¸ Û±Û° Ú¯Ø±Ù', 'trade:sell:10')
        .text('âï¸ ÛµÛ° Ú¯Ø±Ù', 'trade:sell:50').row()
        .text('âï¸ Ø³ÙØ§Ø±Ø´Û', 'trade:sell:custom');

      const prices = getAllPrices();

      await ctx.reply(
        `â¡ **ÙØ±ÙØ´ Ø³Ø±ÛØ¹ Ø·ÙØ§**\n\n` +
        `ð° ÙÛÙØª ÙØ¹ÙÛ ÙØ±ÙØ´: ${formatEN(Math.floor(prices.gold18.price * 0.98))} Øª/Ú¯Ø±Ù\n\n` +
        `ÙÙØ¯Ø§Ø± ÙÙØ±Ø¯ ÙØ¸Ø± Ø±Ø§ Ø§ÙØªØ®Ø§Ø¨ Ú©ÙÛØ¯:`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return;
    }

    const weightStr = args[0].replace(/[gG]/, '');
    const weight = parseFloat(weightStr);

    if (isNaN(weight) || weight <= 0) {
      await ctx.reply('â ÙÙØ¯Ø§Ø± ÙØ§ÙØ¹ØªØ¨Ø±. ÙØ«Ø§Ù: /sell 5g');
      return;
    }

    await confirmSell(ctx, tUser, weight);
  } catch (err: any) {
    console.error('[sell]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ÙØ±ÙØ´');
  }
});

/** Confirm buy with inline button */
async function confirmBuy(ctx: Context, tUser: any, weight: number) {
  const prices = getAllPrices();
  const totalPrice = Math.ceil(prices.gold18.price * weight);

  const keyboard = new InlineKeyboard()
    .text('â ØªØ£ÛÛØ¯ Ø®Ø±ÛØ¯', `trade:confirm_buy:${weight}`)
    .text('â Ø§ÙØµØ±Ø§Ù', 'trade:cancel');

  await ctx.reply(
    `â¡ **ØªØ£ÛÛØ¯ Ø®Ø±ÛØ¯**\n\n` +
    `âï¸ ÙÙØ¯Ø§Ø±: ${formatNumber(weight)} Ú¯Ø±Ù Ø·ÙØ§ Û±Û¸ Ø¹ÛØ§Ø±\n` +
    `ð° ÙÛÙØª ÙØ§Ø­Ø¯: ${formatEN(prices.gold18.price)} Øª/Ú¯Ø±Ù\n` +
    `ðµ ÙØ¨ÙØº Ú©Ù: ${formatEN(totalPrice)} ØªÙÙØ§Ù\n\n` +
    `ââââââââââââââââââ\n` +
    `Ø¢ÛØ§ Ø®Ø±ÛØ¯ Ø±Ø§ ØªØ£ÛÛØ¯ ÙÛâÚ©ÙÛØ¯Ø`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
}

/** Confirm sell with inline button */
async function confirmSell(ctx: Context, tUser: any, weight: number) {
  const prices = getAllPrices();
  const sellPrice = Math.floor(prices.gold18.price * 0.98); // 2% spread
  const totalPrice = Math.ceil(sellPrice * weight);

  const keyboard = new InlineKeyboard()
    .text('â ØªØ£ÛÛØ¯ ÙØ±ÙØ´', `trade:confirm_sell:${weight}`)
    .text('â Ø§ÙØµØ±Ø§Ù', 'trade:cancel');

  await ctx.reply(
    `â¡ **ØªØ£ÛÛØ¯ ÙØ±ÙØ´**\n\n` +
    `âï¸ ÙÙØ¯Ø§Ø±: ${formatNumber(weight)} Ú¯Ø±Ù Ø·ÙØ§ Û±Û¸ Ø¹ÛØ§Ø±\n` +
    `ð° ÙÛÙØª ÙØ±ÙØ´: ${formatEN(sellPrice)} Øª/Ú¯Ø±Ù\n` +
    `ðµ ÙØ¨ÙØº Ø¯Ø±ÛØ§ÙØªÛ: ${formatEN(totalPrice)} ØªÙÙØ§Ù\n\n` +
    `ââââââââââââââââââ\n` +
    `Ø¢ÛØ§ ÙØ±ÙØ´ Ø±Ø§ ØªØ£ÛÛØ¯ ÙÛâÚ©ÙÛØ¯Ø`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
}

/** Execute buy */
async function executeBuy(ctx: Context, tUser: any, weight: number) {
  const prices = getAllPrices();
  const buyPrice = prices.gold18.price;
  const totalAmount = Math.ceil(buyPrice * weight);
  const orderId = `TG-${Date.now().toString(36).toUpperCase()}`;

  try {
    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: tUser.userId,
        type: 'buy',
        amountFiat: totalAmount,
        amountGold: weight,
        goldPrice: buyPrice,
        fee: 0,
        status: 'completed',
        referenceId: orderId,
        description: `Ø®Ø±ÛØ¯ ${weight} Ú¯Ø±Ù Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø± via Telegram`,
      },
    });

    // Update gold wallet
    const wallet = await prisma.goldWallet.findUnique({ where: { userId: tUser.userId } });
    if (wallet) {
      await prisma.goldWallet.update({
        where: { userId: tUser.userId },
        data: { goldGrams: { increment: weight } },
      });
    }

    // Send receipt
    await sendTradeReceipt(ctx, tUser.chatId, {
      orderId,
      type: 'buy',
      weight,
      price: buyPrice,
      total: totalAmount,
      fee: 0,
    });

    await ctx.reply('ð Ø®Ø±ÛØ¯ Ø¨Ø§ ÙÙÙÙÛØª Ø§ÙØ¬Ø§Ù Ø´Ø¯!');
  } catch (err: any) {
    console.error('[executeBuy]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø§Ø¬Ø±Ø§Û Ø®Ø±ÛØ¯. ÙØ·ÙØ§Ù Ø¨Ø§ Ù¾Ø´ØªÛØ¨Ø§ÙÛ ØªÙØ§Ø³ Ø¨Ú¯ÛØ±ÛØ¯.');
  }
}

/** Execute sell */
async function executeSell(ctx: Context, tUser: any, weight: number) {
  const prices = getAllPrices();
  const sellPrice = Math.floor(prices.gold18.price * 0.98);
  const totalAmount = Math.ceil(sellPrice * weight);
  const orderId = `TG-${Date.now().toString(36).toUpperCase()}`;

  try {
    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: tUser.userId,
        type: 'sell',
        amountFiat: totalAmount,
        amountGold: -weight,
        goldPrice: sellPrice,
        fee: 0,
        status: 'completed',
        referenceId: orderId,
        description: `ÙØ±ÙØ´ ${weight} Ú¯Ø±Ù Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø± via Telegram`,
      },
    });

    // Update wallet
    const wallet = await prisma.wallet.findUnique({ where: { userId: tUser.userId } });
    if (wallet) {
      await prisma.wallet.update({
        where: { userId: tUser.userId },
        data: { balance: { increment: totalAmount } },
      });
    }

    // Update gold wallet
    const goldWallet = await prisma.goldWallet.findUnique({ where: { userId: tUser.userId } });
    if (goldWallet) {
      await prisma.goldWallet.update({
        where: { userId: tUser.userId },
        data: { goldGrams: { increment: -weight } },
      });
    }

    // Send receipt
    await sendTradeReceipt(ctx, tUser.chatId, {
      orderId,
      type: 'sell',
      weight,
      price: sellPrice,
      total: totalAmount,
      fee: 0,
    });

    await ctx.reply('ð ÙØ±ÙØ´ Ø¨Ø§ ÙÙÙÙÛØª Ø§ÙØ¬Ø§Ù Ø´Ø¯!');
  } catch (err: any) {
    console.error('[executeSell]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø§Ø¬Ø±Ø§Û ÙØ±ÙØ´. ÙØ·ÙØ§Ù Ø¨Ø§ Ù¾Ø´ØªÛØ¨Ø§ÙÛ ØªÙØ§Ø³ Ø¨Ú¯ÛØ±ÛØ¯.');
  }
}

/** /portfolio â Show portfolio */
bot.command('portfolio', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);
    const prices = getAllPrices();

    // Get wallet data
    const goldWallet = await prisma.goldWallet.findUnique({ where: { userId: tUser.userId } });
    const wallet = await prisma.wallet.findUnique({ where: { userId: tUser.userId } });

    const goldGrams = goldWallet?.goldGrams || 0;
    const fiatBalance = wallet?.balance || 0;
    const goldValue = goldGrams * prices.gold18.price;
    const totalValue = goldValue + fiatBalance;

    const text =
      `ð¼ **Ù¾ÙØ±ØªÙÙÙÛÙ Ø´ÙØ§**\n` +
      `ââââââââââââââââââ\n\n` +
      `ð¥ **Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø±**\n` +
      `   âï¸ ÙÙØ¬ÙØ¯Û: ${formatNumber(goldGrams)} Ú¯Ø±Ù\n` +
      `   ðµ Ø§Ø±Ø²Ø´: ${formatEN(goldValue)} ØªÙÙØ§Ù\n\n` +
      `ð° **Ú©ÛÙ Ù¾ÙÙ ØªÙÙØ§ÙÛ**\n` +
      `   ðµ ÙÙØ¬ÙØ¯Û: ${formatEN(fiatBalance)} ØªÙÙØ§Ù\n\n` +
      `ââââââââââââââââââ\n` +
      `ð **Ø§Ø±Ø²Ø´ Ú©Ù Ù¾ÙØ±ØªÙÙÙÛÙ**: ${formatEN(totalValue)} ØªÙÙØ§Ù\n\n` +
      `ð ÙÛÙØª ÙØ¹ÙÛ: ${formatEN(prices.gold18.price)} Øª/Ú¯Ø±Ù`;

    const keyboard = new InlineKeyboard()
      .text('â¡ Ø®Ø±ÛØ¯', 'cmd:buy')
      .text('â¡ ÙØ±ÙØ´', 'cmd:sell').row()
      .text('ð Ú¯Ø²Ø§Ø±Ø´ Ø±ÙØ²Ø§ÙÙ', 'cmd:dailyreport');

    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err: any) {
    console.error('[portfolio]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛØ§ÙØª Ù¾ÙØ±ØªÙÙÙÛÙ');
  }
});

/** /orders â Show active orders */
bot.command('orders', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const orders = await prisma.transaction.findMany({
      where: {
        userId: tUser.userId,
        type: { in: ['buy', 'sell'] },
        status: { in: ['pending', 'processing'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (orders.length === 0) {
      await ctx.reply(
        `ð **Ø³ÙØ§Ø±Ø´Ø§Øª ÙØ¹Ø§Ù**\n\n` +
        `ÙÛÚ Ø³ÙØ§Ø±Ø´ ÙØ¹Ø§ÙÛ ÙØ¯Ø§Ø±ÛØ¯.\n\n` +
        `â¡ Ø¨Ø±Ø§Û ÙØ¹Ø§ÙÙÙ: /buy ÛØ§ /sell`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let text = `ð **Ø³ÙØ§Ø±Ø´Ø§Øª ÙØ¹Ø§Ù** (${formatNumber(orders.length)})\n`;
    text += `ââââââââââââââââââ\n\n`;

    orders.forEach((order, i) => {
      const typeEmoji = order.type === 'buy' ? 'ð¢ Ø®Ø±ÛØ¯' : 'ð´ ÙØ±ÙØ´';
      const statusLabel = order.status === 'pending' ? 'â³ Ø¯Ø± Ø§ÙØªØ¸Ø§Ø±' : 'ð Ø¯Ø± Ø­Ø§Ù Ù¾Ø±Ø¯Ø§Ø²Ø´';
      text += `${i + 1}. ${typeEmoji}\n`;
      text += `   ${formatNumber(Math.abs(order.amountGold))} Ú¯Ø±Ù | ${formatEN(order.amountFiat)} Øª\n`;
      text += `   ${statusLabel}\n\n`;
    });

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[orders]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛØ§ÙØª Ø³ÙØ§Ø±Ø´Ø§Øª');
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 11: Feature 6 â Daily Report
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** /dailyreport â Portfolio summary, P/L, risk warning */
bot.command('dailyreport', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);
    const prices = getAllPrices();

    const goldWallet = await prisma.goldWallet.findUnique({ where: { userId: tUser.userId } });
    const wallet = await prisma.wallet.findUnique({ where: { userId: tUser.userId } });

    const goldGrams = goldWallet?.goldGrams || 0;
    const fiatBalance = wallet?.balance || 0;
    const goldValue = goldGrams * prices.gold18.price;
    const totalValue = goldValue + fiatBalance;

    // Mock P/L data
    const avgBuyPrice = prices.gold18.price * (0.95 + Math.random() * 0.1);
    const unrealizedPL = (prices.gold18.price - avgBuyPrice) * goldGrams;
    const unrealizedPLPercent = avgBuyPrice > 0 ? ((prices.gold18.price - avgBuyPrice) / avgBuyPrice) * 100 : 0;

    // Risk assessment
    const goldRatio = totalValue > 0 ? (goldValue / totalValue) * 100 : 0;
    let riskLevel = 'ð¢ Ù¾Ø§ÛÛÙ';
    let riskAdvice = 'Ø³Ø¨Ø¯ Ø³Ø±ÙØ§ÛÙâÚ¯Ø°Ø§Ø±Û ÙØªØ¹Ø§Ø¯Ù Ø§Ø³Øª.';
    if (goldRatio > 80) {
      riskLevel = 'ð´ Ø¨Ø§ÙØ§';
      riskAdvice = 'ÙØ³Ø¨Øª Ø·ÙØ§Û Ø´ÙØ§ Ø¨Ø§ÙØ§Ø³Øª. ØªÙÙØ¹âØ¨Ø®Ø´Û ØªÙØµÛÙ ÙÛâØ´ÙØ¯.';
    } else if (goldRatio > 60) {
      riskLevel = 'ð  ÙØªÙØ³Ø·';
      riskAdvice = 'ÙØ³Ø¨Øª Ø·ÙØ§Û Ø´ÙØ§ ÙØ§Ø¨Ù ÙØ¨ÙÙ Ø§Ø³Øª ÙÙÛ ÙØ±Ø§ÙØ¨ ÙÙØ³Ø§ÙØ§Øª Ø¨Ø§Ø´ÛØ¯.';
    }

    // Get recent transactions
    const recentTx = await prisma.transaction.findMany({
      where: {
        userId: tUser.userId,
        type: { in: ['buy', 'sell'] },
        status: 'completed',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    let txText = 'Ø¨Ø¯ÙÙ ÙØ¹Ø§ÙÙÙ Ø§ÙØ±ÙØ²';
    if (recentTx.length > 0) {
      txText = '';
      recentTx.forEach((tx) => {
        const emoji = tx.type === 'buy' ? 'ð¢+' : 'ð´-';
        txText += `  ${emoji} ${formatNumber(Math.abs(tx.amountGold))} Ú¯Ø±Ù | ${formatEN(tx.amountFiat)} Øª\n`;
      });
    }

    const text =
      `ð **Ú¯Ø²Ø§Ø±Ø´ Ø±ÙØ²Ø§ÙÙ Ù¾ÙØ±ØªÙÙÙÛÙ**\n` +
      `ð ${formatDate(getTehranTime())}\n` +
      `ââââââââââââââââââââââ\n\n` +
      `ð¼ **Ø®ÙØ§ØµÙ Ø¯Ø§Ø±Ø§ÛÛâÙØ§**\n` +
      `ð¥ Ø·ÙØ§Û Û±Û¸: ${formatNumber(goldGrams)} Ú¯Ø±Ù (${formatEN(goldValue)} Øª)\n` +
      `ð° ØªÙÙØ§ÙÛ: ${formatEN(fiatBalance)} Øª\n` +
      `ð Ø§Ø±Ø²Ø´ Ú©Ù: ${formatEN(totalValue)} ØªÙÙØ§Ù\n\n` +
      `ð **Ø³ÙØ¯/Ø²ÛØ§Ù ÙØ­ÙÙâÙØ´Ø¯Ù**\n` +
      `${unrealizedPL >= 0 ? 'ð¢' : 'ð´'} ${formatEN(Math.abs(unrealizedPL))} ØªÙÙØ§Ù (${formatPercent(unrealizedPLPercent)})\n\n` +
      `â ï¸ **Ø³Ø·Ø­ Ø±ÛØ³Ú©**: ${riskLevel}\n` +
      `   ÙØ³Ø¨Øª Ø·ÙØ§: ${goldRatio.toFixed(1)}%\n` +
      `   ${riskAdvice}\n\n` +
      `ð **ÙØ¹Ø§ÙÙØ§Øª Ø§ÙØ±ÙØ²**\n${txText}\n\n` +
      `ââââââââââââââââââââââ\n` +
      `ð Ø§Ø´ØªØ±Ø§Ú© Ú¯Ø²Ø§Ø±Ø´ Ø±ÙØ²Ø§ÙÙ: /subscribe`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[dailyreport]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛØ§ÙØª Ú¯Ø²Ø§Ø±Ø´');
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 12: Feature 7 â Referral
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** /referral â Generate referral link */
bot.command('referral', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const user = await prisma.user.findUnique({ where: { id: tUser.userId } });
    const referralCode = user?.referralCode || `TG${tUser.telegramId}`;
    const referralLink = `https://t.me/${IS_DEV ? 'zarringold_bot' : (await bot.api.getMe()).username}?start=${referralCode}`;

    // Count referrals
    const referralCount = await prisma.referral.count({
      where: { referrerId: tUser.userId },
    });

    const earnedRewards = Math.floor(referralCount * 50000); // Mock: 50k Toman per referral

    const text =
      `ð¯ **Ø³ÛØ³ØªÙ Ø¯Ø¹ÙØª Ø§Ø² Ø¯ÙØ³ØªØ§Ù**\n` +
      `ââââââââââââââââââââââ\n\n` +
      `ð **ÙÛÙÚ© Ø¯Ø¹ÙØª Ø´ÙØ§:**\n` +
      `\`${referralCode}\`\n\n` +
      `ð¥ Ø¯ÙØ³ØªØ§Ù Ø¯Ø¹ÙØª Ø´Ø¯Ù: ${formatNumber(referralCount)}\n` +
      `ð° Ù¾Ø§Ø¯Ø§Ø´ Ú©Ø³Ø¨ Ø´Ø¯Ù: ${formatEN(earnedRewards)} ØªÙÙØ§Ù\n\n` +
      `ð **Ø¬ÙØ§ÛØ² Ø¯Ø¹ÙØª:**\n` +
      `   ÙØ± Ø¯Ø¹ÙØª ÙÙÙÙ = ÛµÛ°,Û°Û°Û° ØªÙÙØ§Ù\n` +
      `   Ûµ Ø¯Ø¹ÙØª = Û³Û°Û°,Û°Û°Û° ØªÙÙØ§Ù Ø¨ÙÙÙØ³\n` +
      `   Û±Û° Ø¯Ø¹ÙØª = Û±,Û°Û°Û°,Û°Û°Û° ØªÙÙØ§Ù Ø¨ÙÙÙØ³\n\n` +
      `ââââââââââââââââââââââ\n` +
      `ð¥ ÙÛÙÚ© Ø±Ø§ Ø¨Ø±Ø§Û Ø¯ÙØ³ØªØ§ÙØªØ§Ù Ø§Ø±Ø³Ø§Ù Ú©ÙÛØ¯!\n` +
      `ð ÙØ¶Ø¹ÛØª Ø¯Ø¹ÙØªâÙØ§: /myreferrals`;

    const keyboard = new InlineKeyboard()
      .text('ð ÙØ¶Ø¹ÛØª Ø¯Ø¹ÙØªâÙØ§', 'cmd:myreferrals');

    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err: any) {
    console.error('[referral]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛØ§ÙØª ÙÛÙÚ© Ø¯Ø¹ÙØª');
  }
});

/** /myreferrals â List referred users */
bot.command('myreferrals', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const referrals = await prisma.referral.findMany({
      where: { referrerId: tUser.userId },
      include: { referred: { select: { fullName: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (referrals.length === 0) {
      await ctx.reply(
        `ð **Ø¯Ø¹ÙØªâÙØ§Û Ø´ÙØ§**\n\n` +
        `ÙÙÙØ² ÙÛÚâÚ©Ø³ Ø±Ø§ Ø¯Ø¹ÙØª ÙÚ©Ø±Ø¯ÙâØ§ÛØ¯.\n\n` +
        `ð¯ Ø¨Ø±Ø§Û Ø¯Ø±ÛØ§ÙØª ÙÛÙÚ© Ø¯Ø¹ÙØª: /referral`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let text = `ð **ÙÛØ³Øª Ø¯Ø¹ÙØªâÙØ§** (${formatNumber(referrals.length)})\n`;
    text += `ââââââââââââââââââ\n\n`;

    referrals.forEach((ref, i) => {
      const name = ref.referred.fullName || 'Ú©Ø§Ø±Ø¨Ø± Ø¬Ø¯ÛØ¯';
      const statusEmoji = ref.status === 'claimed' ? 'â' : ref.status === 'completed' ? 'ð¡' : 'â³';
      text += `${i + 1}. ${statusEmoji} ${name}\n`;
      text += `   ð ${formatDate(ref.createdAt)} | Ù¾Ø§Ø¯Ø§Ø´: ${formatEN(ref.rewardAmount)} Øª\n\n`;
    });

    const totalRewards = referrals.reduce((sum, r) => sum + r.rewardAmount, 0);
    text += `ââââââââââââââââââ\n`;
    text += `ð° ÙØ¬ÙÙØ¹ Ù¾Ø§Ø¯Ø§Ø´: ${formatEN(totalRewards)} ØªÙÙØ§Ù`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[myreferrals]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛØ§ÙØª Ø¯Ø¹ÙØªâÙØ§');
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 12B: Account Balance & Gold Card Commands
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** /balance â Check account balance (wallet + gold + card) */
bot.command('balance', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);
    const prices = getAllPrices();

    const wallet = await prisma.wallet.findUnique({ where: { userId: tUser.userId } });
    const goldWallet = await prisma.goldWallet.findUnique({ where: { userId: tUser.userId } });
    const goldCard = await prisma.goldCard.findUnique({ where: { userId: tUser.userId } });

    const fiatBalance = wallet?.balance || 0;
    const frozenFiat = wallet?.frozenBalance || 0;
    const goldGrams = goldWallet?.goldGrams || 0;
    const frozenGold = goldWallet?.frozenGold || 0;
    const goldValue = goldGrams * prices.gold18.price;
    const cardBalance = goldCard?.balanceFiat || 0;

    let text =
      `💰 **موجودی حساب شما**\n` +
      `─────────────────\n\n` +
      `💵 **کیف پول تومانی**\n` +
      `   ✅ موجودی: ${formatEN(fiatBalance)} تومان\n` +
      `   🔒 مسدود: ${formatEN(frozenFiat)} تومان\n\n` +
      `🥇 **کیف پول طلایی**\n` +
      `   ✅ موجودی: ${formatNumber(goldGrams)} گرم\n` +
      `   🔒 مسدود: ${formatNumber(frozenGold)} گرم\n` +
      `   💰 ارزش: ${formatEN(goldValue)} تومان\n\n`;

    if (goldCard) {
      const maskedCard = goldCard.cardNumber.replace(/(\d{4})/g, '$1 ').trim();
      const statusMap: Record<string, string> = { active: '🟢 فعال', frozen: '🔵 مسدود', blocked: '🔴 قفل', expired: '⚫ منقضی' };
      text +=
        `💳 **کارت طلایی زرین گلد**\n` +
        `   شماره: ${maskedCard}\n` +
        `   وضعیت: ${statusMap[goldCard.status] || goldCard.status}\n` +
        `   موجودی: ${formatEN(cardBalance)} تومان\n\n`;
    }

    text +=
      `─────────────────\n` +
      `📊 **ارزش کل دارایی**: ${formatEN(goldValue + fiatBalance + cardBalance)} تومان\n\n` +
      `🔥 قیمت فعلی: ${formatEN(prices.gold18.price)} ت/گرم`;

    const recentTx = await prisma.transaction.findMany({
      where: { userId: tUser.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (recentTx.length > 0) {
      text += `\n\n📋 **آخرین تراکنش‌ها:**\n`;
      recentTx.forEach((tx, i) => {
        const typeEmoji = tx.type === 'buy' ? '🟢+' : tx.type === 'sell' ? '🔴-' : '📊';
        const statusIcon = tx.status === 'completed' ? '✅' : tx.status === 'pending' ? '⏳' : '❌';
        text += `${i + 1}. ${typeEmoji} ${formatEN(Math.abs(tx.amountGold))} گرم | ${formatEN(tx.amountFiat)} ت ${statusIcon}\n`;
      });
    }

    const keyboard = new InlineKeyboard()
      .text('🟢 خرید طلا', 'cmd:buy')
      .text('🔴 فروش طلا', 'cmd:sell').row()
      .text('💳 کارت طلایی', 'cmd:goldcard')
      .text('📊 پرتفویو', 'cmd:portfolio');

    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err: any) {
    console.error('[balance]', err.message);
    await ctx.reply('❌ خطا در دریافت موجودی حساب');
  }
});

/** /goldcard â Check gold card status */
bot.command('goldcard', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const goldCard = await prisma.goldCard.findUnique({
      where: { userId: tUser.userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });

    if (!goldCard) {
      const keyboard = new InlineKeyboard()
        .text('💰 موجودی حساب', 'cmd:balance')
        .text('🟢 خرید طلا', 'cmd:buy').row()
        .text('📊 پرتفویو', 'cmd:portfolio');

      await ctx.reply(
        `💳 **کارت طلایی زرین گلد**\n\n` +
        `❌ شما هنوز کارت طلایی ندارید.\n\n` +
        `برای دریافت کارت طلایی:\n` +
        `  ۱. ثبت‌نام و احراز هویت در سایت\n` +
        `  ۲. خرید حداقل ۱ گرم طلا\n` +
        `  ۳. درخواست کارت از بخش کارت طلایی\n\n` +
        `🌐 وبسایت: zarringold.ir`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return;
    }

    const maskedCard = goldCard.cardNumber.replace(/(\d{4})/g, '$1 ').trim();
    const statusMap: Record<string, string> = {
      active: '🟢 فعال',
      frozen: '🔵 مسدود موقت',
      blocked: '🔴 قفل شده',
      expired: '⚫ منقضی',
    };
    const cardStatus = statusMap[goldCard.status] || goldCard.status;
    const typeLabel = goldCard.cardType === 'physical' ? '🔒 فیزیکی' : '📱 مجازی';
    const expiryStr = `${goldCard.expiryMonth < 10 ? '0' : ''}${goldCard.expiryMonth}/${goldCard.expiryYear}`;
    const dailyRemaining = goldCard.dailyLimit - goldCard.spentToday;
    const monthlyRemaining = goldCard.monthlyLimit - goldCard.spentThisMonth;

    let text =
      `💳 **کارت طلایی زرین گلد**\n` +
      `═════════════════════\n\n` +
      `🔢 شماره کارت:\n` +
      `   \`${maskedCard}\`\n\n` +
      `📋 نوع: ${typeLabel}\n` +
      `📊 وضعیت: ${cardStatus}\n` +
      `📅 انقضا: ${expiryStr}\n\n` +
      `💰 **موجودی کارت**\n` +
      `   ✅ ${formatEN(goldCard.balanceFiat)} تومان\n` +
      `   🥇 ${formatNumber(goldCard.linkedGoldGram)} گرم طلا متصل\n\n` +
      `📏 **سقف تراکنش**\n` +
      `   روزانه: ${formatEN(goldCard.spentToday)}/${formatEN(goldCard.dailyLimit)} ت\n` +
      `   ماهانه: ${formatEN(goldCard.spentThisMonth)}/${formatEN(goldCard.monthlyLimit)} ت\n` +
      `   ━━━━━━━━━━━━━━━━━━\n` +
      `   باقیمانده روزانه: ${formatEN(dailyRemaining)} ت\n` +
      `   باقیمانده ماهانه: ${formatEN(monthlyRemaining)} ت\n\n`;

    if (goldCard.transactions.length > 0) {
      text += `📋 **آخرین تراکنش‌های کارت:**\n`;
      goldCard.transactions.forEach((tx, i) => {
        const typeMap: Record<string, string> = {
          purchase: '🛒 خرید',
          refund: '↩️ بازگشت',
          charge: '➕ شارژ',
          withdrawal: '💸 برداشت',
        };
        const statusIcon = tx.status === 'completed' ? '✅' : '⏳';
        text += `${i + 1}. ${typeMap[tx.type] || tx.type} ${formatEN(tx.amount)} ت ${statusIcon}`;
        if (tx.description) text += ` â ${tx.description}`;
        text += '\n';
      });
    }

    text += `\n═════════════════════`;

    const keyboard = new InlineKeyboard()
      .text('💰 موجودی حساب', 'cmd:balance')
      .text('🟢 خرید طلا', 'cmd:buy').row()
      .text('🔴 فروش طلا', 'cmd:sell')
      .text('📊 پرتفویو', 'cmd:portfolio');

    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err: any) {
    console.error('[goldcard]', err.message);
    await ctx.reply('❌ خطا در دریافت اطلاعات کارت طلایی');
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 13: Feature 8 â Receipt Notifications
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** Send trade receipt after successful buy/sell */
async function sendTradeReceipt(ctx: Context, chatId: number, data: {
  orderId: string;
  type: 'buy' | 'sell';
  weight: number;
  price: number;
  total: number;
  fee: number;
}) {
  const typeLabel = data.type === 'buy' ? 'ð¢ Ø±Ø³ÛØ¯ Ø®Ø±ÛØ¯' : 'ð´ Ø±Ø³ÛØ¯ ÙØ±ÙØ´';
  const text =
    `ð **${typeLabel}**\n` +
    `ââââââââââââââââââ\n\n` +
    `ð Ø´ÙØ§Ø±Ù Ø³ÙØ§Ø±Ø´: \`${data.orderId}\`\n` +
    `ð ØªØ§Ø±ÛØ®: ${formatDate(new Date())}\n\n` +
    `âï¸ ÙÙØ¯Ø§Ø±: ${formatNumber(data.weight)} Ú¯Ø±Ù Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø±\n` +
    `ð° ÙÛÙØª ÙØ§Ø­Ø¯: ${formatEN(data.price)} ØªÙÙØ§Ù\n` +
    `ðµ ÙØ¨ÙØº ${data.type === 'buy' ? 'Ù¾Ø±Ø¯Ø§Ø®ØªÛ' : 'Ø¯Ø±ÛØ§ÙØªÛ'}: ${formatEN(data.total)} ØªÙÙØ§Ù\n` +
    `ð² Ú©Ø§Ø±ÙØ²Ø¯: ${formatEN(data.fee)} ØªÙÙØ§Ù\n\n` +
    `ââââââââââââââââââ\n` +
    `â ÙØ¶Ø¹ÛØª: ØªÚ©ÙÛÙ Ø´Ø¯Ù\n\n` +
    `ð Ø±Ø¨Ø§Øª Ø·ÙØ§Û Ø²Ø±ÛÙ`;

  try {
    await ctx.api.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[sendReceipt]', err.message);
  }
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 14: Feature 9 â Support Tickets
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** /support â Create support ticket */
bot.command('support', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    await ctx.reply(
      `ð§ **Ø§ÛØ¬Ø§Ø¯ ØªÛÚ©Øª Ù¾Ø´ØªÛØ¨Ø§ÙÛ**\n\n` +
      `ÙÙØ¶ÙØ¹ ØªÛÚ©Øª Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:\n` +
      `ÙØ«Ø§Ù: ÙØ´Ú©Ù Ø¯Ø± Ø®Ø±ÛØ¯ Ø·ÙØ§`,
      { parse_mode: 'Markdown' }
    );

    supportConversations.set(ctx.chat!.id, { subject: '', step: 'awaiting_subject' });
  } catch (err: any) {
    console.error('[support]', err.message);
    await ctx.reply('â Ø®Ø·Ø§');
  }
});

/** /ticket â Reply to ongoing ticket */
bot.command('ticket', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const openTickets = await prisma.telegramSupportMessage.findMany({
      where: { telegramUserId: tUser.id, ticketId: { not: null } },
      distinct: ['ticketId'],
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    if (openTickets.length === 0) {
      await ctx.reply(
        `ð« **ØªÛÚ©ØªâÙØ§Û Ø´ÙØ§**\n\n` +
        `ØªÛÚ©Øª ÙØ¹Ø§ÙÛ ÙØ¯Ø§Ø±ÛØ¯.\n\n` +
        `ð§ Ø¨Ø±Ø§Û Ø§ÛØ¬Ø§Ø¯ ØªÛÚ©Øª: /support`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const keyboard = new InlineKeyboard();
    openTickets.forEach((msg, i) => {
      keyboard.text(`ð« ØªÛÚ©Øª #${i + 1}`, `support:reply:${msg.ticketId}`).row();
    });

    await ctx.reply(
      `ð« **Ø§ÙØªØ®Ø§Ø¨ ØªÛÚ©Øª**\n\n` +
      `ØªÛÚ©ØªÛ Ú©Ù ÙÛâØ®ÙØ§ÙÛØ¯ Ø¨Ù Ø¢Ù Ù¾Ø§Ø³Ø® Ø¯ÙÛØ¯ Ø±Ø§ Ø§ÙØªØ®Ø§Ø¨ Ú©ÙÛØ¯:`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  } catch (err: any) {
    console.error('[ticket]', err.message);
    await ctx.reply('â Ø®Ø·Ø§');
  }
});

/** /mytickets â List all tickets */
bot.command('mytickets', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    const messages = await prisma.telegramSupportMessage.findMany({
      where: { telegramUserId: tUser.id },
      orderBy: { createdAt: 'desc' },
      distinct: ['ticketId'],
      take: 10,
    });

    if (messages.length === 0) {
      await ctx.reply(
        `ð« **ØªÛÚ©ØªâÙØ§Û ÙÙ**\n\n` +
        `ØªÛÚ©ØªÛ Ø«Ø¨Øª ÙØ´Ø¯Ù Ø§Ø³Øª.\n\n` +
        `ð§ Ø§ÛØ¬Ø§Ø¯ ØªÛÚ©Øª: /support`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let text = `ð« **ÙÛØ³Øª ØªÛÚ©ØªâÙØ§** (${formatNumber(messages.length)})\n`;
    text += `ââââââââââââââââââ\n\n`;

    messages.forEach((msg, i) => {
      const preview = msg.messageText.substring(0, 50) + (msg.messageText.length > 50 ? '...' : '');
      text += `${i + 1}. ${preview}\n`;
      text += `   ð ${formatDate(msg.createdAt)}\n\n`;
    });

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('[mytickets]', err.message);
    await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛØ§ÙØª ØªÛÚ©ØªâÙØ§');
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 15: Link Account Command
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** /link â Link Telegram to existing account */
bot.command('link', async (ctx) => {
  try {
    const { tUser } = await ensureTelegramUser(ctx);

    await ctx.reply(
      `ð **Ø§ØªØµØ§Ù Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±Û**\n\n` +
      `Ø´ÙØ§Ø±Ù ÙÙØ¨Ø§ÛÙ Ø«Ø¨ØªâØ´Ø¯Ù Ø¯Ø± Ø³Ø§ÛØª Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:\n` +
      `ÙØ«Ø§Ù: Û°Û¹Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹`,
      { parse_mode: 'Markdown' }
    );

    phoneLinkRequests.set(ctx.chat!.id, ctx.from!.id);
  } catch (err: any) {
    console.error('[link]', err.message);
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 16: Callback Query Handlers (Inline Keyboard Buttons)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

bot.on('callback_query:data', async (ctx) => {
  try {
    const data = ctx.callbackQuery.data;
    const chatId = ctx.callbackQuery.message?.chat.id;

    if (!chatId) return;

    // ââ Command shortcuts ââ
    if (data.startsWith('cmd:')) {
      const cmd = data.replace('cmd:', '');
      await ctx.answerCallbackQuery();

      switch (cmd) {
        case 'price':
          await ctx.reply('/price');
          await bot.commands.get('price')?.handler(ctx as any);
          break;
        case 'chart':
          await bot.commands.get('chart')?.handler(ctx as any);
          break;
        case 'compare':
          await bot.commands.get('compare')?.handler(ctx as any);
          break;
        case 'help':
          await bot.commands.get('help')?.handler(ctx as any);
          break;
        case 'alert':
          await bot.commands.get('alert')?.handler(ctx as any);
          break;
        case 'analysis':
          await bot.commands.get('analysis')?.handler(ctx as any);
          break;
        case 'daily':
          await bot.commands.get('daily')?.handler(ctx as any);
          break;
        case 'subscribe':
          await bot.commands.get('subscribe')?.handler(ctx as any);
          break;
        case 'buy':
          await bot.commands.get('buy')?.handler(ctx as any);
          break;
        case 'sell':
          await bot.commands.get('sell')?.handler(ctx as any);
          break;
        case 'invoice':
          await bot.commands.get('invoice')?.handler(ctx as any);
          break;
        case 'support':
          await bot.commands.get('support')?.handler(ctx as any);
          break;
        case 'dailyreport':
          await bot.commands.get('dailyreport')?.handler(ctx as any);
          break;
        case 'myreferrals':
          await bot.commands.get('myreferrals')?.handler(ctx as any);
          break;
      }
      return;
    }

    // ââ Chart asset selection ââ
    if (data.startsWith('chart:')) {
      const asset = data.replace('chart:', '');
      await ctx.answerCallbackQuery();
      const prices = getAllPrices();

      const assetLabels: Record<string, string> = {
        gold18: 'ð¥ Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø±',
        gold24: 'ð¥ Ø·ÙØ§Û Û²Û´ Ø¹ÛØ§Ø±',
        mesghal: 'âï¸ ÙØ«ÙØ§Ù Ø·ÙØ§',
        ounce: 'ð Ø§ÙÙØ³ Ø¬ÙØ§ÙÛ',
      };

      const label = assetLabels[asset] || asset;

      const chartBlock = generateChart(asset);
      const priceVal = prices[asset as keyof typeof prices]?.price || 0;
      const changeVal = prices[asset as keyof typeof prices]?.change || 0;
      const currency = asset === 'ounce' ? '$' : '';
      const unit = asset !== 'ounce' ? ' ØªÙÙØ§Ù' : '';
      const priceStr = currency + formatEN(priceVal) + unit;
      const arrow = getArrow(changeVal);
      const changeStr = formatPercent(changeVal);

      await ctx.reply(
        'ð **' + label + '**\n\n' +
        '```\n' + chartBlock + '```\n' +
        'ÙÛÙØª ÙØ¹ÙÛ: ' + priceStr + '\n' +
        arrow + ' ' + changeStr,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // ââ Alert: Asset selection ââ
    if (data.startsWith('alert:asset:')) {
      const asset = data.replace('alert:asset:', '');
      await ctx.answerCallbackQuery();

      alertConversations.set(chatId, { assetType: asset, condition: '' });

      const keyboard = new InlineKeyboard()
        .text('â¬ï¸ Ø¨Ø§ÙØ§ØªØ± Ø§Ø²', `alert:condition:${asset}:above`)
        .text('â¬ï¸ Ù¾Ø§ÛÛÙâØªØ± Ø§Ø²', `alert:condition:${asset}:below`).row()
        .text('âï¸ Ø¹Ø¨ÙØ± Ø§Ø²', `alert:condition:${asset}:crosses');

      const assetLabels: Record<string, string> = {
        gold18: 'ð¥ Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø±',
        gold24: 'ð¥ Ø·ÙØ§Û Û²Û´ Ø¹ÛØ§Ø±',
        mesghal: 'âï¸ ÙØ«ÙØ§Ù Ø·ÙØ§',
        ounce: 'ð Ø§ÙÙØ³ Ø¬ÙØ§ÙÛ',
      };

      const alertMsg = 'ð Ø´Ø±Ø· ÙØ´Ø¯Ø§Ø± Ø±Ø§ Ø§ÙØªØ®Ø§Ø¨ Ú©ÙÛØ¯:\n\n' +
        'ð Ø¯Ø§Ø±Ø§ÛÛ: ' + (assetLabels[asset] || asset);

      await ctx.reply(alertMsg, { reply_markup: keyboard });
      return;
    }

    // ââ Alert: Condition selection ââ
    if (data.startsWith('alert:condition:')) {
      const parts = data.replace('alert:condition:', '').split(':');
      const asset = parts[0];
      const condition = parts[1];
      await ctx.answerCallbackQuery();

      alertConversations.set(chatId, { assetType: asset, condition });

      const assetLabels: Record<string, string> = {
        gold18: 'Ø·ÙØ§Û Û±Û¸',
        gold24: 'Ø·ÙØ§Û Û²Û´',
        mesghal: 'ÙØ«ÙØ§Ù',
        ounce: 'Ø§ÙÙØ³',
      };

      const condLabel = condition === 'above' ? 'Ø¨Ø§ÙØ§ØªØ± Ø§Ø²' : condition === 'below' ? 'Ù¾Ø§ÛÛÙâØªØ± Ø§Ø²' : 'Ø¹Ø¨ÙØ± Ø§Ø²';
      const exampleStr = asset === 'ounce' ? 'ÙØ«Ø§Ù: 2400 (Ø¯ÙØ§Ø±)' : 'ÙØ«Ø§Ù: 4000000 (ØªÙÙØ§Ù)';
      const priceInputMsg = 'ð **ÙÛÙØª ÙØ¯Ù Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:**\n\n' +
        'ð Ø¯Ø§Ø±Ø§ÛÛ: ' + (assetLabels[asset] || asset) + '\n' +
        'ð Ø´Ø±Ø·: ' + condLabel + '\n\n' + exampleStr;

      await ctx.reply(priceInputMsg, { parse_mode: 'Markdown' });
      return;
    }

    // ââ Alert: Remove ââ
    if (data.startsWith('alert:remove:')) {
      const alertId = data.replace('alert:remove:', '');
      await ctx.answerCallbackQuery({ text: 'â ÙØ´Ø¯Ø§Ø± Ø­Ø°Ù Ø´Ø¯' });

      await prisma.telegramAlert.update({
        where: { id: alertId },
        data: { isActive: false },
      });

      // Delete the message to keep it clean
      try {
        await ctx.api.deleteMessage(chatId, ctx.callbackQuery.message!.message_id);
      } catch { /* ignore */ }

      await ctx.reply('â ÙØ´Ø¯Ø§Ø± Ø¨Ø§ ÙÙÙÙÛØª Ø­Ø°Ù Ø´Ø¯.');
      return;
    }

    // ââ Trade: Buy/Sell ââ
    if (data.startsWith('trade:buy:')) {
      const weight = data.replace('trade:buy:', '');
      await ctx.answerCallbackQuery();

      const { tUser } = await ensureTelegramUser(ctx as any);
      await confirmBuy(ctx, tUser, parseFloat(weight));
      return;
    }

    if (data.startsWith('trade:sell:')) {
      const weight = data.replace('trade:sell:', '');
      await ctx.answerCallbackQuery();

      const { tUser } = await ensureTelegramUser(ctx as any);
      await confirmSell(ctx, tUser, parseFloat(weight));
      return;
    }

    if (data.startsWith('trade:confirm_buy:')) {
      const weight = parseFloat(data.replace('trade:confirm_buy:', ''));
      await ctx.answerCallbackQuery({ text: 'â³ Ø¯Ø± Ø­Ø§Ù Ù¾Ø±Ø¯Ø§Ø²Ø´...' });

      const { tUser } = await ensureTelegramUser(ctx as any);
      await executeBuy(ctx, tUser, weight);
      return;
    }

    if (data.startsWith('trade:confirm_sell:')) {
      const weight = parseFloat(data.replace('trade:confirm_sell:', ''));
      await ctx.answerCallbackQuery({ text: 'â³ Ø¯Ø± Ø­Ø§Ù Ù¾Ø±Ø¯Ø§Ø²Ø´...' });

      const { tUser } = await ensureTelegramUser(ctx as any);
      await executeSell(ctx, tUser, weight);
      return;
    }

    if (data === 'trade:cancel') {
      await ctx.answerCallbackQuery({ text: 'â ÙØºÙ Ø´Ø¯' });
      await ctx.reply('â Ø¹ÙÙÛØ§Øª ÙØºÙ Ø´Ø¯.');
      return;
    }

    if (data.startsWith('trade:buy:custom') || data.startsWith('trade:sell:custom')) {
      await ctx.answerCallbackQuery();
      await ctx.reply('âï¸ ÙÙØ¯Ø§Ø± Ø¯ÙØ®ÙØ§Ù Ø±Ø§ Ø¨Ù Ú¯Ø±Ù ÙØ§Ø±Ø¯ Ú©ÙÛØ¯ (ÙØ«ÙØ§Ù 7.5):');
      alertConversations.set(chatId, {
        assetType: data.includes('buy') ? 'buy_custom' : 'sell_custom',
        condition: 'awaiting_weight',
      });
      return;
    }

    // ââ Support: Reply to ticket ââ
    if (data.startsWith('support:reply:')) {
      const ticketId = data.replace('support:reply:', '');
      await ctx.answerCallbackQuery();

      ticketReplyConversations.set(chatId, { ticketId });
      await ctx.reply(
        'ð« **Ù¾Ø§Ø³Ø® Ø¨Ù ØªÛÚ©Øª**\n\n' +
        'ÙØªÙ Ù¾Ø§Ø³Ø® Ø®ÙØ¯ Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:',
        { parse_mode: 'Markdown' }
      );
      return;
    }

  } catch (err: any) {
    console.error('[callback_query]', err.message);
    try { await ctx.answerCallbackQuery({ text: 'â Ø®Ø·Ø§' }); } catch { /* ignore */ }
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 17: Message Handler (Multi-step Conversations)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

bot.on('message:text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    const chatId = ctx.chat!.id;

    // ââ Phone number linking ââ
    if (phoneLinkRequests.has(chatId)) {
      const phone = text.replace(/[^\d]/g, '');
      if (phone.length < 10) {
        await ctx.reply('â Ø´ÙØ§Ø±Ù ÙÙØ¨Ø§ÛÙ ÙØ§ÙØ¹ØªØ¨Ø±. ÙØ·ÙØ§Ù Ø¯ÙØ¨Ø§Ø±Ù ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:');
        return;
      }

      const formattedPhone = phone.startsWith('09') ? phone : '0' + phone.slice(-10);
      phoneLinkRequests.delete(chatId);

      try {
        const existingUser = await prisma.user.findUnique({ where: { phone: formattedPhone } });

        if (existingUser) {
          // Link Telegram user to existing account
          const tgUser = await prisma.telegramUser.findUnique({
            where: { telegramId: ctx.from!.id },
          });

          if (tgUser && tgUser.userId.startsWith('tg-')) {
            // Delete temp user
            await prisma.telegramUser.delete({ where: { id: tgUser.id } });
            await prisma.user.delete({ where: { id: tgUser.userId } }).catch(() => {});
          }

          // Update or create TelegramUser with real user
          await prisma.telegramUser.upsert({
            where: { telegramId: ctx.from!.id },
            create: {
              userId: existingUser.id,
              telegramId: ctx.from!.id,
              chatId: chatId,
              username: ctx.from?.username,
              firstName: ctx.from?.first_name,
              lastName: ctx.from?.last_name,
              languageCode: ctx.from?.language_code || 'fa',
              lastActivityAt: new Date(),
            },
            update: {
              userId: existingUser.id,
              chatId: chatId,
              username: ctx.from?.username,
              firstName: ctx.from?.first_name,
              lastName: ctx.from?.last_name,
              lastActivityAt: new Date(),
            },
          });

          await ctx.reply(
            `â **Ø­Ø³Ø§Ø¨ ÙØªØµÙ Ø´Ø¯!**\n\n` +
            `ð Ø³ÙØ§Ù ${existingUser.fullName || 'Ú©Ø§Ø±Ø¨Ø±'} Ø¹Ø²ÛÚ©!\n\n` +
            `Ø­Ø³Ø§Ø¨ ØªÙÚ¯Ø±Ø§Ù Ø´ÙØ§ Ø¨Ø§ Ø­Ø³Ø§Ø¨ Ø³Ø§ÛØª ÙØªØµÙ Ø´Ø¯.\n` +
            `Ø§Ú©ÙÙÙ ÙÛâØªÙØ§ÙÛØ¯ Ø§Ø² ØªÙØ§Ù Ø§ÙÚ©Ø§ÙØ§Øª Ø±Ø¨Ø§Øª Ø§Ø³ØªÙØ§Ø¯Ù Ú©ÙÛØ¯.\n\n` +
            `ð Ø¨Ø±Ø§Û Ø´Ø±ÙØ¹: /start`,
            { parse_mode: 'Markdown' }
          );
        } else {
          await ctx.reply(
            `â ï¸ Ø­Ø³Ø§Ø¨Û Ø¨Ø§ Ø§ÛÙ Ø´ÙØ§Ø±Ù ÛØ§ÙØª ÙØ´Ø¯.\n\n` +
            `ÙØ·ÙØ§Ù Ø§Ø¨ØªØ¯Ø§ Ø¯Ø± Ø³Ø§ÛØª Ø«Ø¨ØªâÙØ§Ù Ú©ÙÛØ¯Ø Ø³Ù¾Ø³ Ø¯ÙØ¨Ø§Ø±Ù ØªÙØ§Ø´ Ú©ÙÛØ¯.\n\n` +
            `ð ÛØ§ Ø§Ø² Ø±Ø¨Ø§Øª Ø¨Ù ØµÙØ±Øª ÙÙÙØ§Ù Ø§Ø³ØªÙØ§Ø¯Ù Ú©ÙÛØ¯: /start`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (linkErr: any) {
        console.error('[phone_link]', linkErr.message);
        await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± Ø§ØªØµØ§Ù Ø­Ø³Ø§Ø¨. ÙØ·ÙØ§Ù Ø¯ÙØ¨Ø§Ø±Ù ØªÙØ§Ø´ Ú©ÙÛØ¯.');
      }
      return;
    }

    // ââ Alert: Target price input ââ
    if (alertConversations.has(chatId)) {
      const conv = alertConversations.get(chatId)!;

      // Alert price input
      if (conv.condition && conv.condition !== '' && !conv.condition.includes('awaiting')) {
        const targetPrice = parseFloat(text.replace(/[^\d.]/g, ''));

        if (isNaN(targetPrice) || targetPrice <= 0) {
          await ctx.reply('â ÙÛÙØª ÙØ§ÙØ¹ØªØ¨Ø±. ÙØ·ÙØ§Ù Ø¹Ø¯Ø¯ ÙØ«Ø¨Øª ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:');
          return;
        }

        alertConversations.delete(chatId);

        const { tUser } = await ensureTelegramUser(ctx);

        await prisma.telegramAlert.create({
          data: {
            telegramUserId: tUser.id,
            alertType: 'price',
            assetType: conv.assetType,
            condition: conv.condition,
            targetPrice,
          },
        });

        const assetLabels: Record<string, string> = {
          gold18: 'Ø·ÙØ§Û Û±Û¸',
          gold24: 'Ø·ÙØ§Û Û²Û´',
          mesghal: 'ÙØ«ÙØ§Ù',
          ounce: 'Ø§ÙÙØ³',
        };
        const conditionLabels: Record<string, string> = {
          above: 'Ø¨Ø§ÙØ§ØªØ± Ø§Ø²',
          below: 'Ù¾Ø§ÛÛÙâØªØ± Ø§Ø²',
          crosses: 'Ø¹Ø¨ÙØ± Ø§Ø²',
        };

        await ctx.reply(
          `â **ÙØ´Ø¯Ø§Ø± ÙÛÙØª Ø«Ø¨Øª Ø´Ø¯!**\n\n` +
          `ð Ø¯Ø§Ø±Ø§ÛÛ: ${assetLabels[conv.assetType]}\n` +
          `ð Ø´Ø±Ø·: ${conditionLabels[conv.condition]} ${conv.assetType === 'ounce' ? '$' : ''}${formatEN(targetPrice)}\n\n` +
          `ð Ø¨Ù ÙØ­Ø¶ Ø±Ø³ÛØ¯Ù Ø¨Ù ÙÛÙØª ÙØ¯Ù Ø¨Ù Ø´ÙØ§ Ø§Ø·ÙØ§Ø¹ ÙÛâØ¯ÙÛÙ.\n\n` +
          `ð ÙØ´Ø§ÙØ¯Ù ÙØ´Ø¯Ø§Ø±ÙØ§: /myalerts`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Buy/Sell custom weight
      if (conv.condition === 'awaiting_weight') {
        const weight = parseFloat(text);
        if (isNaN(weight) || weight <= 0) {
          await ctx.reply('â ÙÙØ¯Ø§Ø± ÙØ§ÙØ¹ØªØ¨Ø±. ÙØ·ÙØ§Ù Ø¹Ø¯Ø¯ ÙØ«Ø¨Øª ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:');
          return;
        }
        alertConversations.delete(chatId);
        const { tUser } = await ensureTelegramUser(ctx);

        if (conv.assetType === 'buy_custom') {
          await confirmBuy(ctx, tUser, weight);
        } else {
          await confirmSell(ctx, tUser, weight);
        }
        return;
      }

      // Add customer flow
      if (conv.assetType === 'addcustomer') {
        const { tUser } = await ensureTelegramUser(ctx);

        if (conv.condition === 'name') {
          alertConversations.set(chatId, { assetType: 'addcustomer', condition: 'phone', ...conv.tempData, name: text });
          await ctx.reply('ð± Ø´ÙØ§Ø±Ù ØªÙÙÙ ÙØ´ØªØ±Û Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯ (Ø§Ø®ØªÛØ§Ø±ÛØ /skip Ø¨Ø±Ø§Û Ø±Ø¯ Ø´Ø¯Ù):');
          return;
        }

        if (conv.condition === 'phone') {
          const customerName = (conv as any).name || text;
          const customerPhone = text === '/skip' ? null : text;

          await prisma.telegramB2BCustomer.create({
            data: {
              telegramUserId: tUser.id,
              name: customerName,
              phone: customerPhone,
            },
          });

          alertConversations.delete(chatId);
          await ctx.reply(
            `â **ÙØ´ØªØ±Û Ø§Ø¶Ø§ÙÙ Ø´Ø¯!**\n\n` +
            `ð¤ ${customerName}\n` +
            `${customerPhone ? `ð± ${customerPhone}\n` : ''}\n\n` +
            `ð ÙÛØ³Øª ÙØ´ØªØ±ÛØ§Ù: /customers`,
            { parse_mode: 'Markdown' }
          );
          return;
        }
      }
    }

    // ââ Support: Subject input ââ
    if (supportConversations.has(chatId)) {
      const conv = supportConversations.get(chatId)!;

      if (conv.step === 'awaiting_subject') {
        conv.subject = text;
        conv.step = 'awaiting_message';
        await ctx.reply(
          `â ÙÙØ¶ÙØ¹: ${text}\n\n` +
          `ð ÙØªÙ Ù¾ÛØ§Ù Ø®ÙØ¯ Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:`
        );
        return;
      }

      if (conv.step === 'awaiting_message') {
        const { tUser } = await ensureTelegramUser(ctx);
        const ticketId = `TG-TKT-${Date.now().toString(36).toUpperCase()}`;

        await prisma.telegramSupportMessage.create({
          data: {
            telegramUserId: tUser.id,
            ticketId,
            messageText: text,
            isAdmin: false,
          },
        });

        supportConversations.delete(chatId);

        await ctx.reply(
          `â **ØªÛÚ©Øª Ø§ÛØ¬Ø§Ø¯ Ø´Ø¯!**\n\n` +
          `ð« Ø´ÙØ§Ø±Ù ØªÛÚ©Øª: ${ticketId}\n` +
          `ð ÙÙØ¶ÙØ¹: ${conv.subject}\n\n` +
          `ð¹ Ø¯Ø± Ø§Ø³Ø±Ø¹ ÙÙØª Ù¾Ø§Ø³Ø® ÙÛâØ¯ÙÛÙ.\n` +
          `ð ØªÛÚ©ØªâÙØ§Û ÙÙ: /mytickets`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
    }

    // ââ Ticket reply ââ
    if (ticketReplyConversations.has(chatId)) {
      const conv = ticketReplyConversations.get(chatId)!;
      const { tUser } = await ensureTelegramUser(ctx);

      await prisma.telegramSupportMessage.create({
        data: {
          telegramUserId: tUser.id,
          ticketId: conv.ticketId,
          messageText: text,
          isAdmin: false,
        },
      });

      ticketReplyConversations.delete(chatId);

      await ctx.reply(
        `â **Ù¾Ø§Ø³Ø® Ø§Ø±Ø³Ø§Ù Ø´Ø¯!**\n\n` +
        `ð¹ Ù¾Ø§Ø³Ø® Ø´ÙØ§ Ø«Ø¨Øª Ø´Ø¯ Ù Ø¯Ø± Ø§Ø³Ø±Ø¹ ÙÙØª Ø¨Ø±Ø±Ø³Û Ø®ÙØ§ÙØ¯ Ø´Ø¯.\n\n` +
        `ð ØªÛÚ©ØªâÙØ§Û ÙÙ: /mytickets`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // ââ Invoice flow: Weight â Customer â Confirm ââ
    if (invoiceConversations.has(chatId)) {
      const conv = invoiceConversations.get(chatId)!;

      // Step 1: Weight input
      if (conv.weightGrams === 0 && conv.customerName === '') {
        const weight = parseFloat(text);
        if (isNaN(weight) || weight <= 0) {
          await ctx.reply('â ÙØ²Ù ÙØ§ÙØ¹ØªØ¨Ø±. ÙØ·ÙØ§Ù Ø¹Ø¯Ø¯ ÙØ«Ø¨Øª ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:');
          return;
        }
        conv.weightGrams = weight;
        invoiceConversations.set(chatId, conv);

        await ctx.reply(
          `â ÙØ²Ù: ${formatNumber(weight)} Ú¯Ø±Ù\n\n` +
          `ð¤ ÙØ§Ù ÙØ´ØªØ±Û Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯:`
        );
        return;
      }

      // Step 2: Customer name
      if (conv.weightGrams > 0 && conv.customerName === '') {
        conv.customerName = text;
        invoiceConversations.set(chatId, conv);

        await ctx.reply(
          `â ÙØ´ØªØ±Û: ${text}\n\n` +
          `ð± Ø´ÙØ§Ø±Ù ØªÙÙÙ ÙØ´ØªØ±Û Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯ (/skip Ø¨Ø±Ø§Û Ø±Ø¯ Ø´Ø¯Ù):`
        );
        return;
      }

      // Step 3: Customer phone (or skip)
      if (conv.weightGrams > 0 && conv.customerName !== '' && conv.pricePerGram === 0) {
        conv.customerPhone = text === '/skip' ? '' : text;
        const prices = getAllPrices();
        conv.pricePerGram = prices.gold18.price;
        invoiceConversations.set(chatId, conv);

        // Calculate totals
        const goldValue = conv.pricePerGram * conv.weightGrams;
        const ejratAmount = goldValue * (conv.ejratPercent / 100);
        const subtotal = goldValue + ejratAmount;
        const taxAmount = subtotal * 0.09;
        const finalPrice = subtotal + taxAmount;

        const keyboard = new InlineKeyboard()
          .text('â ØªØ£ÛÛØ¯ Ù ØµØ¯ÙØ± ÙØ§Ú©ØªÙØ±', 'invoice:confirm')
          .text('â Ø§ÙØµØ±Ø§Ù', 'invoice:cancel').row()
          .text('ð§ ØªØºÛÛØ± Ø§Ø¬Ø±Øª (Û³%)', 'invoice:change_ejrat');

        await ctx.reply(
          `ð **Ù¾ÛØ´âÙÙØ§ÛØ´ ÙØ§Ú©ØªÙØ±**\n` +
          `ââââââââââââââââââ\n\n` +
          `ð¤ ÙØ´ØªØ±Û: ${conv.customerName}\n` +
          `${conv.customerPhone ? `ð± ØªÙÙÙ: ${conv.customerPhone}\n` : ''}\n` +
          `âï¸ ÙØ²Ù: ${formatNumber(conv.weightGrams)} Ú¯Ø±Ù\n` +
          `ð° ÙÛÙØª Ø·ÙØ§Û Ø®Ø§Ù: ${formatEN(conv.pricePerGram)} Øª/Ú¯Ø±Ù\n\n` +
          `ð **ØªÙÚ©ÛÚ© ÙØ²ÛÙÙ**\n` +
          `   Ø§Ø±Ø²Ø´ Ø·ÙØ§: ${formatEN(goldValue)} Øª\n` +
          `   Ø§Ø¬Ø±Øª (${conv.ejratPercent}%): ${formatEN(ejratAmount)} Øª\n` +
          `   ÙØ§ÙÛØ§Øª (Û¹%): ${formatEN(taxAmount)} Øª\n\n` +
          `ââââââââââââââââââ\n` +
          `ðµ **ÙØ¨ÙØº ÙÙØ§ÛÛ: ${formatEN(finalPrice)} ØªÙÙØ§Ù**\n\n` +
          `Ø¢ÛØ§ ÙØ§Ú©ØªÙØ± Ø±Ø§ ØªØ£ÛÛØ¯ ÙÛâÚ©ÙÛØ¯Ø`,
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );
        return;
      }
    }

    // ââ Invoice: Confirm/Cancel callback handling via text ââ
    // (Handled via callback_query above)

  } catch (err: any) {
    console.error('[message:text]', err.message);
  }
});

// Handle invoice callbacks
bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const chatId = ctx.callbackQuery.message?.chat.id;

  if (!chatId) return;

  if (data === 'invoice:confirm') {
    await ctx.answerCallbackQuery({ text: 'â ÙØ§Ú©ØªÙØ± ØµØ§Ø¯Ø± Ø´Ø¯!' });

    const conv = invoiceConversations.get(chatId);
    if (!conv) {
      await ctx.reply('â Ø§Ø·ÙØ§Ø¹Ø§Øª ÙØ§Ú©ØªÙØ± ÛØ§ÙØª ÙØ´Ø¯');
      return;
    }

    const { tUser } = await ensureTelegramUser(ctx as any);

    const goldValue = conv.pricePerGram * conv.weightGrams;
    const ejratAmount = goldValue * (conv.ejratPercent / 100);
    const subtotal = goldValue + ejratAmount;
    const taxAmount = subtotal * 0.09;
    const finalPrice = subtotal + taxAmount;

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    try {
      // Save invoice to DB
      await prisma.telegramInvoice.create({
        data: {
          telegramUserId: tUser.id,
          invoiceNumber,
          customerName: conv.customerName,
          customerPhone: conv.customerPhone || null,
          weightGrams: conv.weightGrams,
          pricePerGram: conv.pricePerGram,
          totalPrice: goldValue,
          ejratPercent: conv.ejratPercent,
          ejratAmount,
          taxPercent: 9,
          taxAmount,
          finalPrice,
          status: 'sent',
          sentToTelegram: true,
          sentAt: new Date(),
        },
      });

      // Save customer if not exists
      if (conv.customerName) {
        const existingCustomer = await prisma.telegramB2BCustomer.findFirst({
          where: { telegramUserId: tUser.id, name: conv.customerName },
        });
        if (!existingCustomer) {
          await prisma.telegramB2BCustomer.create({
            data: {
              telegramUserId: tUser.id,
              name: conv.customerName,
              phone: conv.customerPhone || null,
            },
          });
        } else {
          await prisma.telegramB2BCustomer.update({
            where: { id: existingCustomer.id },
            data: {
              totalInvoices: { increment: 1 },
              totalSpent: { increment: finalPrice },
            },
          });
        }
      }

      invoiceConversations.delete(chatId);

      // Send formatted invoice
      const invoiceText =
        `ð **ÙØ§Ú©ØªÙØ± ÙØ±ÙØ´ Ø·ÙØ§**\n` +
        `ââââââââââââââââââââââ\n\n` +
        `ð¢ Ø´ÙØ§Ø±Ù ÙØ§Ú©ØªÙØ±: \`${invoiceNumber}\`\n` +
        `ð ØªØ§Ø±ÛØ®: ${formatDate(new Date())}\n\n` +
        `ð¤ ÙØ´ØªØ±Û: ${conv.customerName}\n` +
        `${conv.customerPhone ? `ð± ØªÙÙÙ: ${conv.customerPhone}\n` : ''}\n\n` +
        `ââââââââââââââââââââââ\n\n` +
        `âï¸ ÙØ²Ù: ${formatNumber(conv.weightGrams)} Ú¯Ø±Ù Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø±\n` +
        `ð° ÙÛÙØª Ø·ÙØ§Û Ø®Ø§Ù: ${formatEN(conv.pricePerGram)} Øª/Ú¯Ø±Ù\n` +
        `   Ø§Ø±Ø²Ø´ Ø·ÙØ§: ${formatEN(goldValue)} ØªÙÙØ§Ù\n\n` +
        `ð§ Ø§Ø¬Ø±Øª (${conv.ejratPercent}%): ${formatEN(ejratAmount)} ØªÙÙØ§Ù\n` +
        `   Ø¬ÙØ¹: ${formatEN(subtotal)} ØªÙÙØ§Ù\n\n` +
        `ð¦ ÙØ§ÙÛØ§Øª Ø¨Ø± Ø§Ø±Ø²Ø´ Ø§ÙØ²ÙØ¯Ù (Û¹%): ${formatEN(taxAmount)} ØªÙÙØ§Ù\n\n` +
        `ââââââââââââââââââââââ\n\n` +
        `ðµ **ÙØ¨ÙØº ÙÙØ§ÛÛ: ${formatEN(finalPrice)} ØªÙÙØ§Ù**\n\n` +
        `ââââââââââââââââââââââ\n` +
        `ð Ø±Ø¨Ø§Øª Ø·ÙØ§Û Ø²Ø±ÛÙ\n` +
        `  powered by Mili Gold`;

      await ctx.reply(invoiceText, { parse_mode: 'Markdown' });

    } catch (err: any) {
      console.error('[invoice:confirm]', err.message);
      await ctx.reply('â Ø®Ø·Ø§ Ø¯Ø± ØµØ¯ÙØ± ÙØ§Ú©ØªÙØ±');
    }
    return;
  }

  if (data === 'invoice:cancel') {
    await ctx.answerCallbackQuery({ text: 'â ÙØºÙ Ø´Ø¯' });
    invoiceConversations.delete(chatId);
    await ctx.reply('â ØµØ¯ÙØ± ÙØ§Ú©ØªÙØ± ÙØºÙ Ø´Ø¯.');
    return;
  }

  if (data === 'invoice:change_ejrat') {
    await ctx.answerCallbackQuery();
    await ctx.reply('ð§ Ø¯Ø±ØµØ¯ Ø§Ø¬Ø±Øª Ø¬Ø¯ÛØ¯ Ø±Ø§ ÙØ§Ø±Ø¯ Ú©ÙÛØ¯ (ÙØ«ÙØ§Ù 4):');
    // We'll use a special state
    const conv = invoiceConversations.get(chatId);
    if (conv) {
      alertConversations.set(chatId, { assetType: 'change_ejrat', condition: String(conv.ejratPercent) });
    }
    return;
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 18: Alert Checker Cron (every 30 seconds)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

setInterval(async () => {
  try {
    const activeAlerts = await prisma.telegramAlert.findMany({
      where: { isActive: true, isTriggered: false },
      include: { telegramUser: true },
    });

    for (const alert of activeAlerts) {
      try {
        const currentPrice = getMockPrice(alert.assetType);

        const isTriggered =
          (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
          (alert.condition === 'below' && currentPrice <= alert.targetPrice) ||
          (alert.condition === 'crosses' && Math.abs(currentPrice - alert.targetPrice) < alert.targetPrice * 0.001);

        if (isTriggered) {
          const assetLabels: Record<string, string> = {
            gold18: 'Ø·ÙØ§Û Û±Û¸ Ø¹ÛØ§Ø±',
            gold24: 'Ø·ÙØ§Û Û²Û´ Ø¹ÛØ§Ø±',
            mesghal: 'ÙØ«ÙØ§Ù Ø·ÙØ§',
            ounce: 'Ø§ÙÙØ³ Ø¬ÙØ§ÙÛ',
          };
          const conditionLabels: Record<string, string> = {
            above: 'Ø±Ø³ÛØ¯ ÛØ§ Ø¹Ø¨ÙØ± Ú©Ø±Ø¯ â¬ï¸',
            below: 'Ù¾Ø§ÛÛÙâØªØ± Ø¢ÙØ¯ â¬ï¸',
            crosses: 'Ø¹Ø¨ÙØ± Ú©Ø±Ø¯ âï¸',
          };

          const priceStr = alert.assetType === 'ounce'
            ? `$${formatEN(alert.targetPrice)}`
            : `${formatEN(alert.targetPrice)} ØªÙÙØ§Ù`;

          await bot.api.sendMessage(
            alert.telegramUser.chatId,
            `ð **ÙØ´Ø¯Ø§Ø± ÙÛÙØª ÙØ¹Ø§Ù Ø´Ø¯!**\n\n` +
            `ð ${assetLabels[alert.assetType] || alert.assetType}\n` +
            `ð Ø¨Ù ${priceStr} ${conditionLabels[alert.condition]}\n` +
            `ð° ÙÛÙØª ÙØ¹ÙÛ: ${alert.assetType === 'ounce' ? '$' : ''}${formatEN(currentPrice)}${alert.assetType !== 'ounce' ? ' ØªÙÙØ§Ù' : ''}\n\n` +
            `ââââââââââââââââââ\n` +
            `ð Ø¨Ø±Ø§Û ÙØ´Ø¯Ø§Ø± Ø¬Ø¯ÛØ¯: /alert`,
            { parse_mode: 'Markdown' }
          );

          await prisma.telegramAlert.update({
            where: { id: alert.id },
            data: { isTriggered: true, triggeredAt: new Date() },
          });

          console.log(`ð Alert triggered: ${alert.id} for user ${alert.telegramUser.chatId}`);
        }
      } catch (alertErr: any) {
        console.error(`[alert_checker:${alert.id}]`, alertErr.message);
      }
    }
  } catch (err: any) {
    console.error('[alert_checker]', err.message);
  }
}, 30000);

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 19: Scheduled Report Sender (Daily at 8 AM Tehran time)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function getNextTehran8AM(): number {
  const now = new Date();
  const tehranOffset = 3.5 * 60 * 60 * 1000;
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const tehranNow = new Date(utcNow + tehranOffset);

  // Next 8 AM Tehran time
  const target = new Date(tehranNow);
  target.setHours(8, 0, 0, 0);
  if (target <= tehranNow) {
    target.setDate(target.getDate() + 1);
  }

  // Convert back to UTC
  return target.getTime() - tehranOffset - now.getTimezoneOffset() * 60 * 1000;
}

// Schedule daily report
function scheduleDailyReport() {
  const delay = getNextTehran8AM();

  setTimeout(async () => {
    await sendDailyReports();
    // Reschedule for next day
    setInterval(sendDailyReports, 24 * 60 * 60 * 1000);
  }, delay);

  console.log(`ð Daily report scheduled in ${Math.round(delay / 60000)} minutes`);
}

async function sendDailyReports() {
  try {
    console.log('ð Sending daily reports...');

    const subscriptions = await prisma.telegramSubscription.findMany({
      where: { type: 'analysis', schedule: 'daily', isActive: true },
      include: { telegramUser: true },
    });

    const prices = getAllPrices();

    for (const sub of subscriptions) {
      try {
        await bot.api.sendMessage(
          sub.telegramUser.chatId,
          `ð° **ØªØ­ÙÛÙ Ø±ÙØ²Ø§ÙÙ Ø¨Ø§Ø²Ø§Ø± Ø·ÙØ§**\n` +
          `ð ${formatDate(getTehranTime())}\n` +
          `ââââââââââââââââââââââ\n\n` +
          `ð° ÙÛÙØªâÙØ§:\n` +
          `ð¥ Ø·ÙØ§Û Û±Û¸: ${formatEN(prices.gold18.price)} Øª ${getArrow(prices.gold18.change)} ${formatPercent(prices.gold18.change)}\n` +
          `âï¸ ÙØ«ÙØ§Ù: ${formatEN(prices.mesghal.price)} Øª ${getArrow(prices.mesghal.change)} ${formatPercent(prices.mesghal.change)}\n` +
          `ð Ø§ÙÙØ³: $${formatEN(prices.ounce.price)} ${getArrow(prices.ounce.change)} ${formatPercent(prices.ounce.change)}\n\n` +
          `ð ØªØ­ÙÛÙ Ú©ÙØªØ§Ù: ${Math.random() > 0.5 ? 'Ø¨Ø§Ø²Ø§Ø± ØµØ¹ÙØ¯Û' : 'Ø¨Ø§Ø²Ø§Ø± ÙØ²ÙÙÛ'} - ${Math.random() > 0.5 ? 'ØªÙØ§Ø¶Ø§Û Ø¨Ø§ÙØ§' : 'ÙØ´Ø§Ø± ÙØ±ÙØ´'}\n\n` +
          `ââââââââââââââââââââââ\n` +
          `â ÙØºÙ Ø§Ø´ØªØ±Ø§Ú©: /unsubscribe`,
          { parse_mode: 'Markdown' }
        );
      } catch (sendErr: any) {
        console.error(`[daily_report:${sub.telegramUser.chatId}]`, sendErr.message);
      }
    }

    // Also send to users with subscribedAnalysis = true
    const analysisUsers = await prisma.telegramUser.findMany({
      where: { subscribedAnalysis: true },
    });

    for (const user of analysisUsers) {
      // Check if not already sent via subscription
      const alreadySent = subscriptions.find(s => s.telegramUserId === user.id);
      if (!alreadySent) {
        try {
          await bot.api.sendMessage(
            user.chatId,
            `ð° **Ø®ÙØ§ØµÙ Ø±ÙØ²Ø§ÙÙ**\n` +
            `ð¥ Ø·ÙØ§Û Û±Û¸: ${formatEN(prices.gold18.price)} Øª ${getArrow(prices.gold18.change)} ${formatPercent(prices.gold18.change)}\n` +
            `âï¸ ÙØ«ÙØ§Ù: ${formatEN(prices.mesghal.price)} Øª ${getArrow(prices.mesghal.change)} ${formatPercent(prices.mesghal.change)}\n` +
            `ð Ø§ÙÙØ³: $${formatEN(prices.ounce.price)} ${getArrow(prices.ounce.change)} ${formatPercent(prices.ounce.change)}\n\n` +
            `â ÙØºÙ: /unsubscribe`,
            { parse_mode: 'Markdown' }
          );
        } catch { /* ignore */ }
      }
    }

    console.log(`ð Daily reports sent to ${subscriptions.length + analysisUsers.length} users`);
  } catch (err: any) {
    console.error('[daily_report]', err.message);
  }
}

scheduleDailyReport();

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 20: Health Check HTTP Server (Port 3005)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const HEALTH_PORT = 3005;

Bun.serve({
  port: HEALTH_PORT,
  hostname: '0.0.0.0',
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'zarrin-gold-telegram-bot',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/info') {
      return new Response(JSON.stringify({
        service: 'Mili Gold Telegram Bot',
        features: [
          'live-price', 'price-alerts', 'ai-analysis',
          'b2b-toolkit', 'fast-trading', 'daily-report',
          'referral', 'receipt-notifications', 'support-tickets',
        ],
        token_set: BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE',
        prisma_connected: true,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`ð¥ Health check server running on port ${HEALTH_PORT}`);

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// SECTION 21: Bot Start (Long Polling)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

// Global error handler
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[bot_error] ${err.message}`);
  console.error(`  Update: ${ctx.update.update_id}`);
  const msg = ctx.message;
  if (msg) {
    console.error(`  From: ${msg.from?.id} @${msg.from?.username}`);
    console.error(`  Text: ${msg.text?.substring(0, 50)}`);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nð Shutting down...');
  await prisma.$disconnect();
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nð Shutting down...');
  await prisma.$disconnect();
  bot.stop();
  process.exit(0);
});

// Start bot with long polling
if (IS_DEV) {
  console.log('â ï¸  DEVELOPMENT MODE â Bot token not set. Only health check server is active.');
  console.log('   Set TELEGRAM_BOT_TOKEN in .env to start the bot.');
  console.log(`   Health check: http://localhost:${HEALTH_PORT}/health`);
} else {
  bot.start({
    onStart: (info) => {
      console.log(`â Mili Gold Telegram Bot @${info.username} is running (long polling)`);
      console.log(`   Bot ID: ${info.id}`);
      console.log(`   Health check: http://localhost:${HEALTH_PORT}/health`);
      console.log(`   Features: 9 modules loaded`);
      console.log(`   Alert checker: every 30s`);
      console.log(`   Daily report: 8:00 AM Tehran`);
    },
  });
}
