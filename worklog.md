# ZarinGold v2.9.0 - Project Setup Worklog

## Project Overview
ZarinGold (زرین گلد) is a comprehensive gold trading and investment platform built with Next.js 16.

## Current Status: Successfully Deployed

### Setup Steps Completed:
1. **Repository Clone**: Cloned `https://github.com/fartakcomplex/zaringold` and checked out the latest release tag `v2.9.0`
2. **File Migration**: Copied all project files to `/home/z/my-project/` including:
   - `src/` - All source code (components, API routes, hooks, lib)
   - `prisma/schema.prisma` - Full database schema (1737 lines, 80+ models)
   - `mini-services/` - Chat service (Socket.IO on port 3005)
   - `public/` - Fonts (IRANSans), images, uploads
   - Configuration files (package.json, tailwind.config.ts, next.config.ts, etc.)
3. **Dependencies**: Installed all packages via `bun install` (68 packages)
4. **Database**: Prisma schema pushed to SQLite, database already in sync
5. **Services**: Chat-service started on port 3005
6. **Dev Server**: Next.js 16.1.3 (Turbopack) running on port 3000

### Key Features in v2.9.0:
- Gold trading (buy/sell) with real-time prices
- Wallet system (fiat + gold)
- Payment gateway integration (ZarinPal)
- User authentication (OTP-based, password login)
- KYC verification system
- Blog/CMS system
- Chat support with AI
- Gold Card (virtual/physical)
- Merchant payment gateway
- Savings goals & auto-buy plans
- Gamification (achievements, daily check-in, quests)
- Creator club (UGC content)
- Insurance, car services, utility payments
- Admin dashboard with comprehensive management
- SMS & Email marketing
- Landing page builder
- And many more features...

### Running Services:
- **Next.js Dev Server**: Port 3000 (main application)
- **Chat Service**: Port 3005 (Socket.IO + HTTP)

### Database:
- SQLite at `file:/home/z/my-project/db/custom.db`
- 80+ models covering all platform features

### Current Goals:
- Application is running and serving pages
- All API routes are available
- Landing page renders correctly (GET / 200)

### Unresolved Issues:
- Need to seed initial data (prices, site settings, landing sections)
- Some external integrations (SMS, email) need API key configuration
- Telegram bot needs configuration

---
Task ID: 1
Agent: Main Agent
Task: Add English translations to landing pages (Terms, Privacy, Contact, Blog, BlogPostDetail)

Work Log:
- Analyzed existing i18n system (`src/lib/i18n.ts` with `useTranslation` hook)
- Identified 5 landing page components with hardcoded Farsi text
- Updated TermsPage.tsx: Added bilingual sections (7 articles, 38 content items, all UI strings)
- Updated PrivacyPage.tsx: Added bilingual sections (6 sections, 6 quick badges, all UI strings)
- Updated ContactPage.tsx: Added bilingual contact info, departments, social links, form labels
- Updated BlogPage.tsx: Added bilingual mock data (8 posts, categories), UI strings, date formatting
- Updated BlogPostDetailPage.tsx: Added bilingual UI strings (back button, share, meta labels)
- Verified all files compile with no new lint errors
- Dev server running and serving pages correctly (200)

Stage Summary:
- All 5 landing pages now support both Farsi (fa) and English (en) via `useTranslation` hook
- Translations use local locale-conditional objects (not i18n.ts keys) for long-form content
- Date formatting is locale-aware (fa-IR for Farsi, en-US for English)
- Direction (RTL/LTR) handled correctly in ContactPage form fields
- No changes to i18n.ts needed - all translations kept local to each component

---
Task ID: 2
Agent: Main Agent
Task: Fix mobile landing preview button overlap with bottom nav

Work Log:
- Modified `src/components/landing/LandingPreviewToggle.tsx`
- Changed mobile `bottom-4` to `bottom-20` to avoid overlap with fixed footer navigation

Stage Summary:
- Landing preview toggle button no longer overlaps with mobile bottom navigation bar

---
Task ID: 3
Agent: Main Agent
Task: Remove login requirement, auto-login as super_admin for testing

Work Log:
- Modified `src/stores/authStore.ts` to hardcode super_admin user state
- Set `isAuthenticated: true` with super_admin role and default user data

Stage Summary:
- Application now auto-logs in as super_admin without requiring credentials

---
Task ID: 4
Agent: Main Agent
Task: Rename "util" service label to "فروش شارژ و پرداخت قبوض" in admin panel

Work Log:
- Verified AdminSidebar.tsx already has label "فروش شارژ و پرداخت قبوض" (line 103)
- Verified i18n.ts has `admin.utilityOrders: 'فروش شارژ و پرداخت قبوض'` (both fa and en)
- Fixed `nav.utility` i18n key from "خدمات_util" to proper Persian/English labels

Stage Summary:
- Admin panel utility services tab shows "فروش شارژ و پرداخت قبوض" in Farsi and "Charge Sales & Bill Payment" in English

---
Task ID: 5
Agent: Main Agent
Task: Push to GitHub and create release v2.9.3

Work Log:
- Pushed 2 new commits to `fartakcomplex/zaringold` main branch
- Created GitHub release v2.9.3 with comprehensive changelog (Farsi + English)
- Release URL: https://github.com/fartakcomplex/zaringold/releases/tag/v2.9.3

Stage Summary:
- v2.9.3 released with all recent changes (label rename, auto-login, mobile fix, English translations)
- Cron job for webDevReview every 15 minutes attempted but failed due to auth infrastructure issue (non-blocking)

---
Task ID: 6
Agent: Main Agent
Task: Redesign mobile UI for Insurance, Charge/Bill Payment, and Car Services

Work Log:
- Added MobileQuickActions for insurance (شخص ثالث, آتش‌سوزی, بدنه, بیمه‌نامه‌ها)
- Added MobileQuickActions for utility (شارژ, اینترنت, قبوض, تاریخچه)
- Added MobileQuickActions for car-services (تعویض روغنی, بیمه خودرو, ثبت خودرو, سفارش‌ها)
- Added missing icon imports (Shield, Flame, Car, Wrench, ShieldAlert) to MobileQuickActions.tsx
- Redesigned InsuranceView.tsx: compact header, hero banner, quick access 4x2 category grid with colored icons, back button on sub-views
- Redesigned UtilityServicesView.tsx: compact header, hero banner, tab labels always visible on mobile (removed `hidden sm:inline`)
- Redesigned CarServicesView.tsx: compact header with inline add-car button, hero banner

Stage Summary:
- All 3 service pages now have app-like mobile UI with:
  - Compact sticky headers with icon + title + quick action buttons
  - Gradient hero banners for visual appeal
  - Quick access grids (4 columns) for fast category/service navigation
  - MobileQuickActions for iOS-style quick action buttons
  - Always-visible tab labels on mobile
  - Proper touch-friendly sizing and spacing

---
Task ID: 7
Agent: Main Agent
Task: Replace emoji operator icons with real SIM card operator logos

Work Log:
- Created `/src/components/utility-services/operators/OperatorLogos.tsx` with SVG logo components:
  - MCILogo: Yellow circle with "MCI" letter mark (همراه اول brand)
  - IrancellLogo: Orange rounded rect with signal wave pattern (ایرانسل brand)
  - RightelLogo: Purple gradient with "R" letter mark (رایتل brand)
  - TaliyaLogo: Teal circle with "T" letter mark (تالیا brand)
  - ShatelLogo: Blue rounded rect (شاتل موبایل brand, optional)
- Updated `UtilityServicesView.tsx`:
  - Imported real logo components instead of using emoji icons (📱📲📶☕)
  - Updated OPERATORS constant to remove `icon` property
  - Replaced emoji rendering in topup operator selection with SVG logos (44px size)
  - Replaced emoji rendering in internet operator selection with SVG logos
  - Updated operator auto-detection hint to show logo + name badge
  - Updated summary card to show operator logo next to operator name
  - Updated history list to show operator logo in each transaction item
- Updated `AdminServices.tsx`:
  - Imported operator logo components
  - Replaced generic Lucide icons (Smartphone, Wifi, Phone) in API settings with real logos
  - Updated operator column in orders table to show logo next to operator name

Stage Summary:
- All 4 Iranian SIM card operators (MCI, Irancell, Rightel, Taliya) now show their branded SVG logos
- Logos appear in: operator selection grids, phone number detection hints, payment summary, transaction history, admin API settings, admin orders table
- Professional app-like appearance with brand-accurate colors and design elements
- No external image dependencies - all logos are inline SVG components

---
Task ID: 8
Agent: Main Agent
Task: Fix mobile black screen (70% of page covered) and scrolling issue

Work Log:
- Investigated mobile layout structure in `AppLayout.tsx`
- Found root cause: Content wrapper div had `h-0 min-h-0` which set height to literally 0px
  - Parent root div was `flex` (row direction), so `flex-1` on child only affected WIDTH, not HEIGHT
  - Combined with `overflow-hidden` on parent, the 0px height content was clipped
  - In dark mode, the dark background (oklch(0.08)) showed through as a "black screen"
- Fixed root div: Added `flex-col` on mobile so `flex-1` on children controls HEIGHT
  - Before: `isMobile ? 'h-dvh overflow-hidden'`
  - After: `isMobile ? 'h-dvh flex-col overflow-hidden'`
- Fixed content wrapper: Removed `h-0` so height is determined by flex stretch
  - Before: `isMobile ? 'h-0 min-h-0'`
  - After: `isMobile ? 'min-h-0'`
- Fixed mobile scrolling: Added `user-select: auto` to scrollable `<main>` element
  - Body has `user-select: none` globally which can interfere with touch scrolling on some mobile browsers
  - Added `WebkitUserSelect: 'auto', userSelect: 'auto'` to main element's style prop
  - Added `main` to CSS selector list for re-enabling user-select
- Server compiled successfully and serves 200 responses

Stage Summary:
- Mobile black screen issue fixed (content area was 0px height due to CSS bug)
- Mobile scrolling fixed (re-enabled user-select on scrollable content area)
- Changed files: `src/components/layout/AppLayout.tsx`, `src/app/globals.css`
