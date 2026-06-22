'use client';
import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Text, Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

const spinSound = new Howl({ src: ['/sounds/slot-spin.mp3'], volume: 0.5 });
const winSound = new Howl({ src: ['/sounds/win-big.mp3'], volume: 0.7 });

const SYMBOLS = [
  { id: 'lion', emoji: '🦁', value: 100, color: '#D4AF37' },
  { id: 'crown', emoji: '👑', value: 50, color: '#8A2BE2' },
  { id: 'mic', emoji: '🎤', value: 25, color: '#FF69B4' },
  { id: 'diamond', emoji: '💎', value: 15, color: '#00F3FF' },
  { id: 'lightning', emoji: '⚡', value: 10, color: '#FFD700' },
  { id: 'music', emoji: '🎵', value: 5, color: '#00FF00' },
];

export function Slot3DC8L({ userCoins, setUserCoins, currency = 'coins' }) {
  const [reels, setReels] = useState([
    [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
    [SYMBOLS[2], SYMBOLS[3], SYMBOLS[4]],
    [SYMBOLS[4], SYMBOLS[5], SYMBOLS[0]],
  ]);
  const [spinning, setSpinning] = useState(false);
  const [winning, setWinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [jackpot, setJackpot] = useState(0);
  const [betAmount, setBetAmount] = useState(10);


  const spin = () => {
    if (spinning || userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    setSpinning(true); spinSound.play();
    const newReels = reels.map(() => Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
    setTimeout(() => setReels([newReels[0], reels[1], reels[2]]), 400);
    setTimeout(() => setReels([newReels[0], newReels[1], reels[2]]), 800);
    setTimeout(() => { setReels(newReels); setSpinning(false); evaluateWin(newReels); }, 1200);
  };

  const evaluateWin = (newReels) => {
    const row = newReels.map(r => r[1]);
    if (row[0].id === row[1].id && row[1].id === row[2].id) {
      const amount = betAmount * row[0].value;
      setWinAmount(amount); setWinning(true); winSound.play();
      confetti({ particleCount: 150, spread: 80, colors: ['#D4AF37', '#8A2BE2'] });
      setUserCoins(prev => prev + amount);
      setJackpot(prev => prev + amount * 0.05);
    } else if (row[0].id === row[2].id) {
      const amount = betAmount * Math.floor(row[0].value / 2);
      setWinAmount(amount); setWinning(true); winSound.play();
      setUserCoins(prev => prev + amount);
    }
    setTimeout(() => setWinning(false), 3000);
  };

  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-2 text-center">🎰 TRAGAMONEDAS 3D</h2>
      <div className="text-center text-sm text-gray-400 mb-4">Jackpot: <span className="text-c8l-gold font-bold">{jackpot.toLocaleString()} C8L</span></div>
      <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30 h-48 mb-4">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} /><pointLight position={[10, 10, 10]} />
          {reels.map((reel, ri) => (<Box key={ri} position={[-2+ri*2, 0, 0]}>{reel.map((sym, si) => (<Text key={si} position={[0, 1-si*1, 0.5]} fontSize={0.8} color={sym.color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000000">{sym.emoji}</Text>))}</Box>))}
        </Canvas>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {[10,25,50,100,250].map(a => (<button key={a} onClick={()=>setBetAmount(a)} className={`px-4 py-2 rounded-lg font-bold transition ${betAmount===a?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{a} {currency==='coins'?'🪙':'💎'}</button>))}
      </div>
      <button onClick={spin} disabled={spinning} className="w-full py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 disabled:opacity-50 transition">{spinning?'🌀 GIRANDO...':'🎰 GIRAR'}</button>
      <AnimatePresence>{winning && (<motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} className="mt-4 p-3 bg-c8l-gold/20 border border-c8l-gold rounded-lg text-center"><div className="text-2xl font-bold text-c8l-gold">🎉 +{winAmount} C8L 🎉</div></motion.div>)}</AnimatePresence>
    </div>
  );
}
