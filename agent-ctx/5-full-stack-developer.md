# Task ID: 5 — ZarinPal Payment Gateway API Routes

## Agent: full-stack-developer

## Work Log

- Read `/home/z/my-project/worklog.md` to understand project context (Persian fintech app "Mili Gold" / زرین گلد)
- Analyzed existing Prisma schema: RialDeposit, GatewayConfig, Wallet, Transaction, User, UserSession models already exist
- Studied existing admin auth pattern (auto-recovery session) from `/api/admin/gateway-payments/route.ts` and `/api/admin/settlements/route.ts`
- Verified `db` import path: `import { db } from '@/lib/db'`
- Created 5 API route files with complete production-ready code
- Lint: 0 errors
- Dev server: Compiles successfully

## Files Created

### 1. `/src/app/api/deposit/create/route.ts` (~175 lines)
**POST** — Create a ZarinPal deposit request
- Auth: Bearer token validated against UserSession
- Validates: amount >= 10,000, user active, user not frozen, amount <= 500,000,000
- Reads GatewayConfig for merchant_id, mode (sandbox/production), callback_url
- Creates RialDeposit record with status "pending"
- Calls ZarinPal PaymentRequest API with metadata (deposit_id, user_id)
- Constructs callback_url from request headers (x-forwarded-host, x-forwarded-proto) or custom config
- Returns payment URL with authority for redirect
- On ZarinPal error: marks deposit as "failed", returns Persian error message
- Includes `getZarinPalError()` helper with 15+ error code translations
- **GET** — Returns gateway mode config for client (public, no auth needed)

### 2. `/src/app/api/deposit/verify/route.ts` (~260 lines)
**GET** — ZarinPal callback + user return handler
- Query params: `Authority` and `Status` (from ZarinPal redirect)
- Handles edge cases: no authority, deposit not found, already paid, user cancelled
- Calls ZarinPal PaymentVerification API to confirm payment
- On success (code 100 + ref_id):
  - Uses `db.$transaction()` for atomicity:
    1. Updates RialDeposit: status → "paid", refId, cardPan, paidAt
    2. Upserts Wallet: increments balance by deposit amount
    3. Creates Transaction: type "deposit_rial", status "completed"
    4. Creates Notification: "واریز موفق" with amount and ref_id
- Returns HTML result page (full styled page with RTL Persian dark theme):
  - Success state: gold checkmark SVG animation, amount, ref_id, current balance, masked card
  - Error state: red X icon, error message, 72h refund notice
- Includes `generateResultPage()` and `maskCardPan()` helper functions
- Vazirmatn font, gold accent colors, responsive design

### 3. `/src/app/api/deposit/list/route.ts` (~105 lines)
**GET** — User's deposit history
- Auth: Bearer token
- Query params: status?, page?, limit?
- Returns stats: totalPaidAmount, pendingCount, paidCount, failedCount, expiredCount
- Paginated list ordered by createdAt desc
- All deposits filtered by userId (user can only see own deposits)

### 4. `/src/app/api/admin/deposits/route.ts` (~155 lines)
**GET** — Admin deposits management
- Auth: Auto-recovery session pattern (same as existing admin routes)
- Query params: status?, userId?, gateway?, from?, to?, page?, limit?
- Date range filtering with proper end-of-day handling
- Stats: totalCount, pendingCount, paidCount, failedCount, expiredCount, totalPaidAmount, todayDeposits
- Includes user info: phone, fullName, role, isActive
- Returns admin identity in response

### 5. `/src/app/api/admin/gateway-config/route.ts` (~170 lines)
**GET** — Return all gateway config records
- Auth: Auto-recovery session pattern
- Returns default configs if not in DB: zarinpal_merchant_code, zarinpal_mode, zarinpal_callback_url
- **PUT** — Update/create gateway configs
- Validates: allowed keys only, zarinpal_mode must be "sandbox" or "production"
- Uses `db.gatewayConfig.upsert()` for idempotent updates
- Returns updated configs with timestamps

## Verification
- Lint: 0 errors, 0 warnings
- Prisma: Schema already in sync (RialDeposit, GatewayConfig models exist)
- Dev server: Compiles successfully
- All routes follow existing project patterns (auto-recovery admin auth, Persian error messages, NextRequest/NextResponse)
- No framer-motion, no recharts used
