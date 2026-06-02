'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';

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
          
          // Support both old format (buy/sell) and new format (geram18/sekkehEmami)
          let buyPrice: number;
          let sellPrice: number;
          
          if (data.buy != null && data.sell != null) {
            // Old format
            buyPrice = data.buy;
            sellPrice = data.sell;
          } else if (data.geram18 != null) {
            // New format: derive buy/sell from geram18
            const spread = Math.round(data.geram18 * 0.003);
            buyPrice = data.geram18 + Math.round(spread / 2);
            sellPrice = data.geram18 - Math.round(spread / 2);
          } else {
            return; // Unknown format, skip
          }
          
          setGoldPrice({
            buyPrice,
            sellPrice,
            marketPrice: Math.round((buyPrice + sellPrice) / 2),
            ouncePrice: data.ounceUsd 
              ? data.ounceUsd * (data.dollar || 95000) * 10
              : Math.round(buyPrice * 0.03215),
            spread: buyPrice - sellPrice,
            updatedAt: data.updatedAt 
              ? data.updatedAt 
              : new Date((data.timestamp || Date.now() / 1000) * 1000).toISOString(),
            // Pass through full Iranian gold prices
            geram18: data.geram18 || undefined,
            geram24: data.geram24 || undefined,
            sekkehEmami: data.sekkehEmami || undefined,
            sekkehBahar: data.sekkehBahar || undefined,
            nimSekkeh: data.nimSekkeh || undefined,
            robSekkeh: data.robSekkeh || undefined,
            sekkehGerami: data.sekkehGerami || undefined,
            ounceUsd: data.ounceUsd || undefined,
            dollar: data.dollar || undefined,
            source: data.source || undefined,
          });
          
          const ts = data.timestamp || Math.floor(Date.now() / 1000);
          setLastUpdate(
            new Intl.DateTimeFormat('fa-IR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(new Date(ts * 1000)),
          );
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
