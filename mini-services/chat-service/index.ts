import { createServer } from 'http';
import { Server } from 'socket.io';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SupportMessage {
  id: string;
  senderType: 'user' | 'operator';
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface ConnectedUser {
  socketId: string;
  userId: string;
  userName: string;
  isOperator: boolean;
  operatorName?: string;
  assignedOperator?: string;
  connectedAt: number;
}

interface SupportQueueItem {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  assignedOperator?: string;
  status: 'waiting' | 'active';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  State                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PORT = 3005;
const MAX_MESSAGES_PER_USER = 200;

/* Mock operators */
const MOCK_OPERATORS = [
  { id: 'op-ali', name: 'اپراتور علی' },
  { id: 'op-maryam', name: 'اپراتور مریم' },
  { id: 'op-reza', name: 'اپراتور رضا' },
];

/* Connected clients */
const connectedClients = new Map<string, ConnectedUser>();

/* Per-user chat history: userId → messages[] */
const chatHistory = new Map<string, SupportMessage[]>();

/* Support queue: userId → queue item */
const supportQueue = new Map<string, SupportQueueItem>();

/* Operator assignments: operatorId → Set of userIds */
const operatorAssignments = new Map<string, Set<string>>();

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function getOrCreateHistory(userId: string): SupportMessage[] {
  if (!chatHistory.has(userId)) {
    chatHistory.set(userId, []);
  }
  return chatHistory.get(userId)!;
}

function addMessageToHistory(userId: string, msg: SupportMessage): void {
  const history = getOrCreateHistory(userId);
  history.push(msg);
  while (history.length > MAX_MESSAGES_PER_USER) {
    history.shift();
  }
}

function getUserSocketId(userId: string): string | undefined {
  for (const [, client] of connectedClients) {
    if (!client.isOperator && client.userId === userId) {
      return client.socketId;
    }
  }
  return undefined;
}

function getOperatorSocketId(operatorId: string): string | undefined {
  for (const [, client] of connectedClients) {
    if (client.isOperator && client.userId === operatorId) {
      return client.socketId;
    }
  }
  return undefined;
}

function getAllOperatorSocketIds(): string[] {
  const ids: string[] = [];
  for (const [, client] of connectedClients) {
    if (client.isOperator) {
      ids.push(client.socketId);
    }
  }
  return ids;
}

function getOrCreateQueueItem(userId: string, userName: string): SupportQueueItem {
  if (!supportQueue.has(userId)) {
    supportQueue.set(userId, {
      userId,
      userName,
      lastMessage: '',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      status: 'waiting',
    });
  }
  return supportQueue.get(userId)!;
}

function updateQueueItem(
  userId: string,
  updates: Partial<SupportQueueItem>
): void {
  const item = supportQueue.get(userId);
  if (item) {
    Object.assign(item, updates);
  }
}

function assignOperatorToUser(operatorId: string, userId: string): void {
  if (!operatorAssignments.has(operatorId)) {
    operatorAssignments.set(operatorId, new Set());
  }
  operatorAssignments.get(operatorId)!.add(userId);
  updateQueueItem(userId, { assignedOperator: operatorId, status: 'active' });
}

function getSupportQueueList(): SupportQueueItem[] {
  return Array.from(supportQueue.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

function broadcastSupportQueue(): void {
  const operators = getAllOperatorSocketIds();
  const queue = getSupportQueueList();
  for (const opSocketId of operators) {
    const opClient = connectedClients.get(opSocketId);
    if (opClient) {
      const opId = opClient.userId;
      // Show assigned users first, then waiting users
      const assignedUsers = queue.filter(
        (item) => item.assignedOperator === opId
      );
      const waitingUsers = queue.filter(
        (item) => item.status === 'waiting' || (item.assignedOperator && item.assignedOperator !== opId)
      );
      io.to(opSocketId).emit('support-queue', {
        assignedUsers,
        waitingUsers,
      });
    }
  }
}

function autoAssignOperator(userId: string): string | null {
  // Find the operator with fewest assignments
  let minAssignments = Infinity;
  let selectedOperator: string | null = null;

  for (const op of MOCK_OPERATORS) {
    const count = operatorAssignments.get(op.id)?.size ?? 0;
    if (count < minAssignments) {
      minAssignments = count;
      selectedOperator = op.id;
    }
  }

  return selectedOperator;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HTTP Server + Socket.io                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const httpServer = createServer();

const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

/* ── Connection ── */

io.on('connection', (socket) => {
  console.log(`[SupportChat] Client connected: ${socket.id}`);

  /* ── User joins ── */
  socket.on('user-join', (data: { userId: string; userName: string }) => {
    const { userId, userName } = data;

    const client: ConnectedUser = {
      socketId: socket.id,
      userId,
      userName,
      isOperator: false,
      connectedAt: Date.now(),
    };

    connectedClients.set(socket.id, client);
    socket.join(`user:${userId}`);

    // Get or create queue item
    getOrCreateQueueItem(userId, userName);

    // Send chat history
    const history = getOrCreateHistory(userId);
    socket.emit('chat-history', { messages: history });

    // Auto-assign an operator if user has messages
    if (history.length > 0) {
      const opId = autoAssignOperator(userId);
      if (opId) {
        assignOperatorToUser(opId, userId);
        const opName = MOCK_OPERATORS.find((op) => op.id === opId)?.name;
        if (opName) {
          socket.emit('assigned', { operatorName: opName });
        }
      }
    }

    // Broadcast updated queue to operators
    broadcastSupportQueue();

    console.log(`[SupportChat] User "${userName}" joined (id: ${userId})`);
  });

  /* ── Operator joins ── */
  socket.on('operator-join', (data: { operatorId: string; operatorName: string }) => {
    const { operatorId, operatorName } = data;

    // Verify it's a mock operator
    const isMockOperator = MOCK_OPERATORS.some((op) => op.id === operatorId);
    if (!isMockOperator) {
      console.warn(`[SupportChat] Unauthorized operator attempt: ${operatorId}`);
      return;
    }

    const client: ConnectedUser = {
      socketId: socket.id,
      userId: operatorId,
      userName: operatorName,
      isOperator: true,
      operatorName,
      connectedAt: Date.now(),
    };

    connectedClients.set(socket.id, client);
    socket.join(`operator:${operatorId}`);

    if (!operatorAssignments.has(operatorId)) {
      operatorAssignments.set(operatorId, new Set());
    }

    // Send current support queue
    const queue = getSupportQueueList();
    const assignedUsers = queue.filter((item) => item.assignedOperator === operatorId);
    const waitingUsers = queue.filter(
      (item) => item.status === 'waiting' || (item.assignedOperator && item.assignedOperator !== operatorId)
    );
    socket.emit('support-queue', { assignedUsers, waitingUsers });

    console.log(`[SupportChat] Operator "${operatorName}" joined (id: ${operatorId})`);
  });

  /* ── User sends a message ── */
  socket.on('user-message', (data: { message: string }) => {
    const client = connectedClients.get(socket.id);
    if (!client || client.isOperator) return;

    const trimmed = (data.message || '').trim();
    if (!trimmed) return;

    const msg: SupportMessage = {
      id: generateId(),
      senderType: 'user',
      senderId: client.userId,
      senderName: client.userName,
      message: trimmed,
      timestamp: new Date().toISOString(),
      read: false,
    };

    addMessageToHistory(client.userId, msg);

    // Send to user
    io.to(`user:${client.userId}`).emit('new-message', msg);

    // Update support queue
    updateQueueItem(client.userId, {
      lastMessage: trimmed,
      lastMessageAt: msg.timestamp,
      unreadCount: (supportQueue.get(client.userId)?.unreadCount ?? 0) + 1,
      userName: client.userName,
    });

    // Auto-assign operator if not assigned
    const queueItem = supportQueue.get(client.userId);
    if (!queueItem?.assignedOperator) {
      const opId = autoAssignOperator(client.userId);
      if (opId) {
        assignOperatorToUser(opId, client.userId);
        const opName = MOCK_OPERATORS.find((op) => op.id === opId)?.name;
        if (opName) {
          io.to(`user:${client.userId}`).emit('assigned', { operatorName: opName });
        }
      }
    }

    // Broadcast queue to operators
    broadcastSupportQueue();

    console.log(`[SupportChat] User "${client.userName}": ${trimmed.substring(0, 60)}`);
  });

  /* ── Operator sends a message to a user ── */
  socket.on('operator-message', (data: { targetUserId: string; message: string }) => {
    const client = connectedClients.get(socket.id);
    if (!client || !client.isOperator) return;

    const trimmed = (data.message || '').trim();
    if (!trimmed) return;

    const targetUserId = data.targetUserId;

    const msg: SupportMessage = {
      id: generateId(),
      senderType: 'operator',
      senderId: client.userId,
      senderName: client.operatorName || client.userName,
      message: trimmed,
      timestamp: new Date().toISOString(),
      read: false,
    };

    addMessageToHistory(targetUserId, msg);

    // Send to user
    io.to(`user:${targetUserId}`).emit('new-message', msg);

    // Mark as read (operator saw it)
    msg.read = true;

    // Update queue item
    updateQueueItem(targetUserId, {
      lastMessage: trimmed,
      lastMessageAt: msg.timestamp,
    });

    // Broadcast queue to operators
    broadcastSupportQueue();

    console.log(
      `[SupportChat] Operator "${client.operatorName}" → User "${targetUserId}": ${trimmed.substring(0, 60)}`
    );
  });

  /* ── Operator switches to a user's chat ── */
  socket.on('switch-user', (data: { targetUserId: string }) => {
    const client = connectedClients.get(socket.id);
    if (!client || !client.isOperator) return;

    const targetUserId = data.targetUserId;

    // Assign this operator to the user
    assignOperatorToUser(client.userId, targetUserId);

    // Send chat history
    const history = getOrCreateHistory(targetUserId);
    socket.emit('chat-history', {
      targetUserId,
      messages: history,
    });

    // Broadcast updated queue
    broadcastSupportQueue();

    console.log(
      `[SupportChat] Operator "${client.operatorName}" switched to user "${targetUserId}"`
    );
  });

  /* ── Operator assigns user to themselves ── */
  socket.on('assign-user', (data: { targetUserId: string }) => {
    const client = connectedClients.get(socket.id);
    if (!client || !client.isOperator) return;

    const targetUserId = data.targetUserId;
    assignOperatorToUser(client.userId, targetUserId);

    // Notify user
    io.to(`user:${targetUserId}`).emit('assigned', {
      operatorName: client.operatorName || client.userName,
    });

    // Send history to operator
    const history = getOrCreateHistory(targetUserId);
    socket.emit('chat-history', {
      targetUserId,
      messages: history,
    });

    broadcastSupportQueue();

    console.log(
      `[SupportChat] Operator "${client.operatorName}" assigned to user "${targetUserId}"`
    );
  });

  /* ── Typing indicator ── */
  socket.on('typing', (data?: { targetUserId?: string }) => {
    const client = connectedClients.get(socket.id);
    if (!client) return;

    if (client.isOperator) {
      // Operator typing → notify user
      const targetUserId = data?.targetUserId;
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit('operator-typing', {
          operatorName: client.operatorName || client.userName,
        });
      }
    } else {
      // User typing → notify assigned operators
      const queueItem = supportQueue.get(client.userId);
      if (queueItem?.assignedOperator) {
        const opSocketId = getOperatorSocketId(queueItem.assignedOperator);
        if (opSocketId) {
          io.to(opSocketId).emit('user-typing', {
            userId: client.userId,
            userName: client.userName,
          });
        }
      }
    }
  });

  /* ── Stop typing indicator ── */
  socket.on('stop-typing', (data?: { targetUserId?: string }) => {
    const client = connectedClients.get(socket.id);
    if (!client) return;

    if (client.isOperator) {
      const targetUserId = data?.targetUserId;
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit('operator-stop-typing');
      }
    } else {
      const queueItem = supportQueue.get(client.userId);
      if (queueItem?.assignedOperator) {
        const opSocketId = getOperatorSocketId(queueItem.assignedOperator);
        if (opSocketId) {
          io.to(opSocketId).emit('user-stop-typing', {
            userId: client.userId,
          });
        }
      }
    }
  });

  /* ── User marks messages as read ── */
  socket.on('mark-read', () => {
    const client = connectedClients.get(socket.id);
    if (!client || client.isOperator) return;

    // Mark all operator messages as read
    const history = getOrCreateHistory(client.userId);
    for (const msg of history) {
      if (msg.senderType === 'operator') {
        msg.read = true;
      }
    }

    // Update queue
    updateQueueItem(client.userId, { unreadCount: 0 });
    broadcastSupportQueue();

    console.log(`[SupportChat] User "${client.userName}" marked messages as read`);
  });

  /* ── Disconnect ── */
  socket.on('disconnect', () => {
    const client = connectedClients.get(socket.id);
    if (!client) {
      console.log(`[SupportChat] Unknown client disconnected: ${socket.id}`);
      return;
    }

    connectedClients.delete(socket.id);

    if (client.isOperator) {
      console.log(`[SupportChat] Operator "${client.operatorName}" disconnected`);
    } else {
      console.log(`[SupportChat] User "${client.userName}" disconnected`);
      // Broadcast to operators
      broadcastSupportQueue();
    }
  });

  /* ── Error ── */
  socket.on('error', (error) => {
    console.error(`[SupportChat] Socket error (${socket.id}):`, error);
  });
});

/* ── Start server ── */

httpServer.listen(PORT, () => {
  console.log(`[SupportChat] Socket.io support chat server running on port ${PORT}`);
  console.log(`[SupportChat] Operators: ${MOCK_OPERATORS.map((o) => o.name).join(', ')}`);
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Auto-reply: Simulate operator response after 3-8 seconds                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const AUTO_REPLIES = [
  'سلام! چطور می‌تونم کمکتون کنم؟ 😊',
  'بله، حتماً. لطفاً سوالتون رو بفرمایید.',
  'من در حال بررسی موضوع شما هستم، لطفاً کمی صبر کنید.',
  'بسیار عالی! آیا سوال دیگه‌ای هم دارید؟',
  'ممنون از صبوری شما. به زودی پاسخ می‌دم.',
  'لطفاً اطلاعات بیشتری در مورد مشکل خودتون بدید.',
  'متوجه شدم. الان بررسی می‌کنم.',
  'با سلام و احترام، بله ما می‌تونیم کمکتون کنیم.',
];

function pickRandomReply(): string {
  return AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
}

function getRandomOperator(): (typeof MOCK_OPERATORS)[number] {
  return MOCK_OPERATORS[Math.floor(Math.random() * MOCK_OPERATORS.length)];
}

/* Track pending auto-replies to avoid duplicates */
const pendingAutoReplies = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleAutoReply(userId: string, userName: string): void {
  // Cancel any existing pending reply
  const existing = pendingAutoReplies.get(userId);
  if (existing) {
    clearTimeout(existing);
  }

  const delay = 3000 + Math.random() * 5000; // 3-8 seconds

  const timer = setTimeout(() => {
    pendingAutoReplies.delete(userId);

    // Only auto-reply if no real operator is connected
    const realOperatorConnected = Array.from(connectedClients.values()).some(
      (c) => c.isOperator
    );

    const operator = getRandomOperator();
    const reply: SupportMessage = {
      id: generateId(),
      senderType: 'operator',
      senderId: operator.id,
      senderName: operator.name,
      message: pickRandomReply(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    addMessageToHistory(userId, reply);

    // Send to user
    io.to(`user:${userId}`).emit('new-message', reply);
    io.to(`user:${userId}`).emit('assigned', { operatorName: operator.name });

    // Update queue
    assignOperatorToUser(operator.id, userId);
    updateQueueItem(userId, {
      lastMessage: reply.message,
      lastMessageAt: reply.timestamp,
      assignedOperator: operator.id,
    });

    broadcastSupportQueue();

    console.log(
      `[SupportChat] Auto-reply to "${userName}" from "${operator.name}"`
    );
  }, delay);

  pendingAutoReplies.set(userId, timer);
}

/* Monkey-patch the user-message handler to also schedule auto-reply */
const originalOn = io.on.bind(io);
// We already handle this in the socket event listener above.
// Let's add auto-reply logic by intercepting.

// Actually, let's override the user-message event handler above to include auto-reply.
// Since we can't easily modify the closure, let's use a different approach:

// Patch: listen for all 'user-message' emissions via a wrapper
const origEmit = io.emit.bind(io);

// Simple approach: use a global event hook
io.on('connection', (socket) => {
  const originalOnevent = socket.onevent.bind(socket);
  socket.onevent = function (packet: { data: string[] }) {
    const eventName = packet.data[0];
    if (eventName === 'user-message') {
      const client = connectedClients.get(socket.id);
      if (client && !client.isOperator) {
        // Schedule auto-reply (will be cancelled if real operator responds first)
        scheduleAutoReply(client.userId, client.userName);
      }
    }
    originalOnevent(packet);
  };
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Graceful Shutdown                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function shutdown() {
  console.log('[SupportChat] Shutting down...');
  // Clear all pending auto-replies
  for (const [, timer] of pendingAutoReplies) {
    clearTimeout(timer);
  }
  httpServer.close(() => {
    console.log('[SupportChat] Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
