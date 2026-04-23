# Task 3-b: Add Section IDs for Quick-Access Button System

## Summary
Added `id` attributes to 6 page components for a quick-access scroll-to-section system. All 22 IDs were successfully placed on appropriate elements. No functionality was changed — only `id` props were added to existing elements.

## Changes Made

### 1. AchievementsView.tsx
- `ach-all` → `<TabsContent value="achievements">` (the achievements tab)
- `ach-locked` → `<CardContent>` inside the achievements tab (wraps locked achievement display)
- `ach-progress` → Achievement grid `<div>` (where progress-bar items appear)
- `ach-quests` → `<TabsContent value="leaderboard">` (bottom section, closest match to "quests")

### 2. GoldQuest.tsx
- `quest-today` → `<TabsContent value="daily">` (today's missions tab)
- `quest-weekly` → `<TabsContent value="weekly">` (weekly missions tab)
- `quest-leaderboard` → `<TabsContent value="leaderboard">` (leaderboard tab)
- `quest-streak` → `<TabsContent value="streak">` (daily streak tab)

### 3. DeveloperPortal.tsx
- `mp-dashboard` → `<div>` in `DashboardTab` (dashboard content wrapper)
- `mp-keys` → `<div>` in `ApiKeysTab` (API keys section wrapper)
- `mp-docs` → `<div>` in `ApiDocsTab` (API documentation wrapper)
- `mp-payments` → `<div>` in `TransactionsTab` (transactions/payments wrapper)

### 4. PriceMissileTracker.tsx
- `pm-new` → `<Card>` in `AddTargetForm` (new alert creation form)
- `pm-active` → `<div>` containing active targets heading and list
- `pm-history` → `<div>` containing hit/reached targets section
- `pm-stats` → Current price `<Card>` (displays live price stats)

### 5. PortfolioAnalyticsFresh.tsx
- `pa-overview` → Hero header `<Card>` (total portfolio value, P/L, ROI)
- `pa-performance` → Performance summary `<Card>` (ROI, monthly growth, spread, trade counts)
- `pa-allocation` → Growth + Allocation grid `<div>` container
- `pa-risk` → Risk score `<Card>` (risk score with progress bar)

### 6. PricePredictionGameFresh.tsx
- `pg-predict` → Already existed at `<div id="pg-predict">`
- `pg-leaderboard` → Already existed at `<TabsContent id="pg-leaderboard">`
- `pg-stats` → Already existed at `<div id="pg-stats">`
- `pg-rules` → Added to current price info `<Card>` (informational section, closest match to rules/help)

## Verification
- `bun run lint` passed with no errors
