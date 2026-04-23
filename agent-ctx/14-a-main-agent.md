---
Task ID: 14-a
Agent: Main Agent
Task: Create Real-Time Gold Price WebSocket Mini-Service

## Work Log

### 1. Replaced Mini-Service (socket.io → Bun native WebSocket)
- **Deleted**: Old `socket.io`-based price service (`index.ts` + `package.json`)
- **Created**: New `mini-services/price-service/index.ts` using `Bun.serve()` with native WebSocket support
- **Created**: New `package.json` with zero runtime dependencies (uses Bun built-in WebSocket)
- **Port**: 3004

### 2. WebSocket Server Features
- **On connection**: Sends initial gold prices matching app format (buyPrice, sellPrice, marketPrice, ouncePrice, spread)
- **Every 3 seconds**: Broadcasts simulated price update:
  - buyPrice ± random(0, 50000)
  - sellPrice ± random(0, 50000)
  - Maintains buyPrice > sellPrice invariant
  - Recalculates marketPrice (average) and spread (percentage)
  - ouncePrice fluctuates ± $2
  - Message format: `{ type: "price_update", data: { buyPrice, sellPrice, marketPrice, ouncePrice, spread, timestamp } }`
- **Every 15 seconds**: Heartbeat: `{ type: "heartbeat", data: { status: "ok" } }`
- **Client messages**: Handles `{ type: "subscribe", channels: [...] }` — logs and confirms
- **Logging**: Console logs for connections, disconnections, and price broadcasts with client count

### 3. Client-Side WebSocket Hook (`src/lib/useGoldPriceSocket.ts`)
- **Completely rewritten**: Replaced socket.io-client with native browser `WebSocket` API
- **Connection URL**: `ws://` (or `wss://`) + `window.location.host` + `/?XTransformPort=3004` (Caddy gateway)
- **Auto-reconnect**: 3-second delay on disconnect
- **Store integration**: Calls `setGoldPrice()` from Zustand store on each price_update message
- **Returns**: `{ isConnected: boolean, lastUpdate: string }` — connection status and Persian locale timestamp
- **Cleanup**: Properly closes WebSocket and clears timeout on unmount
- **isMounted guard**: Prevents state updates after component unmount

### 4. DashboardView Integration (`src/components/dashboard/DashboardView.tsx`)
- **Import**: Added `useGoldPriceSocket` from `@/lib/useGoldPriceSocket`
- **Hook call**: `const { isConnected: wsConnected, lastUpdate: wsLastUpdate } = useGoldPriceSocket();`
- **Chart card header**: Replaced static "لایو" label with dynamic live indicator:
  - Green pulsing dot (`animate-ping`) when connected
  - Gray static dot when disconnected
  - Text: "زنده" (Live) when connected, "آفلاین" (Offline) when disconnected
- **Price bar**: Added "آخرین بروزرسانی: {time}" with Activity icon below buy/sell/spread prices
- **Responsive**: Price bar uses `flex-col` on mobile, `flex-row` on desktop

### 5. AppHeader Integration (`src/components/layout/AppHeader.tsx`)
- **Import**: Added `useGoldPriceSocket` from `@/lib/useGoldPriceSocket`
- **Hook call**: `const { isConnected: wsConnected } = useGoldPriceSocket();`
- **Desktop ticker**: Added live indicator (green dot + "زنده" text) before buy/sell prices
- **Mobile bar**: Added live indicator dot before buy/sell prices on small screens
- **Same pattern**: Green pulsing dot when connected, gray when disconnected

### 6. Technical Notes
- Bun's native WebSocket (`Bun.serve` with `websocket` handler) was used instead of the `ws` npm package
- The `ws` npm package's `WebSocketServer` was incompatible with Bun's runtime
- `Bun.serve` with `server.upgrade(req)` pattern handles WebSocket upgrades natively
- Service tested successfully: client connects, receives initial price, receives broadcasts every 3 seconds
- No changes to REST API calls — WebSocket supplements existing price fetching
- Lint: 0 errors, 0 warnings ✅

## Files Modified
- `mini-services/price-service/index.ts` — Rewritten (Bun native WebSocket)
- `mini-services/price-service/package.json` — Updated (removed socket.io, ws)
- `src/lib/useGoldPriceSocket.ts` — Rewritten (native browser WebSocket)
- `src/components/dashboard/DashboardView.tsx` — Added live price indicator
- `src/components/layout/AppHeader.tsx` — Added live price indicator

## Verification Results
- `bun run lint`: 0 errors, 0 warnings ✅
- Dev server: Compiles clean, all routes 200 OK ✅
- Price service: Running on port 3004, tested with local client ✅
- WebSocket messages: Initial price + periodic updates confirmed ✅
