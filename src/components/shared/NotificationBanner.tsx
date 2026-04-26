'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, TrendingUp, TrendingDown, AlertTriangle, Info, X, CheckCircle } from 'lucide-react';

interface NotificationData {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'success' | 'warning';
  price?: number;
  timestamp: string;
}

const severityConfig: Record<string, { icon: React.ElementType; borderClass: string; bgClass: string; iconClass: string; progressClass: string }> = {
  info: {
    icon: Info,
    borderClass: 'border-gold/40',
    bgClass: 'bg-gold/10',
    iconClass: 'text-gold',
    progressClass: 'bg-gold/60',
  },
  success: {
    icon: CheckCircle,
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-emerald-500/10',
    iconClass: 'text-emerald-500',
    progressClass: 'bg-emerald-500/60',
  },
  warning: {
    icon: AlertTriangle,
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/10',
    iconClass: 'text-amber-500',
    progressClass: 'bg-amber-500/60',
  },
};

export default function NotificationBanner() {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);

  // Connect to the price service via socket.io
  useEffect(() => {
    let socket: any = null;
    let mounted = true;

    async function connect() {
      try {
        const { io } = await import('socket.io-client');
        socket = io('/?XTransformPort=3004', {
          transports: ['websocket', 'polling'],
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          timeout: 10000,
        });

        if (!mounted) {
          socket.disconnect();
          return;
        }

        socket.on('connect', () => {
          if (mounted) setSocketConnected(true);
        });

        socket.on('disconnect', () => {
          if (mounted) setSocketConnected(false);
        });

        socket.on('notification:new', (data: NotificationData) => {
          if (mounted) showNotification(data);
        });
      } catch {
        if (mounted) setSocketConnected(false);
      }
    }

    connect();

    return () => {
      mounted = false;
      if (socket) socket.disconnect();
    };
  }, []);

  // Fallback: simulate notifications every 30 seconds if socket not connected
  useEffect(() => {
    if (socketConnected) return;

    const fallbackMessages: Omit<NotificationData, 'id' | 'timestamp'>[] = [
      { type: 'price_up', message: 'قیمت طلا روند صعودی دارد', severity: 'info', price: 34500000 },
      { type: 'system', message: 'بروزرسانی سیستم با موفقیت انجام شد', severity: 'success' },
      { type: 'alert', message: 'توجه: نوسانات بالا در بازار طلا', severity: 'warning' },
      { type: 'info', message: 'فرصت خرید مناسب در بازار', severity: 'info', price: 34300000 },
    ];

    let index = 0;
    const interval = setInterval(() => {
      const msg = fallbackMessages[index % fallbackMessages.length];
      showNotification({
        ...msg,
        id: `fb-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
      });
      index++;
    }, 30000);

    const initialTimeout = setTimeout(() => {
      const msg = fallbackMessages[0];
      showNotification({
        ...msg,
        id: `fb-initial-${Date.now()}`,
        timestamp: new Date().toISOString(),
      });
      index = 1;
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [socketConnected]);

  const showNotification = useCallback((data: NotificationData) => {
    // Reset exit state, mount the element, then animate in
    setIsExiting(false);
    setIsMounted(true);
    setNotification(data);
    setProgressKey((k) => k + 1);
    // Small delay to ensure the DOM is painted before triggering the transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    if (!isVisible && !isMounted) return;
    setIsExiting(true);
    setIsVisible(false);
    // Wait for CSS transition to finish before unmounting
    setTimeout(() => {
      setIsMounted(false);
      setNotification(null);
      setIsExiting(false);
    }, 400);
  }, [isVisible, isMounted]);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!isVisible || !notification) return;
    const timer = setTimeout(handleClose, 6000);
    return () => clearTimeout(timer);
  }, [isVisible, notification?.id, handleClose]);

  if (!isMounted || !notification) return null;

  const config = severityConfig[notification.severity] || severityConfig.info;
  const Icon = config.icon;
  const TypeIcon = notification.type === 'price_up' ? TrendingUp : notification.type === 'price_down' ? TrendingDown : Bell;

  return (
    <>
      <style>{`
        @keyframes notif-progress-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .notif-progress-bar-active {
          animation: notif-progress-shrink 6s linear forwards;
        }
      `}</style>

      <div
        className={`fixed top-0 left-0 right-0 z-[100] mx-2 mt-2 sm:mx-auto sm:max-w-lg sm:mt-4
          opacity-0 -translate-y-full pointer-events-none
          transition-[transform,opacity] duration-[400ms] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]
          ${isVisible ? '!translate-y-0 !opacity-100 pointer-events-auto' : ''}`}
        role="alert"
        aria-live="polite"
      >
        <div className={`relative overflow-hidden rounded-xl border-2 ${config.borderClass} ${config.bgClass} backdrop-blur-xl shadow-xl`}>
          {/* Progress bar for auto-dismiss */}
          <div
            key={progressKey}
            className={`absolute bottom-0 left-0 h-0.5 ${config.progressClass} ${isVisible ? 'notif-progress-bar-active' : 'w-0'}`}
          />

          <div className="flex items-center gap-3 p-3 sm:p-4">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-background/80 ${config.iconClass}`}>
              <Icon className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">{notification.message}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <TypeIcon className="size-3" />
                {notification.price && (
                  <span className="tabular-nums font-medium">
                    {notification.price.toLocaleString('fa-IR')} گرم طلا
                  </span>
                )}
                <span>·</span>
                <span>{new Date(notification.timestamp).toLocaleTimeString('fa-IR')}</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-foreground/10"
              aria-label="بستن"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
