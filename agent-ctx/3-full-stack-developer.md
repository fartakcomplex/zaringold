# Task 3 — InvoicePDF Component & Invoice Helpers

## Agent: full-stack-developer

## Summary
Created a reusable InvoicePDF component and helper utilities for the "زرین گلد" (Zarrin Gold) Persian RTL fintech app. Both files are production-ready with zero lint errors and successful dev server compilation.

## Files Created

### 1. `/src/lib/invoice-helpers.ts`
Utility functions for invoice operations:
- `generateInvoiceNumber(type)` — Creates formatted invoice numbers like `ZG-14031225-001` with type prefix, Persian date, and sequential counter
- `formatPersianDate(date)` — Full Persian date (e.g., "چهارشنبه، ۱۵ بهمن ۱۴۰۳")
- `formatPersianDateShort(date)` — Short Persian date (e.g., "۱۵ بهم ۱۴۰۳")
- `formatPersianDateFull(date)` — Numeric Persian date (e.g., "۱۴۰۳/۱۱/۱۵")
- `formatPersianTime(date)` — Persian time (e.g., "۱۴:۳۰")
- `formatPersianCurrency(amount, unit)` — Formats with تومان/ریal using Intl.NumberFormat
- `formatPersianNumber(num)` — Formats numbers with Persian digits
- `formatPersianGrams(grams)` — Formats grams/milligrams with Persian digits
- `getTypeLabel(type)` — Returns Persian label for 14+ transaction types
- `getStatusConfig(status)` — Returns badge color config for 6 status types (success/completed/pending/processing/failed/cancelled)

Includes a pure-JS Gregorian → Jalali calendar conversion (no external dependencies).

### 2. `/src/components/shared/InvoicePDF.tsx`
Reusable invoice component (~320 lines) with:
- **Props**: `InvoiceData` (fully generic, works with any transaction type) + `visible` + `onClose`
- **Full-screen overlay** with dark backdrop and backdrop-blur
- **A4-sized receipt** (max-w 794px) centered in overlay with scrollable area
- **Gold gradient header** with ZG logo, "زرین گلد" app name, and invoice number
- **Status badge** — emerald for success, amber for pending, red for failed (configurable)
- **Info table** with alternating row colors (date, type, from/to, phone, ref, payment method, card PAN)
- **Amount breakdown section** with gold-bordered box and gradient header
- **Highlight support** for main amount rows (larger font, gold background)
- **Total section** with gold highlight gradient
- **Optional note** section with gold border
- **Signature/stamp area** — dual signature boxes + center ZG verification stamp
- **Legal text footer** — Persian text about document validity
- **Decorative gold bars** at top and bottom
- **"دانلود PDF" button** using html2canvas (2× scale) + jsPDF (A4 portrait)
- **"بستن" close button** (✕ icon)
- **Multi-page PDF support** — if content exceeds one page
- **Loading spinner** during PDF generation
- **CSS-only animations** — fade-scale entrance (no framer-motion)

## Verification
- **Lint**: 0 errors, 0 warnings
- **Dev server**: GET / 200 OK, no compilation errors
- **No framer-motion, no recharts** used
- **RTL Persian layout** throughout
- **Client-side** ('use client') component
- **html2canvas + jspdf** (both already installed) for PDF generation
