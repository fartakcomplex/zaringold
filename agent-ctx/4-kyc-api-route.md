# Task 4 — KYC API Route Update

## Summary
Updated `/home/z/my-project/src/app/api/kyc/route.ts` to handle all KYC fields.

## Changes Made

### POST handler (`/api/kyc` — POST)
- **Destructuring**: Now extracts all 6 optional fields from the request body:
  - `userId` (required)
  - `idCardImage` (optional)
  - `idCardBackImage` (optional — **NEW**)
  - `selfieImage` (optional)
  - `bankCardImage` (optional)
  - `verificationVideo` (optional — **NEW**)
- **Upsert update block**: Uses spread pattern `...(field ? { field } : {})` to only overwrite fields that are provided in the submission. Still resets `status` to `'pending'` and clears `adminNote`, `reviewedBy`, `reviewedAt`.
- **Upsert create block**: Passes all 6 optional fields (null if not provided) so the initial record is complete.

### GET handler (`/api/kyc?userId=...`)
- Unchanged — `findUnique` already returns all fields on the model, so `idCardBackImage` and `verificationVideo` are included automatically.

## Validation
- `bun run lint` passes cleanly (no errors or warnings).
