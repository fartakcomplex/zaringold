# Task ID: 6-a
# Agent: Main Agent
# Task: Add Quick Buy Widget to Dashboard + Savings Calculator

## Completed Modifications

### Feature 1: Quick Buy Widget on Dashboard (`src/components/dashboard/DashboardView.tsx`)

**Changes:**
1. Added `Zap` to lucide-react imports
2. Added `selectedQuickBuyGram` state (number | null) for tracking selected gram amount
3. Inserted new "Quick Buy" card between Quick Actions row and Referral Card section
4. Card features:
   - `.card-gold-border` + `.card-glass-premium` classes
   - `Zap` icon with gold color
   - Current gold buy price display from `goldPrice?.buyPrice`
   - Three preset gram buttons: ۰.۱, ۰.۵, ۱ gram with gold accent styling
   - Animated reveal of cost/confirm section using `motion.div`
   - "تأیید خرید" button with `.btn-gold-gradient` class
   - On confirm: shows success toast "خرید شما با موفقیت انجام شد" (mock), resets selection
5. framer-motion entrance animation on the card

### Feature 2: Savings Projection Calculator (`src/components/savings/SavingsView.tsx`)

**Changes:**
1. `AreaChart` and `Area` were already imported (from previous round)
2. `generateProjectionData()` function was already defined (from previous round)
3. Added new "پیش‌بینی پس‌انداز" (Savings Projection) card after the bar chart section
4. Card features:
   - `.card-gold-border` class
   - `TrendingUp` icon with gold accent
   - Badge showing "۱۲ ماهه" (12 months)
   - Recharts `AreaChart` with 250px height in `.chart-container`
   - Two Y-axes: left (toman, gray) and right (gold grams, #D4AF37)
   - Two Area fills: gray gradient (totalToman) and gold gradient (goldGrams)
   - Custom inline Tooltip with dual values display
   - Legend with colored dots
   - Summary row: "پس‌انداز ۱۲ ماهه: ۶,۰۰۰,۰۰۰ تومان" + "ارزش تخمینی: ~۰.۱۵ گرم طلا"
   - `.text-gold-gradient` for the gold value
   - framer-motion entrance animation

## Verification Results
- `bun run lint`: 0 errors, 0 warnings ✅
- All text in Persian (RTL) ✅
- Uses existing store, helpers (`formatToman`, `formatGrams`, `formatNumber`), and toast patterns ✅
- Balanced braces and proper JSX syntax ✅
- No existing layout broken ✅

