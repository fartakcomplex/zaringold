import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';

/* ------------------------------------------------------------------ */
/*  POST /api/invoice/pdf  —  Generate A4 PDF receipt                  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      id,
      type,
      amountGold,
      amountFiat,
      fee,
      goldPrice,
      status,
      referenceId,
      description,
      createdAt,
      merchantName,
      settlementType,
      paymentCount,
      netGrams,
      feeGrams,
      merchantOrderId,
      userName,
    } = body as {
      id: string;
      type: string;
      amountGold: number;
      amountFiat: number;
      fee: number;
      goldPrice: number;
      status: string;
      referenceId: string | null;
      description: string | null;
      createdAt: string;
      merchantName?: string;
      settlementType?: string;
      paymentCount?: number;
      netGrams?: number;
      feeGrams?: number;
      merchantOrderId?: string;
      userName?: string;
    };

    /* ── Persian formatters ── */
    const fmtNum = (n: number) =>
      new Intl.NumberFormat('fa-IR').format(Math.round(n));
    const fmtToman = (n: number) => `${fmtNum(n)} واحد طلایی`;
    const fmtGrams = (n: number) =>
      n < 1
        ? `${fmtNum(n * 1000)} میلی‌گرم`
        : `${fmtNum(n)} گرم`;
    const fmtDate = (d: string) =>
      new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(d));
    const fmtTime = (d: string) =>
      new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(d));
    const toFa = (s: string) =>
      s.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

    const fmtStatus = (s: string) => {
      const map: Record<string, string> = {
        success: 'موفق',
        completed: 'تکمیل‌شده',
        pending: 'در انتظار',
        processing: 'در حال پردازش',
        failed: 'ناموفق',
        cancelled: 'لغو‌شده',
      };
      return map[s] || s;
    };

    /* ── Invoice meta ── */
    const invoiceNumber = `ZG-${(referenceId || id).slice(0, 8).toUpperCase()}`;
    const statusLabel = fmtStatus(status);

    /* ── Type configuration ── */
    type TypeConfig = {
      title: string;
      subtitle: string;
      accent: string;
      accentBg: string;
      accentBorder: string;
      pillBg: string;
      pillBorder: string;
      dotColor: string;
      textColor: string;
      amountHeader: string;
      sigLeftRole: string;
      sigLeftSub: string;
      sigRightRole: string;
      sigRightSub: string;
      legalP1: string;
      legalP2: string;
    };

    const typeConfigs: Record<string, TypeConfig> = {
      buy_gold: {
        title: 'فاکتور خرید طلا',
        subtitle: 'سند خرید طلای خالص از پلتفرم زرین گلد',
        accent: '#10b981',
        accentBg: '#ecfdf5',
        accentBorder: '#a7f3d0',
        pillBg: '#ecfdf5',
        pillBorder: '#a7f3d0',
        dotColor: '#10b981',
        textColor: '#047857',
        amountHeader: 'جزئیات خرید طلا',
        sigLeftRole: 'امضای صادرکننده',
        sigLeftSub: 'مدیر مالی زرین گلد',
        sigRightRole: 'امضای خریدار',
        sigRightSub: 'کاربر زرین گلد',
        legalP1: 'این فاکتور خرید طلا به صورت خودکار توسط پلتفرم زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
        legalP2: 'تمامی معاملات طلای خالص مطابق با قوانین سازمان بورس و اوراق بهادار انجام می‌شود. هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      },
      sell_gold: {
        title: 'فاکتور فروش طلا',
        subtitle: 'سند فروش طلای خالص در پلتفرم زرین گلد',
        accent: '#f59e0b',
        accentBg: '#fffbeb',
        accentBorder: '#fde68a',
        pillBg: '#fffbeb',
        pillBorder: '#fde68a',
        dotColor: '#f59e0b',
        textColor: '#b45309',
        amountHeader: 'جزئیات فروش طلا',
        sigLeftRole: 'امضای صادرکننده',
        sigLeftSub: 'مدیر مالی زرین گلد',
        sigRightRole: 'امضای فروشنده',
        sigRightSub: 'کاربر زرین گلد',
        legalP1: 'این فاکتور فروش طلا به صورت خودکار توسط پلتفرم زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
        legalP2: 'تمامی معاملات طلای خالص مطابق با قوانین سازمان بورس و اوراق بهادار انجام می‌شود. هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      },
      deposit: {
        title: 'رسید واریز واحد طلایی',
        subtitle: 'رسید واریز وجه به کیف پول واحد طلایی',
        accent: '#3b82f6',
        accentBg: '#eff6ff',
        accentBorder: '#bfdbfe',
        pillBg: '#eff6ff',
        pillBorder: '#bfdbfe',
        dotColor: '#3b82f6',
        textColor: '#1d4ed8',
        amountHeader: 'جزئیات واریز',
        sigLeftRole: 'امضای صادرکننده',
        sigLeftSub: 'مدیر مالی زرین گلد',
        sigRightRole: 'امضای واریزکننده',
        sigRightSub: 'کاربر زرین گلد',
        legalP1: 'این رسید واریز وجه به صورت خودکار توسط پلتفرم زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
        legalP2: 'واریزهای واحد طلایی پس از تأیید سیستم بانکی نهایی شده و قابل بازگشت نمی‌باشند مگر در موارد قانونی. هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      },
      withdrawal: {
        title: 'رسید برداشت واحد طلایی',
        subtitle: 'رسید درخواست برداشت وجه از کیف پول',
        accent: '#ef4444',
        accentBg: '#fef2f2',
        accentBorder: '#fecaca',
        pillBg: '#fef2f2',
        pillBorder: '#fecaca',
        dotColor: '#ef4444',
        textColor: '#b91c1c',
        amountHeader: 'جزئیات برداشت',
        sigLeftRole: 'امضای صادرکننده',
        sigLeftSub: 'مدیر مالی زرین گلد',
        sigRightRole: 'امضای درخواست‌کننده',
        sigRightSub: 'کاربر زرین گلد',
        legalP1: 'این رسید برداشت وجه به صورت خودکار توسط پلتفرم زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
        legalP2: 'برداشت‌های واحد طلایی پس از تأیید سیستم بانکی نهایی شده و قابل بازگشت نمی‌باشند مگر در موارد قانونی. هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      },
      settlement_deposit: {
        title: 'رسید تسویه‌حساب درگاه پرداخت',
        subtitle: 'فاکتور تسویه وجوه حاصل از درگاه پرداخت طلایی',
        accent: '#10b981',
        accentBg: '#ecfdf5',
        accentBorder: '#a7f3d0',
        pillBg: '#ecfdf5',
        pillBorder: '#a7f3d0',
        dotColor: '#10b981',
        textColor: '#047857',
        amountHeader: 'مالیات و کارمزد — جدول مبالغ',
        sigLeftRole: 'امضای صادرکننده',
        sigLeftSub: 'مدیر مالی زرین گلد',
        sigRightRole: 'امضای دریافت‌کننده',
        sigRightSub: 'پذیرنده درگاه پرداخت',
        legalP1: 'این سند به صورت خودکار توسط سیستم درگاه پرداخت طلایی زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
        legalP2: 'این فاکتور مرجع رسمی تسویه حساب محسوب می‌شود و هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      },
      referral_reward: {
        title: 'رسید جایزه معرفی',
        subtitle: 'رسید جایزه دریافتی از دعوت کاربر جدید',
        accent: '#8b5cf6',
        accentBg: '#f5f3ff',
        accentBorder: '#c4b5fd',
        pillBg: '#f5f3ff',
        pillBorder: '#c4b5fd',
        dotColor: '#8b5cf6',
        textColor: '#6d28d9',
        amountHeader: 'جزئیات جایزه معرفی',
        sigLeftRole: 'امضای صادرکننده',
        sigLeftSub: 'مدیر بازاریابی زرین گلد',
        sigRightRole: 'امضای دریافت‌کننده',
        sigRightSub: 'کاربر زرین گلد',
        legalP1: 'این رسید جایزه معرفی به صورت خودکار توسط پلتفرم زرین گلد صادر شده است.',
        legalP2: 'جایزه معرفی پس از انجام اولین معامله توسط کاربر دعوت‌شده واریز می‌گردد. هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      },
      cashback: {
        title: 'رسید کش‌بک',
        subtitle: 'رسید بازپرداخت کش‌بک خرید',
        accent: '#ec4899',
        accentBg: '#fdf2f8',
        accentBorder: '#f9a8d4',
        pillBg: '#fdf2f8',
        pillBorder: '#f9a8d4',
        dotColor: '#ec4899',
        textColor: '#be185d',
        amountHeader: 'جزئیات کش‌بک',
        sigLeftRole: 'امضای صادرکننده',
        sigLeftSub: 'مدیر مالی زرین گلد',
        sigRightRole: 'امضای دریافت‌کننده',
        sigRightSub: 'کاربر زرین گلد',
        legalP1: 'این رسید کش‌بک به صورت خودکار توسط پلتفرم زرین گلد صادر شده است.',
        legalP2: 'مبلغ کش‌بک بلافاصله پس از تکمیل خرید به کیف پول کاربر واریز می‌گردد. هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      },
      gateway_payment: {
        title: 'رسید پرداخت درگاه طلایی',
        subtitle: 'رسید پرداخت از کیف پول طلایی به پذیرنده',
        accent: '#06b6d4',
        accentBg: '#ecfeff',
        accentBorder: '#a5f3fc',
        pillBg: '#ecfeff',
        pillBorder: '#a5f3fc',
        dotColor: '#06b6d4',
        textColor: '#0e7490',
        amountHeader: 'جزئیات پرداخت درگاه',
        sigLeftRole: 'امضای صادرکننده',
        sigLeftSub: 'مدیر مالی زرین گلد',
        sigRightRole: 'امضای پذیرنده',
        sigRightSub: merchantName || 'پذیرنده درگاه پرداخت',
        legalP1: 'این رسید پرداخت درگاه طلایی به صورت خودکار توسط پلتفرم زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
        legalP2: 'پرداخت‌های درگاه طلایی پس از کسر کارمزد و تأیید سیستم نهایی می‌شوند. هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      },
    };

    const cfg = typeConfigs[type] || typeConfigs.settlement_deposit;

    /* ── Helpers for type-specific logic ── */
    const isSettlement = type === 'settlement_deposit';
    const isBuyGold = type === 'buy_gold';
    const isSellGold = type === 'sell_gold';
    const isDeposit = type === 'deposit';
    const isWithdrawal = type === 'withdrawal';
    const isReferral = type === 'referral_reward';
    const isCashback = type === 'cashback';
    const isGateway = type === 'gateway_payment';

    const isGoldTx = isBuyGold || isSellGold || isGateway;
    const isFiatOnly = isDeposit || isWithdrawal;
    const isRewardTx = isReferral || isCashback;

    const goldAmount = isSettlement && netGrams ? netGrams : amountGold;

    const settlementLabel = isSettlement
      ? 'تسویه شده از درگاه پرداخت'
      : 'تراکنش مالی';
    const settlementTypeLabel =
      settlementType === 'instant'
        ? '⚡ تسویه آنی'
        : settlementType === 'daily'
          ? '📅 تسویه روزانه'
          : '📋 تسویه دستی';

    /* ── Info table second header ── */
    const infoSecondHeader = (() => {
      if (isSettlement) return 'جزئیات تسویه';
      if (isGateway && merchantName) return 'اطلاعات پذیرنده';
      if (isBuyGold) return 'جزئیات خرید';
      if (isSellGold) return 'جزئیات فروش';
      if (isDeposit) return 'جزئیات واریز';
      if (isWithdrawal) return 'جزئیات برداشت';
      if (isReferral) return 'جزئیات جایزه';
      if (isCashback) return 'جزئیات کش‌بک';
      return 'جزئیات تراکنش';
    })();

    /* ── Row 2 cell 2: type-specific detail ── */
    const row2Cell2 = (() => {
      if (isSettlement && settlementType) {
        return `
          <td class="td-label">نوع تسویه</td>
          <td class="td-value">
            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;background:${cfg.accentBg};color:${cfg.textColor};font-size:11px;font-weight:700;">
              ${settlementTypeLabel}
            </span>
          </td>`;
      }
      return `
        <td class="td-label">وضعیت</td>
        <td class="td-value" style="color:${cfg.textColor};font-weight:700;">● ${statusLabel}</td>`;
    })();

    /* ── Row 3 cell 2: type-specific detail ── */
    const row3Cell2 = (() => {
      if (isSettlement && paymentCount !== undefined) {
        return `
          <td class="td-label">تعداد تراکنش‌ها</td>
          <td class="td-value-bold">${toFa(String(paymentCount))} تراکنش</td>`;
      }
      if (isBuyGold) {
        return `
          <td class="td-label">قیمت هر گرم</td>
          <td class="td-value-bold">${goldPrice > 0 ? fmtToman(goldPrice) : '—'}</td>`;
      }
      if (isSellGold) {
        return `
          <td class="td-label">قیمت هر گرم</td>
          <td class="td-value-bold">${goldPrice > 0 ? fmtToman(goldPrice) : '—'}</td>`;
      }
      if (isDeposit) {
        return `
          <td class="td-label">وضعیت</td>
          <td class="td-value" style="color:${cfg.textColor};font-weight:700;">● ${statusLabel}</td>`;
      }
      if (isWithdrawal) {
        return `
          <td class="td-label">وضعیت</td>
          <td class="td-value" style="color:${cfg.textColor};font-weight:700;">● ${statusLabel}</td>`;
      }
      return `
        <td class="td-label">شناسه فاکتور</td>
        <td class="td-value" style="font-family:monospace;direction:ltr;text-align:left;font-size:11px;">${invoiceNumber}</td>`;
    })();

    /* ── Extra info rows (type-specific) ── */
    const extraInfoRows = (() => {
      let rows = '';

      if (isSettlement && merchantName) {
        rows += `
        <tr>
          <td class="td-label">پذیرنده</td>
          <td colspan="3" style="font-weight:700;">${merchantName}</td>
        </tr>`;
      }

      if (isGateway && merchantName) {
        rows += `
        <tr>
          <td class="td-label">پذیرنده</td>
          <td style="font-weight:700;">${merchantName}</td>
          <td class="td-label">شماره سفارش پذیرنده</td>
          <td class="td-value" style="font-family:monospace;direction:ltr;text-align:left;font-size:11px;">${merchantOrderId || '—'}</td>
        </tr>`;
      }

      if (userName) {
        rows += `
        <tr>
          <td class="td-label">نام کاربر</td>
          <td colspan="3" style="font-weight:700;">${userName}</td>
        </tr>`;
      }

      return rows;
    })();

    /* ── Amount rows (type-specific) ── */
    const amountRows = (() => {
      let rows = '';

      if (isBuyGold) {
        rows += `
            <tr>
              <td class="td-label"><span class="icon-badge icon-gold">🪙</span>مقدار طلا خریداری‌شده</td>
              <td><span class="val-gold">${fmtGrams(amountGold)}</span></td>
            </tr>
            <tr>
              <td class="td-label"><span class="icon-badge icon-green">💰</span>مبلغ پرداخت‌شده</td>
              <td><span class="val-green">${fmtToman(amountFiat)}</span></td>
            </tr>
            ${fee > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-red">📊</span>کارمزد معامله</td>
              <td><span class="val-red">-${fmtToman(fee)}</span></td>
            </tr>
            ` : ''}
            ${goldPrice > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-blue">📈</span>قیمت هر گرم</td>
              <td><span class="val-blue">${fmtNum(goldPrice)} واحد طلایی</span></td>
            </tr>
            ` : ''}`;
      } else if (isSellGold) {
        rows += `
            <tr>
              <td class="td-label"><span class="icon-badge icon-gold">🪙</span>مقدار طلا فروخته‌شده</td>
              <td><span class="val-gold">${fmtGrams(amountGold)}</span></td>
            </tr>
            <tr>
              <td class="td-label"><span class="icon-badge icon-green">💰</span>مبلغ دریافتی</td>
              <td><span class="val-green">${fmtToman(amountFiat)}</span></td>
            </tr>
            ${fee > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-red">📊</span>کارمزد معامله</td>
              <td><span class="val-red">-${fmtToman(fee)}</span></td>
            </tr>
            ` : ''}
            ${goldPrice > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-blue">📈</span>قیمت هر گرم</td>
              <td><span class="val-blue">${fmtNum(goldPrice)} واحد طلایی</span></td>
            </tr>
            ` : ''}`;
      } else if (isDeposit) {
        rows += `
            <tr>
              <td class="td-label"><span class="icon-badge icon-green">💰</span>مبلغ واریزشده</td>
              <td><span class="val-green">${fmtToman(amountFiat)}</span></td>
            </tr>`;
      } else if (isWithdrawal) {
        rows += `
            <tr>
              <td class="td-label"><span class="icon-badge icon-red">💰</span>مبلغ برداشتشده</td>
              <td><span class="val-red">${fmtToman(amountFiat)}</span></td>
            </tr>
            ${fee > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-blue">📊</span>کارمزد برداشت</td>
              <td><span class="val-red">-${fmtToman(fee)}</span></td>
            </tr>
            ` : ''}`;
      } else if (isSettlement) {
        rows += `
            <tr>
              <td class="td-label"><span class="icon-badge icon-gold">🪙</span>مقدار طلا (خالص)</td>
              <td><span class="val-gold">${fmtGrams(goldAmount)}</span></td>
            </tr>
            <tr>
              <td class="td-label"><span class="icon-badge icon-green">💰</span>معادل واحد طلایی</td>
              <td><span class="val-green">${fmtToman(amountFiat)}</span></td>
            </tr>
            ${feeGrams !== undefined && feeGrams > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-red">📊</span>کارمزد کسرشده</td>
              <td><span class="val-red">-${fmtGrams(feeGrams)}</span></td>
            </tr>
            ` : ''}
            ${goldPrice > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-blue">📈</span>قیمت هر گرم طلای خالص</td>
              <td><span class="val-blue">${fmtNum(goldPrice)} واحد طلایی</span></td>
            </tr>
            ` : ''}`;
      } else if (isReferral) {
        rows += `
            ${amountGold > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-gold">🪙</span>مقدار طلا جایزه</td>
              <td><span class="val-gold">${fmtGrams(amountGold)}</span></td>
            </tr>
            ` : ''}
            ${amountFiat > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-green">💰</span>مبلغ جایزه واحد طلایی</td>
              <td><span class="val-green">${fmtToman(amountFiat)}</span></td>
            </tr>
            ` : ''}`;
      } else if (isCashback) {
        rows += `
            ${amountGold > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-gold">🪙</span>مقدار طلا کش‌بک</td>
              <td><span class="val-gold">${fmtGrams(amountGold)}</span></td>
            </tr>
            ` : ''}
            ${amountFiat > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-green">💰</span>مبلغ کش‌بک واحد طلایی</td>
              <td><span class="val-green">${fmtToman(amountFiat)}</span></td>
            </tr>
            ` : ''}`;
      } else if (isGateway) {
        rows += `
            <tr>
              <td class="td-label"><span class="icon-badge icon-gold">🪙</span>مقدار طلا پرداخت‌شده</td>
              <td><span class="val-gold">${fmtGrams(amountGold)}</span></td>
            </tr>
            <tr>
              <td class="td-label"><span class="icon-badge icon-green">💰</span>معادل واحد طلایی</td>
              <td><span class="val-green">${fmtToman(amountFiat)}</span></td>
            </tr>
            ${fee > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-red">📊</span>کارمزد</td>
              <td><span class="val-red">-${fmtToman(fee)}</span></td>
            </tr>
            ` : ''}
            ${goldPrice > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-blue">📈</span>قیمت هر گرم</td>
              <td><span class="val-blue">${fmtNum(goldPrice)} واحد طلایی</span></td>
            </tr>
            ` : ''}`;
      } else {
        /* Fallback */
        rows += `
            ${amountGold > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-gold">🪙</span>مقدار طلا</td>
              <td><span class="val-gold">${fmtGrams(amountGold)}</span></td>
            </tr>
            ` : ''}
            ${amountFiat > 0 ? `
            <tr>
              <td class="td-label"><span class="icon-badge icon-green">💰</span>مبلغ واحد طلایی</td>
              <td><span class="val-green">${fmtToman(amountFiat)}</span></td>
            </tr>
            ` : ''}`;
      }

      return rows;
    })();

    /* ── Total section (type-specific) ── */
    const totalSection = (() => {
      if (isBuyGold) {
        return `
        <div class="total-row">
          <div class="total-inner">
            <div class="total-label">مجموع خرید</div>
            <div class="total-vals">
              <div class="total-block">
                <div class="big">${fmtGrams(amountGold)}</div>
                <div class="small">طلای خالص دریافت‌شده</div>
              </div>
              <div class="total-divider"></div>
              <div class="total-block green">
                <div class="big">${fmtToman(amountFiat)}</div>
                <div class="small">مبلغ پرداخت‌شده</div>
              </div>
            </div>
          </div>
        </div>`;
      }

      if (isSellGold) {
        return `
        <div class="total-row">
          <div class="total-inner">
            <div class="total-label">مبلغ دریافتی</div>
            <div class="total-vals">
              <div class="total-block green">
                <div class="big">${fmtToman(amountFiat)}</div>
                <div class="small">واحد طلایی واریزشده به کیف پول</div>
              </div>
            </div>
          </div>
        </div>`;
      }

      if (isDeposit) {
        return `
        <div class="total-row">
          <div class="total-inner">
            <div class="total-label">مبلغ واریزی</div>
            <div class="total-vals">
              <div class="total-block green">
                <div class="big">${fmtToman(amountFiat)}</div>
                <div class="small">واریزشده به کیف پول واحد طلایی</div>
              </div>
            </div>
          </div>
        </div>`;
      }

      if (isWithdrawal) {
        return `
        <div class="total-row">
          <div class="total-inner">
            <div class="total-label">مبلغ برداشت</div>
            <div class="total-vals">
              <div class="total-block">
                <div class="big">${fmtToman(amountFiat)}</div>
                <div class="small">برداشتشده از کیف پول واحد طلایی</div>
              </div>
              ${fee > 0 ? `
              <div class="total-divider"></div>
              <div class="total-block">
                <div class="big" style="font-size:14px;color:#ef4444;">-${fmtToman(fee)}</div>
                <div class="small">کارمزد</div>
              </div>
              ` : ''}
            </div>
          </div>
        </div>`;
      }

      if (isSettlement) {
        return `
        <div class="total-row">
          <div class="total-inner">
            <div class="total-label">مبلغ کل واریزی</div>
            <div class="total-vals">
              <div class="total-block">
                <div class="big">${fmtGrams(goldAmount)}</div>
                <div class="small">طلای خالص</div>
              </div>
              <div class="total-divider"></div>
              <div class="total-block green">
                <div class="big">${fmtToman(amountFiat)}</div>
                <div class="small">معادل واحد طلایی</div>
              </div>
            </div>
          </div>
        </div>`;
      }

      if (isReferral) {
        const rewardVal = amountGold > 0 ? fmtGrams(amountGold) : fmtToman(amountFiat);
        const rewardUnit = amountGold > 0 ? 'طلای خالص' : 'واحد طلایی';
        return `
        <div class="total-row">
          <div class="total-inner">
            <div class="total-label">مبلغ جایزه</div>
            <div class="total-vals">
              <div class="total-block green">
                <div class="big">${rewardVal}</div>
                <div class="small">${rewardUnit}</div>
              </div>
            </div>
          </div>
        </div>`;
      }

      if (isCashback) {
        const cbVal = amountGold > 0 ? fmtGrams(amountGold) : fmtToman(amountFiat);
        const cbUnit = amountGold > 0 ? 'طلای خالص' : 'واحد طلایی';
        return `
        <div class="total-row">
          <div class="total-inner">
            <div class="total-label">مبلغ کش‌بک</div>
            <div class="total-vals">
              <div class="total-block green">
                <div class="big">${cbVal}</div>
                <div class="small">${cbUnit}</div>
              </div>
            </div>
          </div>
        </div>`;
      }

      if (isGateway) {
        return `
        <div class="total-row">
          <div class="total-inner">
            <div class="total-label">مبلغ پرداختی</div>
            <div class="total-vals">
              <div class="total-block">
                <div class="big">${fmtGrams(amountGold)}</div>
                <div class="small">طلای خالص</div>
              </div>
              <div class="total-divider"></div>
              <div class="total-block green">
                <div class="big">${fmtToman(amountFiat)}</div>
                <div class="small">معادل واحد طلایی</div>
              </div>
            </div>
          </div>
        </div>`;
      }

      /* Fallback */
      return `
      <div class="total-row">
        <div class="total-inner">
          <div class="total-label">مبلغ کل</div>
          <div class="total-vals">
            <div class="total-block green">
              <div class="big">${amountFiat > 0 ? fmtToman(amountFiat) : fmtGrams(amountGold)}</div>
              <div class="small">${amountFiat > 0 ? 'واحد طلایی' : 'طلای خالص'}</div>
            </div>
          </div>
        </div>
      </div>`;
    })();

    /* ── Build HTML ── */
    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Vazirmatn, Tahoma, Arial, sans-serif;
    width: 210mm;
    min-height: 297mm;
    background: white;
    color: #1f2937;
    direction: rtl;
  }

  /* ── Gold Header Band ── */
  .header-band {
    background: linear-gradient(to left, #92680c, #b8860b, #d4a017, #f5d442, #d4a017, #b8860b, #92680c);
    color: white;
    padding: 22px 36px;
    position: relative;
    overflow: hidden;
  }
  .header-band .deco {
    position: absolute;
    inset: 0;
    opacity: 0.06;
    font-size: 30px;
    letter-spacing: 10px;
    pointer-events: none;
  }
  .header-band .deco.top { top: 6px; right: 30px; }
  .header-band .deco.bot { bottom: 6px; left: 30px; }
  .header-inner {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .logo-box {
    width: 58px; height: 58px;
    border-radius: 12px;
    background: rgba(255,255,255,0.18);
    border: 2px solid rgba(255,255,255,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 900;
    font-family: monospace;
  }
  .header-title { font-size: 24px; font-weight: 900; }
  .header-sub { font-size: 11px; color: rgba(255,255,255,0.75); margin-top: 3px; }
  .invoice-label { font-size: 9px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 4px; font-family: monospace; }
  .invoice-num { font-size: 17px; font-weight: 700; font-family: monospace; letter-spacing: 1px; }

  /* ── Title Band ── */
  .title-band {
    background: ${cfg.accentBg};
    border-bottom: 2px solid ${cfg.accent};
    padding: 14px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .title-accent { width: 5px; height: 28px; border-radius: 3px; background: ${cfg.accent}; }
  .title-main { font-size: 16px; font-weight: 900; color: #111827; }
  .title-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .status-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 14px;
    border-radius: 20px;
    background: ${cfg.pillBg};
    border: 1px solid ${cfg.pillBorder};
  }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; background: ${cfg.dotColor}; }
  .status-text { font-size: 12px; font-weight: 700; color: ${cfg.textColor}; }

  /* ── Content ── */
  .content { padding: 24px 36px; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th, td { padding: 9px 13px; border: 1px solid #e5e7eb; }
  .th-accent { background: ${cfg.accentBg}; color: ${cfg.textColor}; font-size: 11px; font-weight: 700; text-align: right; }
  .td-label { background: #fafafa; color: #6b7280; width: 20%; }
  .td-value { font-weight: 500; }
  .td-value-bold { font-weight: 700; color: ${cfg.textColor}; }

  /* ── Amount Box ── */
  .amount-box {
    margin-top: 22px;
    border: 2px solid ${cfg.accent};
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 16px ${cfg.accent}20;
  }
  .amount-header {
    background: linear-gradient(to left, #b8860b, #d4a017, #f5d442);
    color: white;
    text-align: center;
    padding: 10px 20px;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .amount-body { background: white; padding: 20px; }
  .amount-body th { background: #f9fafb; color: #4b5563; font-size: 11px; text-align: right; }
  .amount-body th:last-child { text-align: center; }
  .amount-body td:last-child { text-align: center; }
  .icon-badge {
    display: inline-flex;
    width: 22px; height: 22px;
    border-radius: 5px;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    vertical-align: middle;
    margin-left: 6px;
  }
  .icon-gold { background: #fef3c7; }
  .icon-green { background: #d1fae5; }
  .icon-red { background: #fee2e2; }
  .icon-blue { background: #dbeafe; }
  .val-gold { font-size: 16px; font-weight: 900; color: #b45309; }
  .val-green { font-size: 16px; font-weight: 900; color: #047857; }
  .val-red { font-size: 14px; font-weight: 700; color: #ef4444; }
  .val-blue { font-size: 13px; font-weight: 700; color: #2563eb; }

  /* ── Total ── */
  .total-row {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 2px dashed ${cfg.accent};
  }
  .total-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${cfg.accentBg};
    border: 1px solid ${cfg.accentBorder};
    border-radius: 8px;
    padding: 10px 18px;
  }
  .total-label { font-size: 12.5px; font-weight: 700; color: #374151; }
  .total-vals { display: flex; align-items: center; gap: 14px; }
  .total-block { text-align: left; }
  .total-block .big { font-size: 18px; font-weight: 900; color: #111827; }
  .total-block .small { font-size: 10px; color: #6b7280; }
  .total-block.green .big { color: #047857; }
  .total-divider { width: 1px; height: 34px; background: ${cfg.accentBorder}; }

  /* ── Description ── */
  .desc-box {
    margin-top: 18px;
    background: ${cfg.accentBg};
    border: 1px solid ${cfg.accentBorder};
    border-radius: 8px;
    padding: 12px 18px;
  }
  .desc-label { font-size: 11px; font-weight: 700; color: ${cfg.textColor}; margin-bottom: 4px; }
  .desc-text { font-size: 12.5px; color: #374151; line-height: 1.6; }

  /* ── Signatures ── */
  .sig-section {
    margin-top: 28px;
    padding-top: 20px;
    border-top: 2px solid #e5e7eb;
  }
  .sig-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .sig-block { flex: 1; text-align: center; }
  .sig-box {
    width: 110px; height: 60px;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    margin: 0 auto 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #9ca3af;
  }
  .sig-role { font-size: 11.5px; font-weight: 700; color: #4b5563; }
  .sig-sub { font-size: 10px; color: #9ca3af; }
  .sig-center { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 24px; }
  .sig-stamp {
    width: 50px; height: 50px;
    border-radius: 50%;
    background: #fef3c7;
    border: 2px solid #fcd34d;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 900;
    color: #b45309;
    font-family: monospace;
  }
  .sig-stamp-text { font-size: 10px; color: #9ca3af; margin-top: 4px; }

  /* ── Legal ── */
  .legal {
    text-align: center;
    padding-top: 14px;
    border-top: 1px dashed #e5e7eb;
  }
  .legal p { font-size: 10.5px; color: #6b7280; line-height: 1.7; }
  .legal .mono {
    font-family: monospace;
    font-size: 10px;
    color: #9ca3af;
    margin-top: 10px;
    letter-spacing: 0.5px;
    direction: ltr;
  }

  /* ── Bottom Band ── */
  .bottom-band {
    background: linear-gradient(to left, #92680c, #b8860b, #d4a017, #f5d442, #d4a017, #b8860b, #92680c);
    color: white;
    text-align: center;
    padding: 10px 36px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header-band">
    <div class="deco top">◆◆◆◆◆◆◆◆◆◆◆◆</div>
    <div class="deco bot">◆◆◆◆◆◆◆◆◆◆◆◆</div>
    <div class="header-inner">
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="logo-box">ZG</div>
        <div>
          <div class="header-title">زرین گلد</div>
          <div class="header-sub">Zarrin Gold — پلتفرم معاملات طلای نوین</div>
        </div>
      </div>
      <div style="text-align:left;">
        <div class="invoice-label">INVOICE</div>
        <div class="invoice-num">${invoiceNumber}</div>
      </div>
    </div>
  </div>

  <!-- Title -->
  <div class="title-band">
    <div style="display:flex;align-items:center;gap:10px;">
      <div class="title-accent"></div>
      <div>
        <div class="title-main">${cfg.title}</div>
        <div class="title-sub">${cfg.subtitle}</div>
      </div>
    </div>
    <div class="status-pill">
      <div class="status-dot"></div>
      <div class="status-text">${statusLabel}</div>
    </div>
  </div>

  <!-- Content -->
  <div class="content">

    <!-- Info Table -->
    <table>
      <thead>
        <tr>
          <th colspan="2" class="th-accent">اطلاعات فاکتور</th>
          <th colspan="2" class="th-accent">${infoSecondHeader}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-label">تاریخ صدور</td>
          <td class="td-value">${fmtDate(createdAt)}</td>
          <td class="td-label">نوع تراکنش</td>
          <td class="td-value-bold">${isSettlement ? settlementLabel : cfg.title}</td>
        </tr>
        <tr>
          <td class="td-label">ساعت صدور</td>
          <td class="td-value">${fmtTime(createdAt)}</td>
          ${row2Cell2}
        </tr>
        <tr>
          <td class="td-label">شماره پیگیری</td>
          <td class="td-value" style="font-family:monospace;direction:ltr;text-align:left;font-size:11px;">${referenceId || id}</td>
          ${row3Cell2}
        </tr>
        ${extraInfoRows}
      </tbody>
    </table>

    <!-- Amount Box -->
    <div class="amount-box">
      <div class="amount-header">${cfg.amountHeader}</div>
      <div class="amount-body">
        <table>
          <thead>
            <tr>
              <th>شرح</th>
              <th>مبلغ / مقدار</th>
            </tr>
          </thead>
          <tbody>
            ${amountRows}
          </tbody>
        </table>

        ${totalSection}
      </div>
    </div>

    ${description ? `
    <div class="desc-box">
      <div class="desc-label">📝 توضیحات</div>
      <div class="desc-text">${description}</div>
    </div>
    ` : ''}

    <!-- Signatures -->
    <div class="sig-section">
      <div class="sig-row">
        <div class="sig-block">
          <div class="sig-box">مهر و امضا</div>
          <div class="sig-role">${cfg.sigLeftRole}</div>
          <div class="sig-sub">${cfg.sigLeftSub}</div>
        </div>
        <div class="sig-center">
          <div class="sig-stamp">ZG</div>
          <div class="sig-stamp-text">تأیید شده</div>
        </div>
        <div class="sig-block">
          <div class="sig-box">مهر و امضا</div>
          <div class="sig-role">${cfg.sigRightRole}</div>
          <div class="sig-sub">${cfg.sigRightSub}</div>
        </div>
      </div>
      <div class="legal">
        <p>${cfg.legalP1}</p>
        <p>${cfg.legalP2}</p>
        <p class="mono">zarringold.com | ${invoiceNumber} | ${new Date(createdAt).toISOString()}</p>
      </div>
    </div>

  </div>

  <!-- Bottom Band -->
  <div class="bottom-band">زرین گلد — پلتفرم معاملات طلای نوین</div>

</body>
</html>`;

    /* ── Launch Playwright & generate PDF ── */
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      printBackground: true,
      preferCSSPageSize: false,
    });

    await browser.close();

    /* ── Return PDF ── */
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoiceNumber}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای ناشناخته';
    console.error('Invoice PDF generation error:', message);
    return NextResponse.json(
      { success: false, message: `خطا در تولید فاکتور PDF: ${message}` },
      { status: 500 },
    );
  }
}
