
import React, { useEffect, useState, useCallback } from 'react';
import {CheckCircle2, XCircle, Info, X} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {cn} from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Toast type configs                                                 */
/* ------------------------------------------------------------------ */

const toastConfig = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    barColor: '#34d399', // emerald-400
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-400',
    barColor: '#f87171', // red-400
  },
  info: {
    icon: Info,
    iconClass: 'text-[#D4AF37]',
    barColor: '#D4AF37', // gold
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Inline CSS keyframes & animation classes                           */
/* ------------------------------------------------------------------ */

const toastStyles = `
  @keyframes snackbar-enter {
    0% {
      transform: translateY(100%);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes snackbar-exit {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(20px);
      opacity: 0;
    }
  }

  .snackbar-enter {
    animation: snackbar-enter 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .snackbar-exit {
    animation: snackbar-exit 0.25s ease-in forwards;
  }
`;

/* ------------------------------------------------------------------ */
/*  Single Toast                                                       */
/* ------------------------------------------------------------------ */

function ToastItem({
  toast,
}: {
  toast: { id: string; message: string; type: 'success' | 'error' | 'info' };
}) {
  const removeToast = useAppStore((s) => s.removeToast);
  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const [animClass, setAnimClass] = useState<string>('snackbar-enter');
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setAnimClass('snackbar-exit');
  }, [isExiting]);

  const handleAnimationEnd = useCallback(() => {
    if (isExiting) {
      removeToast(toast.id);
    }
  }, [isExiting, removeToast, toast.id]);

  return (
    <div
      role="alert"
      dir="rtl"
      className={cn(
        'relative w-full overflow-hidden',
        'bg-[#1A1A1A]/95 backdrop-blur-xl',
        'border border-white/[0.08]',
        'rounded-2xl',
        'shadow-[0_-4px_30px_rgba(0,0,0,0.4)]',
        'flex items-center gap-3 px-4 py-3',
        animClass,
        'pointer-events-auto'
      )}
      style={{ borderTop: `2px solid ${config.barColor}` }}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* Icon — right side in RTL */}
      <Icon className={cn('h-5 w-5 shrink-0', config.iconClass)} />

      {/* Message — center */}
      <p className="flex-1 text-sm font-medium text-white/90 leading-relaxed">
        {toast.message}
      </p>

      {/* Close button — left side in RTL */}
      <button
        type="button"
        onClick={handleClose}
        className={cn(
          'shrink-0 rounded-lg p-1 transition-colors duration-150',
          'hover:bg-white/10',
          'text-white/30 hover:text-white/60'
        )}
        aria-label="بستن"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toast Container                                                    */
/* ------------------------------------------------------------------ */

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);

  // Show max 3 toasts — newest at the bottom (end of array)
  // Stack vertically (not reversed) so the oldest is on top
  const visibleToasts = toasts.slice(-3);

  if (visibleToasts.length === 0) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: toastStyles }} />

      {/* Mobile: full width bottom center, above bottom nav */}
      {/* Desktop: bottom-left with max-width */}
      <div
        className={cn(
          'fixed z-[100]',
          // Mobile: bottom center, above bottom nav
          'bottom-20 inset-x-0 mx-3',
          // Desktop: bottom-left with max-width
          'md:bottom-6 md:left-6 md:right-auto md:inset-x-auto md:mx-0 md:max-w-sm',
          'flex flex-col gap-3',
          'pointer-events-none'
        )}
      >
        {visibleToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </>
  );
}
