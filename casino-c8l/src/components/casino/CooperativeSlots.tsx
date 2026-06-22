'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

const spinSound = new Howl({ src: ['/sounds/slot-spin.mp3'], volume: 0.5 });
const winSound = new Howl({ src: ['/sounds/win-big.mp3'], volume: 0.7 });
const SYMBOLS = ['🦁', '👑', '🎤', '💎', '⚡', '🎵'];

export function CooperativeSlots({ userCoins, setUserCoins, roomId }) {
  const [reels, setReels] = useState([[SYMBOLS[0],SYMBOLS[1],SYMBOLS[2]],[SYMBOLS[2],SYMBOLS[3],SYMBOLS[4]],[SYMBOLS[4],SYMBOLS[5],SYMBOLS[0]]]);
  const [spinning, setSpinning] = useState(false);
  const [winning, setWinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [jackpot, setJackpot] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [contributors, setContributors] = useState([]);

  const spin = () => {
    if (spinning || userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    setSpinning(true); spinSound.play();
    setJackpot(prev => prev + betAmount * 0.1);
    const newReels = reels.map(() => Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
    setTimeout(() => setReels([newReels[0], reels[1], reels[2]]), 400);
    setTimeout(() => setReels([newReels[0], newReels[1], reels[2]]), 800);
    setTimeout(() => { setReels(newReels); setSpinning(false); evaluateWin(newReels); }, 1200);
  };

  const evaluateWin = (newReels) => {
    const row = newReels.map(r => r[1]);
    if (row[0] === row[1] && row[1] === row[2]) {
      const amount = betAmount * 10;
      setWinAmount(amount); setWinning(true); winSound.play();
      confetti({ particleCount: 200, spread: 100, colors: ['#D4AF37', '#8A2BE2'] });
      setUserCoins(prev => prev + amount);
    } else if (row[0] === row[2]) {
      const amount = betAmount * 5;
      setWinAmount(amount); setWinning(true); winSound.play();
      setUserCoins(prev => prev + amount);
    }
    setTimeout(() => setWinning(false), 3000);
  };


  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-2 text-center">🎰 Slots Colaborativos</h2>
      <div className="text-center text-sm text-gray-400 mb-4">Bote común: <span className="text-c8l-gold font-bold">{jackpot.toLocaleString()} C8L</span></div>
      <div className="grid grid-cols-3 gap-2 bg-black/50 p-4 rounded-lg border border-c8l-gold/30">
        {reels.map((reel, ri) => (
          <div key={ri} className="space-y-2">
            {reel.map((symbol, si) => (
              <div key={si} className={`h-20 bg-black/50 rounded-lg flex items-center justify-center text-4xl border ${si === 1 ? 'border-c8l-gold' : 'border-gray-700'}`}>{symbol}</div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button onClick={spin} disabled={spinning} className="px-6 py-2 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-lg font-bold text-white hover:scale-105 disabled:opacity-50 transition">
            {spinning ? '🌀 GIRANDO...' : '🎰 GIRAR'}
          </button>
          <div className="flex gap-1">
            {[10,25,50,100].map(a => (<button key={a} onClick={() => setBetAmount(a)} className={`px-2 py-1 rounded text-xs font-bold ${betAmount === a ? 'bg-c8l-gold text-black' : 'bg-gray-800 text-gray-400'}`}>{a}</button>))}
          </div>
        </div>
        <div className="bg-black/50 px-4 py-2 rounded-lg border border-c8l-gold text-center">
          <div className="text-xs text-gray-400">Saldo</div>
          <div className="text-lg font-bold text-c8l-gold">{userCoins.toLocaleString()} C8L</div>
        </div>
      </div>
      <AnimatePresence>
        {winning && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed inset-0 flex items-center justify-center z-30 pointer-events-none"><div className="bg-gradient-to-r from-c8l-gold to-c8l-pink text-black px-8 py-4 rounded-lg shadow-2xl animate-bounce"><div className="text-3xl font-black">🎉 +{winAmount} C8L 🎉</div></div></motion.div>)}
      </AnimatePresence>
    </div>
  );
}
