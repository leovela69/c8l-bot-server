'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

const BINGO_NUMBERS = Array.from({ length: 75 }, (_, i) => i + 1);
const C8L_SYMBOLS = ['🦁', '👑', '🎤', '💎', '⚡', '🎵'];

const winSound = new Howl({ src: ['/sounds/win-big.mp3'], volume: 0.7 });
const bingoSound = new Howl({ src: ['/sounds/bingo.mp3'], volume: 0.8 });

export function C8LBingo({ userCoins, setUserCoins, betAmount }) {
  const [card, setCard] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [markedNumbers, setMarkedNumbers] = useState([]);
  const [gameActive, setGameActive] = useState(false);
  const [winner, setWinner] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [mascotMessage, setMascotMessage] = useState('');
  const [jackpot, setJackpot] = useState(0);


  const generateCard = () => {
    const shuffled = [...BINGO_NUMBERS].sort(() => Math.random() - 0.5);
    const cardNumbers = shuffled.slice(0, 25);
    const cardWithSymbols = cardNumbers.map((num, idx) => ({
      number: num, marked: false,
      symbol: C8L_SYMBOLS[idx % C8L_SYMBOLS.length],
      color: ['#D4AF37', '#8A2BE2', '#FF69B4', '#00F3FF', '#FFD700'][Math.floor(Math.random() * 5)]
    }));
    setCard(cardWithSymbols);
    setMarkedNumbers([]); setCalledNumbers([]);
    setWinner(false); setWinAmount(0);
  };

  const startGame = () => {
    if (userCoins < betAmount) {
      setMascotMessage('😅 ¡Leo dice que necesitas más coins!');
      return;
    }
    setUserCoins(prev => prev - betAmount);
    generateCard();
    setGameActive(true); setCalledNumbers([]); setMarkedNumbers([]);
    setMascotMessage('🎲 ¡BINGO C8L COMENZÓ!');
    callNumber();
  };

  const callNumber = () => {
    if (!gameActive || winner) return;
    const available = BINGO_NUMBERS.filter(n => !calledNumbers.includes(n));
    if (available.length === 0) {
      setGameActive(false);
      setMascotMessage('😢 ¡No hay más números!');
      return;
    }
    const number = available[Math.floor(Math.random() * available.length)];
    setCalledNumbers(prev => [...prev, number]);
    if (card.some(c => c.number === number)) {
      setMarkedNumbers(prev => [...prev, number]);
      checkBingo();
    }
    setTimeout(callNumber, 1000 + Math.random() * 2000);
  };


  const checkBingo = () => {
    const rows = [
      [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24]
    ];
    for (const row of rows) {
      if (row.every(idx => markedNumbers.includes(card[idx]?.number))) {
        const win = betAmount * 2;
        setWinAmount(win); setWinner(true);
        winSound.play();
        confetti({ particleCount: 100, spread: 60, colors: ['#D4AF37'] });
        setUserCoins(prev => prev + win);
        setMascotMessage('🎉 ¡LÍNEA! +' + win + ' C8L 🎉');
        setGameActive(false);
        setJackpot(prev => prev + win * 0.05);
        return;
      }
    }
    if (markedNumbers.length === 25) {
      const win = betAmount * 10;
      setWinAmount(win); setWinner(true);
      bingoSound.play();
      confetti({ particleCount: 300, spread: 120, colors: ['#D4AF37', '#8A2BE2', '#FF69B4'] });
      setUserCoins(prev => prev + win);
      setMascotMessage('🎉🎉 ¡BINGO C8L! +' + win + ' C8L 🎉🎉');
      setGameActive(false);
      setJackpot(prev => prev + win * 0.1);
    }
  };


  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-3xl font-black text-c8l-gold mb-4 text-center">🎲 BINGO C8L</h2>
      <div className="text-center text-sm text-gray-400 mb-2">Jackpot: {jackpot.toLocaleString()} C8L</div>
      <div className="grid grid-cols-5 gap-1 bg-black/50 p-2 rounded-lg border border-c8l-gold/30">
        {card.map((cell, idx) => (
          <div key={idx}
            className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold transition ${
              markedNumbers.includes(cell?.number)
                ? 'bg-c8l-gold text-black border-2 border-white'
                : 'bg-gray-800 text-white border border-gray-700'
            }`}>
            <div className="text-lg">{cell?.symbol || '🎵'}</div>
            <div className="text-[8px]">{cell?.number || ''}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <button onClick={startGame} disabled={gameActive}
          className="px-8 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg transition-all hover:scale-105 disabled:opacity-50">
          {gameActive ? '🎲 JUGANDO...' : '🎲 NUEVO BINGO'}
        </button>
        <div className="bg-black/50 px-4 py-2 rounded-lg text-center border border-c8l-gold">
          <div className="text-xs text-gray-400">Números llamados</div>
          <div className="text-lg font-bold text-c8l-gold">{calledNumbers.length}/75</div>
        </div>
      </div>
      {mascotMessage && (
        <div className="mt-4 p-2 bg-c8l-gold/20 border border-c8l-gold rounded-lg text-center text-c8l-gold animate-pulse">
          {mascotMessage}
        </div>
      )}
    </div>
  );
}
