'use client';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export function GiftAnimation({ gift, onComplete }) {
  const triggerAnimation = () => {
    const colors = {
      common: ['#AAAAAA'], rare: ['#4A9EFF'],
      epic: ['#9B59B6', '#8E44AD'], legendary: ['#D4AF37', '#FFD700', '#F1C40F']
    };
    confetti({
      particleCount: gift.rarity === 'legendary' ? 200 : 100,
      spread: gift.rarity === 'legendary' ? 120 : 80,
      colors: colors[gift.rarity] || colors.common,
      origin: { y: 0.6 }
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        onAnimationComplete={() => { triggerAnimation(); setTimeout(onComplete, 2000); }}>
        <div className="text-8xl animate-bounce">{gift.emoji}</div>
        {gift.rarity === 'legendary' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl font-black text-c8l-gold animate-ping">✨ LEGENDARIO ✨</div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
