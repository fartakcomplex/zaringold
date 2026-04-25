'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/lib/store';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface SupportMessage {
  id: string;
  senderType: 'user' | 'operator' | 'ai';
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SupportQueueItem {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  assignedOperator?: string;
  status: 'waiting' | 'active';
}

/* ── User-side hook return type ── */

export interface UseSupportChatReturn {
  messages: SupportMessage[];
  isConnected: boolean;
  operatorName: string | null;
  isOperatorTyping: boolean;
  sendUserMessage: (message: string) => void;
  markAsRead: () => void;
  emitTyping: () => void;
  emitStopTyping: () => void;
}

/* ── Operator-side hook return type ── */

export interface UseOperatorChatReturn {
  isConnected: boolean;
  assignedUsers: SupportQueueItem[];
  waitingUsers: SupportQueueItem[];
  currentChatUserId: string | null;
  currentMessages: SupportMessage[];
  isUserTyping: boolean;
  sendMessage: (targetUserId: string, message: string) => void;
  switchUser: (targetUserId: string) => void;
  assignUser: (targetUserId: string) => void;
  emitTyping: (targetUserId: string) => void;
  emitStopTyping: (targetUserId: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Socket connection factory (shared)                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function createSupportSocket(): Socket {
  return io('/?XTransformPort=3005', {
    transports: ['websocket', 'polling'],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
  });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  useSupportChat — User-side hook                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function useSupportChat(): UseSupportChatReturn {
  const { user } = useAppStore();
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasJoinedRef = useRef(false);

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [isOperatorTyping, setIsOperatorTyping] = useState(false);

  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  /* ── Connect and register events ── */
  useEffect(() => {
    if (!user) return;

    const socket = createSupportSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (!hasJoinedRef.current) {
        socket.emit('user-join', {
          userId: user.id,
          userName: user.fullName || user.phone || 'کاربر',
        });
        hasJoinedRef.current = true;
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('chat-history', (data: { messages: SupportMessage[] }) => {
      setMessages(data.messages);
    });

    socket.on('new-message', (msg: SupportMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Auto-mark as read when receiving operator message
      if (msg.senderType === 'operator') {
        setTimeout(() => {
          socket.emit('mark-read');
        }, 500);
      }
    });

    socket.on('assigned', (data: { operatorName: string }) => {
      setOperatorName(data.operatorName);
    });

    socket.on('operator-typing', () => {
      setIsOperatorTyping(true);
      clearTypingTimeout();
      typingTimeoutRef.current = setTimeout(() => {
        setIsOperatorTyping(false);
      }, 3000);
    });

    socket.on('operator-stop-typing', () => {
      setIsOperatorTyping(false);
      clearTypingTimeout();
    });

    return () => {
      hasJoinedRef.current = false;
      clearTypingTimeout();
      socket.disconnect();
    };
  }, [user?.id, clearTypingTimeout]);

  /* ── Actions ── */

  const sendUserMessage = useCallback(
    (message: string) => {
      if (socketRef.current && isConnected && message.trim()) {
        socketRef.current.emit('user-message', { message: message.trim() });
      }
    },
    [isConnected]
  );

  const markAsRead = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark-read');
    }
  }, [isConnected]);

  const emitTyping = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing');
    }
  }, [isConnected]);

  const emitStopTyping = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('stop-typing');
    }
  }, [isConnected]);

  return {
    messages,
    isConnected,
    operatorName,
    isOperatorTyping,
    sendUserMessage,
    markAsRead,
    emitTyping,
    emitStopTyping,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  useOperatorChat — Operator-side hook                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function useOperatorChat(operatorId: string, operatorName: string): UseOperatorChatReturn {
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasJoinedRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<SupportQueueItem[]>([]);
  const [waitingUsers, setWaitingUsers] = useState<SupportQueueItem[]>([]);
  const [currentChatUserId, setCurrentChatUserId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<SupportMessage[]>([]);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  /* ── Connect and register events ── */
  useEffect(() => {
    if (!operatorId || !operatorName) return;

    const socket = createSupportSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (!hasJoinedRef.current) {
        socket.emit('operator-join', { operatorId, operatorName });
        hasJoinedRef.current = true;
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('support-queue', (data: { assignedUsers: SupportQueueItem[]; waitingUsers: SupportQueueItem[] }) => {
      setAssignedUsers(data.assignedUsers);
      setWaitingUsers(data.waitingUsers);
    });

    socket.on('chat-history', (data: { targetUserId: string; messages: SupportMessage[] }) => {
      setCurrentChatUserId(data.targetUserId);
      setCurrentMessages(data.messages);
    });

    socket.on('new-message', (msg: SupportMessage) => {
      setCurrentMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('user-typing', () => {
      setIsUserTyping(true);
      clearTypingTimeout();
      typingTimeoutRef.current = setTimeout(() => {
        setIsUserTyping(false);
      }, 3000);
    });

    socket.on('user-stop-typing', () => {
      setIsUserTyping(false);
      clearTypingTimeout();
    });

    return () => {
      hasJoinedRef.current = false;
      clearTypingTimeout();
      socket.disconnect();
    };
  }, [operatorId, operatorName, clearTypingTimeout]);

  /* ── Actions ── */

  const sendMessage = useCallback(
    (targetUserId: string, message: string) => {
      if (socketRef.current && isConnected && message.trim()) {
        socketRef.current.emit('operator-message', {
          targetUserId,
          message: message.trim(),
        });
      }
    },
    [isConnected]
  );

  const switchUser = useCallback(
    (targetUserId: string) => {
      if (socketRef.current && isConnected) {
        setCurrentChatUserId(targetUserId);
        setCurrentMessages([]);
        socketRef.current.emit('switch-user', { targetUserId });
      }
    },
    [isConnected]
  );

  const assignUser = useCallback(
    (targetUserId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('assign-user', { targetUserId });
      }
    },
    [isConnected]
  );

  const emitTyping = useCallback(
    (targetUserId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('typing', { targetUserId });
      }
    },
    [isConnected]
  );

  const emitStopTyping = useCallback(
    (targetUserId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('stop-typing', { targetUserId });
      }
    },
    [isConnected]
  );

  return {
    isConnected,
    assignedUsers,
    waitingUsers,
    currentChatUserId,
    currentMessages,
    isUserTyping,
    sendMessage,
    switchUser,
    assignUser,
    emitTyping,
    emitStopTyping,
  };
}
