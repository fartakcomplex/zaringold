
import {useState, useEffect, useCallback} from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {ArrowUp} from 'lucide-react';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ScrollToTop — Floating gold button to scroll back to page top             */
/*  Dark-gold-blur theme · RTL · Appears after 400px scroll                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const SCROLL_THRESHOLD = 400;

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position (e.g. if page is refreshed mid-scroll)
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollToTop}
          aria-label="بازگشت به بالا"
          initial={{ opacity: 0, scale: 0.6, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 16 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'fixed bottom-6 left-6 z-50',
            'flex size-12 items-center justify-center rounded-full',
            'bg-gradient-to-br from-gold-light via-gold to-gold-dark',
            'text-gray-950 shadow-lg shadow-gold/25',
            'transition-all duration-200 ease-out',
            'hover:shadow-xl hover:shadow-gold/40 hover:scale-110',
            'active:scale-95',
          )}
        >
          <ArrowUp className="size-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
