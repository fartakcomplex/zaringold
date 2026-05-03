
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {Bell, BellRing, Plus, TrendingUp, TrendingDown, X, Clock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useAppStore} from '@/lib/store';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Alarm {
  id: string;
  targetPrice: number;
  direction: 'above' | 'below';
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
}

const STORAGE_KEY = 'zarrin-gold-alarms';
const POLL_INTERVAL = 30000; // 30 seconds

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatNumber(n: number): string {
  return n.toLocaleString('fa-IR');
}

function loadAlarms(): Alarm[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAlarms(alarms: Alarm[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  } catch {
    // storage full
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PriceAlarmWidget() {
  const { isAuthenticated, goldPrice } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [alarms, setAlarms] = useState<Alarm[]>(() => loadAlarms());
  const [price, setPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [isFlashing, setIsFlashing] = useState(false);
  const [recentTrigger, setRecentTrigger] = useState<Alarm | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* Check alarms against current price */
  const checkAlarms = useCallback(() => {
    if (!goldPrice) return;
    const current = goldPrice.marketPrice || goldPrice.buyPrice;
    if (!current) return;

    setAlarms((prev) => {
      let changed = false;
      const updated = prev.map((alarm) => {
        if (alarm.triggered) return alarm;

        const hit =
          (alarm.direction === 'above' && current >= alarm.targetPrice) ||
          (alarm.direction === 'below' && current <= alarm.targetPrice);

        if (hit) {
          changed = true;
          return {
            ...alarm,
            triggered: true,
            triggeredAt: new Date().toISOString(),
          };
        }
        return alarm;
      });

      if (changed) {
        // Find newly triggered alarms
        const newlyTriggered = updated.filter(
          (a) => a.triggered && !prev.find((p) => p.id === a.id && p.triggered)
        );

        if (newlyTriggered.length > 0) {
          // Flash the bell
          setIsFlashing(true);
          setTimeout(() => setIsFlashing(false), 5000);

          // Show toast
          setRecentTrigger(newlyTriggered[0]);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => setRecentTrigger(null), 6000);

          // Use app store toast
          useAppStore.getState().addToast(
            `🔔 آلارم قیمت فعال شد: ${formatNumber(newlyTriggered[0].targetPrice)} گرم طلا ${newlyTriggered[0].direction === 'above' ? '⬆️' : '⬇️'}`,
            'success'
          );

          saveAlarms(updated);
        }

        return updated;
      }
      return prev;
    });
  }, [goldPrice]);

  /* Poll price every 30 seconds */
  useEffect(() => {
    checkAlarms();
    const interval = setInterval(checkAlarms, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkAlarms]);

  /* Close panel on click outside */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  /* Add alarm */
  const handleAddAlarm = () => {
    const numPrice = parseInt(price.replace(/,/g, ''), 10);
    if (!numPrice || numPrice <= 0) return;

    const current = goldPrice?.marketPrice || goldPrice?.buyPrice || 0;

    const alarm: Alarm = {
      id: `alarm-${Date.now()}`,
      targetPrice: numPrice,
      direction,
      createdAt: new Date().toISOString(),
      triggered:
        (direction === 'above' && current >= numPrice) ||
        (direction === 'below' && current <= numPrice),
    };

    if (alarm.triggered) {
      alarm.triggeredAt = new Date().toISOString();
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 5000);
      useAppStore.getState().addToast(
        `🔔 آلارم فوراً فعال شد: ${formatNumber(numPrice)} گرم طلا`,
        'success'
      );
    }

    const updated = [alarm, ...alarms];
    setAlarms(updated);
    saveAlarms(updated);
    setPrice('');
  };

  /* Remove alarm */
  const handleRemoveAlarm = (id: string) => {
    const updated = alarms.filter((a) => a.id !== id);
    setAlarms(updated);
    saveAlarms(updated);
  };

  /* Don't show if not authenticated */
  if (!isAuthenticated) return null;

  const currentPrice = goldPrice?.marketPrice || goldPrice?.buyPrice || 0;
  const activeAlarms = alarms.filter((a) => !a.triggered);
  const triggeredAlarms = alarms.filter((a) => a.triggered);

  return (
    <>
      {/* ── Floating Button ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed bottom-24 right-5 z-50 flex size-14 items-center justify-center rounded-full text-gold md:bottom-6 md:right-6 cursor-pointer',
            isFlashing && 'alarm-flash'
          )}
          style={{
            background:
              'linear-gradient(135deg, rgba(17,17,17,0.92) 0%, rgba(28,28,30,0.88) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow:
              '0 4px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(212,175,55,0.2), 0 0 20px rgba(212,175,55,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="آلارم قیمت طلا"
        >
          {isFlashing ? (
            <BellRing className="size-6 alarm-bell-ring" />
          ) : (
            <Bell className="size-6" />
          )}
          {/* Active alarms count badge */}
          {activeAlarms.length > 0 && (
            <span className="absolute -top-1 -left-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
              {activeAlarms.length}
            </span>
          )}
        </button>
      )}

      {/* ── Alarm Panel ── */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl md:bottom-6 md:right-6 alarm-panel-in"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-gold/15">
                <BellRing className="size-4 text-gold" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">
                  آلارم قیمت طلا
                </span>
                {currentPrice > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    قیمت فعلی: {formatNumber(currentPrice)} گرم طلا
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* ── Add Alarm Form ── */}
          <div className="border-b border-border bg-muted/30 p-3">
            <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
              <Plus className="size-3" />
              آلارم جدید
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="قیمت..."
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAlarm()}
                className="flex-1 h-9 text-sm"
                dir="ltr"
              />
              <Select
                value={direction}
                onValueChange={(v) => setDirection(v as 'above' | 'below')}
              >
                <SelectTrigger className="w-24 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="size-3 text-green-500" />
                      بالا
                    </div>
                  </SelectItem>
                  <SelectItem value="below">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="size-3 text-red-500" />
                      پایین
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAddAlarm}
                disabled={!price}
                className="h-9 bg-gold text-background hover:bg-gold/90 px-3"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* ── Active Alarms ── */}
          <div className="flex-1 overflow-y-auto max-h-60 custom-scrollbar">
            {activeAlarms.length === 0 && triggeredAlarms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="size-8 opacity-20 mb-2" />
                <p className="text-xs">آلارمی تنظیم نشده</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {/* Active */}
                {activeAlarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {alarm.direction === 'above' ? (
                        <TrendingUp className="size-3.5 text-green-500 shrink-0" />
                      ) : (
                        <TrendingDown className="size-3.5 text-red-500 shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate">
                          {formatNumber(alarm.targetPrice)}
                          <span className="text-[9px] font-normal text-muted-foreground mr-1">
                            گرم طلا
                          </span>
                        </span>
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="size-2" />
                          {alarm.direction === 'above' ? 'بالاتر' : 'پایین‌تر'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAlarm(alarm.id)}
                      className="size-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}

                {/* Triggered */}
                {triggeredAlarms.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 px-1 pt-2 pb-1">
                      <span className="text-[10px] font-bold text-green-500">
                        فعال‌شده
                      </span>
                      <Badge className="bg-green-500/15 text-green-500 border-green-500/30 hover:bg-green-500/20 text-[8px] px-1 py-0">
                        {triggeredAlarms.length}
                      </Badge>
                    </div>
                    {triggeredAlarms.slice(0, 5).map((alarm) => (
                      <div
                        key={alarm.id}
                        className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-2.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <BellRing className="size-3.5 text-green-500 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-green-600 truncate">
                              {formatNumber(alarm.targetPrice)}
                              <span className="text-[9px] font-normal mr-1 opacity-70">
                                گرم طلا ✓
                              </span>
                            </span>
                            {alarm.triggeredAt && (
                              <span className="text-[9px] text-green-600/60">
                                {new Date(alarm.triggeredAt).toLocaleTimeString('fa-IR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAlarm(alarm.id)}
                          className="size-6 flex items-center justify-center rounded-full hover:bg-green-500/10 text-green-500/40 hover:text-red-400 transition-colors shrink-0"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {recentTrigger && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] alarm-toast-in">
          <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-card px-4 py-3 shadow-xl">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-500/15">
              <BellRing className="size-4 text-green-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-green-600">
                🔔 آلارم قیمت فعال شد!
              </span>
              <span className="text-xs text-muted-foreground">
                {formatNumber(recentTrigger.targetPrice)} گرم طلا{' '}
                {recentTrigger.direction === 'above' ? '⬆️' : '⬇️'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Animations ── */}
      <style jsx>{`
        @keyframes alarmFlash {
          0%, 100% {
            box-shadow:
              0 4px 30px rgba(0,0,0,0.3),
              0 0 0 1px rgba(212,175,55,0.2),
              0 0 20px rgba(212,175,55,0.1);
          }
          50% {
            box-shadow:
              0 4px 30px rgba(0,0,0,0.3),
              0 0 0 3px rgba(34,197,94,0.6),
              0 0 30px rgba(34,197,94,0.4);
          }
        }
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-15deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
        }
        @keyframes panelSlideIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes toastSlideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .alarm-flash {
          animation: alarmFlash 0.8s ease-in-out infinite;
        }
        .alarm-bell-ring {
          animation: bellRing 1s ease-in-out infinite;
        }
        .alarm-panel-in {
          animation: panelSlideIn 0.25s ease-out;
        }
        .alarm-toast-in {
          animation: toastSlideDown 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212,175,55,0.2);
          border-radius: 4px;
        }
      `}</style>
    </>
  );
}
