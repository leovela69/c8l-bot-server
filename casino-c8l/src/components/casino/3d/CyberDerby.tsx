'use client';
import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Text } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

const HORSES = [
  { id: 1, name: 'Leo Vela Express', emoji: '🦁', color: '#D4AF37', odds: 2.5 },
  { id: 2, name: 'Corazones Locos', emoji: '❤️', color: '#FF69B4', odds: 3.2 },
  { id: 3, name: 'Quantum Cyber', emoji: '⚡', color: '#00F3FF', odds: 4.1 },
  { id: 4, name: 'Nardil Nippe', emoji: '🎵', color: '#8A2BE2', odds: 5.8 },
  { id: 5, name: 'Vela Gold', emoji: '👑', color: '#FFD700', odds: 6.5 },
];

const raceSound = new Howl({ src: ['/sounds/horse-race.mp3'], volume: 0.5 });
const winSound = new Howl({ src: ['/sounds/win-big.mp3'], volume: 0.7 });
const loseSound = new Howl({ src: ['/sounds/lose.mp3'], volume: 0.4 });

export function CyberDerby({ userCoins, setUserCoins, betAmount }) {
  const [selectedHorse, setSelectedHorse] = useState(HORSES[0]);
  const [raceActive, setRaceActive] = useState(false);
  const [positions, setPositions] = useState(HORSES.map(() => -5));
  const [winner, setWinner] = useState(null);
  const [winAmount, setWinAmount] = useState(0);
  const [mascotMessage, setMascotMessage] = useState('');
  const [jackpot, setJackpot] = useState(0);


  const startRace = () => {
    if (raceActive || userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    setRaceActive(true);
    setPositions(HORSES.map(() => -5));
    setWinner(null); setWinAmount(0);
    setMascotMessage('🏇 ¡CARRERA COMENZADA!');
    raceSound.play();

    const raceInterval = setInterval(() => {
      setPositions(prev => {
        const newPos = prev.map((pos) => {
          const speed = 0.5 + Math.random() * 0.3;
          return Math.min(pos + speed, 5);
        });
        const winnerIdx = newPos.findIndex(pos => pos >= 5);
        if (winnerIdx !== -1) {
          clearInterval(raceInterval);
          setRaceActive(false);
          const winningHorse = HORSES[winnerIdx];
          setWinner(winningHorse);
          const won = winningHorse.id === selectedHorse.id;
          if (won) {
            const amount = Math.round(betAmount * winningHorse.odds);
            setWinAmount(amount);
            winSound.play();
            confetti({ particleCount: 200, spread: 100, colors: ['#D4AF37', '#8A2BE2'] });
            setUserCoins(prev => prev + amount);
            setMascotMessage(`🎉 ¡${winningHorse.name} GANÓ! +${amount} C8L 🎉`);
            setJackpot(prev => prev + amount * 0.05);
          } else {
            loseSound.play();
            setMascotMessage(`😢 Ganó ${winningHorse.name}. ¡Sigue participando!`);
          }
        }
        return newPos;
      });
    }, 100);
  };


  return (
    <div className="relative bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-3xl font-black text-c8l-gold mb-4 text-center">🏇 DERBY CIBERNÉTICO</h2>
      <div className="text-center text-sm text-gray-400 mb-2">Jackpot: {jackpot.toLocaleString()} C8L</div>
      <div className="relative bg-black/80 rounded-xl p-4 mb-6 border border-c8l-gold/30 h-64">
        <Canvas camera={{ position: [0, 5, 10], rotation: [-0.3, 0, 0] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls enableZoom={false} enablePan={false} />
          {HORSES.map((horse, idx) => (
            <Box key={horse.id} position={[-2 + idx * 1.2, 0, positions[idx]]} args={[0.6, 0.6, 0.6]}>
              <meshStandardMaterial color={horse.color} />
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle">
                {horse.emoji}
              </Text>
            </Box>
          ))}
        </Canvas>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {HORSES.map(horse => (
          <button key={horse.id} onClick={() => setSelectedHorse(horse)}
            className={`p-2 rounded-lg text-center font-bold transition ${
              selectedHorse.id === horse.id
                ? 'bg-c8l-gold text-black border-2 border-white'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}>
            <div className="text-2xl">{horse.emoji}</div>
            <div className="text-xs">{horse.name}</div>
            <div className="text-[10px]">x{horse.odds}</div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {winner && winAmount > 0 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="bg-gradient-to-r from-c8l-gold to-c8l-pink text-black px-8 py-4 rounded-lg shadow-2xl animate-bounce">
              <div className="text-3xl font-black">🏆 +{winAmount} C8L 🏆</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={startRace} disabled={raceActive}
        className="w-full py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg transition-all hover:scale-105 disabled:opacity-50">
        {raceActive ? '🏇 CORRIENDO...' : '🏇 APOSTAR E INICIAR CARRERA'}
      </button>
      {mascotMessage && (
        <div className="mt-4 p-2 bg-c8l-gold/20 border border-c8l-gold rounded-lg text-center text-c8l-gold animate-pulse">
          {mascotMessage}
        </div>
      )}
    </div>
  );
}
