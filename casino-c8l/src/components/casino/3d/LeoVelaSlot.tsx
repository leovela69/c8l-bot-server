'use client';
import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

const SYMBOLS = [
  { id: 'lion', emoji: '🦁', name: 'León Dorado', value: 1000, color: '#D4AF37' },
  { id: 'crown', emoji: '👑', name: 'Corona C8L', value: 500, color: '#8A2BE2' },
  { id: 'mic', emoji: '🎤', name: 'Micrófono', value: 250, color: '#FF69B4' },
  { id: 'diamond', emoji: '💎', name: 'Diamante', value: 150, color: '#00F3FF' },
  { id: 'lightning', emoji: '⚡', name: 'Rayo', value: 100, color: '#FFD700' },
  { id: 'music', emoji: '🎵', name: 'Nota Musical', value: 75, color: '#00FF00' },
  { id: 'seven', emoji: '7️⃣', name: '7 Dorado', value: 50, color: '#FFD700' },
  { id: 'bell', emoji: '🔔', name: 'Campana', value: 25, color: '#FFA500' },
];

const spinSound = new Howl({ src: ['/sounds/slot-spin.mp3'], volume: 0.5 });
const winSound = new Howl({ src: ['/sounds/win-big.mp3'], volume: 0.7 });
const loseSound = new Howl({ src: ['/sounds/lose.mp3'], volume: 0.4 });

export function LeoVelaSlot({ userCoins, setUserCoins, betAmount }) {
  const [reels, setReels] = useState([
    [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
    [SYMBOLS[2], SYMBOLS[3], SYMBOLS[4]],
    [SYMBOLS[4], SYMBOLS[5], SYMBOLS[6]],
  ]);
  const [spinning, setSpinning] = useState(false);
  const [winning, setWinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [jackpot, setJackpot] = useState(0);
  const [mascotMessage, setMascotMessage] = useState('');


  const spin = () => {
    if (spinning || userCoins < betAmount) return;
    setSpinning(true);
    setUserCoins(prev => prev - betAmount);
    spinSound.play();
    const newReels = reels.map(() =>
      Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
    );
    setTimeout(() => setReels([newReels[0], reels[1], reels[2]]), 400);
    setTimeout(() => setReels([newReels[0], newReels[1], reels[2]]), 800);
    setTimeout(() => {
      setReels(newReels);
      setSpinning(false);
      evaluateWin(newReels);
    }, 1200);
  };

  const evaluateWin = (newReels) => {
    const centerRow = newReels.map(reel => reel[1]);
    const win = checkWin(centerRow);
    if (win) {
      const amount = betAmount * win.value;
      setWinAmount(amount);
      setWinning(true);
      winSound.play();
      confetti({ particleCount: 150, spread: 80, colors: ['#D4AF37', '#8A2BE2'] });
      setUserCoins(prev => prev + amount);
      setMascotMessage('🦁 ¡LEO VELA TE BENDICE! 🎉');
      if (win.value >= 500) setJackpot(prev => prev + amount * 0.1);
    } else {
      loseSound.play();
      setMascotMessage('😢 ¡Uy, casi! ¡Sigue participando!');
    }
    setTimeout(() => setWinning(false), 3000);
  };

  const checkWin = (row) => {
    if (row[0].id === row[1].id && row[1].id === row[2].id) return row[0];
    if (row[0].id === row[2].id) return { ...row[0], value: Math.floor(row[0].value / 2) };
    return null;
  };


  return (
    <div className="relative bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-3xl font-black text-c8l-gold mb-4 text-center">🦁 LEO VELA SLOT</h2>
      <div className="text-center text-sm text-gray-400 mb-2">Jackpot: {jackpot.toLocaleString()} C8L</div>
      <div className="relative bg-black/80 rounded-xl p-4 mb-6 border border-c8l-gold/30 h-64">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          {reels.map((reel, ri) => (
            <Box key={ri} position={[-2 + ri * 2, 0, 0]}>
              {reel.map((symbol, si) => (
                <Text key={si} position={[0, 1 - si * 1, 0.5]} fontSize={0.8}
                  color={symbol.color} anchorX="center" anchorY="middle"
                  outlineWidth={0.02} outlineColor="#000000">
                  {symbol.emoji}
                </Text>
              ))}
            </Box>
          ))}
        </Canvas>
      </div>
      {mascotMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-c8l-gold px-4 py-2 rounded-full text-sm border border-c8l-gold z-20 animate-pulse">
          {mascotMessage}
        </div>
      )}

      <AnimatePresence>
        {winning && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="bg-gradient-to-r from-c8l-gold to-c8l-pink text-black px-8 py-4 rounded-lg shadow-2xl animate-bounce">
              <div className="text-3xl font-black">🎉 +{winAmount} C8L 🎉</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button onClick={spin} disabled={spinning}
          className="px-8 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg transition-all hover:scale-105 disabled:opacity-50">
          {spinning ? '🌀 GIRANDO...' : '🎰 GIRAR'}
        </button>
        <div className="bg-black/50 px-4 py-2 rounded-lg text-center border border-c8l-gold">
          <div className="text-xs text-gray-400">Saldo</div>
          <div className="text-lg font-bold text-c8l-gold">{userCoins.toLocaleString()} C8L</div>
        </div>
      </div>
    </div>
  );
}
