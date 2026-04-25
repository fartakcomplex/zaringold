'use client';

import { useEffect } from 'react';

/**
 * useQuickAction — listens for `zarrin-quick-action` CustomEvents dispatched
 * by the PageQuickAccess component (or any other source).
 *
 * @param actionId  The full action string, e.g. "open:wallet-deposit" or "tab:quest-today"
 * @param handler   Callback to run when the matching action is dispatched
 *
 * Usage:
 *   useQuickAction('open:wallet-deposit', () => setOpenDeposit(true));
 *   useQuickAction('tab:quest-today', () => setActiveTab('today'));
 */
export function useQuickAction(actionId: string, handler: () => void) {
  useEffect(() => {
    const listener = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.action === actionId) {
        handler();
      }
    };
    window.addEventListener('zarrin-quick-action', listener);
    return () => window.removeEventListener('zarrin-quick-action', listener);
  }, [actionId, handler]);
}
