# Task 1 — Payment Gateway API Routes

## Summary
Built 6 production-ready API route files for the Gold Payment Gateway Platform. All files pass ESLint with zero errors.

## Files Created/Enhanced

### 1. `/api/v1/payment/details/route.ts` (NEW)
- **GET handler** fetching payment details by `authority` query param
- Returns merchant info, amounts (toman/gold), fees, status (with Persian labels), gold price, expiry countdown
- Auto-expires pending payments past deadline
- Includes refund history, parsed metadata, formatted time remaining in Persian
- Safe JSON.parse with fallback for metadata

### 2. `/api/v1/payment/request/route.ts` (ENHANCED)
- **POST handler** creating payment requests via merchant API key
- Validates API key with SHA-256 hash, checks expiry
- Supports `merchant_key` and `api_key` param names, `amount` + `currency` convenience fields
- **Risk scoring**: rapid payment detection (5+ in 1min), duplicate amount detection, high-amount flagging, merchant risk score check
- Generates authority via `crypto.randomBytes(16).toString('hex')`
- **15-minute expiry** (configurable constant)
- Fee calculation: `min(max(amount * feeRate, minFee), maxFee)`
- Fires `payment.created` webhook with HMAC-SHA256 signature
- Logs RiskEvent for elevated scores (>=20)

### 3. `/api/v1/payment/verify/route.ts` (ENHANCED)
- **POST handler** supporting three payment methods:
  - **toman**: simulated gateway payment (ZarinPal integration separate)
  - **gold**: deducts from user's GoldWallet with balance check
  - **mixed**: configurable gold/toman split via `goldPercent`, deducts gold portion + marks toman portion
- Creates **Transaction records** for each payment type
- **Card velocity risk scoring**: flags cards with 5+ payments in 24h
- Unique ref_id generation: `GPG-{timestamp}-{random}`
- Updates merchant sales/settlement totals
- Fires `payment.verified` webhook with signature

### 4. `/api/v1/payment/refund/route.ts` (ENHANCED)
- **POST handler** for full/partial refunds
- Supports lookup by `payment_id` or `authority`
- Ownership verification (merchant check)
- Prevents duplicate active refunds (409 Conflict)
- **Refund risk scoring**: frequent refund detection, high amount flagging, repeat refund flagging
- Creates **Transaction record** (negative amounts for outflow)
- Fires `payment.refunded` webhook with signature
- Logs RiskEvent for elevated scores

### 5. `/api/v1/wallet/pay/route.ts` (NEW)
- **POST handler** for gold wallet payments
- Validates userId, authority, amount_gold
- Checks payment status (pending), expiry, user active/frozen status
- Checks gold wallet balance (available = total - frozen)
- Atomic gold deduction from GoldWallet
- Creates Transaction record with negative gold amount
- Updates merchant totals
- Fires `payment.wallet_paid` webhook
- Logs RiskEvent for high-value wallet payments (>=10g)

### 6. `/api/v1/prices/gold/route.ts` (ENHANCED)
- **GET handler** for current gold price
- Adds **gold_per_toman** (1/buyPrice) and **toman_per_gram** derived values
- Adds **30-day statistics** (high, low, average)
- Returns 24h change (amount, percent, direction)
- Includes 7-day price history for charting

## Key Patterns Used
- All user-facing messages in **Persian (Farsi)**
- `crypto.randomBytes(16).toString('hex')` for authority tokens
- `crypto.createHash('sha256')` for API key validation
- `crypto.createHmac('sha256')` for webhook signatures
- Consistent error response format: `{ success, message, error_code }`
- All webhooks include HMAC-SHA256 signature in `X-Webhook-Signature` header
- Webhook delivery logged in `WebhookLog` table
- Risk events logged in `RiskEvent` table
- Transaction records created for all financial operations
- 10s timeout on all webhook fetches via `AbortSignal.timeout`
