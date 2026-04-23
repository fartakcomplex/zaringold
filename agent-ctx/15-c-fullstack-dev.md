# Task 15-c: Gold Price Calculator Widget

## Agent: Full-Stack Developer

## Summary
Added an interactive Gold Price Calculator widget to the landing page hero section.

## Changes Made

### File Modified: `src/components/landing/LandingHero.tsx`

1. **Imports Added:**
   - `Calculator` icon from lucide-react
   - `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from shadcn/ui

2. **Mock Data Added (CALC_RATES):**
   - gram: 39,500,000 Toman/gram
   - fullCoin: 28,500,000 Toman (7.216g)
   - halfCoin: 15,200,000 Toman (3.576g)
   - quarterCoin: 9,500,000 Toman (1.735g)
   - TypeScript types: `CalcTab`, `CoinKey`

3. **Calculator State:**
   - `activeTab`: tracks current mode (gramToToman/tomanToGram/coinToGram)
   - `inputValue`: user input as string
   - `coinType`: selected coin type for mode 3
   - `calcResult`: computed IIFE returning `{main, sub, rate}`

4. **Widget Section (after stats counter, before stats bar):**
   - Glass card with gold accent border
   - Title: "💰 محاسبهگر قیمت طلا"
   - Three tab buttons with active gold gradient styling
   - Mode 1: Grams to Toman with coin equivalence display
   - Mode 2: Toman to Grams conversion
   - Mode 3: Coin to Grams with Select dropdown for coin type
   - Real-time calculation on input change
   - All numbers formatted with `toLocaleString('fa-IR')`
   - Responsive: single column mobile, 2-column desktop
   - framer-motion entrance animation (delay 0.9s)

## Verification
- `bun run lint` passed with no errors
- Dev server compiled successfully
- Page loads correctly at `/`
