# Task 14-c: Gold Market News Widget + Animated Stats Counter

## Agent: Full-Stack Developer
## Status: Completed

---

## Feature 1: Gold Market News Widget (Dashboard)

**File:** `src/components/dashboard/DashboardView.tsx`

### Changes:
1. **Added `GOLD_NEWS` mock data array** (line ~345) — 6 realistic Persian gold market news items with id, title, source, time, category, and emoji icon fields.

2. **Added News Widget JSX** (line ~1160) — Placed after the Quick Buy Card section and before the Referral Card section:
   - Card with `card-gold-border` and `card-glass-premium` styling
   - Header with "📰 اخبار بازار طلا" title and "مشاهده همه" link (navigates to market view via `setPage('market')`)
   - Each news item shows: emoji icon, bold title, source name (muted), time (`.text-muted-gold`)
   - Hover effect via `.hover-lift-sm` class
   - Border separator between items (except last)
   - Vertical scrolling container with `max-h-72 overflow-y-auto`
   - Staggered framer-motion entrance animation (`x: -15 → 0`, 0.08s stagger per item)
   - Click on any news item navigates to market view

---

## Feature 2: Animated Stats Counter (Landing Page)

**File:** `src/components/landing/LandingHero.tsx`

### Changes:
1. **Added imports** — `useEffect, useState, useRef` from React (all icons were already imported: `Users, Star, Coins, TrendingUp`)

2. **Created `useCountUp` hook** (line ~89) — Inline custom hook:
   - Takes `end: number`, `duration: number = 2000`, `active: boolean = false`
   - When `active` becomes true, animates from 0 to end using `requestAnimationFrame`
   - Uses easeOutQuart easing for smooth deceleration
   - Only animates once (uses `hasAnimated` ref guard)

3. **Added `ANIMATED_STATS` data array** (line ~117) — 4 stats: active users (125,000+), transaction volume (8,500B+), gold grams traded (2,500+), user satisfaction (98%)

4. **Added IntersectionObserver** in component (line ~158) — Triggers `statsInView` state when the counter container enters viewport (threshold 0.2)

5. **Added 4 `useCountUp` hook instances** (line ~174) — One per stat, activated by `statsInView`

6. **Added Animated Stats Counter JSX** (line ~392) — Below the live price widget, above the existing stats bar:
   - 4-column grid (2 cols on mobile, 4 on desktop) with `gap-4`
   - Each stat in a `card-glass-premium` glass card with:
     - Icon in gold circle (`bg-gold/10`, `rounded-full`)
     - Large animated number in `text-gold-gradient` (text-2xl font-bold tabular-nums)
     - Persian locale formatting via `.toLocaleString('fa-IR')`
     - Label text in muted color below
   - Staggered framer-motion entrance (0.15s delay per card)
   - Hover lift effect via `.hover-lift-sm`
   - Container: `mt-12 w-full max-w-4xl`

---

## Lint Status
- `bun run lint` passes with **0 errors, 0 warnings**
