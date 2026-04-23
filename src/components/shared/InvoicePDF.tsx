'use client';

import React, { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getStatusConfig } from '@/lib/invoice-helpers';

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export interface InvoiceData {
  // Invoice identity
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: string;

  // Status
  status: 'success' | 'pending' | 'failed';
  statusLabel: string;

  // Parties
  fromName: string;
  toName: string;
  toPhone?: string;

  // Amount details
  items: Array<{
    label: string;
    value: string;
    highlight?: boolean;
  }>;

  // Totals
  totalLabel?: string;
  totalValue?: string;

  // Payment info
  paymentMethod?: string;
  transactionRef?: string;
  cardPan?: string;

  // Footer
  note?: string;
}

export interface InvoicePDFProps {
  data: InvoiceData | null;
  visible: boolean;
  onClose: () => void;
}

/* ================================================================== */
/*  Gold Gradient CSS (kept as inline strings for PDF capture)          */
/* ================================================================== */

const GOLD_GRADIENT =
  'linear-gradient(to left, #92680c, #b8860b, #d4a017, #f5d442, #d4a017, #b8860b, #92680c)';
const GOLD_GRADIENT_LIGHT =
  'linear-gradient(to left, #b8860b, #d4a017, #f5d442)';

/* ================================================================== */
/*  InvoicePDF Component                                               */
/* ================================================================== */

export default function InvoicePDF({ data, visible, onClose }: InvoicePDFProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  PDF Generation: html2canvas → jsPDF A4 portrait                  */
  /* ---------------------------------------------------------------- */

  const handleDownloadPDF = useCallback(async () => {
    if (!invoiceRef.current || downloading || !data) return;
    setDownloading(true);

    try {
      const element = invoiceRef.current;

      // 1. Capture at 2× scale for high-quality PDF
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      // 2. Create A4 portrait PDF (210 mm × 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If content taller than one page, handle multi-page
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 3. Save with invoice number as filename
      const sanitizedInvoice = data.invoiceNumber.replace(/[^a-zA-Z0-9\-_]/g, '_');
      pdf.save(`invoice-${sanitizedInvoice}.pdf`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'خطای ناشناخته';
      console.error('PDF generation error:', msg);
      alert('خطا در تولید PDF. لطفاً دوباره تلاش کنید.');
    } finally {
      setDownloading(false);
    }
  }, [downloading, data]);

  // Don't render if not visible or no data
  if (!visible || !data) return null;

  const statusCfg = getStatusConfig(data.status);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex flex-col"
      onClick={onClose}
      style={{ animation: 'fade-scale 0.25s ease-out both' }}
    >
      {/* ── Top Toolbar ── */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/30 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-white/80">
          {/* Document icon */}
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
            فاکتور {data.invoiceNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download PDF button */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-wait"
            style={{
              background: 'linear-gradient(to left, #b8860b, #d4a017)',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!downloading) {
                e.currentTarget.style.background =
                  'linear-gradient(to left, #92680c, #b8860b)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(to left, #b8860b, #d4a017)';
            }}
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

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex items-center justify-center size-9 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors border border-white/20"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Scrollable Invoice Preview ── */}
      <div
        className="flex-1 overflow-y-auto flex justify-center py-6 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-white shadow-2xl rounded-sm"
          style={{
            width: '794px',
            maxWidth: '100%',
          }}
        >
          {/* This ref div is what html2canvas captures */}
          <div ref={invoiceRef}>
            <InvoiceContent data={data} statusCfg={statusCfg} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Invoice Content — Captured by html2canvas                          */
/* ================================================================== */

interface InvoiceContentProps {
  data: InvoiceData;
  statusCfg: {
    label: string;
    bg: string;
    borderColor: string;
    dotColor: string;
    textColor: string;
  };
}

function InvoiceContent({ data, statusCfg }: InvoiceContentProps) {
  const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    fontSize: '12px',
  };
  const tdLabelStyle: React.CSSProperties = {
    ...tdStyle,
    color: '#6b7280',
    background: '#fafafa',
    fontWeight: 600,
    minWidth: '120px',
  };

  return (
    <div
      className="bg-white text-gray-900"
      dir="rtl"
      style={{ fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif' }}
    >
      {/* ─── Decorative Top Gold Bar ─── */}
      <div
        style={{
          height: '6px',
          background: GOLD_GRADIENT,
        }}
      />

      {/* ─── Gold Header ─── */}
      <div
        className="px-8 py-5 text-white relative overflow-hidden"
        style={{ background: GOLD_GRADIENT }}
      >
        {/* Subtle decorative pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10 flex items-center justify-between">
          {/* Logo & App Name */}
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
              <h1 className="text-xl font-black" style={{ letterSpacing: '-0.02em' }}>
                زرین گلد
              </h1>
              <p className="text-[11px] text-white/75 mt-0.5">
                Zarrin Gold — پلتفرم معاملات طلای نوین
              </p>
            </div>
          </div>

          {/* Invoice Number */}
          <div className="text-left">
            <p
              className="text-[9px] text-white/50 uppercase tracking-[3px] mb-0.5"
              style={{ fontFamily: 'monospace' }}
            >
              INVOICE
            </p>
            <p
              className="text-base font-bold"
              style={{ fontFamily: 'monospace' }}
            >
              {data.invoiceNumber}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Title Band ─── */}
      <div
        className="px-8 py-3 border-b-2"
        style={{
          background: '#fffbeb',
          borderColor: statusCfg.dotColor,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Accent bar */}
            <div
              style={{
                width: '5px',
                height: '28px',
                borderRadius: '3px',
                background: statusCfg.dotColor,
              }}
            />
            <div>
              <h2 className="text-[15px] font-black text-gray-900">
                {data.invoiceType}
              </h2>
              <p className="text-[10px] text-gray-500">
                فاکتور رسمی صادر شده توسط زرین گلد
              </p>
            </div>
          </div>

          {/* Status Badge */}
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
              {data.statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="px-8 py-5">
        {/* ── Info Table ── */}
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {/* Row 1: Date + Invoice Type */}
            <tr>
              <td style={tdLabelStyle}>تاریخ صدور</td>
              <td style={tdStyle}>{data.invoiceDate}</td>
              <td style={tdLabelStyle}>نوع فاکتور</td>
              <td style={{ ...tdStyle, fontWeight: 700, color: '#b45309' }}>
                {data.invoiceType}
              </td>
            </tr>

            {/* Row 2: From + To */}
            <tr>
              <td style={tdLabelStyle}>صادرکننده</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{data.fromName}</td>
              <td style={tdLabelStyle}>دریافت‌کننده</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{data.toName}</td>
            </tr>

            {/* Row 3: Phone (if available) + Transaction Ref */}
            <tr>
              {data.toPhone ? (
                <>
                  <td style={tdLabelStyle}>شماره تماس</td>
                  <td style={tdStyle}>{data.toPhone}</td>
                </>
              ) : (
                <>
                  <td style={tdLabelStyle}>شماره فاکتور</td>
                  <td style={tdStyle}>{data.invoiceNumber}</td>
                </>
              )}
              {data.transactionRef ? (
                <>
                  <td style={tdLabelStyle}>شماره پیگیری</td>
                  <td
                    style={{
                      ...tdStyle,
                      fontFamily: 'monospace',
                      direction: 'ltr',
                      textAlign: 'left',
                      fontSize: '10px',
                    }}
                  >
                    {data.transactionRef}
                  </td>
                </>
              ) : (
                <>
                  <td style={tdLabelStyle}>وضعیت</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        color: statusCfg.textColor,
                        fontWeight: 700,
                      }}
                    >
                      {data.statusLabel}
                    </span>
                  </td>
                </>
              )}
            </tr>

            {/* Row 4: Payment Method (if available) + Card PAN */}
            {(data.paymentMethod || data.cardPan) && (
              <tr>
                <td style={tdLabelStyle}>روش پرداخت</td>
                <td style={tdStyle}>{data.paymentMethod || '—'}</td>
                {data.cardPan ? (
                  <>
                    <td style={tdLabelStyle}>شماره کارت</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: 'monospace',
                        direction: 'ltr',
                        textAlign: 'left',
                        letterSpacing: '1px',
                        fontSize: '11px',
                      }}
                    >
                      {data.cardPan}
                    </td>
                  </>
                ) : (
                  <>
                    <td style={tdLabelStyle}>شماره فاکتور</td>
                    <td style={tdStyle}>{data.invoiceNumber}</td>
                  </>
                )}
              </tr>
            )}
          </tbody>
        </table>

        {/* ── Dashed Separator ── */}
        <div
          style={{
            border: 'none',
            borderTop: '2px dashed #e5e7eb',
            margin: '20px 0',
          }}
        />

        {/* ── Amount Breakdown ── */}
        <div
          style={{
            borderRadius: '8px',
            border: '2px solid #fbbf24',
            overflow: 'hidden',
          }}
        >
          {/* Section Header */}
          <div
            className="px-5 py-2.5 text-white text-center font-bold"
            style={{
              fontSize: '12px',
              background: GOLD_GRADIENT_LIGHT,
            }}
          >
            جزئیات مبالغ
          </div>

          {/* Items */}
          <div style={{ padding: '20px', background: '#ffffff' }}>
            <div>
              {data.items.map((item, index) => {
                const isLast = index === data.items.length - 1;
                return (
                  <div
                    key={`${item.label}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: item.highlight ? '12px 16px' : '10px 0',
                      background: item.highlight
                        ? 'linear-gradient(to left, #fffbeb, #fefce8)'
                        : 'transparent',
                      borderRadius: item.highlight ? '8px' : '0',
                      border: item.highlight
                        ? '1px solid #fde68a'
                        : 'none',
                      marginBottom: isLast ? '0' : undefined,
                      borderBottom: isLast
                        ? 'none'
                        : '1px solid #f3f4f6',
                    }}
                  >
                    <span
                      style={{
                        fontSize: item.highlight ? '13px' : '12px',
                        color: '#4b5563',
                        fontWeight: item.highlight ? 700 : 400,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: item.highlight ? '17px' : '15px',
                        fontWeight: item.highlight ? 900 : 700,
                        color: item.highlight
                          ? '#047857'
                          : '#1f2937',
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total Row */}
            {data.totalLabel && data.totalValue && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  background: 'linear-gradient(to left, #fffbeb, #fefce8)',
                  border: '1px solid #fde68a',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#78350f',
                  }}
                >
                  {data.totalLabel}
                </span>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 900,
                    color: '#b45309',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {data.totalValue}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Note (if provided) ── */}
        {data.note && (
          <div
            style={{
              marginTop: '16px',
              borderRadius: '8px',
              padding: '12px 16px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                marginBottom: '4px',
                color: '#b45309',
              }}
            >
              📝 یادداشت
            </p>
            <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.8' }}>
              {data.note}
            </p>
          </div>
        )}

        {/* ── Dashed Separator ── */}
        <div
          style={{
            border: 'none',
            borderTop: '2px solid #e5e7eb',
            margin: '24px 0 0 0',
          }}
        />

        {/* ── Signatures & Stamp Area ── */}
        <div style={{ paddingTop: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            {/* Left Signature — Issuer */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '6px',
                  width: '100px',
                  height: '50px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '9px', color: '#9ca3af' }}>
                  مهر و امضا
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#374151', fontWeight: 700 }}>
                امضای صادرکننده
              </p>
              <p style={{ fontSize: '9px', color: '#9ca3af' }}>
                مدیر مالی زرین گلد
              </p>
            </div>

            {/* Center — Verification Stamp */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0 24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  border: '2px solid #fcd34d',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    color: '#b45309',
                    fontFamily: 'monospace',
                  }}
                >
                  ZG
                </span>
              </div>
              <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>
                تأیید شده
              </p>
            </div>

            {/* Right Signature — Receiver */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '6px',
                  width: '100px',
                  height: '50px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '9px', color: '#9ca3af' }}>
                  مهر و امضا
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#374151', fontWeight: 700 }}>
                امضای دریافت‌کننده
              </p>
              <p style={{ fontSize: '9px', color: '#9ca3af' }}>
                {data.toName}
              </p>
            </div>
          </div>

          {/* ── Dashed Separator ── */}
          <div
            style={{
              border: 'none',
              borderTop: '1px dashed #e5e7eb',
              margin: '12px 0',
            }}
          />

          {/* ── Legal Footer ── */}
          <div style={{ textAlign: 'center', paddingTop: '12px' }}>
            <p
              style={{
                fontSize: '10px',
                color: '#6b7280',
                lineHeight: '1.8',
              }}
            >
              این سند به صورت خودکار توسط سیستم زرین گلد صادر شده و دارای اعتبار قانونی
              می‌باشد.
            </p>
            <p
              style={{
                fontSize: '10px',
                color: '#6b7280',
                lineHeight: '1.8',
                marginTop: '2px',
              }}
            >
              هرگونه مغایرت باید حداکثر ظرف ۷ روز کاری از تاریخ صدور اعلام گردد.
            </p>
            <p
              style={{
                fontSize: '9px',
                color: '#9ca3af',
                marginTop: '8px',
                letterSpacing: '0.5px',
                fontFamily: 'monospace',
                direction: 'ltr',
              }}
            >
              zarringold.com | {data.invoiceNumber} |{' '}
              {new Date().toISOString().slice(0, 19).replace('T', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Decorative Bottom Gold Bar ─── */}
      <div
        className="px-8 py-2.5 text-center text-white font-bold"
        style={{
          fontSize: '11px',
          background: GOLD_GRADIENT,
        }}
      >
        زرین گلد — پلتفرم معاملات طلای نوین
      </div>
    </div>
  );
}
