# Task 13-b: Enhance AdminView and MarketView with Gold Theme Styling

## Work Log
- Applied gold theme CSS utility classes to `AdminView.tsx` and `MarketView.tsx`
- All changes are className-only additions using `cn()` from `@/lib/utils`
- No structural changes, no new dependencies

## AdminView.tsx Changes
1. **Import**: Added `cn` from `@/lib/utils`
2. **Stats Overview Cards** (4 cards): `border-gold/10` → `card-gold-border`, stat numbers → `text-gold-gradient`
3. **Admin Tabs** (6 triggers): Conditional `tab-active-gold` when `activeTab === value`
4. **User Management Table**:
   - Search input: added `input-gold-focus`
   - Table rows: added `table-row-hover-gold`
   - Role badges: conditional `badge-gold` for admin role
   - Status badges: `badge-success-green` (active), `badge-danger-red` (suspended)
5. **KYC Queue**: Pending items → `card-glass-premium hover-lift-sm`, status badges → `badge-warning-amber`/`badge-success-green`/`badge-danger-red`, textarea → `input-gold-focus`, approve/reject buttons → `btn-success`/`btn-danger-outline`
6. **Transactions**: Table rows → `table-row-hover-gold`, filter select → `select-gold`
7. **Withdrawals**: Items → `card-glass-premium`, amount → `text-gold-gradient`, buttons → `btn-success`/`btn-danger-outline`
8. **Price Management**: Inputs → `input-gold-focus`, update button → `btn-gold-gradient`
9. **All section Cards**: `border-gold/10` → `card-gold-border`

## MarketView.tsx Changes
1. **Import**: Added `cn` from `@/lib/utils`
2. **Tab Navigation**: Converted `defaultValue` to controlled `value`/`onValueChange`, added conditional `tab-active-gold`
3. **TrendSummaryCards** (4 cards): `border-border/50` → `card-gold-border`
4. **RSI Chart**: Container → `chart-container`
5. **Moving Average Chart**: Container → `chart-container`
6. **Support/Resistance**: Added `badge-success-green` for support, `badge-danger-red` for resistance, `badge-gold` for current
7. **News Feed**: Cards → `hover-lift-sm`, count badge → `badge-gold`, time text → `text-muted-gold`
8. **Impact Badges**: Updated `getImpactColor()` to return `badge-danger-red`/`badge-warning-amber`/`badge-success-green` (affects news + calendar)
9. **Economic Calendar**: Event rows → `table-row-hover-gold`
10. **Comparison Chart**: Container → `chart-container`, legend items → colored dot indicators
11. **Market Overview Bar**: Card → `card-gold-border`, price values → `text-gold-gradient`, change values → `text-success-gradient`/`text-danger-gradient`

## Verification
- `bun run lint`: 0 errors, 0 warnings ✅
- Dev server: Compiles clean, no errors ✅
