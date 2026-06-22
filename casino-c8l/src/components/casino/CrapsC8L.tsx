'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';

const diceSound = new Howl({ src: ['/sounds/dice.mp3'], volume: 0.5 });

export function CrapsC8L({ userCoins, setUserCoins, currency = 'coins' }) {
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [point, setPoint] = useState(null);
  const [phase, setPhase] = useState('come-out');
  const [betAmount, setBetAmount] = useState(10);


  const rollDice = () => {
    if (rolling || userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    setRolling(true);
    diceSound.play();
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice1(d1); setDice2(d2);
      const total = d1 + d2;
      setRolling(false);
      if (phase === 'come-out') {
        if (total === 7 || total === 11) {
          setResult({ type: 'win', amount: betAmount * 2 });
          setUserCoins(prev => prev + betAmount * 2);
        } else if (total === 2 || total === 3 || total === 12) {
          setResult({ type: 'lose' });
        } else {
          setPoint(total); setPhase('point');
          setResult({ type: 'point', point: total });
        }
      } else if (phase === 'point') {
        if (total === point) {
          setResult({ type: 'win', amount: betAmount * 2 });
          setUserCoins(prev => prev + betAmount * 2);
          setPhase('come-out'); setPoint(null);
        } else if (total === 7) {
          setResult({ type: 'lose' });
          setPhase('come-out'); setPoint(null);
        } else {
          setResult({ type: 'continue' });
        }
      }
    }, 1000);
  };

  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-4 text-center">🎲 DADOS C8L</h2>
      <div className="flex justify-center gap-4 mb-6">
        <motion.div animate={rolling?{rotate:360}:{}} transition={{duration:0.5}} className="w-20 h-20 bg-white rounded-xl border-2 border-c8l-gold flex items-center justify-center text-4xl font-bold text-black">{dice1}</motion.div>
        <motion.div animate={rolling?{rotate:-360}:{}} transition={{duration:0.5}} className="w-20 h-20 bg-white rounded-xl border-2 border-c8l-gold flex items-center justify-center text-4xl font-bold text-black">{dice2}</motion.div>
      </div>
      <div className="text-center mb-4">
        <div className="text-sm text-gray-400">Fase: {phase==='come-out'?'🎯 Salida':'🎯 Punto'}</div>
        {point && <div className="text-c8l-gold font-bold">Punto: {point}</div>}
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {[10,25,50,100,250].map(a => (<button key={a} onClick={()=>setBetAmount(a)} className={`px-4 py-2 rounded-lg font-bold transition ${betAmount===a?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{a} {currency==='coins'?'🪙':'💎'}</button>))}
      </div>
      <button onClick={rollDice} disabled={rolling} className="w-full py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 disabled:opacity-50 transition">{rolling?'🎲 GIRANDO...':'🎲 TIRAR DADOS'}</button>
      <AnimatePresence>
        {result && (<motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-4 p-3 rounded-lg text-center font-bold">
          {result.type==='win' && <div className="bg-green-600/20 text-green-400 border border-green-600 p-2 rounded">🎉 ¡Ganaste {result.amount} {currency==='coins'?'🪙':'💎'}!</div>}
          {result.type==='lose' && <div className="bg-red-600/20 text-red-400 border border-red-600 p-2 rounded">😢 Perdiste. ¡Sigue intentando!</div>}
          {result.type==='point' && <div className="bg-yellow-600/20 text-yellow-400 border border-yellow-600 p-2 rounded">🎯 ¡Punto: {result.point}!</div>}
          {result.type==='continue' && <div className="bg-blue-600/20 text-blue-400 border border-blue-600 p-2 rounded">🔄 ¡Continúa!</div>}
        </motion.div>)}
      </AnimatePresence>
    </div>
  );
}
