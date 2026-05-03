
import {useEffect, useRef} from 'react';
import {useAppStore} from '@/lib/store';

/**
 * useSessionRefresh — validates and refreshes the current user's data
 * from the database on app load. This ensures that stale localStorage
 * data (e.g. missing role field) is corrected automatically.
 */
export function useSessionRefresh() {
  const { user, isAuthenticated, setUser, setFiatWallet, setGoldWallet, reset } =
    useAppStore();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || hasRefreshed.current) return;
    hasRefreshed.current = true;

    const refreshSession = async () => {
      try {
        const res = await fetch(`/api/auth/me?userId=${user.id}`);
        const data = await res.json();

        if (!data.success) {
          // User was deleted or banned → force logout
          if (data.action === 'logout') {
            reset();
            useAppStore.getState().addToast(data.message || 'حساب کاربری غیرفعال است', 'error');
          }
          return;
        }

        // Refresh user data in store (fixes stale role, name, etc.)
        setUser(data.user);

        // Refresh wallet data
        if (data.wallet) {
          setFiatWallet({
            balance: data.wallet.balance,
            frozenBalance: data.wallet.frozenBalance,
          });
        }
        if (data.goldWallet) {
          setGoldWallet({
            goldGrams: data.goldWallet.goldGrams,
            frozenGold: data.goldWallet.frozenGold,
          });
        }
      } catch {
        // Silent failure — don't block the UI
      }
    };

    refreshSession();
  }, [isAuthenticated, user?.id, setUser, setFiatWallet, setGoldWallet, reset]);
}
