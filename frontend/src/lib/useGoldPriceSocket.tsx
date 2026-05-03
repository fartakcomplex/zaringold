
import {useEffect, useRef, useState} from 'react';
import {useAppStore} from '@/lib/store';

/**
 * useGoldPriceSocket — connects to the SSE endpoint at /api/gold/price/stream
 * and pushes live price updates into the global store.
 *
 * Returns { isConnected, lastUpdate } for UI indicators.
 */
export function useGoldPriceSocket() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const setGoldPrice = useAppStore((state) => state.setGoldPrice);

  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let es: EventSource | null = null;

    function cleanup() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (es) {
        es.close();
        es = null;
      }
      eventSourceRef.current = null;
    }

    function connect() {
      cleanup();

      es = new EventSource('/api/gold/price/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.buy != null && data.sell != null) {
            setGoldPrice({
              buyPrice: data.buy,
              sellPrice: data.sell,
              marketPrice: Math.round((data.buy + data.sell) / 2),
              ouncePrice: Math.round(data.buy * 0.03215),
              spread: data.buy - data.sell,
              updatedAt: new Date(data.timestamp * 1000).toISOString(),
            });
            setLastUpdate(
              new Intl.DateTimeFormat('fa-IR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }).format(new Date(data.timestamp * 1000)),
            );
          }
        } catch {
          // Ignore non-JSON messages (e.g. SSE heartbeats)
        }
      };

      es.onerror = () => {
        if (!isMounted) return;
        setIsConnected(false);
        cleanup();
        reconnectTimer = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [setGoldPrice]);

  return { isConnected, lastUpdate };
}
