'use client';
import { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Cylinder, Sphere } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

const NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const COLORS = {
  red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
  black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
  green: [0]
};

const spinSound = new Howl({ src: ['/sounds/roulette-spin.mp3'], volume: 0.5 });
const winSound = new Howl({ src: ['/sounds/win-big.mp3'], volume: 0.7 });
const loseSound = new Howl({ src: ['/sounds/lose.mp3'], volume: 0.4 });

export function QuantumRoulette({ userCoins, setUserCoins, betAmount }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [winAmount, setWinAmount] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const [betType, setBetType] = useState('number');
  const [selectedNumber, setSelectedNumber] = useState(0);
  const [mascotMessage, setMascotMessage] = useState('');


  const spin = () => {
    if (spinning || userCoins < betAmount) return;
    setSpinning(true);
    setUserCoins(prev => prev - betAmount);
    spinSound.play();
    const winningNumber = Math.floor(Math.random() * 37);
    setTimeout(() => {
      setResult(winningNumber);
      setSpinning(false);
      evaluateWin(winningNumber);
    }, 2000);
  };

  const evaluateWin = (winningNumber) => {
    let won = false;
    let amount = 0;
    if (betType === 'number' && winningNumber === selectedNumber) {
      won = true; amount = betAmount * 36;
    } else if (betType === 'red' && COLORS.red.includes(winningNumber)) {
      won = true; amount = betAmount * 2;
    } else if (betType === 'black' && COLORS.black.includes(winningNumber)) {
      won = true; amount = betAmount * 2;
    } else if (betType === 'even' && winningNumber % 2 === 0 && winningNumber !== 0) {
      won = true; amount = betAmount * 2;
    } else if (betType === 'odd' && winningNumber % 2 === 1) {
      won = true; amount = betAmount * 2;
    }
    if (won) {
      setIsWin(true); setWinAmount(amount);
      winSound.play();
      confetti({ particleCount: 150, spread: 80, colors: ['#D4AF37', '#8A2BE2'] });
      setUserCoins(prev => prev + amount);
      setMascotMessage('🎉 ¡GANASTE! 🎉');
    } else {
      loseSound.play();
      setMascotMessage('😢 ¡CASI! SIGUE PARTICIPANDO');
    }
    setTimeout(() => { setIsWin(false); setMascotMessage(''); }, 3000);
  };

  const getColor = (num) => {
    if (num === 0) return '#00FF00';
    if (COLORS.red.includes(num)) return '#FF0055';
    return '#111111';
  };


  return (
    <div className="relative bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-3xl font-black text-c8l-gold mb-4 text-center">🎡 RULETA QUANTUM</h2>
      <div className="relative bg-black/80 rounded-xl p-4 mb-6 border border-c8l-gold/30 h-64">
        <Canvas camera={{ position: [0, 0, 8] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls enableZoom={false} enablePan={false} />
          <Cylinder args={[3, 3, 0.5, 37]} rotation={[Math.PI / 2, 0, 0]}>
            {NUMBERS.map((num, i) => {
              const angle = (i / NUMBERS.length) * Math.PI * 2;
              const x = 2.8 * Math.cos(angle);
              const z = 2.8 * Math.sin(angle);
              return (
                <Text key={num} position={[x, 0.3, z]} fontSize={0.3}
                  color={getColor(num)} anchorX="center" anchorY="middle"
                  rotation={[0, -angle, 0]}>
                  {num}
                </Text>
              );
            })}
          </Cylinder>
          {result !== null && (
            <Text position={[0, 0.8, 0]} fontSize={0.8} color="#D4AF37"
              anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000000">
              {result}
            </Text>
          )}
        </Canvas>
      </div>

      {mascotMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-c8l-gold px-4 py-2 rounded-full text-sm border border-c8l-gold z-20 animate-pulse">
          {mascotMessage}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2 flex gap-2 flex-wrap">
          {['number', 'red', 'black', 'even', 'odd'].map(type => (
            <button key={type} onClick={() => setBetType(type)}
              className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                betType === type ? 'bg-c8l-gold text-black' : 'bg-gray-800 text-gray-400'
              }`}>
              {type.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1 col-span-2">
          {NUMBERS.map(num => (
            <button key={num} onClick={() => setSelectedNumber(num)}
              className={`px-2 py-1 rounded text-xs font-bold transition ${
                selectedNumber === num
                  ? 'bg-c8l-gold text-black border-2 border-white'
                  : `bg-${num === 0 ? 'green-600' : COLORS.red.includes(num) ? 'red-700' : 'gray-700'} text-white`
              }`}>
              {num}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isWin && (
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
          {spinning ? '🌀 GIRANDO...' : '🎡 GIRAR'}
        </button>
        <div className="bg-black/50 px-4 py-2 rounded-lg text-center border border-c8l-gold">
          <div className="text-xs text-gray-400">Saldo</div>
          <div className="text-lg font-bold text-c8l-gold">{userCoins.toLocaleString()} C8L</div>
        </div>
      </div>
    </div>
  );
}
