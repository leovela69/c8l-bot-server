'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

const COLORS = {
  red: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36],
  black: [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35],
};
const spinSound = new Howl({ src: ['/sounds/roulette-spin.mp3'], volume: 0.5 });
const winSound = new Howl({ src: ['/sounds/win-big.mp3'], volume: 0.7 });

export function SocialRoulette({ userCoins, setUserCoins, streamer }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [betAmount, setBetAmount] = useState(50);
  const [betType, setBetType] = useState('number');
  const [selectedNumber, setSelectedNumber] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [liveBets, setLiveBets] = useState([]);


  const spin = () => {
    if (spinning || userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    setSpinning(true);
    spinSound.play();
    const winningNumber = Math.floor(Math.random() * 37);
    setTimeout(() => { setResult(winningNumber); setSpinning(false); evaluateWin(winningNumber); }, 3000);
  };

  const evaluateWin = (winningNumber) => {
    let won = false; let amount = 0;
    if (betType === 'number' && winningNumber === selectedNumber) { won = true; amount = betAmount * 36; }
    else if (betType === 'red' && COLORS.red.includes(winningNumber)) { won = true; amount = betAmount * 2; }
    else if (betType === 'black' && COLORS.black.includes(winningNumber)) { won = true; amount = betAmount * 2; }
    if (won) {
      winSound.play();
      confetti({ particleCount: 200, spread: 100, colors: ['#D4AF37', '#FF0055'] });
      setUserCoins(prev => prev + amount);
      setChatMessages(prev => [...prev, { user: 'Sistema', message: `🎉 ¡${amount} Coins ganados!`, timestamp: Date.now() }]);
    } else {
      setChatMessages(prev => [...prev, { user: 'Sistema', message: `😢 Número ${winningNumber}. ¡Sigue!`, timestamp: Date.now() }]);
    }
    setTimeout(() => setResult(null), 3000);
  };

  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-c8l-gold">🎡 Ruleta Social</h2>
        {streamer && <div className="text-sm text-gray-400">🔴 {streamer}</div>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30 h-64 flex items-center justify-center">
            {result !== null ? <div className="text-6xl font-black text-c8l-gold">{result}</div> : <div className="text-gray-400">🎡 Gira la ruleta</div>}
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {['number','red','black','even','odd'].map(t => (
              <button key={t} onClick={() => setBetType(t)} className={`px-3 py-1 rounded-lg text-sm font-bold ${betType === t ? 'bg-c8l-gold text-black' : 'bg-gray-800 text-gray-400'}`}>{t.toUpperCase()}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2 flex-wrap">
            {[10,50,100,250,500].map(a => (
              <button key={a} onClick={() => setBetAmount(a)} className={`px-3 py-1 rounded-lg text-sm font-bold ${betAmount === a ? 'bg-c8l-gold text-black' : 'bg-gray-800 text-gray-400'}`}>{a}</button>
            ))}
          </div>
          <button onClick={spin} disabled={spinning} className="w-full mt-4 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 disabled:opacity-50 transition-all">
            {spinning ? '🌀 GIRANDO...' : '🎡 GIRAR'}
          </button>
        </div>
        <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30 h-96 flex flex-col">
          <div className="text-sm font-bold text-c8l-gold mb-2">💬 Chat en vivo</div>
          <div className="flex-1 overflow-y-auto space-y-2 text-sm">
            {chatMessages.slice(-10).map((msg, i) => (
              <div key={i} className="border-b border-gray-800 pb-1"><span className="text-c8l-gold">{msg.user}:</span><span className="text-gray-300 ml-2">{msg.message}</span></div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input type="text" placeholder="Escribe..." className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-1 text-white text-sm" />
            <button className="px-3 py-1 bg-c8l-gold text-black rounded-lg text-sm font-bold">Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
