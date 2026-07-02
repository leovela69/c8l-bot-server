// components/casino/OlympusSlots.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SYMBOLS = {
  '⚡': { name: 'ZEUS', payout: 100, color: '#00F3FF', effect: 'lightning', desc: '¡Rayos multiplicadores!' },
  '🛡️': { name: 'ARES', payout: 75, color: '#FF0055', effect: 'battle', desc: 'Modo batalla activado' },
  '💕': { name: 'AFRODITA', payout: 50, color: '#FF69B4', effect: 'heart', desc: 'Corazones que expanden' },
  '👟': { name: 'HERMES', payout: 40, color: '#D4AF37', effect: 'speed', desc: 'Giros más rápidos' },
  '🍇': { name: 'DIONISIO', payout: 30, color: '#9B59B6', effect: 'party', desc: '¡Modo fiesta!' }
} as const;

type SymbolKey = keyof typeof SYMBOLS;
const SYMBOLS_LIST: SymbolKey[] = ['⚡', '🛡️', '💕', '👟', '🍇'];

interface OlympusSlotsProps {
  userCoins: number;
  setUserCoins: React.Dispatch<React.SetStateAction<number>>;
  onWin?: (amount: number, god: string) => void;
}

export function OlympusSlots({ userCoins, setUserCoins, onWin }: OlympusSlotsProps) {
  const [reels, setReels] = useState<SymbolKey[][]>([
    ['⚡', '🛡️', '💕', '👟', '🍇'],
    ['🛡️', '⚡', '🍇', '💕', '👟'],
    ['💕', '👟', '⚡', '🛡️', '🍇']
  ]);
  const [spinning, setSpinning] = useState(false);
  const [activeGod, setActiveGod] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [freeSpins, setFreeSpins] = useState(0);
  const [lastWin, setLastWin] = useState<{ amount: number; symbol: SymbolKey } | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  
  const betAmount = 10;
  
  const spinReel = async (reelIndex: number, newSymbols: SymbolKey[]) => {
    return new Promise<void>(resolve => {
      let spins = 0;
      const maxSpins = 15;
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
      }, 50);
    });
  };
  
  const spin = async () => {
    if (spinning || (freeSpins === 0 && userCoins < betAmount)) {
      if (freeSpins === 0 && userCoins < betAmount) alert('❌ Coins insuficientes');
      return;
    }
    
    if (freeSpins === 0) {
      setUserCoins(prev => prev - betAmount);
    } else {
      setFreeSpins(prev => prev - 1);
    }
    
    setSpinning(true);
    setLastWin(null);
    setShowAnimation(false);
    
    // Generar nuevos símbolos
    const newReels: SymbolKey[][] = reels.map(() => 
      SYMBOLS_LIST.map(() => SYMBOLS_LIST[Math.floor(Math.random() * SYMBOLS_LIST.length)])
    );
    
    // Animar cada reel en cascada
    for (let i = 0; i < newReels.length; i++) {
      await spinReel(i, newReels[i]);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    // Evaluar línea central (índice 2)
    const centerRow = newReels.map(reel => reel[2]);
    const win = evaluateWin(centerRow);
    
    if (win) {
      const winAmount = win.payout * multiplier;
      setUserCoins(prev => prev + winAmount);
      setLastWin({ amount: winAmount, symbol: win.symbol });
      setShowAnimation(true);
      onWin?.(winAmount, SYMBOLS[win.symbol].name);
      
      // Activar modo dios
      if (win.symbol === '⚡') {
        setMultiplier(prev => prev * 2);
        setActiveGod('ZEUS');
        setTimeout(() => {
          setMultiplier(prev => prev / 2);
          setActiveGod(null);
        }, 5000);
      } else if (win.symbol === '🍇' && freeSpins === 0) {
        setFreeSpins(3);
        setActiveGod('DIONISIO');
        setTimeout(() => setActiveGod(null), 8000);
      } else if (win.symbol === '🛡️') {
        setActiveGod('ARES');
        setTimeout(() => setActiveGod(null), 4000);
      }
    }
    
    setSpinning(false);
  };
  
  const evaluateWin = (row: SymbolKey[]) => {
    if (row[0] === row[1] && row[1] === row[2]) {
      return { symbol: row[0], payout: SYMBOLS[row[0]].payout };
    }
    if (row[0] === row[2]) {
      return { symbol: row[0], payout: Math.floor(SYMBOLS[row[0]].payout / 2) };
    }
    return null;
  };
  
  return (
    <div className="border-4 border-black bg-gradient-to-b from-[#1a1a2e] to-[#0a0a15] p-6 shadow-[8px_8px_0px_#D4AF37] relative overflow-hidden">
      
      {/* Efecto de dios activo */}
      <AnimatePresence>
        {activeGod && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
          >
            <div className="bg-black/90 border-b-4 border-[#D4AF37] py-3 text-center">
              <span className={`text-2xl font-black ${
                activeGod === 'ZEUS' ? 'text-[#00F3FF]' : 
                activeGod === 'ARES' ? 'text-[#FF0055]' : 
                'text-purple-400'
              }`}>
                {activeGod === 'ZEUS' && '⚡ ¡MODO ZEUS ACTIVADO! x2 MULTIPLICADOR ⚡'}
                {activeGod === 'ARES' && '🛡️ ¡MODO ARES! BATALLA INFINITA 🛡️'}
                {activeGod === 'DIONISIO' && '🍇 ¡MODO DIONISIO! +3 GIROS GRATIS 🍇'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <h2 className="font-heading text-2xl font-black text-[#D4AF37] mb-4 text-center flex items-center justify-center gap-3">
        <span>🏛️</span> OLIMPO C8L - LA IRA DE LOS DIOSES <span>⚡</span>
      </h2>
      
      {/* Info panel */}
      <div className="grid grid-cols-4 gap-3 mb-6 bg-black p-3 border-2 border-[#D4AF37]">
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase">Coins</div>
          <div className="text-xl font-black text-[#D4AF37]">{userCoins}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase">Apuesta</div>
          <div className="text-xl font-black text-white">{betAmount}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase">Multiplicador</div>
          <div className={`text-xl font-black ${multiplier > 1 ? 'text-[#00F3FF] animate-pulse' : 'text-white'}`}>
            x{multiplier}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase">Giros Gratis</div>
          <div className={`text-xl font-black ${freeSpins > 0 ? 'text-[#FF69B4]' : 'text-white'}`}>
            {freeSpins}
          </div>
        </div>
      </div>
      
      {/* Rodillos */}
      <div className="grid grid-cols-3 gap-3 bg-black p-4 border-4 border-[#D4AF37] rounded-lg">
        {reels.map((reel, reelIdx) => (
          <div key={reelIdx} className="space-y-2">
            {reel.map((symbol, rowIdx) => (
              <motion.div
                key={`${reelIdx}-${rowIdx}`}
                className={`h-24 flex items-center justify-center text-5xl border-2 rounded-lg transition-all ${
                  rowIdx === 2 ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-lg' : 'border-gray-700'
                }`}
                animate={spinning ? { rotateY: [0, 360], scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.2, delay: reelIdx * 0.1 }}
                style={{ backgroundColor: rowIdx === 2 ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }}
              >
                {symbol}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Animación de victoria */}
      <AnimatePresence>
        {showAnimation && lastWin && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="bg-black/90 border-4 border-[#D4AF37] rounded-lg p-6 text-center">
              <div className="text-6xl mb-2">{lastWin.symbol}</div>
              <div className="text-3xl font-black text-[#D4AF37] animate-pulse">
                +{lastWin.amount} COINS
              </div>
              <div className="text-sm text-gray-400">
                {SYMBOLS[lastWin.symbol]?.desc}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Leyenda de pagos */}
      <div className="grid grid-cols-5 gap-2 mt-6 text-center text-xs">
        {Object.entries(SYMBOLS).map(([symbol, data]) => (
          <div key={symbol} className="bg-black p-2 border border-gray-700 rounded">
            <div className="text-2xl">{symbol}</div>
            <div className="text-[#D4AF37] font-bold text-[10px]">{data.name}</div>
            <div className="text-gray-500 text-[9px]">{data.payout}x</div>
          </div>
        ))}
      </div>
      
      <button
        onClick={spin}
        disabled={spinning || (freeSpins === 0 && userCoins < betAmount)}
        className="w-full mt-6 py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-heading font-black text-xl border-2 border-black shadow-[4px_4px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
      >
        {spinning ? (
          '⚡ GIRANDO... ⚡'
        ) : freeSpins > 0 ? (
          `🎲 GIRO GRATIS (${freeSpins} restantes) 🎲`
        ) : (
          '🎰 TIRAR PALANCA (10 COINS) 🎰'
        )}
      </button>
      
      {/* Jackpot progresivo */}
      <div className="mt-3 text-center text-xs text-gray-400">
        💎 JACKPOT ACUMULADO: 69,420 COINS 💎
      </div>
    </div>
  );
}