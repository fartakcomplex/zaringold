# QR Payment System Implementation

## Task Summary
Built a comprehensive QR Payment system for the Gold Payment Gateway Platform with three main components.

## Files Created/Modified

### 1. `/src/app/api/v1/merchant/qr/[id]/route.ts` (NEW)
- **GET**: Fetch single QR code by ID or token, increment scan count, return merchant info
- **PATCH**: Toggle active/inactive status (`action: 'toggle_active'`), update title/amount fields
- **DELETE**: Remove QR code by ID (with merchant ownership verification)

### 2. `/src/components/gateway/QrPaymentView.tsx` (NEW)
Mobile-first QR payment page with three tabbed sections:

**Section 1 - Create QR:**
- Title input, QR type selector (fixed/flexible)
- For fixed: amount in toman input
- Generates QR token via API
- SVG-based QR code display pattern (deterministic from token)
- Copy link button, reset/create new button

**Section 2 - Pay QR (Customer View):**
- Merchant info header with name and title
- Amount display (fixed or flexible with customer input)
- Payment method selector (toman wallet / gold wallet)
- Simulated pay flow with success animation
- Trust indicators (secure payment, scan count)

**Section 3 - My QR Codes List:**
- Table/card list of all QR codes
- Each shows: title, amount, type badge, scan count, status
- Actions: copy link, toggle active/inactive, delete with confirmation dialog
- Real-time API integration

### 3. `/src/app/page.tsx` (MODIFIED)
- Added `import QrPaymentView` 
- Added `case 'qr-payment': return <QrPaymentView />` to authenticated router

### 4. `/src/app/api/v1/merchant/qr/route.ts` (EXISTING - reviewed)
- Already had POST (create) and GET (list) endpoints - no changes needed

## Design
- Gold dark theme with `border-gold/20` cards
- Mobile-first `max-w-lg` container
- Uses `QrCode`, `ScanLine`, `CreditCard`, `Coins` icons from lucide-react
- Persian text, RTL layout, English comments
- shadcn/ui components throughout (Card, Button, Badge, Input, Select, Switch, AlertDialog, Skeleton)
- Framer-compat for animations (`motion`, `AnimatePresence`)
- Custom SVG QR pattern generator (deterministic from token hash)

## API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/merchant/qr` | Create QR code |
| GET | `/api/v1/merchant/qr` | List merchant QR codes |
| GET | `/api/v1/merchant/qr/[id]` | Get single QR (by ID or token) |
| PATCH | `/api/v1/merchant/qr/[id]` | Toggle active / update fields |
| DELETE | `/api/v1/merchant/qr/[id]` | Delete QR code |

## Navigation
- Access via `setPage('qr-payment')` from anywhere in the app
- Tab 1: "ایجاد QR" - Create new QR codes
- Tab 2: "QR‌های من" - View and manage existing codes
- Tab 3: "پرداخت QR" - Customer payment view (via token)
