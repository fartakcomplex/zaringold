'use client';

import { motion, AnimatePresence } from '@/lib/framer-compat';
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="relative"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-dark shadow-xl shadow-gold/30">
            <span className="text-2xl">🪙</span>
          </div>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gold/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="gold-gradient-text text-xl font-bold">زرین گلد</h2>
          <p className="text-xs text-muted-foreground mt-1">در حال بارگذاری...</p>
        </motion.div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="size-2 rounded-full bg-gold"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
