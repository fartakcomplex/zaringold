import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server } from 'socket.io';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SupportMessage {
  id: string;
  senderType: 'user' | 'operator' | 'ai';
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

interface Operator {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role?: 'operator' | 'supervisor' | 'admin';
  online: boolean;
  status: 'available' | 'busy' | 'away' | 'offline';
  createdAt: string;
}

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants & State                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PORT = 3005;
const MAX_MESSAGES_PER_USER = 200;
const NEXTJS_API = 'http://localhost:3000';

/* Dynamic operators (replaces MOCK_OPERATORS) */
const operators = new Map<string, Operator>();

/* Default FAQ items */
const faqList: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: 'ساعات کاری شما چطور است؟',
    answer: 'پشتیبانی آنلاین ما ۲۴ ساعته و ۷ روز هفته فعال است.',
    keywords: ['ساعت', 'کاری', 'زمان', 'کی', 'کدام ساعت'],
  },
  {
    id: 'faq-2',
    category: 'general',
    question: 'چطور می‌توانم ثبت‌نام کنم؟',
    answer: 'برای ثبت‌نام از منوی اصلی وارد بخش ثبت‌نام شوید یا با شماره موبایل وارد شوید.',
    keywords: ['ثبت', 'نام', 'ثبت نام', 'اکانت', 'حساب', 'ورود'],
  },
  {
    id: 'faq-3',
    category: 'pricing',
    question: 'قیمت طلا الان چقدر است؟',
    answer: 'قیمت لحظه‌ای طلا در داشبورد اصلی قابل مشاهده است. قیمت‌ها به صورت لحظه‌ای آپدیت می‌شوند.',
    keywords: ['قیمت', 'طلا', 'گرم', 'ریال', 'تومان', 'چقدر', 'مقدار'],
  },
  {
    id: 'faq-4',
    category: 'pricing',
    question: 'کارمزد معاملات چقدر است؟',
    answer: 'کارمزد معاملات خرید و فروش طلا ۰.۵٪ (نیم درصد) از مبلغ معامله محاسبه می‌شود.',
    keywords: ['کارمزد', 'هزینه', ' کمیسیون', 'فی', 'مالیات'],
  },
  {
    id: 'faq-5',
    category: 'wallet',
    question: 'واریز و برداشت چطور انجام می‌شود؟',
    answer: 'واریز و برداشت از کیف پول ریالی از بخش کیف پول امکان‌پذیر است. برداشت طلا نیز به صورت فیزیکی یا فروش خودکار انجام می‌شود.',
    keywords: ['واریز', 'برداشت', 'موجودی', 'پول', 'کیف', 'انتقال'],
  },
  {
    id: 'faq-6',
    category: 'goldcard',
    question: 'کارت طلایی چیست؟',
    answer: 'کارت طلایی زرین گلد یک کارت فیزیکی متصل به حساب طلایی شماست که امکان خرید مستقیم با طلا را فراهم می‌کند.',
    keywords: ['کارت', 'طلایی', 'گلد', 'کارت طلایی', 'gold card'],
  },
  {
    id: 'faq-7',
    category: 'security',
    question: 'حساب من هک شده، چه کنم؟',
    answer: 'فوراً رمز عبور خود را تغییر دهید و با پشتیبانی تماس بگیرید. قفل اضطراری از بخش تنظیمات کارت طلایی قابل فعال‌سازی است.',
    keywords: ['هک', 'امنیت', 'رمز', 'گذرواژه', 'خطا', 'مشکل', 'ورود'],
  },
  {
    id: 'faq-8',
    category: 'support',
    question: 'چطور با پشتیبانی تماس بگیرم؟',
    answer: 'از همین چت آنلاین، تلگرام ربات ما، یا شماره ۰۲۱-۱۲۳۴۵۶۷۸ با ما در تماس باشید.',
    keywords: ['تماس', 'پشتیبانی', 'شمار', 'تلفن', 'ایمیل', 'ارتباط'],
  },
];

/* Connected clients */
const connectedClients = new Map<string, ConnectedUser>();

/* Per-user chat history: userId → messages[] */
const chatHistory = new Map<string, SupportMessage[]>();

/* Support queue: userId → queue item */
const supportQueue = new Map<string, SupportQueueItem>();

/* Operator assignments: operatorId → Set of userIds */
const operatorAssignments = new Map<string, Set<string>>();

/* Track pending auto-replies to avoid duplicates */
const pendingAutoReplies = new Map<string, ReturnType<typeof setTimeout>>();

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

/** Check if any real operator is currently connected via socket */
function hasRealOperatorConnected(): boolean {
  return Array.from(connectedClients.values()).some((c) => c.isOperator);
}

/** Get list of online operator IDs (connected via socket) */
function getOnlineOperatorIds(): string[] {
  return Array.from(connectedClients.values())
    .filter((c) => c.isOperator)
    .map((c) => c.userId);
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
  const operatorsList = getAllOperatorSocketIds();
  const queue = getSupportQueueList();
  for (const opSocketId of operatorsList) {
    const opClient = connectedClients.get(opSocketId);
    if (opClient) {
      const opId = opClient.userId;
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

/** Auto-assign to the connected operator with fewest assignments */
function autoAssignOperator(userId: string): string | null {
  const onlineOpIds = getOnlineOperatorIds();
  if (onlineOpIds.length === 0) return null;

  let minAssignments = Infinity;
  let selectedOperator: string | null = null;

  for (const opId of onlineOpIds) {
    const count = operatorAssignments.get(opId)?.size ?? 0;
    if (count < minAssignments) {
      minAssignments = count;
      selectedOperator = opId;
    }
  }

  return selectedOperator;
}

/** Get an operator by ID from the stored operators map */
function getOperatorById(opId: string): Operator | undefined {
  return operators.get(opId);
}

/** Get all operators that are currently online (connected via socket) */
function getOnlineOperators(): Operator[] {
  const onlineIds = getOnlineOperatorIds();
  return onlineIds
    .map((id) => operators.get(id))
    .filter((op): op is Operator => !!op);
}

/** Send a message from AI to a user */
function sendAIMessage(userId: string, message: string): void {
  const reply: SupportMessage = {
    id: generateId(),
    senderType: 'ai',
    senderId: 'ai-assistant',
    senderName: 'دستیار هوشمند',
    message,
    timestamp: new Date().toISOString(),
    read: false,
  };

  addMessageToHistory(userId, reply);
  io.to(`user:${userId}`).emit('new-message', reply);

  updateQueueItem(userId, {
    lastMessage: reply.message,
    lastMessageAt: reply.timestamp,
  });

  broadcastSupportQueue();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HTTP fetch helpers (call Next.js backend)                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

async function fetchAIReply(message: string): Promise<string | null> {
  try {
    const resp = await fetch(`${NEXTJS_API}/api/chat/ai-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context: 'Zarin Gold support chat' }),
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.reply || null;
  } catch (err) {
    console.warn('[SupportChat] AI reply fetch failed:', (err as Error).message);
    return null;
  }
}

async function fetchGreetingConfig(): Promise<string | null> {
  try {
    const resp = await fetch(`${NEXTJS_API}/api/chat/config`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.greeting || data.welcomeMessage || data.message || null;
  } catch (err) {
    console.warn('[SupportChat] Greeting config fetch failed:', (err as Error).message);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FAQ matching                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function matchFAQ(message: string): FAQItem | null {
  const normalizedMessage = message.trim().toLowerCase();

  for (const faq of faqList) {
    for (const keyword of faq.keywords) {
      if (normalizedMessage.includes(keyword.toLowerCase())) {
        return faq;
      }
    }
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HTTP REST API Handler                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function sendJSON(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function parseUrlPath(req: IncomingMessage): { pathname: string; query: Record<string, string> } {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return { pathname: url.pathname, query };
}

async function handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const { pathname, query } = parseUrlPath(req);
  const method = (req.method || 'GET').toUpperCase();

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  Operator Management                                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  // GET /api/operators — List all operators
  if (method === 'GET' && pathname === '/api/operators') {
    const allOps = Array.from(operators.values());
    sendJSON(res, 200, { success: true, data: allOps, count: allOps.length });
    return;
  }

  // POST /api/operators — Add a new operator
  if (method === 'POST' && pathname === '/api/operators') {
    try {
      const body = await parseBody(req);
      const { name, phone, email, role } = JSON.parse(body) as {
        name?: string;
        phone?: string;
        email?: string;
        role?: string;
      };

      if (!name || !phone) {
        sendJSON(res, 400, { success: false, message: 'نام و شماره تلفن الزامی است' });
        return;
      }

      const id = `op-${generateId()}`;
      const newOp: Operator = {
        id,
        name,
        phone,
        email: email || undefined,
        role: (role as Operator['role']) || 'operator',
        online: false,
        status: 'offline',
        createdAt: new Date().toISOString(),
      };

      operators.set(id, newOp);
      console.log(`[SupportChat] Operator added: ${name} (${id})`);
      sendJSON(res, 201, { success: true, data: newOp });
      return;
    } catch (err) {
      sendJSON(res, 400, { success: false, message: 'درخواست نامعتبر' });
      return;
    }
  }

  // PUT /api/operators/:id — Update an operator
  if (method === 'PUT' && pathname.startsWith('/api/operators/')) {
    const opId = pathname.replace('/api/operators/', '');
    const op = operators.get(opId);

    if (!op) {
      sendJSON(res, 404, { success: false, message: 'اپراتور یافت نشد' });
      return;
    }

    try {
      const body = await parseBody(req);
      const updates = JSON.parse(body) as Partial<Operator>;

      // Allowed fields to update
      if (updates.name !== undefined) op.name = updates.name;
      if (updates.phone !== undefined) op.phone = updates.phone;
      if (updates.email !== undefined) op.email = updates.email;
      if (updates.role !== undefined) op.role = updates.role as Operator['role'];
      if (updates.online !== undefined) op.online = updates.online;
      if (updates.status !== undefined) op.status = updates.status;

      operators.set(opId, op);
      console.log(`[SupportChat] Operator updated: ${op.name} (${opId})`);
      sendJSON(res, 200, { success: true, data: op });
      return;
    } catch (err) {
      sendJSON(res, 400, { success: false, message: 'درخواست نامعتبر' });
      return;
    }
  }

  // DELETE /api/operators/:id — Remove an operator
  if (method === 'DELETE' && pathname.startsWith('/api/operators/')) {
    const opId = pathname.replace('/api/operators/', '');
    const op = operators.get(opId);

    if (!op) {
      sendJSON(res, 404, { success: false, message: 'اپراتور یافت نشد' });
      return;
    }

    // Clean up assignments
    const assignedUsers = operatorAssignments.get(opId);
    if (assignedUsers) {
      for (const userId of assignedUsers) {
        const queueItem = supportQueue.get(userId);
        if (queueItem && queueItem.assignedOperator === opId) {
          queueItem.assignedOperator = undefined;
          queueItem.status = 'waiting';
        }
      }
      operatorAssignments.delete(opId);
    }

    operators.delete(opId);
    console.log(`[SupportChat] Operator removed: ${op.name} (${opId})`);
    sendJSON(res, 200, { success: true, message: `اپراتور "${op.name}" حذف شد` });
    return;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  FAQ Endpoints                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  // GET /api/faq?category=xxx — List FAQs (optionally filtered by category)
  if (method === 'GET' && pathname === '/api/faq') {
    const category = query.category;
    const filtered = category
      ? faqList.filter((f) => f.category === category)
      : faqList;
    sendJSON(res, 200, {
      success: true,
      data: filtered,
      count: filtered.length,
      categories: [...new Set(faqList.map((f) => f.category))],
    });
    return;
  }

  // POST /api/faq-match — Match a message against FAQ keywords
  if (method === 'POST' && pathname === '/api/faq-match') {
    try {
      const body = await parseBody(req);
      const { message } = JSON.parse(body) as { message?: string };

      if (!message || !message.trim()) {
        sendJSON(res, 400, { success: false, message: 'پیام الزامی است' });
        return;
      }

      const matched = matchFAQ(message);
      if (matched) {
        sendJSON(res, 200, {
          success: true,
          matched: true,
          data: {
            id: matched.id,
            category: matched.category,
            question: matched.question,
            answer: matched.answer,
          },
        });
      } else {
        sendJSON(res, 200, {
          success: true,
          matched: false,
          message: 'سوال منطبقی یافت نشد',
        });
      }
      return;
    } catch (err) {
      sendJSON(res, 400, { success: false, message: 'درخواست نامعتبر' });
      return;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  Stats / Health                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  // GET /api/stats — Service health and stats
  if (method === 'GET' && pathname === '/api/stats') {
    sendJSON(res, 200, {
      success: true,
      data: {
        uptime: process.uptime(),
        connectedUsers: Array.from(connectedClients.values()).filter((c) => !c.isOperator).length,
        connectedOperators: Array.from(connectedClients.values()).filter((c) => c.isOperator).length,
        totalOperators: operators.size,
        activeChats: chatHistory.size,
        queueSize: supportQueue.size,
      },
    });
    return;
  }

  /* ── Fallback: 404 ── */
  sendJSON(res, 404, { success: false, message: 'مسیر یافت نشد' });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HTTP Server + Socket.io                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const httpServer = createServer();

// Attach Socket.io with default path `/socket.io` so it does NOT conflict
// with our `/api/*` REST routes. Socket.io only handles /socket.io/* requests.
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// REST API handler — only intercepts /api/* routes.
// Everything else (including /socket.io/*) is left for Socket.io.
httpServer.on('request', (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const { pathname } = parseUrlPath(req);
  if (!pathname.startsWith('/api/')) {
    return; // Not our route — let Socket.io handle it
  }

  handleHttpRequest(req, res).catch((err) => {
    console.error('[SupportChat] HTTP handler error:', err);
    if (!res.headersSent) {
      sendJSON(res, 500, { success: false, message: 'خطای سرور داخلی' });
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Auto-Reply Logic                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function scheduleAutoReply(userId: string, userName: string): void {
  // Cancel any existing pending reply
  const existing = pendingAutoReplies.get(userId);
  if (existing) {
    clearTimeout(existing);
  }

  const delay = 3000 + Math.random() * 5000; // 3-8 seconds

  const timer = setTimeout(async () => {
    pendingAutoReplies.delete(userId);

    // Only auto-reply if no real operator is connected
    if (hasRealOperatorConnected()) {
      console.log(`[SupportChat] Skipping auto-reply for "${userName}" — real operator online`);
      return;
    }

    // Try FAQ match first
    const lastMessages = getOrCreateHistory(userId);
    const lastUserMsg = [...lastMessages].reverse().find((m) => m.senderType === 'user');
    const faqMatch = lastUserMsg ? matchFAQ(lastUserMsg.message) : null;

    let replyText: string | null = null;

    if (faqMatch) {
      replyText = faqMatch.answer;
    } else {
      // Fall back to AI reply from Next.js backend
      replyText = await fetchAIReply(lastUserMsg?.message || '');
    }

    // Final fallback if AI is unavailable
    if (!replyText) {
      replyText = 'سلام! پیام شما دریافت شد. یکی از اپراتورهای ما در اسرع وقت با شما تماس خواهد گرفت.';
    }

    sendAIMessage(userId, replyText);

    console.log(`[SupportChat] AI auto-reply to "${userName}": ${replyText.substring(0, 60)}`);
  }, delay);

  pendingAutoReplies.set(userId, timer);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Greeting on User Join                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_GREETING = 'سلام! 👋 به پشتیبانی زرین گلد خوش آمدید. چطور می‌تونم کمکتون کنم؟';

async function sendGreetingToUser(userId: string): Promise<void> {
  // Only send greeting if no real operator is connected
  if (hasRealOperatorConnected()) return;

  const greeting = await fetchGreetingConfig();
  sendAIMessage(userId, greeting || DEFAULT_GREETING);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Socket.io Connection Handler                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

io.on('connection', (socket) => {
  console.log(`[SupportChat] Client connected: ${socket.id}`);

  /* ── User joins ── */
  socket.on('user-join', async (data: { userId: string; userName: string }) => {
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
        const opName = getOperatorById(opId)?.name;
        if (opName) {
          socket.emit('assigned', { operatorName: opName });
        }
      }
    }

    // Broadcast updated queue to operators
    broadcastSupportQueue();

    // Send greeting if no online operator and user has no prior messages
    if (history.length === 0) {
      await sendGreetingToUser(userId);
    }

    console.log(`[SupportChat] User "${userName}" joined (id: ${userId})`);
  });

  /* ── Operator joins ── */
  socket.on('operator-join', (data: { operatorId: string; operatorName: string }) => {
    const { operatorId, operatorName } = data;

    const storedOp = getOperatorById(operatorId);

    // Verification: operator MUST exist in the operators registry
    if (!storedOp) {
      console.warn(`[SupportChat] Operator not found in registry: ${operatorId}`);
      socket.emit('error', { message: 'اپراتور ثبت نشده است. لطفاً ابتدا از طریق مدیریت اپراتورها ثبت شوید.' });
      return;
    }

    // Mark operator as online
    storedOp.online = true;
    storedOp.status = 'available';

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

    console.log(`[SupportChat] Operator "${operatorName}" joined (id: ${operatorId}, role: ${storedOp?.role || 'N/A'})`);
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
        const opName = getOperatorById(opId)?.name;
        if (opName) {
          io.to(`user:${client.userId}`).emit('assigned', { operatorName: opName });
        }
      }
    }

    // Broadcast queue to operators
    broadcastSupportQueue();

    // Schedule AI auto-reply if no real operator is connected
    scheduleAutoReply(client.userId, client.userName);

    console.log(`[SupportChat] User "${client.userName}": ${trimmed.substring(0, 60)}`);
  });

  /* ── Operator sends a message to a user ── */
  socket.on('operator-message', (data: { targetUserId: string; message: string }) => {
    const client = connectedClients.get(socket.id);
    if (!client || !client.isOperator) return;

    const trimmed = (data.message || '').trim();
    if (!trimmed) return;

    const targetUserId = data.targetUserId;

    // Cancel any pending AI auto-reply for this user (real operator is responding)
    const pendingReply = pendingAutoReplies.get(targetUserId);
    if (pendingReply) {
      clearTimeout(pendingReply);
      pendingAutoReplies.delete(targetUserId);
    }

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

    // Cancel any pending AI auto-reply (real operator taking over)
    const pendingReply = pendingAutoReplies.get(targetUserId);
    if (pendingReply) {
      clearTimeout(pendingReply);
      pendingAutoReplies.delete(targetUserId);
    }

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

    // Cancel pending AI auto-reply
    const pendingReply = pendingAutoReplies.get(targetUserId);
    if (pendingReply) {
      clearTimeout(pendingReply);
      pendingAutoReplies.delete(targetUserId);
    }

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

    // Mark all operator and AI messages as read
    const history = getOrCreateHistory(client.userId);
    for (const msg of history) {
      if (msg.senderType === 'operator' || msg.senderType === 'ai') {
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
      // Mark operator as offline in registry
      const storedOp = getOperatorById(client.userId);
      if (storedOp) {
        storedOp.online = false;
        storedOp.status = 'offline';
      }
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
  const opNames = Array.from(operators.values()).map((o) => o.name).join(', ') || '(none registered)';
  console.log(`[SupportChat] Socket.io + HTTP server running on port ${PORT}`);
  console.log(`[SupportChat] Registered operators: ${opNames}`);
  console.log(`[SupportChat] HTTP endpoints: GET/POST/PUT/DELETE /api/operators, GET /api/faq, POST /api/faq-match, GET /api/stats`);
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Graceful Shutdown                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function shutdown() {
  console.log('[SupportChat] Shutting down...');
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
