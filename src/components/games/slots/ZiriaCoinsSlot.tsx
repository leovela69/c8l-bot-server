// components/games/slots/ZiriaCoinsSlot.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Trophy, RefreshCw } from 'lucide-react';
import { casinoSounds } from '../../../lib/audio/casinoSounds';
import confetti from 'canvas-confetti';

const SYMBOLS = {
  '👑': { name: 'Ziria Crown', payout: 300, color: '#D4AF37', desc: 'El trono de Ziria' },
  '🪙': { name: 'Ziria Coin', payout: 150, color: '#FFD700', desc: 'Reliquia de oro' },
  '🔺': { name: 'Pyramid', payout: 90, color: '#CD7F32', desc: 'Fuerza ancestral' },
  '💎': { name: 'Crystal', payout: 60, color: '#00F3FF', desc: 'Mineral cuántico' },
  '🌵': { name: 'Cactus', payout: 30, color: '#228B22', desc: 'Supervivencia extrema' }
} as const;

type SymbolKey = keyof typeof SYMBOLS;
const SYMBOLS_LIST: SymbolKey[] = ['👑', '🪙', '🔺', '💎', '🌵'];

import { useApp } from '../../../context/AppContext';
import { AnimatedNumber } from '../../ui/AnimatedNumber';

interface SlotProps {
  userCoins?: number;
  setUserCoins?: (coins: number | ((prev: number) => number)) => void;
  onWin?: (amount: number, item: string) => void;
}

export function ZiriaCoinsSlot({ onWin }: SlotProps) {
  const { c8lCoins, placeCasinoBet, awardCasinoWin } = useApp();
  const [reels, setReels] = useState<SymbolKey[][]>([
    ['👑', '🪙', '🔺', '💎', '🌵'],
    ['🪙', '👑', '💎', '🔺', '🌵'],
    ['🌵', '💎', '👑', '🪙', '🔺']
  ]);
  const [spinning, setSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [lastWin, setLastWin] = useState<{ amount: number; symbol: SymbolKey } | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  
  const betAmount = 20;

  // Lock scroll during spin
  useEffect(() => {
    const scrollContainer = document.querySelector('.scroll-container') || document.body;
    if (spinning) {
      (scrollContainer as HTMLElement).style.overflowY = 'hidden';
    } else {
      (scrollContainer as HTMLElement).style.overflowY = 'auto';
    }
    return () => {
      (scrollContainer as HTMLElement).style.overflowY = 'auto';
    };
  }, [spinning]);

  const spinReel = async (reelIndex: number, newSymbols: SymbolKey[]) => {
    return new Promise<void>(resolve => {
      let spins = 0;
      const maxSpins = 12;
      const interval = setInterval(() => {
        setReels(prev => {
          const updated = [...prev];
          const randomSymbol = SYMBOLS_LIST[Math.floor(Math.random() * SYMBOLS_LIST.length)];
          updated[reelIndex][spins % 5] = randomSymbol;
          return updated;
        });
        spins++;
        if (spins >= maxSpins) {
          clearInterval(interval);
          setReels(prev => {
            const updated = [...prev];
            updated[reelIndex] = newSymbols;
            return updated;
          });
          resolve();
        }
      }, 60);
    });
  };

  const spin = async () => {
    if (spinning || c8lCoins < betAmount) {
      if (c8lCoins < betAmount) alert('❌ Coins insuficientes');
      return;
    }
    
    const success = await placeCasinoBet(betAmount);
    if (!success) return;

    setSpinning(true);
    setLastWin(null);
    setShowAnimation(false);
    casinoSounds.playSlotSpin(1.0);
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Accumulate progressive jackpot
    window.dispatchEvent(new CustomEvent('c8l-jackpot-bet', { detail: { bet: betAmount } }));
    
    const newReels: SymbolKey[][] = reels.map(() => 
      SYMBOLS_LIST.map(() => SYMBOLS_LIST[Math.floor(Math.random() * SYMBOLS_LIST.length)])
    );
    
    for (let i = 0; i < newReels.length; i++) {
      await spinReel(i, newReels[i]);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const centerRow = newReels.map(reel => reel[2]);
    
    if (centerRow[0] === centerRow[1] && centerRow[1] === centerRow[2]) {
      const sym = centerRow[0];
      let winAmount = SYMBOLS[sym].payout * multiplier;
      const isJackpot = sym === '👑';

      // Jackpot progressive bonus on Crown symbol 👑
      if (isJackpot) {
        const currentJackpot = parseInt(localStorage.getItem("c8l_jackpot") || "124500", 10);
        const bonus = Math.floor(currentJackpot * 0.25); // 25% jackpot bonus
        winAmount += bonus;
        
        localStorage.setItem("c8l_jackpot", (currentJackpot - bonus).toString());
        window.dispatchEvent(new CustomEvent('c8l-jackpot-won', { detail: { amount: bonus } }));
      }

      await awardCasinoWin(winAmount);
      setLastWin({ amount: winAmount, symbol: sym });
      setShowAnimation(true);
      onWin?.(winAmount, SYMBOLS[sym].name);

      if (isJackpot) {
        casinoSounds.playJackpotAlert();
      } else {
        casinoSounds.playWin();
      }
      window.dispatchEvent(new Event('c8l-screen-shake'));
      confetti({
        particleCount: 150,
        spread: 80,
        colors: ['#D4AF37', '#FFD700', '#CD7F32']
      });
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } else if (centerRow[0] === centerRow[2]) {
      const sym = centerRow[0];
      const winAmount = Math.floor(SYMBOLS[sym].payout / 2) * multiplier;
      await awardCasinoWin(winAmount);
      setLastWin({ amount: winAmount, symbol: sym });
      setShowAnimation(true);
      onWin?.(winAmount, SYMBOLS[sym].name);

      casinoSounds.playWin();
      window.dispatchEvent(new Event('c8l-screen-shake'));
      confetti({
        particleCount: 80,
        spread: 50,
        colors: ['#D4AF37', '#FFD700']
      });
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    
    setSpinning(false);
  };

  return (
    <div className="border-4 border-black bg-gradient-to-b from-[#2a1b0a] to-[#120802] p-6 shadow-[8px_8px_0px_#D4AF37] rounded-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(212,175,55,0.02)_50%)] bg-[size:100%_4px] pointer-events-none" />
      
      <h2 className="font-heading text-xl font-black text-[#D4AF37] mb-4 text-center uppercase tracking-wider flex items-center justify-center gap-2">
        <Trophy className="text-[#D4AF37]" size={18} /> ZIRIA GOLD COINS 🪙
      </h2>
      
      <div className="grid grid-cols-3 gap-2 mb-4 bg-black/60 p-2 border border-zinc-800 text-center font-mono text-xs">
        <div>
          <span className="text-zinc-500 block uppercase text-[9px]">Saldo</span>
          <span className="text-[#D4AF37] font-bold"><AnimatedNumber value={c8lCoins} /> C8L</span>
        </div>
        <div>
          <span className="text-zinc-500 block uppercase text-[9px]">Costo</span>
          <span className="text-white font-bold">{betAmount} C8L</span>
        </div>
        <div>
          <span className="text-zinc-500 block uppercase text-[9px]">Multi</span>
          <span className="text-amber-400 font-bold">x{multiplier}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 bg-black/85 p-4 border-3 border-amber-900 rounded-lg">
        {reels.map((reel, reelIdx) => (
          <div key={reelIdx} className="space-y-2">
            {reel.slice(1, 4).map((symbol, rowIdx) => (
              <motion.div
                key={`${reelIdx}-${rowIdx}`}
                className={`h-20 flex items-center justify-center text-4xl border-2 rounded-lg transition-all ${
                  rowIdx === 1 ? 'border-[#D4AF37] bg-amber-950/15 shadow-inner' : 'border-zinc-850 bg-zinc-950/40'
                }`}
                style={{
                  filter: spinning ? 'blur(3px)' : 'none'
                }}
                animate={spinning ? { rotateY: [0, 360], scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.15, delay: reelIdx * 0.08 }}
              >
                {symbol}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      
      <AnimatePresence>
        {showAnimation && lastWin && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="bg-black/95 border-3 border-[#D4AF37] rounded-lg p-5 text-center shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              <div className="text-5xl mb-1">{lastWin.symbol}</div>
              <div className="text-2xl font-black text-[#D4AF37] animate-pulse">
                +{lastWin.amount} C8L COINS
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 uppercase font-mono">
                {SYMBOLS[lastWin.symbol]?.desc}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        onClick={spin}
        disabled={spinning || c8lCoins < betAmount}
        className="w-full mt-4 py-3 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-heading font-black text-sm border-2 border-black shadow-[3px_3px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] cursor-pointer"
      >
        {spinning ? '🪙 EXTRAYENDO ORO...' : '🎰 EXCAVAR JACKPOT'}
      </button>
    </div>
  );
}
