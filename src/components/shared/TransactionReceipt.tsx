'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  formatNumber,
  formatToman,
  formatGrams,
  formatDate,
  formatTime,
  toPersianDigits,
} from '@/lib/helpers';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ReceiptData {
  id: string;
  type: string; // buy_gold, sell_gold, deposit, withdrawal, settlement_deposit, referral_reward, cashback, gateway_payment
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
}

/* ------------------------------------------------------------------ */
/*  Type Config                                                        */
/* ------------------------------------------------------------------ */

interface TypeConfig {
  title: string;
  subtitle: string;
  accentColor: string;
  typeLabel: string;
  amountLabel: string;
  totalLabel: string;
  sigLeftRole: string;
  sigLeftSub: string;
  sigRightRole: string;
  sigRightSub: string;
  legalText1: string;
  legalText2: string;
  amountBoxHeader: string;
}

function getTypeConfig(type: string): TypeConfig {
  const configs: Record<string, TypeConfig> = {
    buy_gold: {
      title: 'فاکتور خرید طلا',
      subtitle: 'سند خرید طلای خالص از پلتفرم زرین گلد',
      accentColor: '#10b981',
      typeLabel: 'خرید طلا',
      amountLabel: 'مبلغ کل پرداخت‌شده',
      totalLabel: 'مجموع خرید',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای خریدار',
      sigRightSub: 'مشتری زرین گلد',
      legalText1:
        'این سند به صورت خودکار توسط سیستم معاملات طلایی زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
      legalText2:
        'این فاکتور مرجع رسمی خرید طلا محسوب می‌شود و هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      amountBoxHeader: 'جزئیات خرید — جدول مبالغ',
    },
    sell_gold: {
      title: 'فاکتور فروش طلا',
      subtitle: 'سند فروش طلای خالص در پلتفرم زرین گلد',
      accentColor: '#f59e0b',
      typeLabel: 'فروش طلا',
      amountLabel: 'مبلغ کل دریافتی',
      totalLabel: 'مجموع فروش',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای فروشنده',
      sigRightSub: 'مشتری زرین گلد',
      legalText1:
        'این سند به صورت خودکار توسط سیستم معاملات طلایی زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
      legalText2:
        'این فاکتور مرجع رسمی فروش طلا محسوب می‌شود و هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      amountBoxHeader: 'جزئیات فروش — جدول مبالغ',
    },
    deposit: {
      title: 'رسید واریز',
      subtitle: 'رسید واریز وجه به حساب زرین گلد',
      accentColor: '#06b6d4',
      typeLabel: 'واریز',
      amountLabel: 'مبلغ واریزشده',
      totalLabel: 'مجموع واریز',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای واریزکننده',
      sigRightSub: 'مشتری زرین گلد',
      legalText1:
        'این رسید به صورت خودکار توسط سیستم مالی زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
      legalText2:
        'هرگونه مغایرت در این رسید باید حداکثر ظرف ۷ روز کاری از تاریخ صدور اعلام گردد.',
      amountBoxHeader: 'جزئیات واریز — جدول مبالغ',
    },
    deposit_rial: {
      title: 'رسید واریز طلایی',
      subtitle: 'رسید واریز وجه از طریق درگاه زرین‌پال',
      accentColor: '#06b6d4',
      typeLabel: 'واریز طلایی',
      amountLabel: 'مبلغ واریزشده',
      totalLabel: 'مجموع واریز',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای واریزکننده',
      sigRightSub: 'مشتری زرین گلد',
      legalText1:
        'این رسید به صورت خودکار توسط سیستم مالی زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
      legalText2:
        'هرگونه مغایرت در این رسید باید حداکثر ظرف ۷ روز کاری از تاریخ صدور اعلام گردد.',
      amountBoxHeader: 'جزئیات واریز — جدول مبالغ',
    },
    withdrawal: {
      title: 'رسید برداشت',
      subtitle: 'رسید برداشت وجه از حساب زرین گلد',
      accentColor: '#ef4444',
      typeLabel: 'برداشت',
      amountLabel: 'مبلغ برداشتشده',
      totalLabel: 'مجموع برداشت',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای برداشت‌کننده',
      sigRightSub: 'مشتری زرین گلد',
      legalText1:
        'این رسید به صورت خودکار توسط سیستم مالی زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
      legalText2:
        'هرگونه مغایرت در این رسید باید حداکثر ظرف ۷ روز کاری از تاریخ صدور اعلام گردد.',
      amountBoxHeader: 'جزئیات برداشت — جدول مبالغ',
    },
    settlement_deposit: {
      title: 'رسید تسویه‌حساب درگاه پرداخت',
      subtitle: 'فاکتور تسویه وجوه حاصل از درگاه پرداخت طلایی',
      accentColor: '#10b981',
      typeLabel: 'تسویه شده از درگاه پرداخت',
      amountLabel: 'مبلغ کل واریزی',
      totalLabel: 'مجموع واریزی',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای دریافت‌کننده',
      sigRightSub: 'پذیرنده درگاه پرداخت',
      legalText1:
        'این سند به صورت خودکار توسط سیستم درگاه پرداخت طلایی زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
      legalText2:
        'این فاکتور مرجع رسمی تسویه حساب محسوب می‌شود و هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      amountBoxHeader: 'مالیات و کارمزد — جدول مبالغ',
    },
    referral_reward: {
      title: 'رسید جایزه دعوت',
      subtitle: 'رسید اعطای جایزه معرفی دوستان در زرین گلد',
      accentColor: '#8b5cf6',
      typeLabel: 'جایزه دعوت',
      amountLabel: 'مبلغ جایزه',
      totalLabel: 'مجموع جایزه',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای دریافت‌کننده',
      sigRightSub: 'مشتری زرین گلد',
      legalText1:
        'این رسید به صورت خودکار توسط سیستم پاداش زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
      legalText2:
        'مبالغ پاداش دعوت طبق قوانین طرح تشویقی زرین گلد محاسبه و پرداخت شده است.',
      amountBoxHeader: 'جزئیات جایزه — جدول مبالغ',
    },
    cashback: {
      title: 'رسید کش‌بک',
      subtitle: 'رسید بازگشت وجه خرید در زرین گلد',
      accentColor: '#ec4899',
      typeLabel: 'کش‌بک',
      amountLabel: 'مبلغ کش‌بک',
      totalLabel: 'مجموع کش‌بک',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای دریافت‌کننده',
      sigRightSub: 'مشتری زرین گلد',
      legalText1:
        'این رسید به صورت خودکار توسط سیستم بازگشت وجه زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
      legalText2:
        'مبالغ کش‌بک طبق قوانین طرح بازگشت وجه زرین گلد محاسبه و پرداخت شده است.',
      amountBoxHeader: 'جزئیات کش‌بک — جدول مبالغ',
    },
    gateway_payment: {
      title: 'رسید پرداخت درگاه',
      subtitle: 'رسید پرداخت طلایی از طریق درگاه زرین گلد',
      accentColor: '#0ea5e9',
      typeLabel: 'پرداخت درگاه',
      amountLabel: 'مبلغ پرداخت‌شده',
      totalLabel: 'مجموع پرداخت',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای پرداخت‌کننده',
      sigRightSub: 'مشتری زرین گلد',
      legalText1:
        'این سند به صورت خودکار توسط سیستم درگاه پرداخت طلایی زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.',
      legalText2:
        'این فاکتور مرجع رسمی پرداخت محسوب می‌شود و هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.',
      amountBoxHeader: 'جزئیات پرداخت — جدول مبالغ',
    },
    gold_transfer_out: {
      title: 'رسید انتقال طلا',
      subtitle: 'رسید انتقال طلای خالص به حساب دیگر در زرین گلد',
      accentColor: '#ef4444',
      typeLabel: 'انتقال طلا (خروجی)',
      amountLabel: 'مقدار انتقال',
      totalLabel: 'مجموع کسر از حساب',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای فرستنده',
      sigRightSub: 'مشتری زرین گلد',
      legalText1: 'این رسید به صورت خودکار صادر شده و غیرقابل بازگشت می‌باشد.',
      legalText2: 'در صورت مغایرت، حداکثر ظرف ۷ روز کاری با پشتیبانی تماس بگیرید.',
      amountBoxHeader: 'جزئیات انتقال — جدول مبالغ',
    },
    gold_transfer_in: {
      title: 'رسید دریافت طلا',
      subtitle: 'رسید دریافت طلای خالص از حساب دیگر در زرین گلد',
      accentColor: '#10b981',
      typeLabel: 'دریافت طلا (واردی)',
      amountLabel: 'مقدار دریافت‌شده',
      totalLabel: 'مجموع واریز به حساب',
      sigLeftRole: 'امضای صادرکننده',
      sigLeftSub: 'مدیر مالی زرین گلد',
      sigRightRole: 'امضای دریافت‌کننده',
      sigRightSub: 'مشتری زرین گلد',
      legalText1: 'این رسید به صورت خودکار صادر شده است.',
      legalText2: 'در صورت مغایرت، حداکثر ظرف ۷ روز کاری با پشتیبانی تماس بگیرید.',
      amountBoxHeader: 'جزئیات دریافت — جدول مبالغ',
    },
  };
  return configs[type] || configs.deposit;
}

/* ------------------------------------------------------------------ */
/*  Status Config                                                      */
/* ------------------------------------------------------------------ */

function getStatusConfig(status: string) {
  const configs: Record<
    string,
    { label: string; bg: string; borderColor: string; dotColor: string; textColor: string }
  > = {
    success: {
      label: 'موفق',
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

/* ------------------------------------------------------------------ */
/*  Amount Row Helpers                                                 */
/* ------------------------------------------------------------------ */

interface AmountRow {
  icon: string;
  label: string;
  value: string;
  valueColor: string;
  valueSize?: string;
}

function buildAmountRows(data: ReceiptData): AmountRow[] {
  const cfg = getTypeConfig(data.type);
  const rows: AmountRow[] = [];

  switch (data.type) {
    case 'buy_gold': {
      rows.push({
        icon: '🪙',
        label: 'مقدار طلا خریداری‌شده',
        value: formatGrams(data.amountGold),
        valueColor: '#b45309',
      });
      rows.push({
        icon: '💰',
        label: 'مبلغ پرداخت‌شده',
        value: formatToman(data.amountFiat),
        valueColor: '#047857',
      });
      if (data.fee > 0) {
        rows.push({
          icon: '📊',
          label: 'کارمزد معامله',
          value: formatToman(data.fee),
          valueColor: '#ef4444',
          valueSize: '13px',
        });
      }
      if (data.goldPrice > 0) {
        rows.push({
          icon: '📈',
          label: 'قیمت هر گرم',
          value: `${formatNumber(data.goldPrice)} گرم طلا`,
          valueColor: '#D4AF37',
          valueSize: '13px',
        });
      }
      break;
    }

    case 'sell_gold': {
      rows.push({
        icon: '🪙',
        label: 'مقدار طلا فروخته‌شده',
        value: formatGrams(data.amountGold),
        valueColor: '#b45309',
      });
      rows.push({
        icon: '💰',
        label: 'مبلغ دریافتی',
        value: formatToman(data.amountFiat),
        valueColor: '#047857',
      });
      if (data.fee > 0) {
        rows.push({
          icon: '📊',
          label: 'کارمزد معامله',
          value: formatToman(data.fee),
          valueColor: '#ef4444',
          valueSize: '13px',
        });
      }
      if (data.goldPrice > 0) {
        rows.push({
          icon: '📈',
          label: 'قیمت هر گرم',
          value: `${formatNumber(data.goldPrice)} گرم طلا`,
          valueColor: '#D4AF37',
          valueSize: '13px',
        });
      }
      break;
    }

    case 'deposit': {
      rows.push({
        icon: '💰',
        label: 'مبلغ واریزشده',
        value: formatToman(data.amountFiat),
        valueColor: '#047857',
      });
      break;
    }

    case 'withdrawal': {
      rows.push({
        icon: '💰',
        label: 'مبلغ برداشتشده',
        value: formatToman(data.amountFiat),
        valueColor: '#047857',
      });
      if (data.fee > 0) {
        rows.push({
          icon: '📊',
          label: 'کارمزد',
          value: formatToman(data.fee),
          valueColor: '#ef4444',
          valueSize: '13px',
        });
      }
      break;
    }

    case 'settlement_deposit': {
      const goldAmount =
        data.netGrams !== undefined && data.netGrams > 0
          ? data.netGrams
          : data.amountGold;
      rows.push({
        icon: '🪙',
        label: 'مقدار طلا (خالص)',
        value: formatGrams(goldAmount),
        valueColor: '#b45309',
      });
      rows.push({
        icon: '💰',
        label: 'معادل طلایی',
        value: formatToman(data.amountFiat),
        valueColor: '#047857',
      });
      if (data.feeGrams !== undefined && data.feeGrams > 0) {
        rows.push({
          icon: '📊',
          label: 'کارمزد کسرشده',
          value: `-${formatGrams(data.feeGrams)}`,
          valueColor: '#ef4444',
          valueSize: '13px',
        });
      }
      if (data.goldPrice > 0) {
        rows.push({
          icon: '📈',
          label: 'قیمت هر گرم',
          value: `${formatNumber(data.goldPrice)} گرم طلا`,
          valueColor: '#D4AF37',
          valueSize: '13px',
        });
      }
      break;
    }

    case 'referral_reward': {
      rows.push({
        icon: '🎁',
        label: 'مبلغ جایزه',
        value: formatToman(data.amountFiat),
        valueColor: '#047857',
      });
      break;
    }

    case 'cashback': {
      rows.push({
        icon: '💳',
        label: 'مبلغ کش‌بک',
        value: formatToman(data.amountFiat),
        valueColor: '#047857',
      });
      break;
    }

    case 'gateway_payment': {
      rows.push({
        icon: '🪙',
        label: 'مقدار طلا پرداخت‌شده',
        value: formatGrams(data.amountGold),
        valueColor: '#b45309',
      });
      rows.push({
        icon: '💰',
        label: 'معادل طلایی',
        value: formatToman(data.amountFiat),
        valueColor: '#047857',
      });
      if (data.fee > 0) {
        rows.push({
          icon: '📊',
          label: 'کارمزد',
          value: formatToman(data.fee),
          valueColor: '#ef4444',
          valueSize: '13px',
        });
      }
      if (data.goldPrice > 0) {
        rows.push({
          icon: '📈',
          label: 'قیمت هر گرم',
          value: `${formatNumber(data.goldPrice)} گرم طلا`,
          valueColor: '#D4AF37',
          valueSize: '13px',
        });
      }
      break;
    }

    default: {
      rows.push({
        icon: '💰',
        label: 'مبلغ',
        value: formatToman(data.amountFiat),
        valueColor: '#047857',
      });
    }
  }

  return rows;
}

/* ------------------------------------------------------------------ */
/*  Total Section Builder                                              */
/* ------------------------------------------------------------------ */

function buildTotalSection(
  data: ReceiptData,
  cfg: TypeConfig,
  invoiceNumber: string,
) {
  // Types with gold amounts get a dual total (gold + fiat)
  const goldTypes = ['buy_gold', 'sell_gold', 'settlement_deposit', 'gateway_payment'];
  const hasGold = goldTypes.includes(data.type) && data.amountGold > 0;

  if (hasGold) {
    const goldAmount =
      data.type === 'settlement_deposit' &&
      data.netGrams !== undefined &&
      data.netGrams > 0
        ? data.netGrams
        : data.amountGold;

    return (
      <div
        className="mt-4 pt-3 flex items-center justify-between rounded-lg px-4 py-2.5"
        style={{
          background: 'linear-gradient(to left, #fffbeb, #fefce8)',
          border: '1px solid #fde68a',
        }}
      >
        <span className="text-[12px] font-bold text-gray-700">{cfg.totalLabel}</span>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[17px] font-black text-gray-900">
              {formatGrams(goldAmount)}
            </p>
            <p className="text-[9px] text-gray-500">طلای خالص</p>
          </div>
          <div style={{ width: '1px', height: '28px', background: '#fcd34d' }} />
          <div className="text-right">
            <p className="text-[17px] font-black" style={{ color: '#047857' }}>
              {formatToman(data.amountFiat)}
            </p>
            <p className="text-[9px] text-gray-500">معادل طلایی</p>
          </div>
        </div>
      </div>
    );
  }

  // Fiat-only total
  return (
    <div
      className="mt-4 pt-3 flex items-center justify-between rounded-lg px-4 py-2.5"
      style={{
        background: 'linear-gradient(to left, #fffbeb, #fefce8)',
        border: '1px solid #fde68a',
      }}
    >
      <span className="text-[12px] font-bold text-gray-700">{cfg.totalLabel}</span>
      <div className="text-right">
        <p className="text-[17px] font-black" style={{ color: '#047857' }}>
          {formatToman(data.amountFiat)}
        </p>
        <p className="text-[9px] text-gray-500">گرم طلا</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Extra Info Rows (context-specific table rows)                      */
/* ------------------------------------------------------------------ */

function buildExtraInfoRows(data: ReceiptData): React.ReactNode {
  const rows: React.ReactNode[] = [];

  // Merchant name — for settlement, gateway_payment
  if (
    data.merchantName &&
    (data.type === 'settlement_deposit' || data.type === 'gateway_payment')
  ) {
    rows.push(
      <tr key="merchant">
        <td
          style={{
            padding: '8px 12px',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            background: '#fafafa',
          }}
        >
          {data.type === 'gateway_payment' ? 'پذیرنده' : 'پذیرنده'}
        </td>
        <td
          colSpan={3}
          style={{
            padding: '8px 12px',
            fontWeight: 700,
            border: '1px solid #e5e7eb',
          }}
        >
          {data.merchantName}
        </td>
      </tr>,
    );
  }

  // Merchant order ID — for gateway_payment
  if (data.merchantOrderId && data.type === 'gateway_payment') {
    rows.push(
      <tr key="orderId">
        <td
          style={{
            padding: '8px 12px',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            background: '#fafafa',
          }}
        >
          شناسه سفارش پذیرنده
        </td>
        <td
          colSpan={3}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            fontFamily: 'monospace',
            direction: 'ltr',
            textAlign: 'left',
            fontSize: '10px',
          }}
        >
          {data.merchantOrderId}
        </td>
      </tr>,
    );
  }

  // User name — for referral_reward
  if (data.userName && data.type === 'referral_reward') {
    rows.push(
      <tr key="userName">
        <td
          style={{
            padding: '8px 12px',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            background: '#fafafa',
          }}
        >
          دعوت‌شنده
        </td>
        <td
          colSpan={3}
          style={{
            padding: '8px 12px',
            fontWeight: 700,
            border: '1px solid #e5e7eb',
          }}
        >
          {data.userName}
        </td>
      </tr>,
    );
  }

  // Payment count — for settlement_deposit
  if (data.paymentCount && data.type === 'settlement_deposit') {
    rows.push(
      <tr key="paymentCount">
        <td
          style={{
            padding: '8px 12px',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            background: '#fafafa',
          }}
        >
          تعداد تراکنش‌ها
        </td>
        <td
          style={{
            padding: '8px 12px',
            fontWeight: 700,
            border: '1px solid #e5e7eb',
          }}
        >
          {toPersianDigits(String(data.paymentCount))} تراکنش
        </td>
      </tr>,
    );
  }

  return rows.length > 0 ? <>{rows}</> : null;
}

/* ------------------------------------------------------------------ */
/*  Transaction Receipt — Outer wrapper                                */
/* ------------------------------------------------------------------ */

export default function TransactionReceipt({
  data,
  onClose,
}: {
  data: ReceiptData;
  onClose?: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/invoice/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'خطا در تولید PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const invoiceNumber = `ZG-${(data.referenceId || data.id)
        .slice(0, 8)
        .toUpperCase()}`;
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'خطای ناشناخته';
      try {
        const res = await fetch('/api/invoice/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch {
        alert(msg);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShareAsImage = async () => {
    if (!receiptRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${invoiceNumber}.png`, { type: 'image/png' });

      // Try Web Share API (works on mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `رسید ${invoiceNumber}`,
          text: `رسید تراکنش ${invoiceNumber} — زرین گلد`,
          files: [file],
        });
      } else {
        // Fallback: download as image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNumber}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error: unknown) {
      // User cancelled share or other error — silently handle
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    } finally {
      setSharing(false);
    }
  };

  const invoiceNumber = `ZG-${(data.referenceId || data.id)
    .slice(0, 8)
    .toUpperCase()}`;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      {/* ── Top toolbar ── */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/30 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-white/80">
          <svg
            className="w-5 h-5 text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm font-medium text-white/90">
            فاکتور {invoiceNumber}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Share as image button */}
          <button
            onClick={handleShareAsImage}
            disabled={sharing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white rounded-lg font-bold text-sm hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
          >
            {sharing ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                در حال آماده‌سازی...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                اشتراک‌گذاری
              </>
            )}
          </button>
          {/* Download PDF button */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-l from-amber-500 to-amber-600 text-white rounded-lg font-bold text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
          >
            {downloading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                در حال ساخت PDF...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                دانلود PDF
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-9 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors border border-white/20"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Scrollable receipt preview ── */}
      <div
        className="flex-1 overflow-y-auto flex justify-center py-6 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={receiptRef}
          className="bg-white shadow-2xl rounded-sm"
          style={{
            width: '794px',
            maxWidth: '100%',
          }}
        >
          <ReceiptPreview data={data} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen-only receipt preview (not for print)                        */
/* ------------------------------------------------------------------ */

function ReceiptPreview({ data }: { data: ReceiptData }) {
  const cfg = getTypeConfig(data.type);
  const statusCfg = getStatusConfig(data.status);
  const invoiceNumber = `ZG-${(data.referenceId || data.id)
    .slice(0, 8)
    .toUpperCase()}`;
  const amountRows = buildAmountRows(data);

  return (
    <div
      className="bg-white text-gray-900"
      dir="rtl"
      style={{ fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif' }}
    >
      {/* Gold Header */}
      <div
        className="px-8 py-5 text-white relative overflow-hidden"
        style={{
          background:
            'linear-gradient(to left, #92680c, #b8860b, #d4a017, #f5d442, #d4a017, #b8860b, #92680c)',
        }}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center text-2xl font-black border-2 border-white/40"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.18)',
              }}
            >
              ZG
            </div>
            <div>
              <h1 className="text-xl font-black">زرین گلد</h1>
              <p className="text-[11px] text-white/75 mt-0.5">
                Zarrin Gold — پلتفرم معاملات طلای نوین
              </p>
            </div>
          </div>
          <div className="text-left">
            <p
              className="text-[9px] text-white/50 uppercase tracking-[3px] mb-0.5"
              style={{ fontFamily: 'monospace' }}
            >
              INVOICE
            </p>
            <p className="text-base font-bold" style={{ fontFamily: 'monospace' }}>
              {invoiceNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Title Band */}
      <div
        className="px-8 py-3 border-b-2"
        style={{ background: '#fffbeb', borderColor: cfg.accentColor }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '5px',
                height: '28px',
                borderRadius: '3px',
                background: cfg.accentColor,
              }}
            />
            <div>
              <h2 className="text-[15px] font-black text-gray-900">{cfg.title}</h2>
              <p className="text-[10px] text-gray-500">{cfg.subtitle}</p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border"
            style={{
              background: statusCfg.bg,
              borderColor: statusCfg.borderColor,
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: statusCfg.dotColor,
              }}
            />
            <span
              className="text-[11px] font-bold"
              style={{ color: statusCfg.textColor }}
            >
              {statusCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-5">
        {/* Info Table */}
        <table
          className="w-full"
          style={{ borderCollapse: 'collapse', fontSize: '12px' }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: '8px 12px',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  background: '#fafafa',
                }}
              >
                تاریخ صدور
              </td>
              <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>
                {formatDate(data.createdAt)}
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  background: '#fafafa',
                }}
              >
                نوع تراکنش
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  fontWeight: 700,
                  color: '#b45309',
                  border: '1px solid #e5e7eb',
                }}
              >
                {cfg.typeLabel}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '8px 12px',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  background: '#fafafa',
                }}
              >
                ساعت
              </td>
              <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>
                {formatTime(data.createdAt)}
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  background: '#fafafa',
                }}
              >
                شماره پیگیری
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  fontFamily: 'monospace',
                  direction: 'ltr',
                  textAlign: 'left',
                  fontSize: '10px',
                }}
              >
                {data.referenceId || data.id}
              </td>
            </tr>
            {buildExtraInfoRows(data)}
          </tbody>
        </table>

        {/* Amount Box */}
        <div
          className="mt-5 overflow-hidden"
          style={{ borderRadius: '8px', border: '2px solid #fbbf24' }}
        >
          <div
            className="px-5 py-2.5 text-white text-center text-[12px] font-bold"
            style={{
              background: 'linear-gradient(to left, #b8860b, #d4a017, #f5d442)',
            }}
          >
            {cfg.amountBoxHeader}
          </div>
          <div className="bg-white p-5">
            <div className="space-y-0">
              {amountRows.map((row, index) => {
                const isLast = index === amountRows.length - 1;
                return (
                  <div
                    key={row.label}
                    className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}
                  >
                    <span className="text-[12px] text-gray-600">
                      {row.icon} {row.label}
                    </span>
                    <span
                      className="font-black"
                      style={{
                        fontSize: row.valueSize || '16px',
                        color: row.valueColor,
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Total */}
            {buildTotalSection(data, cfg, invoiceNumber)}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div
            className="mt-4 rounded-lg px-4 py-2.5"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <p className="text-[10px] font-bold mb-1" style={{ color: '#b45309' }}>
              📝 توضیحات
            </p>
            <p className="text-[12px] text-gray-700">{data.description}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-6 pt-5" style={{ borderTop: '2px solid #e5e7eb' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="text-center flex-1">
              <div
                className="mx-auto flex items-center justify-center mb-1.5"
                style={{
                  width: '100px',
                  height: '50px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                }}
              >
                <span className="text-[9px] text-gray-400">مهر و امضا</span>
              </div>
              <p className="text-[11px] text-gray-600 font-bold">{cfg.sigLeftRole}</p>
              <p className="text-[9px] text-gray-400">{cfg.sigLeftSub}</p>
            </div>
            <div className="flex flex-col items-center px-6">
              <div
                className="flex items-center justify-center"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  border: '2px solid #fcd34d',
                }}
              >
                <span
                  className="text-[14px] font-black"
                  style={{ color: '#b45309', fontFamily: 'monospace' }}
                >
                  ZG
                </span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1">تأیید شده</p>
            </div>
            <div className="text-center flex-1">
              <div
                className="mx-auto flex items-center justify-center mb-1.5"
                style={{
                  width: '100px',
                  height: '50px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                }}
              >
                <span className="text-[9px] text-gray-400">مهر و امضا</span>
              </div>
              <p className="text-[11px] text-gray-600 font-bold">{cfg.sigRightRole}</p>
              <p className="text-[9px] text-gray-400">{cfg.sigRightSub}</p>
            </div>
          </div>
          <div className="text-center pt-3" style={{ borderTop: '1px dashed #e5e7eb' }}>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              {cfg.legalText1}
            </p>
            <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
              {cfg.legalText2}
            </p>
            <p
              className="text-[9px] text-gray-400 mt-2 tracking-wide"
              dir="ltr"
              style={{ fontFamily: 'monospace' }}
            >
              zarringold.com | {invoiceNumber} |{' '}
              {new Date(data.createdAt).toISOString()}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Band */}
      <div
        className="px-8 py-2.5 text-center text-white text-[11px] font-bold"
        style={{
          background:
            'linear-gradient(to left, #92680c, #b8860b, #d4a017, #f5d442, #d4a017, #b8860b, #92680c)',
        }}
      >
        زرین گلد — پلتفرم معاملات طلای نوین
      </div>
    </div>
  );
}
