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
}

/* ------------------------------------------------------------------ */
/*  Settlement Receipt / Invoice — PDF Download + Share                 */
/* ------------------------------------------------------------------ */

export default function SettlementReceipt({
  data,
  onClose,
}: {
  data: ReceiptData;
  onClose?: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const isSettlement = data.type === 'settlement_deposit';
  const invoiceNumber = `ZG-${(data.referenceId || data.id).slice(0, 8).toUpperCase()}`;
  const goldAmount = isSettlement && data.netGrams ? data.netGrams : data.amountGold;

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

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${invoiceNumber}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `رسید ${invoiceNumber}`,
          text: `رسید تسویه‌حساب ${invoiceNumber} — زرین گلد`,
          files: [file],
        });
      } else {
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
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    } finally {
      setSharing(false);
    }
  };

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
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                در حال آماده‌سازی...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                در حال ساخت PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
/*  Screen-only receipt preview (not for print)                         */
/* ------------------------------------------------------------------ */

function ReceiptPreview({ data }: { data: ReceiptData }) {
  const isSettlement = data.type === 'settlement_deposit';
  const invoiceNumber = `ZG-${(data.referenceId || data.id).slice(0, 8).toUpperCase()}`;
  const goldAmount = isSettlement && data.netGrams ? data.netGrams : data.amountGold;

  return (
    <div
      className="bg-white text-gray-900"
      dir="rtl"
      style={{ fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif' }}
    >
      {/* Gold Header */}
      <div className="px-8 py-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(to left, #92680c, #b8860b, #d4a017, #f5d442, #d4a017, #b8860b, #92680c)' }}>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center text-2xl font-black border-2 border-white/40" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(255,255,255,0.18)' }}>
              ZG
            </div>
            <div>
              <h1 className="text-xl font-black">زرین گلد</h1>
              <p className="text-[11px] text-white/75 mt-0.5">Zarrin Gold — پلتفرم معاملات طلای نوین</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-[9px] text-white/50 uppercase tracking-[3px] mb-0.5" style={{ fontFamily: 'monospace' }}>INVOICE</p>
            <p className="text-base font-bold" style={{ fontFamily: 'monospace' }}>{invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Title Band */}
      <div className="px-8 py-3 border-b-2" style={{ background: '#fffbeb', borderColor: '#fbbf24' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: '5px', height: '28px', borderRadius: '3px', background: '#10b981' }} />
            <div>
              <h2 className="text-[15px] font-black text-gray-900">
                {isSettlement ? 'رسید تسویه‌حساب درگاه پرداخت' : 'رسید تراکنش'}
              </h2>
              <p className="text-[10px] text-gray-500">{isSettlement ? 'فاکتور تسویه وجوه حاصل از درگاه پرداخت طلایی' : 'فاکتور تراکنش مالی'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span className="text-[11px] font-bold" style={{ color: '#047857' }}>تکمیل‌شده</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-5">
        {/* Info Table */}
        <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 12px', color: '#6b7280', border: '1px solid #e5e7eb', background: '#fafafa' }}>تاریخ صدور</td>
              <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{formatDate(data.createdAt)}</td>
              <td style={{ padding: '8px 12px', color: '#6b7280', border: '1px solid #e5e7eb', background: '#fafafa' }}>نوع تراکنش</td>
              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#b45309', border: '1px solid #e5e7eb' }}>{isSettlement ? 'تسویه شده از درگاه پرداخت' : 'تراکنش مالی'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', color: '#6b7280', border: '1px solid #e5e7eb', background: '#fafafa' }}>ساعت</td>
              <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{formatTime(data.createdAt)}</td>
              <td style={{ padding: '8px 12px', color: '#6b7280', border: '1px solid #e5e7eb', background: '#fafafa' }}>شماره پیگیری</td>
              <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', fontFamily: 'monospace', direction: 'ltr', textAlign: 'left', fontSize: '10px' }}>{data.referenceId || data.id}</td>
            </tr>
            {isSettlement && data.merchantName && (
              <tr>
                <td style={{ padding: '8px 12px', color: '#6b7280', border: '1px solid #e5e7eb', background: '#fafafa' }}>پذیرنده</td>
                <td colSpan={3} style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #e5e7eb' }}>{data.merchantName}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Amount Box */}
        <div className="mt-5 overflow-hidden" style={{ borderRadius: '8px', border: '2px solid #fbbf24' }}>
          <div className="px-5 py-2.5 text-white text-center text-[12px] font-bold" style={{ background: 'linear-gradient(to left, #b8860b, #d4a017, #f5d442)' }}>
            مالیات و کارمزد — جدول مبالغ
          </div>
          <div className="bg-white p-5">
            <div className="space-y-0">
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[12px] text-gray-600">🪙 مقدار طلا (خالص)</span>
                <span className="text-[16px] font-black" style={{ color: '#b45309' }}>{formatGrams(goldAmount)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[12px] text-gray-600">💰 معادل طلایی</span>
                <span className="text-[16px] font-black" style={{ color: '#047857' }}>{formatToman(data.amountFiat)}</span>
              </div>
              {isSettlement && data.feeGrams !== undefined && data.feeGrams > 0 && (
                <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                  <span className="text-[12px] text-gray-600">📊 کارمزد کسرشده</span>
                  <span className="text-[13px] font-bold" style={{ color: '#ef4444' }}>-{formatGrams(data.feeGrams)}</span>
                </div>
              )}
              {data.goldPrice > 0 && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-gray-600">📈 قیمت هر گرم</span>
                  <span className="text-[13px] font-bold" style={{ color: '#D4AF37' }}>{formatNumber(data.goldPrice)} گرم طلا</span>
                </div>
              )}
            </div>
            {/* Total */}
            <div className="mt-4 pt-3 flex items-center justify-between rounded-lg px-4 py-2.5" style={{ background: 'linear-gradient(to left, #fffbeb, #fefce8)', border: '1px solid #fde68a' }}>
              <span className="text-[12px] font-bold text-gray-700">مبلغ کل واریزی</span>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[17px] font-black text-gray-900">{formatGrams(goldAmount)}</p>
                  <p className="text-[9px] text-gray-500">طلای خالص</p>
                </div>
                <div style={{ width: '1px', height: '28px', background: '#fcd34d' }} />
                <div className="text-right">
                  <p className="text-[17px] font-black" style={{ color: '#047857' }}>{formatToman(data.amountFiat)}</p>
                  <p className="text-[9px] text-gray-500">معادل طلایی</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="mt-4 rounded-lg px-4 py-2.5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: '#b45309' }}>📝 توضیحات</p>
            <p className="text-[12px] text-gray-700">{data.description}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-6 pt-5" style={{ borderTop: '2px solid #e5e7eb' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="text-center flex-1">
              <div className="mx-auto flex items-center justify-center mb-1.5" style={{ width: '100px', height: '50px', border: '2px dashed #d1d5db', borderRadius: '8px' }}>
                <span className="text-[9px] text-gray-400">مهر و امضا</span>
              </div>
              <p className="text-[11px] text-gray-600 font-bold">امضای صادرکننده</p>
              <p className="text-[9px] text-gray-400">مدیر مالی زرین گلد</p>
            </div>
            <div className="flex flex-col items-center px-6">
              <div className="flex items-center justify-center" style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fef3c7', border: '2px solid #fcd34d' }}>
                <span className="text-[14px] font-black" style={{ color: '#b45309', fontFamily: 'monospace' }}>ZG</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1">تأیید شده</p>
            </div>
            <div className="text-center flex-1">
              <div className="mx-auto flex items-center justify-center mb-1.5" style={{ width: '100px', height: '50px', border: '2px dashed #d1d5db', borderRadius: '8px' }}>
                <span className="text-[9px] text-gray-400">مهر و امضا</span>
              </div>
              <p className="text-[11px] text-gray-600 font-bold">امضای دریافت‌کننده</p>
              <p className="text-[9px] text-gray-400">پذیرنده درگاه پرداخت</p>
            </div>
          </div>
          <div className="text-center pt-3" style={{ borderTop: '1px dashed #e5e7eb' }}>
            <p className="text-[10px] text-gray-500 leading-relaxed">این سند به صورت خودکار توسط سیستم درگاه پرداخت طلایی زرین گلد صادر شده و دارای اعتبار قانونی می‌باشد.</p>
            <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">این فاکتور مرجع رسمی تسویه حساب محسوب می‌شود و هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری اعلام گردد.</p>
            <p className="text-[9px] text-gray-400 mt-2 tracking-wide" dir="ltr" style={{ fontFamily: 'monospace' }}>
              zarringold.com | {invoiceNumber} | {new Date(data.createdAt).toISOString()}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Band */}
      <div className="px-8 py-2.5 text-center text-white text-[11px] font-bold" style={{ background: 'linear-gradient(to left, #92680c, #b8860b, #d4a017, #f5d442, #d4a017, #b8860b, #92680c)' }}>
        زرین گلد — پلتفرم معاملات طلای نوین
      </div>
    </div>
  );
}
