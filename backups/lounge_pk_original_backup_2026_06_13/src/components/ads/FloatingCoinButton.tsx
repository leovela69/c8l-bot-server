// components/ads/FloatingCoinButton.tsx
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface FloatingCoinButtonProps {
  userCoins: number;
  onClick: () => void;
}

export function FloatingCoinButton({ userCoins, onClick }: FloatingCoinButtonProps) {
  const [isBouncing, setIsBouncing] = useState(false);

  // Animación de rebote cuando cambian las coins
  useEffect(() => {
    setIsBouncing(true);
    const timer = setTimeout(() => setIsBouncing(false), 500);
    return () => clearTimeout(timer);
  }, [userCoins]);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isBouncing ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
      className="fixed bottom-24 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] px-5 py-3 rounded-full shadow-xl border-2 border-black hover:shadow-2xl transition-all"
    >
      <span className="text-2xl animate-pulse">💰</span>
      <div className="text-left">
        <div className="text-[10px] text-black/70 font-mono">TUS COINS</div>
        <div className="text-xl font-black text-black">{userCoins.toLocaleString()}</div>
      </div>
      <div className="w-px h-8 bg-black/30 mx-1" />
      <div className="text-sm font-black text-black uppercase tracking-wider">
        RECARGAR
      </div>
    </motion.button>
  );
}