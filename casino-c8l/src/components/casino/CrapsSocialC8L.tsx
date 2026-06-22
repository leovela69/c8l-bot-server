'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

const diceSound = new Howl({ src: ['/sounds/dice.mp3'], volume: 0.5 });
const winSound = new Howl({ src: ['/sounds/win.mp3'], volume: 0.6 });
const loseSound = new Howl({ src: ['/sounds/lose.mp3'], volume: 0.4 });

export function CrapsSocialC8L({ userCoins, setUserCoins, currency = 'coins' }) {
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [point, setPoint] = useState(null);
  const [phase, setPhase] = useState('come-out');
  const [betAmount, setBetAmount] = useState(10);
  const [betType, setBetType] = useState('pass');
  const [otherPlayers, setOtherPlayers] = useState([
    { name: 'Bot_Leo', bet: 'pass', amount: 50 },
    { name: 'Bot_Crown', bet: 'dont_pass', amount: 30 },
    { name: 'Bot_Music', bet: 'pass', amount: 100 },
  ]);
  const [chatMessages, setChatMessages] = useState([
    { user: 'Sistema', message: '🎲 ¡Mesa de Craps abierta! Apuesten.', timestamp: Date.now() }
  ]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, streak: 0 });


  const rollDice = () => {
    if (rolling || userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    setRolling(true); diceSound.play();
    setTimeout(() => {
      const d1 = Math.floor(Math.random()*6)+1;
      const d2 = Math.floor(Math.random()*6)+1;
      setDice1(d1); setDice2(d2);
      const total = d1+d2; setRolling(false);
      if (phase === 'come-out') {
        if (total===7||total===11) {
          if (betType==='pass') { setResult({type:'win',amount:betAmount*2}); setUserCoins(prev=>prev+betAmount*2); winSound.play(); confetti({particleCount:100,spread:60,colors:['#D4AF37']}); setStats(s=>({...s,wins:s.wins+1,streak:s.streak+1})); }
          else { setResult({type:'lose'}); loseSound.play(); setStats(s=>({...s,losses:s.losses+1,streak:0})); }
          setChatMessages(prev=>[...prev,{user:'Mesa',message:`🎲 ${total}! ${betType==='pass'?'¡Pass Line gana!':'¡Don\'t Pass gana!'}`,timestamp:Date.now()}]);
        } else if (total===2||total===3||total===12) {
          if (betType==='dont_pass') { setResult({type:'win',amount:betAmount*2}); setUserCoins(prev=>prev+betAmount*2); winSound.play(); setStats(s=>({...s,wins:s.wins+1,streak:s.streak+1})); }
          else { setResult({type:'lose'}); loseSound.play(); setStats(s=>({...s,losses:s.losses+1,streak:0})); }
          setChatMessages(prev=>[...prev,{user:'Mesa',message:`🎲 ${total}! Craps!`,timestamp:Date.now()}]);
        } else { setPoint(total); setPhase('point'); setResult({type:'point',point:total}); setChatMessages(prev=>[...prev,{user:'Mesa',message:`🎯 Punto establecido: ${total}`,timestamp:Date.now()}]); }
      } else if (phase === 'point') {
        if (total===point) {
          if (betType==='pass') { const w=betAmount*2; setResult({type:'win',amount:w}); setUserCoins(prev=>prev+w); winSound.play(); confetti({particleCount:150,spread:80,colors:['#D4AF37','#FF0055']}); setStats(s=>({...s,wins:s.wins+1,streak:s.streak+1})); }
          else { setResult({type:'lose'}); loseSound.play(); setStats(s=>({...s,losses:s.losses+1,streak:0})); }
          setPhase('come-out'); setPoint(null);
          setChatMessages(prev=>[...prev,{user:'Mesa',message:`🎉 ¡Punto ${total}! Pass Line gana!`,timestamp:Date.now()}]);
        } else if (total===7) {
          if (betType==='dont_pass') { const w=betAmount*2; setResult({type:'win',amount:w}); setUserCoins(prev=>prev+w); winSound.play(); setStats(s=>({...s,wins:s.wins+1,streak:s.streak+1})); }
          else { setResult({type:'lose'}); loseSound.play(); setStats(s=>({...s,losses:s.losses+1,streak:0})); }
          setPhase('come-out'); setPoint(null);
          setChatMessages(prev=>[...prev,{user:'Mesa',message:`😢 ¡7! Don't Pass gana.`,timestamp:Date.now()}]);
        } else { setResult({type:'continue'}); setChatMessages(prev=>[...prev,{user:'Mesa',message:`🎲 ${total}. Sigue jugando...`,timestamp:Date.now()}]); }
      }
    }, 1000);
  };

  return (
    <div className="bg-gradient-to-br from-black via-purple-900/20 to-black p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-black text-c8l-gold">🎲 CRAPS SOCIAL</h2>
        <div className="text-xs text-gray-400">RTP: 98.6%</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex justify-center gap-6 mb-4">
            <motion.div animate={rolling?{rotate:360}:{}} transition={{duration:0.5}} className="w-24 h-24 bg-white rounded-xl border-4 border-c8l-gold flex items-center justify-center text-5xl font-bold text-black shadow-xl">{dice1}</motion.div>
            <motion.div animate={rolling?{rotate:-360}:{}} transition={{duration:0.5}} className="w-24 h-24 bg-white rounded-xl border-4 border-c8l-gold flex items-center justify-center text-5xl font-bold text-black shadow-xl">{dice2}</motion.div>
          </div>
          <div className="text-center mb-4">
            <div className="text-sm text-gray-400">Fase: {phase==='come-out'?'🎯 Salida':'🎯 Punto'} {point&&`(${point})`}</div>
            <div className="text-xs text-gray-500 mt-1">Racha: {stats.streak} | Victorias: {stats.wins} | Derrotas: {stats.losses}</div>
          </div>
          <div className="flex gap-2 justify-center mb-4">
            <button onClick={()=>setBetType('pass')} className={`px-6 py-2 rounded-lg font-bold ${betType==='pass'?'bg-green-600 text-white':'bg-gray-800 text-gray-400'}`}>Pass Line</button>
            <button onClick={()=>setBetType('dont_pass')} className={`px-6 py-2 rounded-lg font-bold ${betType==='dont_pass'?'bg-red-600 text-white':'bg-gray-800 text-gray-400'}`}>Don't Pass</button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {[10,25,50,100,250,500].map(a=>(<button key={a} onClick={()=>setBetAmount(a)} className={`px-4 py-2 rounded-lg font-bold transition ${betAmount===a?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{a}</button>))}
          </div>
          <button onClick={rollDice} disabled={rolling} className="w-full py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 disabled:opacity-50 transition">{rolling?'🎲 TIRANDO...':'🎲 TIRAR DADOS'}</button>
        </div>
        <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30">
          <div className="text-sm font-bold text-c8l-gold mb-2">💬 Mesa social</div>
          <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
            {chatMessages.slice(-10).map((m,i)=>(<div key={i} className="border-b border-gray-800 pb-1"><span className="text-c8l-gold">{m.user}:</span> <span className="text-gray-300">{m.message}</span></div>))}
          </div>
          <div className="mt-3 border-t border-gray-800 pt-2">
            <div className="text-xs text-gray-400 mb-1">Otros jugadores:</div>
            {otherPlayers.map((p,i)=>(<div key={i} className="text-xs text-gray-500">👤 {p.name}: {p.bet} ({p.amount}🪙)</div>))}
          </div>
        </div>
      </div>
      <AnimatePresence>{result && (<motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-4 p-3 rounded-lg text-center font-bold">
        {result.type==='win'&&<div className="bg-green-600/20 text-green-400 border border-green-600 p-2 rounded">🎉 ¡Ganaste {result.amount} {currency==='coins'?'🪙':'💎'}!</div>}
        {result.type==='lose'&&<div className="bg-red-600/20 text-red-400 border border-red-600 p-2 rounded">😢 Perdiste.</div>}
        {result.type==='point'&&<div className="bg-yellow-600/20 text-yellow-400 border border-yellow-600 p-2 rounded">🎯 ¡Punto: {result.point}!</div>}
        {result.type==='continue'&&<div className="bg-blue-600/20 text-blue-400 border border-blue-600 p-2 rounded">🔄 Sigue tirando...</div>}
      </motion.div>)}</AnimatePresence>
    </div>
  );
}
