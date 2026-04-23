# Task 14-b: Order Book Visualization + Forgot Password Dialog

**Task ID**: 14-b
**Agent**: Main Agent

## Completed Modifications

### 1. Order Book Visualization (TradeView.tsx)
- **File**: `src/components/gold/TradeView.tsx`
- Added `OrderBookRow` interface for typed order book data
- Created `generateOrderBook()` function that produces 10 bid + 10 ask simulated rows with prices, volumes, and cumulative totals
- Created `ORDER_BOOK_DATA` constant (module-level) to prevent re-generation on every render
- Created `OrderBookDepthChart` component:
  - Uses `card-glass-premium` CSS class, 350px height
  - Recharts `BarChart` with vertical layout (`layout="vertical"`)
  - Green (#22c55e) bid bars with gradient opacity (40%→100%)
  - Red (#ef4444) ask bars with gradient opacity (60%→100%)
  - Gold (#D4AF37) dashed center `ReferenceLine` for spread
  - Y-axis: Price formatted in millions with Persian locale (`Intl.NumberFormat('fa-IR')`) + "مث" suffix
  - X-axis: Cumulative volume with Persian locale formatting + "حجم تجمعی" label
  - Custom tooltip with Persian-formatted prices
  - Legend indicators for buy (green) and sell (red)
  - Spread summary text using `.text-gold-gradient`: "اسپرد: {amount} تومان"
  - `ResponsiveContainer` for responsive chart sizing
- Placed OrderBookDepthChart in JSX between Market Depth Indicator and Buy/Sell Cards
- Wrapped with `motion.div` for entrance animation
- Only renders when not loading (`!isLoading`)

### 2. Forgot Password Dialog (LoginDialog.tsx)
- **File**: `src/components/auth/LoginDialog.tsx`
- Added state: `forgotPasswordOpen` (boolean), `resetPhone` (string)
- Added `addToast` from `useAppStore` for notification
- Added `handleSendResetCode()` mock function that:
  - Validates phone length (≥10 digits)
  - Closes the dialog, resets phone input
  - Shows success toast: "کد بازیابی ارسال شد"
- Added "رمز عبور را فراموش کرده‌اید؟" link below the "ویرایش شماره" link in OTP step:
  - Styled with `text-sm text-[#D4AF37] hover:underline mx-auto`
- Created Forgot Password Dialog (`<Dialog>`):
  - Title: "بازیابی رمز عبور" with Mail icon in gold (#D4AF37)
  - Description: "شماره موبایل خود را وارد کنید تا کد بازیابی ارسال شود"
  - Phone input with `input-gold-focus` class, LTR direction
  - "ارسال کد بازیابی" button with `btn-gold-gradient` class
  - Helper text: "کد بازیابی به شماره موبایل شما ارسال خواهد شد"
  - Button disabled until valid phone entered
- Wrapped return in React Fragment (`<>...</>`) for two sibling Dialog components
- Added `Label` import from `@/components/ui/label`
- Added `Mail` icon import from lucide-react
- Cleanup: Reset `forgotPasswordOpen` in `handleDialogClose`

## Imports Used
- Recharts components were already imported (added by previous agent): `BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine`

## Verification
- `bun run lint`: 0 errors, 0 warnings ✅
- Dev server compiles clean: `✓ Compiled in 294ms` ✅
- GET / returns 200 ✅
