// components/games/slots/C8LQuantumSlot.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Zap, RefreshCw } from 'lucide-react';
import { casinoSounds } from '../../../lib/audio/casinoSounds';
import confetti from 'canvas-confetti';


const SYMBOLS = {
  '⚛️': { name: 'Qubit', payout: 150, color: '#00F3FF', desc: '¡Superposición cuántica!' },
  '💻': { name: 'Quantum Core', payout: 100, color: '#FF0055', desc: 'Sincronización de matriz' },
  '🌌': { name: 'Singularity', payout: 75, color: '#D4AF37', desc: 'Colapso gravitacional' },
  '⚡': { name: 'Laser Beam', payout: 50, color: '#FF69B4', desc: 'Entrelazamiento activo' },
  '💾': { name: 'Buffer Matrix', payout: 25, color: '#9B59B6', desc: 'Cache temporal llena' }
} as const;

type SymbolKey = keyof typeof SYMBOLS;
const SYMBOLS_LIST: SymbolKey[] = ['⚛️', '💻', '🌌', '⚡', '💾'];

import { useApp } from '../../../context/AppContext';
import { AnimatedNumber } from '../../ui/AnimatedNumber';

interface SlotProps {
  userCoins?: number;
  setUserCoins?: (coins: number | ((prev: number) => number)) => void;
  onWin?: (amount: number, item: string) => void;
}

export function C8LQuantumSlot({ onWin }: SlotProps) {
  const { c8lCoins, placeCasinoBet, awardCasinoWin } = useApp();
  const [reels, setReels] = useState<SymbolKey[][]>([
    ['⚛️', '💻', '🌌', '⚡', '💾'],
    ['💻', '⚛️', '💾', '⚡', '🌌'],
    ['🌌', '💾', '⚛️', '💻', '⚡']
  ]);
  const [spinning, setSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [lastWin, setLastWin] = useState<{ amount: number; symbol: SymbolKey } | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  
  const betAmount = 15;

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

    // Play spinning sound and micro haptic trigger
    casinoSounds.playSlotSpin(1.2);
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
      // Play reel-stop click sound procedurally for mechanical feel
      casinoSounds.playClick();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const centerRow = newReels.map(reel => reel[2]);
    
    // Evaluate central row matches
    if (centerRow[0] === centerRow[1] && centerRow[1] === centerRow[2]) {
      const sym = centerRow[0];
      let winAmount = SYMBOLS[sym].payout * multiplier;
      const isJackpot = sym === '⚛️';

      // Jackpot progressive bonus on Qubit symbol ⚛️
      if (isJackpot) {
        const currentJackpot = parseInt(localStorage.getItem("c8l_jackpot") || "124500", 10);
        const bonus = Math.floor(currentJackpot * 0.20); // 20% jackpot bonus
        winAmount += bonus;
        
        localStorage.setItem("c8l_jackpot", (currentJackpot - bonus).toString());
        window.dispatchEvent(new CustomEvent('c8l-jackpot-won', { detail: { amount: bonus } }));
      }

      await awardCasinoWin(winAmount);
      setLastWin({ amount: winAmount, symbol: sym });
      setShowAnimation(true);
      onWin?.(winAmount, SYMBOLS[sym].name);

      // Play win sound, trigger confetti and haptic vibration
      if (isJackpot) {
        casinoSounds.playJackpotAlert();
      } else {
        casinoSounds.playWin();
      }
      window.dispatchEvent(new Event('c8l-screen-shake'));
      
      confetti({
        particleCount: 150,
        spread: 80,
        colors: ['#00F3FF', '#FF0055', '#D4AF37']
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

      // Play win sound, trigger confetti and haptic vibration
      casinoSounds.playWin();
      window.dispatchEvent(new Event('c8l-screen-shake'));
      confetti({
        particleCount: 80,
        spread: 50,
        colors: ['#00F3FF', '#FF0055', '#D4AF37']
      });
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    
    setSpinning(false);
  };

  return (
    <motion.div
      animate={spinning ? {
        y: [0, -2, 2, -1, 1, 0],
        transition: { repeat: Infinity, duration: 0.15 }
      } : {}}
      className="border-[3px] border-black bg-[#0d0d0e]/95 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 shadow-[6px_6px_0px_#00F3FF] hover:shadow-[8px_8px_0px_#00F3FF] hover:border-black c8l-scanlines"
    >
      {/* Cabinet Status LED Indicator */}
      <div className="absolute top-3 right-3 flex gap-1.5 z-20">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00F3FF] animate-pulse shadow-[0_0_8px_#00F3FF]"></span>
        <span className="text-[9px] font-mono text-[#00F3FF] uppercase tracking-wider font-bold">CABINET B: SLOTS</span>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,243,255,0.03)_50%)] bg-[size:100%_4px] pointer-events-none" />
      
      <h2 className="font-heading text-xl font-black text-[#00F3FF] mb-4 text-center uppercase tracking-wider flex items-center justify-center gap-2 text-glow-neon">
        <Zap className="text-[#00F3FF] animate-pulse" size={18} /> C8L QUANTUM SLOT ⚛️
      </h2>
      
      <div className="grid grid-cols-3 gap-2 mb-4 bg-black/70 p-2.5 border-[3px] border-black text-center font-mono text-xs rounded-xl shadow-[4px_4px_0px_#00F3FF] relative z-10">
        <div>
          <span className="text-zinc-500 block uppercase text-[9px]">Saldo</span>
          <span className="text-[#00F3FF] font-bold text-glow-neon"><AnimatedNumber value={c8lCoins} /> C8L</span>
        </div>
        <div>
          <span className="text-zinc-500 block uppercase text-[9px]">Costo</span>
          <span className="text-white font-bold">{betAmount} C8L</span>
        </div>
        <div>
          <span className="text-zinc-500 block uppercase text-[9px]">Multi</span>
          <span className="text-[#D4AF37] font-bold text-glow-gold">x{multiplier}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 bg-black/80 p-4 border-[3px] border-black shadow-[4px_4px_0px_#8A2BE2] rounded-xl relative z-10">
        {reels.map((reel, reelIdx) => (
          <div key={reelIdx} className="space-y-2">
            {reel.slice(1, 4).map((symbol, rowIdx) => {
              const isCenter = rowIdx === 1;
              const symColor = SYMBOLS[symbol]?.color || '#ffffff';
              return (
                 <motion.div
                  key={`${reelIdx}-${rowIdx}`}
                  className={`h-20 flex items-center justify-center text-4xl border-[3px] rounded-xl transition-all relative ${
                    isCenter 
                      ? 'bg-black/90 font-bold border-black shadow-[inset_0_0_15px_rgba(0,243,255,0.15)] scale-[1.03] z-10' 
                      : 'border-zinc-900 bg-zinc-950/20 opacity-30 scale-[0.97]'
                  }`}
                  style={{
                    boxShadow: isCenter ? `0 0 15px ${symColor}40, inset 0 0 10px ${symColor}20` : undefined,
                    filter: spinning ? 'blur(3px)' : 'none'
                  }}
                  animate={spinning ? { rotateY: [0, 360], scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.15, delay: reelIdx * 0.08 }}
                >
                  {isCenter && (
                    <span className="absolute left-1 text-xs text-[var(--color-gold)] font-mono animate-pulse">[</span>
                  )}
                  <span style={{ color: isCenter ? symColor : undefined, textShadow: isCenter ? `0 0 8px ${symColor}` : undefined }}>
                    {symbol}
                  </span>
                  {isCenter && (
                    <span className="absolute right-1 text-xs text-[var(--color-gold)] font-mono animate-pulse">]</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
      
      <AnimatePresence>
        {showAnimation && lastWin && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-black/40 backdrop-blur-xs"
          >
            <div className="bg-black border-[3px] border-[#00F3FF] rounded-xl p-6 text-center shadow-[6px_6px_0px_#FF0055]">
              <div className="text-6xl mb-2 animate-bounce">{lastWin.symbol}</div>
              <div className="text-2xl font-black text-[#00F3FF] animate-pulse font-heading tracking-widest text-glow-neon">
                +{lastWin.amount} C8L COINS
              </div>
              <div className="text-[10px] text-zinc-400 mt-2 uppercase font-mono tracking-wider">
                {SYMBOLS[lastWin.symbol]?.desc}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        onClick={spin}
        disabled={spinning || c8lCoins < betAmount}
        className="w-full mt-5 py-4 bg-gradient-to-r from-[#FF0055] to-[#8A2BE2] text-white font-heading font-black text-sm uppercase tracking-widest rounded border-[3px] border-black shadow-[4px_4px_0px_#00F3FF] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#00F3FF] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {spinning ? '⚛️ PROCESANDO MUESTRA...' : '🎰 SPIN QUANTUM MATRIX'}
      </button>
    </motion.div>
  );
}
