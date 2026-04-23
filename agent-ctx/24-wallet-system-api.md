# 24-Wallet System API Enhancements

## Summary
Built 4 production-grade API routes for the Gold Payment Gateway Wallet system under `/api/v1/wallet/`.

## Files Created

### 1. Cashback Wallet API — `/src/app/api/v1/wallet/cashback/route.ts`
- **GET**: Returns user's cashback balance breakdown (pending/claimed fiat & gold) + full reward history
- **POST**: Claims a pending cashback reward — validates ownership, expiry, credits Wallet or GoldWallet, creates Transaction record, returns reference ID
- Auto-expires past-due pending rewards on read
- Error codes: -1 through -8, -99

### 2. Wallet Transfer API — `/src/app/api/v1/wallet/transfer/route.ts`
- **POST**: Transfer gold OR toman between users (mutually exclusive)
- **Body**: `{ fromUserId, toUserId, amountGold?, amountToman?, description? }`
- Freeze-unfreeze pattern during transfer for safety
- Creates bidirectional Transaction records (transfer_out + transfer_in)
- Minimum amounts: 0.001g gold, 1,000 toman
- Self-transfer prevention
- Error codes: -1 through -15, -97, -98, -99

### 3. Wallet Top-up API — `/src/app/api/v1/wallet/topup/route.ts`
- **POST**: Top-up toman wallet via 3 methods:
  - `zarinpal`: Simulated payment gateway (creates Payment record, auto-completes)
  - `gold_to_toman`: Converts gold grams → toman at sell price (0.5% fee), freeze during conversion
  - `admin`: Admin-only direct credit with audit log
- **Body**: `{ userId, amount, method, goldGrams? }`
- Error codes: -1 through -13, -97, -99

### 4. Wallet Balance API — `/src/app/api/v1/wallet/balance/route.ts`
- **GET**: Returns comprehensive wallet snapshot
- **Query**: `?userId=xxx`
- **Response**: `{ toman: { balance, frozen, available }, gold: { grams, frozen, available, estimated_value_toman }, cashback: { pending, total, claimed, pending_fiat, pending_gold }, market: { gold_buy_price, gold_sell_price }, account: { is_active, is_frozen } }`
- Auto-expires past-due cashback rewards

## Design Patterns Used
- Consistent `error_code` numeric system across all routes
- Freeze-unfreeze pattern for atomic transfers
- `crypto.randomUUID()` / custom ref IDs for traceability
- Persian error messages, English comments
- Auto-expiry of cashback rewards on read
- Audit logging for admin operations
- Production-grade try/catch with fallback unfreeze on failures
