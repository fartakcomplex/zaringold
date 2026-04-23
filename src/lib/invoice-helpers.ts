// ─────────────────────────────────────────────────────────────────
//  Invoice Helpers — زرین گلد (Zarrin Gold)
//  Utility functions for invoice number generation, Persian
//  date/currency formatting, and transaction type labels.
// ─────────────────────────────────────────────────────────────────

/* ------------------------------------------------------------------ */
/*  Generate formatted invoice number                                   */
/*  Pattern: ZG-14031225-001 (type prefix + Persian date + seq)       */
/* ------------------------------------------------------------------ */

const INVOICE_COUNTERS: Record<string, number> = {};

export function generateInvoiceNumber(type: string): string {
  // Map type to a short prefix
  const prefixMap: Record<string, string> = {
    deposit: 'DEP',
    buy_gold: 'BUY',
    sell_gold: 'SEL',
    withdrawal: 'WDR',
    settlement: 'SET',
    gateway: 'GTW',
    cashback: 'CSH',
    referral: 'REF',
    gift: 'GFT',
    autosave: 'SAV',
    loan: 'LOA',
    transfer: 'TRF',
  };

  const prefix = prefixMap[type] || 'INV';

  // Get current Persian date components
  const now = new Date();
  const persianDateParts = getPersianDateParts(now);
  const dateStr = `${persianDateParts.year}${String(persianDateParts.month).padStart(2, '0')}${String(persianDateParts.day).padStart(2, '0')}`;

  // Increment counter per type per day
  const key = `${prefix}-${dateStr}`;
  INVOICE_COUNTERS[key] = (INVOICE_COUNTERS[key] || 0) + 1;
  const seq = String(INVOICE_COUNTERS[key]).padStart(3, '0');

  return `ZG-${dateStr}-${seq}`;
}

/* ------------------------------------------------------------------ */
/*  Simple Gregorian → Persian (Jalali) calendar conversion            */
/*  Algorithm: By Roozbeh Pournader & Mohammad Toossi                 */
/* ------------------------------------------------------------------ */

function getPersianDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  // The days of each month in the Persian calendar
  const persianDaysInMonth = [0, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  let gDaysInMonth: number[] = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Leap year adjustment for Gregorian
  if (
    (gy % 4 === 0 && gy % 100 !== 0) ||
    gy % 400 === 0
  ) {
    gDaysInMonth[2] = 29;
  }

  // Total days from Gregorian 1/1/1 to the given date
  const gTotalDays =
    gy * 365 +
    Math.floor((gy + 3) / 4) -
    Math.floor((gy + 99) / 100) +
    Math.floor((gy + 399) / 400);

  let totalDays = gTotalDays;
  for (let i = 1; i < gm; i++) {
    totalDays += gDaysInMonth[i];
  }
  totalDays += gd;

  // Offset: Persian epoch starts 226876 days after Gregorian epoch
  // Persian 1/1/1 = Gregorian March 20, 622
  const persianEpoch = 226876;
  const pTotalDays = totalDays - persianEpoch;

  const pCycle = Math.floor(pTotalDays / 1029983);
  const pRemainder = pTotalDays % 1029983;

  let py: number;
  if (pRemainder === 1029982) {
    py = 33 * pCycle + 8;
  } else {
    const pYearCycle = Math.floor((2816 * pRemainder + 1038896) / 1029983);
    py = 33 * pCycle + pYearCycle;
  }

  let pDaysRemaining = pTotalDays - (365 * py + Math.floor((py + 3) / 4));

  // Leap day correction
  if (py > 0 && (py % 4 === 0) && ((py % 100 !== 0) || (py % 400 === 0)) && pDaysRemaining === 0) {
    // Adjust for leap year edge case
  }

  if (pDaysRemaining <= 0) {
    py -= 1;
    pDaysRemaining =
      365 * py + Math.floor((py + 3) / 4) - (365 * (py - 1) + Math.floor((py + 2) / 4)) + pDaysRemaining;
  }

  let pm: number;
  let pd: number;

  if (pDaysRemaining <= 186) {
    pm = Math.ceil(pDaysRemaining / 31);
    pd = pDaysRemaining - (pm - 1) * 31;
  } else {
    pDaysRemaining -= 186;
    pm = Math.ceil(pDaysRemaining / 30) + 6;
    pd = pDaysRemaining - (pm - 7) * 30;
  }

  return { year: py, month: pm, day: pd };
}

/* ------------------------------------------------------------------ */
/*  Format date in Persian (Jalali) calendar                           */
/* ------------------------------------------------------------------ */

const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const PERSIAN_MONTH_NAMES_SHORT = [
  'فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر',
  'مهر', 'آبا', 'آذر', 'دی', 'بهم', 'اسف',
];

const PERSIAN_DAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه',
];

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toPersianDigits(num: number | string): string {
  return String(num).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[parseInt(d)]);
}

export function formatPersianDate(date: Date): string {
  const { year, month, day } = getPersianDateParts(date);
  const dayOfWeek = date.getDay();
  const dayName = PERSIAN_DAYS[dayOfWeek];

  return `${dayName}، ${toPersianDigits(day)} ${PERSIAN_MONTH_NAMES[month - 1]} ${toPersianDigits(year)}`;
}

export function formatPersianDateShort(date: Date): string {
  const { year, month, day } = getPersianDateParts(date);
  return `${toPersianDigits(day)} ${PERSIAN_MONTH_NAMES_SHORT[month - 1]} ${toPersianDigits(year)}`;
}

export function formatPersianDateFull(date: Date): string {
  const { year, month, day } = getPersianDateParts(date);
  return `${toPersianDigits(year)}/${toPersianDigits(String(month).padStart(2, '0'))}/${toPersianDigits(String(day).padStart(2, '0'))}`;
}

export function formatPersianTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const h = toPersianDigits(String(hours).padStart(2, '0'));
  const m = toPersianDigits(String(minutes).padStart(2, '0'));
  return `${h}:${m}`;
}

/* ------------------------------------------------------------------ */
/*  Format currency in Persian                                          */
/* ------------------------------------------------------------------ */

export function formatPersianCurrency(
  amount: number,
  unit: 'toman' | 'rial' = 'toman',
): string {
  const formatted = new Intl.NumberFormat('fa-IR').format(Math.round(amount));
  return unit === 'toman' ? `${formatted} واحد طلایی` : `${formatted} واحد طلایی`;
}

export function formatPersianNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(num));
}

export function formatPersianGrams(grams: number): string {
  if (grams < 1) {
    return `${formatPersianNumber(grams * 1000)} میلی‌گرم`;
  }
  return `${formatPersianNumber(grams)} گرم`;
}

/* ------------------------------------------------------------------ */
/*  Get Persian label for transaction type                              */
/* ------------------------------------------------------------------ */

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    deposit: 'فاکتور واریز واحد طلایی',
    buy_gold: 'رسید خرید طلا',
    sell_gold: 'رسید فروش طلا',
    withdrawal: 'رسید برداشت',
    settlement: 'رسید تسویه‌حساب',
    gateway: 'رسید پرداخت درگاه',
    gateway_payment: 'رسید پرداخت درگاه',
    cashback: 'رسید کش‌بک',
    referral: 'رسید جایزه دعوت',
    referral_reward: 'رسید جایزه دعوت',
    gift: 'رسید هدیه طلا',
    autosave: 'رسید پس‌انداز',
    loan: 'رسید وام',
    transfer: 'رسید انتقال',
  };
  return labels[type] || 'فاکتور تراکنش';
}

/* ------------------------------------------------------------------ */
/*  Get status config for invoice badge                                 */
/* ------------------------------------------------------------------ */

export function getStatusConfig(status: string) {
  const configs: Record<
    string,
    { label: string; bg: string; borderColor: string; dotColor: string; textColor: string }
  > = {
    success: {
      label: 'تکمیل‌شده',
      bg: '#ecfdf5',
      borderColor: '#a7f3d0',
      dotColor: '#10b981',
      textColor: '#047857',
    },
    completed: {
      label: 'تکمیل‌شده',
      bg: '#ecfdf5',
      borderColor: '#a7f3d0',
      dotColor: '#10b981',
      textColor: '#047857',
    },
    pending: {
      label: 'در انتظار',
      bg: '#fffbeb',
      borderColor: '#fde68a',
      dotColor: '#f59e0b',
      textColor: '#b45309',
    },
    processing: {
      label: 'در حال پردازش',
      bg: '#eff6ff',
      borderColor: '#bfdbfe',
      dotColor: '#3b82f6',
      textColor: '#1d4ed8',
    },
    failed: {
      label: 'ناموفق',
      bg: '#fef2f2',
      borderColor: '#fecaca',
      dotColor: '#ef4444',
      textColor: '#dc2626',
    },
    cancelled: {
      label: 'لغو شده',
      bg: '#f9fafb',
      borderColor: '#e5e7eb',
      dotColor: '#9ca3af',
      textColor: '#6b7280',
    },
  };
  return configs[status] || configs.completed;
}
