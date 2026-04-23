---
Task ID: 21
Agent: Main Agent
Task: Fix dev server stability (OOM), rate-limiting, create super_admin user

## Root Cause Analysis
- Server kept dying: Linux OOM killer targeting `next-server` process (pid=1144)
- Total VM: 34GB, RSS: 5GB — too much memory in 8GB container
- Chrome (agent-browser) + Next.js together exceeded available RAM
- Caddy proxy on port 81 shows Z.ai placeholder when upstream (3000) is down

## Fixes Applied

### 1. Server Stability — keepalive wrapper
- Created `/tmp/keepalive.cjs` — Node.js script that auto-restarts Next.js on crash
- Runs as detached process with `--max-old-space-size=1536` (1.5GB limit)
- Logs to `/tmp/nextdev.log`, restarts after 3s delay on crash

### 2. Gold Prices Rate-Limiting (src/lib/gold-prices.ts)
- Added per-source cooldown system: `sourceCooldowns` map + `COOLDOWN_MS = 5 min`
- When alanchand/web-search fails, skips that source for 5 minutes (was retrying every request)
- Reduced log spam from 10+ errors/second to 1 warning per failure

### 3. SSE Stream Cache Fix (src/app/api/gold/price/stream/route.ts)
- Changed `fetchGoldPrices(true)` → `fetchGoldPrices(false)` for initial + periodic refresh
- SSE connections no longer bypass cache on every new connection

### 4. Frontend API Call Fix (src/hooks/useRealGoldPrice.ts)
- Removed `refresh=true` from initial fetch URL

### 5. News API Fix (src/app/api/news/gold/route.ts)
- Fixed `new ZAI()` → `await ZAI.create()` (constructor error)
- Added error cooldown (10 min) to prevent web_search spam
- Added static fallback news when API unavailable

### 6. Next.js Config (next.config.ts)
- Added `allowedDevOrigins` for preview iframe cross-origin WebSocket access

### 7. Super Admin User Created
- Phone: 09120000001
- Role: super_admin
- Wallet: 100,000,000 toman balance
- Gold: 1.5 grams
- Login: Enter phone → OTP code is 123456 (dev mode)

## Verification Results
- Lint: 0 errors, 0 warnings ✅
- Server: Running stable with keepalive wrapper ✅
- HTTP: GET / returns 200 (245KB) through Caddy proxy ✅
- Page: Full landing page renders with all sections ✅
- Login: Phone → OTP → Dashboard flow works ✅
- Dashboard: All navigation items, balance cards, prices visible ✅
