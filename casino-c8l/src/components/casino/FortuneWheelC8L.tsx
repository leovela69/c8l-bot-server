'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

const spinSound = new Howl({ src: ['/sounds/wheel-spin.mp3'], volume: 0.5 });
const winSound = new Howl({ src: ['/sounds/win.mp3'], volume: 0.6 });

const SEGMENTS = [
  { label: 'x2', multiplier: 2, color: '#D4AF37' },
  { label: 'x3', multiplier: 3, color: '#8A2BE2' },
  { label: 'x5', multiplier: 5, color: '#FF69B4' },
  { label: 'x10', multiplier: 10, color: '#00F3FF' },
  { label: 'x25', multiplier: 25, color: '#FFD700' },
  { label: 'x50', multiplier: 50, color: '#FF0055' },
  { label: 'x100', multiplier: 100, color: '#00FF00' },
  { label: 'JACKPOT', multiplier: 500, color: '#D4AF37' },
];

export function FortuneWheelC8L({ userCoins, setUserCoins, currency = 'coins' }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [betAmount, setBetAmount] = useState(10);


  const spin = () => {
    if (spinning || userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    setSpinning(true); spinSound.play();
    const randomIndex = Math.floor(Math.random() * SEGMENTS.length);
    const segment = SEGMENTS[randomIndex];
    const angle = (360 * 8) + (randomIndex * (360 / SEGMENTS.length));
    setRotation(angle);
    setTimeout(() => {
      setSpinning(false);
      const winAmount = betAmount * segment.multiplier;
      setUserCoins(prev => prev + winAmount);
      setResult({ type: 'win', amount: winAmount, multiplier: segment.multiplier });
      winSound.play();
      confetti({ particleCount: 100, spread: 60, colors: ['#D4AF37'] });
    }, 3000);
  };

  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-4 text-center">🎡 RULETA DE LA FORTUNA</h2>
      <div className="relative w-64 h-64 mx-auto mb-6">
        <motion.div animate={{rotate: rotation}} transition={{duration: 3, ease: 'easeOut'}} className="w-full h-full rounded-full border-4 border-c8l-gold overflow-hidden bg-gradient-conic">
          <div className="absolute inset-0 flex items-center justify-center"><div className="text-4xl font-black text-c8l-gold">🎡</div></div>
        </motion.div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-8 bg-red-600 rounded-b-full" />
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {[10,25,50,100,250].map(a => (<button key={a} onClick={()=>setBetAmount(a)} className={`px-4 py-2 rounded-lg font-bold transition ${betAmount===a?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{a} {currency==='coins'?'🪙':'💎'}</button>))}
      </div>
      <button onClick={spin} disabled={spinning} className="w-full py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 disabled:opacity-50 transition">{spinning?'🌀 GIRANDO...':'🎡 GIRAR'}</button>
      <AnimatePresence>
        {result && (<motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-4 p-3 rounded-lg text-center font-bold">
          <div className="bg-green-600/20 text-green-400 border border-green-600 p-2 rounded">🎉 ¡x{result.multiplier}! Ganaste {result.amount} {currency==='coins'?'🪙':'💎'}!</div>
        </motion.div>)}
      </AnimatePresence>
    </div>
  );
}
