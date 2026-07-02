// components/games/slots/SirenasSlot.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Anchor, RefreshCw } from 'lucide-react';

const SYMBOLS = {
  '🧜‍♀️': { name: 'Siren', payout: 200, color: '#00F3FF', desc: 'El canto de la sirena' },
  '🦪': { name: 'Pearl', payout: 120, color: '#EAEAEA', desc: 'Perla de los abismos' },
  '🐚': { name: 'Shell', payout: 80, color: '#D4AF37', desc: 'Caracola marina' },
  '🐠': { name: 'Clownfish', payout: 40, color: '#FF7F50', desc: 'Coral animado' },
  '⚓': { name: 'Anchor', payout: 20, color: '#708090', desc: 'Anclado al fondo' }
} as const;

type SymbolKey = keyof typeof SYMBOLS;
const SYMBOLS_LIST: SymbolKey[] = ['🧜‍♀️', '🦪', '🐚', '🐠', '⚓'];

interface SlotProps {
  userCoins: number;
  setUserCoins: (coins: number | ((prev: number) => number)) => void;
  onWin?: (amount: number, item: string) => void;
}

export function SirenasSlot({ userCoins, setUserCoins, onWin }: SlotProps) {
  const [reels, setReels] = useState<SymbolKey[][]>([
    ['🧜‍♀️', '🦪', '🐚', '🐠', '⚓'],
    ['🦪', '🧜‍♀️', '⚓', '🐠', '🐚'],
    ['🐚', '⚓', '🧜‍♀️', '🦪', '🐠']
  ]);
  const [spinning, setSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [lastWin, setLastWin] = useState<{ amount: number; symbol: SymbolKey } | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  
  const betAmount = 10;

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
    if (spinning || userCoins < betAmount) {
      if (userCoins < betAmount) alert('❌ Coins insuficientes');
      return;
    }
    
    setUserCoins(prev => prev - betAmount);
    setSpinning(true);
    setLastWin(null);
    setShowAnimation(false);

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

      // Jackpot progressive bonus on Siren symbol 🧜‍♀️
      if (sym === '🧜‍♀️') {
        const currentJackpot = parseInt(localStorage.getItem("c8l_jackpot") || "124500", 10);
        const bonus = Math.floor(currentJackpot * 0.15); // 15% jackpot bonus
        winAmount += bonus;
        
        localStorage.setItem("c8l_jackpot", (currentJackpot - bonus).toString());
        window.dispatchEvent(new CustomEvent('c8l-jackpot-won', { detail: { amount: bonus } }));
        alert(`🧜‍♀️ ¡CANTO DE JACKPOT! +${bonus} C8L Coins extras añadidos!`);
      }

      setUserCoins(prev => prev + winAmount);
      setLastWin({ amount: winAmount, symbol: sym });
      setShowAnimation(true);
      onWin?.(winAmount, SYMBOLS[sym].name);
    } else if (centerRow[0] === centerRow[2]) {
      const sym = centerRow[0];
      const winAmount = Math.floor(SYMBOLS[sym].payout / 2) * multiplier;
      setUserCoins(prev => prev + winAmount);
      setLastWin({ amount: winAmount, symbol: sym });
      setShowAnimation(true);
      onWin?.(winAmount, SYMBOLS[sym].name);
    }
    
    setSpinning(false);
  };

  return (
    <div className="border-4 border-black bg-gradient-to-b from-[#0a233a] to-[#04101c] p-6 shadow-[8px_8px_0px_#00F3FF] rounded-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,243,255,0.02)_50%)] bg-[size:100%_4px] pointer-events-none" />
      
      <h2 className="font-heading text-xl font-black text-cyan-400 mb-4 text-center uppercase tracking-wider flex items-center justify-center gap-2">
        <Anchor className="text-cyan-400" size={18} /> SIRENAS DEL ABISMO 🧜‍♀️
      </h2>
      
      <div className="grid grid-cols-3 gap-2 mb-4 bg-black/60 p-2 border border-zinc-800 text-center font-mono text-xs">
        <div>
          <span className="text-zinc-500 block uppercase text-[9px]">Saldo</span>
          <span className="text-cyan-400 font-bold">{userCoins} C8L</span>
        </div>
        <div>
          <span className="text-zinc-500 block uppercase text-[9px]">Costo</span>
          <span className="text-white font-bold">{betAmount} C8L</span>
        </div>
        <div>
          <span className="text-zinc-500 block uppercase text-[9px]">Multi</span>
          <span className="text-cyan-300 font-bold">x{multiplier}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 bg-black/80 p-4 border-3 border-cyan-900 rounded-lg">
        {reels.map((reel, reelIdx) => (
          <div key={reelIdx} className="space-y-2">
            {reel.slice(1, 4).map((symbol, rowIdx) => (
              <motion.div
                key={`${reelIdx}-${rowIdx}`}
                className={`h-20 flex items-center justify-center text-4xl border-2 rounded-lg transition-all ${
                  rowIdx === 1 ? 'border-cyan-400 bg-cyan-950/15 shadow-inner' : 'border-zinc-850 bg-zinc-950/40'
                }`}
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
            <div className="bg-black/95 border-3 border-cyan-400 rounded-lg p-5 text-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              <div className="text-5xl mb-1">{lastWin.symbol}</div>
              <div className="text-2xl font-black text-cyan-400 animate-pulse">
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
        disabled={spinning || userCoins < betAmount}
        className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-heading font-black text-sm border-2 border-black shadow-[3px_3px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] cursor-pointer"
      >
        {spinning ? '🧜‍♀️ BUSCANDO PERLAS...' : '🎰 SUMERGIR PALANCA'}
      </button>
    </div>
  );
}
