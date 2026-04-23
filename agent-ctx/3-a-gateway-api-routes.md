---
Task ID: 3-a
Agent: full-stack-developer
Task: Create Gold Payment Gateway API Routes

Work Log:
- Created shared helper utility `src/lib/gateway-helpers.ts` with:
  - `generateApiKey()` — creates `"zg_live_" + randomHex(32)`
  - `generateApiSecret()` — creates `"zg_secret_" + randomHex(32)`
  - `authenticateMerchant()` — validates apiKey header + apiSecret body/query param, checks isActive
  - `authenticateAdmin()` — validates Authorization Bearer token against UserSession, checks admin role
  - `authenticateUser()` — validates Authorization Bearer token, with userId fallback for backwards compatibility
  - `sendMerchantWebhook()` — fire-and-forget POST to callbackUrl with payment details, updates callback status on ExternalPayment
- Created 9 API route files:
  1. `/api/gateway/merchant/register/route.ts` — POST: merchant registration (requires verified user, generates API keys, starts inactive)
  2. `/api/gateway/merchant/list/route.ts` — GET: admin-only paginated merchant list with payment stats
  3. `/api/gateway/merchant/[id]/route.ts` — GET (detail), PATCH (admin update), DELETE (admin delete), POST (regenerate keys)
  4. `/api/gateway/pay/create/route.ts` — POST: create payment request (merchant auth, supports amountGrams or amountFiat+goldPrice, 30min expiry)
  5. `/api/gateway/pay/[id]/status/route.ts` — GET: check payment status (merchant auth via apiKey + apiSecret query param)
  6. `/api/gateway/pay/[id]/execute/route.ts` — POST: user confirms payment (deducts gold, creates transaction, updates merchant stats, sends webhook)
  7. `/api/gateway/pay/[id]/cancel/route.ts` — POST: user cancels pending payment
  8. `/api/gateway/pay/[id]/detail/route.ts` — GET: user views payment details (auth check: user or admin)
  9. `/api/gateway/payments/route.ts` — GET: user's paginated payment history with filters (status, merchantId)
- All error responses return JSON with Persian messages
- Expiry auto-check on status/detail endpoints
- Lint: 0 errors

Stage Summary:
- All 9 API routes + 1 helper utility created and lint verified
- Gateway supports full merchant lifecycle: register → admin approve → create payment → user pay → webhook callback
- Auth patterns: apiKey/apiSecret for merchant external endpoints, Authorization Bearer for admin/user endpoints, userId body param for user-facing endpoints
