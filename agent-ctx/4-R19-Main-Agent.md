---
Task ID: 4-R19
Agent: Main Agent
Task: Add Live Chat Support System

## Current Project Status Assessment
- **Lint**: 0 errors, 0 warnings — clean ✅
- **Dev Server**: Compiles clean, 200 OK ✅
- **Chat Mini-Service**: Socket.io server running on port 3005 ✅
- **All new components**: Pass lint with zero errors ✅

## Completed Modifications

### 1. Chat WebSocket Mini-Service (`mini-services/chat-service/`)
- **New independent bun project** with its own `package.json` and `socket.io` dependency
- Port: 3005, Entry: `mini-services/chat-service/index.ts`
- Socket.io server (following existing project pattern with gateway-compatible config)
- Features implemented:
  - `connection`, `message`, `disconnect` events
  - In-memory message store (max 200 messages, FIFO trimming)
  - Message types: `user` (regular), `system` (join/leave), `admin` (admin replies)
  - Admin identification: userId starting with `admin-` gets admin type
  - 3 chat rooms: `general` (پشتیبانی عمومی), `market` (تحلیل بازار), `suggestions` (پیشنهادات)
  - Room switching support
  - User list tracking per room
  - Typing indicators
  - Heartbeat broadcast every 30 seconds with online count
  - Chat history: sends last 50 messages on new connection
  - Graceful shutdown on SIGTERM/SIGINT

### 2. Chat API Route (`src/app/api/chat/route.ts`)
- **GET**: Returns last 50 messages (REST fallback, primary is WebSocket)
- **POST**: Accepts `{ userId, userName, message, room? }` with validation
- Proper error handling with Persian error messages

### 3. Chat Hook (`src/hooks/use-chat.ts`)
- Reusable `useChat(initialRoom)` hook for both widget and full-page view
- Manages socket connection, messages, users, typing state
- Auto-reconnect via Socket.io client (10 attempts, 1s delay)
- Actions: `joinRoom()`, `sendMessage()`, `setTyping()`, `setStopTyping()`
- Deduplicates messages by ID
- Cleans up socket on unmount

### 4. Chat Widget Component (`src/components/shared/ChatWidget.tsx`)
- **Closed state**: Gold floating button (fixed bottom-left, MessageCircle icon)
  - Green online indicator dot when connected
  - Positioned above bottom nav on mobile (`bottom-20`), normal on desktop (`bottom-6`)
  - Only renders when user is authenticated
- **Open state**: Expandable chat panel (400px wide, 500px tall)
  - Gold-themed header: "💬 چت آنلاین" title, online count, close button
  - Scrollable message area with:
    - User messages: right-aligned (RTL), gold background
    - Admin messages: left-aligned, amber styling, ShieldCheck icon, "پشتیبان" badge
    - System messages: centered, muted text
    - Timestamps in Persian locale (fa-IR)
    - Avatar with first letter of username
  - Input area: Text input + Send button, Enter key submission
  - Empty state with MessageCircle icon
  - Typing indicator with animated dots
  - framer-motion animations: panel entrance, message bubbles

### 5. Full-Page Chat View (`src/components/chat/ChatView.tsx`)
- Larger version with extended features:
  - **Room tabs sidebar**: پشتیبانی عمومی, تحلیل بازار, پیشنهادات (with gold active state)
  - **Online users panel**: Shows connected users with green dot, admin shield icon
  - **Message search**: Filter messages by content or username
  - **Pin messages**: Hover over any message to pin/unpin, pinned messages shown at top of chat and in sidebar
  - **Full message display**: User name, admin badge, pin indicator, date + time, message content
  - **Typing indicator**: Shows who is typing with animated dots
  - Uses `card-gold-border` for consistent gold theme styling
  - Responsive: sidebar stacks above chat on mobile, side-by-side on desktop

### 6. Navigation & Layout Updates
- **AppSidebar.tsx**: Added "چت آنلاین" nav item with MessageCircle icon (after اعلان‌ها, before پشتیبانی)
- **AppLayout.tsx**: Added `<ChatWidget />` at end of authenticated layout (after OnboardingTour)
- **page.tsx**: Added `case 'chat': return <ChatView />` to page router + import

### 7. Bug Fix (Pre-existing)
- **i18n.ts**: Fixed `react-hooks/refs` lint error — replaced `useRef` + render-time access with `useEffect` for locale initialization

## Files Created
1. `mini-services/chat-service/package.json`
2. `mini-services/chat-service/index.ts`
3. `src/app/api/chat/route.ts`
4. `src/hooks/use-chat.ts`
5. `src/components/shared/ChatWidget.tsx`
6. `src/components/chat/ChatView.tsx`

## Files Modified
1. `src/components/layout/AppLayout.tsx` — Added ChatWidget import + render
2. `src/components/layout/AppSidebar.tsx` — Added MessageCircle icon + "چت آنلاین" nav item
3. `src/app/page.tsx` — Added ChatView import + 'chat' route case
4. `src/lib/i18n.ts` — Fixed ref-during-render lint error (useRef → useEffect)

## Verification Results
- `bun run lint`: 0 errors, 0 warnings ✅
- Chat mini-service: Running on port 3005, Socket.io transport ✅
- Dev server: Compiles clean ✅

Stage Summary:
- Complete live chat system with WebSocket mini-service, floating widget, and full-page view
- 6 new files created, 4 files modified
- 3 chat rooms, typing indicators, message pinning, user search
- All new code passes React Compiler strict mode (no setState in effects, no ref access during render)
