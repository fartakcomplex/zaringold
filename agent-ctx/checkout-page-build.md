# Task: Gold Payment Gateway — Premium Checkout Page

## Files Created

### 1. `/src/app/api/checkout/[authority]/route.ts` (GET)
- Looks up `GatewayPayment` by authority code
- Includes merchant info (businessName, logo, brandingColor, isVerified)
- Calculates gold equivalent from latest `GoldPrice`
- Returns remaining seconds for countdown timer
- Handles already-paid and expired states
- Auto-expires overdue payments

### 2. `/src/app/api/checkout/[authority]/pay/route.ts` (POST + GET)
**POST handler — Process payment:**
- **toman method**: Creates ZarinPal payment request, returns redirect URL
- **gold method**: Deducts from user's `GoldWallet`, marks as paid, fires webhook
- **wallet method**: Deducts from user's fiat `Wallet`, marks as paid, fires webhook
- Validates balance/availability before deduction
- Calculates merchant fees based on `Merchant.feeRate` and `maxFee`
- Updates merchant sales totals
- Creates `Transaction` records
- Fires merchant webhook (async, non-blocking) with `WebhookLog` entry

**GET handler — ZarinPal callback:**
- Verifies payment with ZarinPal
- Updates gateway payment status
- Redirects back to checkout page with status query param

### 3. `/src/app/checkout/[authority]/page.tsx` (Customer-facing page)
**Premium Stripe-like checkout design:**
- **Loading state**: Gold spinner animation
- **Error state**: Clean error card with retry button
- **Success state**: Green confirmation with amount, gold equivalent, tracking code, return-to-merchant button
- **Cancelled/Error state**: Clear messaging with retry/return options

**Main checkout view:**
- Merchant branding header (logo, name, verification badge)
- Back button to merchant site
- Live countdown timer (15 min, color changes: gold → amber → red)
- Amount display with gold gradient text
- Gold equivalent display with live gold price banner
- **3 payment method tabs** (toman/gold/wallet) with shadcn Tabs
  - Toman: ZarinPal gateway redirect
  - Gold: Shows gold amount, conversion rate, deducts from gold wallet
  - Wallet: Direct fiat deduction
- **Trust badges**: SSL, Security, 24/7 Support
- Footer with Zarrin Gold branding
- Suspense boundary for useSearchParams compatibility
- All text in Persian (RTL)
- Mobile-first responsive design
- Uses existing CSS animations (fade-in, bounce-in, gold-gradient-text, glass-card, btn-gold-shine, hover-lift-sm)
- No framer-motion, no recharts

## Lint
- `bun run lint` → 0 errors, 0 warnings
- Dev server compiles successfully
