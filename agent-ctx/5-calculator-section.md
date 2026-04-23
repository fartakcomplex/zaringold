# Task 5: CalculatorSection.tsx

## Status: Completed

## Summary
Created `/src/components/landing/CalculatorSection.tsx` — a full-featured, premium gold price calculator section for the Zarrin Gold (زرین گلد) Persian RTL gold trading platform.

## Implementation Details
- **3-tab calculator**: Gram→Toman, Toman→Gram, Coin→Gram with state-based tab switching
- **Coin selector**: Full coin (7.336g), Half coin (3.580g), Quarter coin (1.790g) using `select-gold` class
- **Mock calculations**: Uses 3,250,000 toman/gram rate with `Intl.NumberFormat('fa-IR')` for Persian number formatting
- **Design**: Dark-gold-blur theme with card-glass-premium, gold-gradient-text, input-gold-focus, gold-separator, btn-gold-gradient, cta-pulse-ring
- **Layout**: Two-column on desktop (info left, calculator right), single column mobile
- **Animations**: framer-compat motion for header, info cards, calculator card enter animations
- **CTA**: Gold gradient button calling `onLogin()` prop
- **Navigation**: Section id="calculator" for anchor links

## Dependencies Used
- `@/lib/framer-compat` (motion) — NOT framer-motion
- `@/lib/i18n` (useTranslation)
- `@/lib/utils` (cn)
- lucide-react (Calculator, ArrowUpDownLeftRight)

## CSS Classes Used
card-glass-premium, input-gold-focus, gold-separator, gold-gradient-text, select-gold, btn-gold-gradient, btn-gold-shine, cta-pulse-ring, radial-gold-fade, gold-icon-circle, gold-pulse, card-hover-lift, tabular-nums, gold-text-shadow

## Lint Result
0 errors
