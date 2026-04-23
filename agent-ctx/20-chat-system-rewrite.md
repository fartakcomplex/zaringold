---
Task ID: 20
Agent: Full-Stack Developer (Chat System Rewrite)
Task: Rewrite chat system from user-to-user room-based to operator-to-user support chat

Work Log:
- Rewrote mini-services/chat-service/index.ts with operator-to-user support chat architecture
  - Removed room-based chat (general, market, suggestions rooms)
  - Implemented 1-on-1 operator-to-user support chat
  - Added mock operators: اپراتور علی, اپراتور مریم, اپراتور رضا
  - Per-user chat history storage with support queue
  - Events: user-join, operator-join, user-message, operator-message, typing, stop-typing, mark-read, chat-history, support-queue, switch-user, assign-user, new-message, assigned
  - Auto-reply simulation when no real operator is connected (3-8 second delay)
  - Auto-assignment of operators to users based on load balancing
- Rewrote src/hooks/use-chat.ts
  - Removed old room-based useChat hook and ChatMessage/ChatUser types
  - Added useSupportChat hook for user-side: messages, isConnected, operatorName, isOperatorTyping, sendUserMessage, markAsRead, emitTyping, emitStopTyping
  - Added useOperatorChat hook for operator-side: isConnected, assignedUsers, waitingUsers, currentChatUserId, currentMessages, isUserTyping, sendMessage, switchUser, assignUser, emitTyping, emitStopTyping
  - Added SupportMessage and SupportQueueItem types
- Rewrote src/components/chat/ChatView.tsx
  - Removed room selection, user list, search, pinned messages
  - Simple 1-on-1 support chat interface
  - Operator messages on left with ShieldCheck avatar and پشتیبان badge
  - User messages on right with gold (#D4AF37) background
  - Connection status indicator with animated green pulse
  - Empty state: پشتیبانی آنلاین / به زودی یک اپراتور پاسخ خواهد داد
  - Typing indicator: در حال نوشتن... with animated dots
  - Read receipts (single/double check marks)
  - Gold-themed styling using card-gold-border and input-gold-focus classes
- Updated src/components/shared/ChatWidget.tsx
  - Changed from useChat to useSupportChat
  - Updated to support chat paradigm (operator-to-user)
  - Changed floating button icon from MessageCircle to Headphones
  - Updated header to show operator name with پشتیبان badge
- Updated i18n translations: nav.chat from چت آنلاین to چت پشتیبانی (fa/en)

Stage Summary:
- Chat system is now operator-to-user (not user-to-user)
- Real-time via Socket.IO on port 3005
- Users see their conversation with support operator (no room selection)
- 3 mock operators with auto-reply simulation
- Gold-themed UI with typing indicators, connection status, and read receipts
- All text in Persian RTL
- Lint passes cleanly (0 errors, 0 warnings)
- Chat service running on port 3005
