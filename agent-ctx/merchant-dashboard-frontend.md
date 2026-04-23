# Task: Merchant Dashboard Frontend Component
# Agent: Main Agent
# Date: 2025-01-15

## Summary
Created `/src/components/merchant/MerchantDashboard.tsx` — a comprehensive merchant panel with 7 tabs for the Zarrin Gold (زرین گلد) platform.

## Files Created
1. `/src/components/merchant/MerchantDashboard.tsx` (~1380 lines) — Complete merchant dashboard component

## Files Modified
1. `/src/lib/i18n.ts` — Added 80+ merchant translation keys for both Persian (fa) and English (en)

## Component Details

### Tab 1: نمای کلی (Overview)
- 5 stats cards with gold-themed gradients: today sales, monthly sales, total transactions, success rate, pending settlements
- Quick action buttons: New Invoice, New QR, API Keys, Settlements
- Merchant ID card with active keys count and status
- API security info card (SSL, OAuth 2.0, IP Whitelist)

### Tab 2: کلید API (API Keys)
- List of API keys with prefix display, creation date, last used
- Create new key button with random key generation
- Revoke key button (disables key)
- Copy prefix to clipboard with toast notification
- Active/inactive status badges

### Tab 3: تراکنش‌ها (Transactions)
- Filterable transaction table (all/paid/pending/failed/expired)
- Status badges: paid=green, pending=amber, failed=red, expired=gray
- Amount in toman + gold grams for each transaction
- Reference ID and description
- 8 mock transactions with Persian dates

### Tab 4: تسویه‌ها (Settlements)
- Summary cards: pending amount, total settled, transaction count
- Request settlement button
- Settlement list with status: pending/processing/completed
- Tracking codes for each settlement

### Tab 5: فاکتورها (Invoices)
- Create invoice form (title, amount, description) with animated expand/collapse
- Invoice list with status badges (paid/unpaid/expired)
- Copy payment link button for unpaid invoices
- Add to list on creation

### Tab 6: QR پرداخت (QR Payments)
- Create QR form (title, type: fixed/flexible, amount for fixed)
- QR list grid showing type badge, amount, scan count, active status
- Created date display
- QR type selector (fixed amount vs flexible amount)

### Tab 7: تنظیمات (Settings)
- Webhook URL input field
- Settlement type (manual/automatic) with frequency selector (daily/weekly/monthly)
- Branding color picker with preset colors + custom hex input
- Notification toggles: transaction success, settlement, weekly report
- Save button

## Design Features
- Gold gradient theme matching the rest of the Zarrin Gold app
- motion.div from framer-compat for tab transitions (no actual framer-motion)
- Status badges: paid=green, pending=amber, failed=red, expired=gray
- Stats cards with colored icons and hover glow effects
- Quick action buttons with gold gradient backgrounds
- Empty states with descriptive messages and action buttons
- Scrollable tab navigation for mobile
- Loading skeleton component
- Card hover-lift animations
- RTL-compatible layout
- All UI text in Persian via useTranslation

## Lint Result
- 0 errors, 0 warnings ✅
