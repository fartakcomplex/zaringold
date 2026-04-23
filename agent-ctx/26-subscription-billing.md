# Task: Subscription Billing System for Gold Payment Gateway

## Summary
Built a complete subscription billing system for the merchant gateway platform with 4 tabbed sections: Create Plan, Active Plans, Charge History, and Payment Links.

## Files Created/Modified

### Prisma Schema (`prisma/schema.prisma`)
- Extended `Subscription` model with: `description`, `maxCharges`, `subscriberCount` fields
- Added `SubscriptionCustomer` model (tracks who subscribed, trial period, next charge)
- Added `SubscriptionCharge` model (charge history with status)
- Added `userSubscriptions` relation to `User` model
- Pushed schema to database successfully

### API Routes
1. **`/api/v1/merchant/subscriptions/route.ts`**
   - POST: Create subscription plan (validates merchant, currency, interval, amounts)
   - GET: List merchant's subscriptions with customer/charge counts

2. **`/api/v1/merchant/subscriptions/[id]/route.ts`**
   - PATCH: Toggle active/inactive, update plan fields (name, amounts, interval, etc.)
   - DELETE: Delete subscription (checks for active subscribers first)
   - POST: Process manual charge for all active customers

3. **`/api/v1/subscription/subscribe/route.ts`**
   - POST: Customer subscribes to a plan
   - Deducts from wallet (toman or gold based on payment method)
   - Creates SubscriptionCustomer + initial SubscriptionCharge records
   - Calculates trial periods and next charge dates

### Frontend Component
- **`/src/components/gateway/SubscriptionView.tsx`**
  - 4-tab interface: Create Plan | My Plans | History | Links
  - Stats summary cards (active plans, total subscribers, total charges)
  - Create Plan form: name, description, currency (toman/gold/mixed), amount, interval, trial days, max charges
  - Plans list with toggle active, delete, manual charge, copy link actions
  - Charge history with plan filter and expandable list
  - Payment links section with copy buttons
  - Uses framer-compat for animations, shadcn/ui components
  - All text in Persian, comments in English

### Integration
- Added `case 'subscriptions'` to `src/app/page.tsx` switch router
- Added `SubscriptionView` import to `page.tsx`
- Added sidebar nav entry in `AppSidebar.tsx` (Trust section)
- Added i18n translation keys for `nav.subscriptions` (fa/en)

## Technical Notes
- All motion imports from `@/lib/framer-compat` (no direct framer-motion)
- Uses shadcn/ui components from `@/components/ui/`
- Persian RTL layout throughout
- Responsive mobile-first design
- ESLint passes with zero errors
- Dev server compiles successfully
