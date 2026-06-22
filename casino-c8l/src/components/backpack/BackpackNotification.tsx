'use client';
import { motion, AnimatePresence } from 'framer-motion';

export function BackpackNotification({ gift, fromUser, onRead }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        className="fixed bottom-24 right-4 bg-black/90 border-2 border-c8l-gold p-4 rounded-lg max-w-xs z-40 shadow-xl"
        onClick={onRead}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">{gift.emoji}</div>
          <div>
            <div className="text-sm font-bold text-white">
              {fromUser} te envió {gift.name}
            </div>
            <div className="text-xs text-gray-400">Haz clic para ver</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
