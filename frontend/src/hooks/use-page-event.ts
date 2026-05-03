
import {useEffect, useRef} from 'react';
import {useAppStore} from '@/lib/store';

/**
 * Hook for page components to listen to quick action events.
 * Uses a ref for the handler to avoid infinite re-render loops.
 *
 * @param action - The event action name to listen for (e.g. 'deposit', 'withdraw')
 * @param handler - Callback function when the event fires
 *
 * @example
 * ```tsx
 * usePageEvent('deposit', () => setDepositOpen(true));
 * usePageEvent('withdraw', () => setWithdrawOpen(true));
 * ```
 */
export function usePageEvent(
  action: string,
  handler: () => void,
) {
  const pageEvent = useAppStore((s) => s.pageEvent);
  const handlerRef = useRef(handler);
  const lastHandledIdRef = useRef<string | null>(null);

  // Keep handler ref in sync (inside useEffect to satisfy react-hooks/refs rule)
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (
      pageEvent &&
      pageEvent.action === action &&
      pageEvent.id !== lastHandledIdRef.current
    ) {
      lastHandledIdRef.current = pageEvent.id;
      handlerRef.current();
    }
  }, [pageEvent?.id, pageEvent?.action, action]);
}
