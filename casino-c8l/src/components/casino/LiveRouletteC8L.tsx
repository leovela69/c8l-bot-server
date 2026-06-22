'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

const spinSound = new Howl({ src: ['/sounds/roulette-spin.mp3'], volume: 0.5 });
const ballSound = new Howl({ src: ['/sounds/roulette-ball.mp3'], volume: 0.6 });
const winSound = new Howl({ src: ['/sounds/win-big.mp3'], volume: 0.7 });

const NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

export function LiveRouletteC8L({ userCoins, setUserCoins, currency = 'coins',
  streamerName = 'Leo Vela', streamerAvatar = '🦁' }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [betAmount, setBetAmount] = useState(50);
  const [betType, setBetType] = useState('number');
  const [selectedNumber, setSelectedNumber] = useState(0);
  const [history, setHistory] = useState([]);
  const [hotNumbers, setHotNumbers] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { user: 'Sistema', message: '🎡 ¡Bienvenidos a la Ruleta en Vivo!', timestamp: Date.now() }
  ]);
  const [liveBets, setLiveBets] = useState([]);
  const [showResult, setShowResult] = useState(false);


  const getNumberColor = (num) => { if (num===0) return 'bg-green-600'; if (RED_NUMBERS.includes(num)) return 'bg-red-600'; return 'bg-gray-800'; };

  const spin = () => {
    if (spinning || userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    setSpinning(true); spinSound.play();
    setLiveBets(prev => [...prev, { user: 'Tú', amount: betAmount, type: betType }]);
    const winningNumber = Math.floor(Math.random() * 37);
    setTimeout(() => {
      ballSound.play(); setResult(winningNumber); setSpinning(false); setShowResult(true);
      setHistory(prev => [winningNumber, ...prev].slice(0, 20));
      evaluateWin(winningNumber);
      setTimeout(() => setShowResult(false), 3000);
    }, 2500);
  };

  const evaluateWin = (num) => {
    let won = false; let amount = 0; let msg = '';
    if (betType==='number' && num===selectedNumber) { won=true; amount=betAmount*36; msg=`🎉 ¡PLENO! ${num}!`; }
    else if (betType==='red' && RED_NUMBERS.includes(num)) { won=true; amount=betAmount*2; msg=`🔴 ¡ROJO! ${num}!`; }
    else if (betType==='black' && BLACK_NUMBERS.includes(num)) { won=true; amount=betAmount*2; msg=`⚫ ¡NEGRO! ${num}!`; }
    else if (betType==='even' && num%2===0 && num!==0) { won=true; amount=betAmount*2; msg=`🟢 ¡PAR! ${num}!`; }
    else if (betType==='odd' && num%2===1) { won=true; amount=betAmount*2; msg=`🟠 ¡IMPAR! ${num}!`; }
    else if (betType==='1-12' && num>=1 && num<=12) { won=true; amount=betAmount*3; msg=`📊 ¡1ª DOCENA! ${num}!`; }
    else if (betType==='13-24' && num>=13 && num<=24) { won=true; amount=betAmount*3; msg=`📊 ¡2ª DOCENA! ${num}!`; }
    else if (betType==='25-36' && num>=25 && num<=36) { won=true; amount=betAmount*3; msg=`📊 ¡3ª DOCENA! ${num}!`; }
    else { msg = `😢 Número ${num}. ¡Sigue!`; }
    if (won) { winSound.play(); confetti({particleCount:150,spread:80,colors:['#D4AF37','#FF0055']}); setUserCoins(prev=>prev+amount); }
    setChatMessages(prev=>[...prev,{user:won?streamerName:'Sistema',message:msg,timestamp:Date.now()}]);
  };


  return (
    <div className="bg-gradient-to-br from-black via-purple-900/20 to-black p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{streamerAvatar}</div>
          <div><h2 className="text-2xl font-black text-c8l-gold">🎡 Ruleta en Vivo</h2><div className="text-xs text-gray-400">Con {streamerName} • RTP: 97.3%</div></div>
        </div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><span className="text-xs text-red-500">EN VIVO</span></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30 h-48 flex items-center justify-center">
            {showResult ? (<div className="text-center"><div className={`text-6xl font-black ${getNumberColor(result)} text-white px-6 py-3 rounded-full inline-block`}>{result}</div></div>) : (<div className="text-gray-400 text-center"><div className="text-6xl mb-2">🎡</div><div>{spinning?'GIRANDO...':'Esperando apuesta'}</div></div>)}
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1">
            {NUMBERS.map(num=>(<button key={num} onClick={()=>{setBetType('number');setSelectedNumber(num);}} className={`p-1 rounded text-xs font-bold transition ${selectedNumber===num&&betType==='number'?'ring-2 ring-c8l-gold scale-110':''} ${getNumberColor(num)} text-white hover:scale-105`}>{num}</button>))}
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {['red','black','even','odd','1-12','13-24','25-36'].map(t=>(<button key={t} onClick={()=>setBetType(t)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${betType===t?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{t.toUpperCase()}</button>))}
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {[10,25,50,100,250,500].map(a=>(<button key={a} onClick={()=>setBetAmount(a)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${betAmount===a?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{a}</button>))}
          </div>
          <button onClick={spin} disabled={spinning} className="w-full mt-4 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 disabled:opacity-50 transition">{spinning?'🌀 GIRANDO...':'🎡 GIRAR'}</button>
        </div>
        <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30 h-[450px] flex flex-col">
          <div className="text-sm font-bold text-c8l-gold mb-2">💬 Chat en vivo</div>
          <div className="flex-1 overflow-y-auto space-y-2 text-sm">
            {chatMessages.slice(-15).map((msg,i)=>(<div key={i} className="border-b border-gray-800 pb-1"><span className={msg.user===streamerName?'text-c8l-gold font-bold':'text-gray-400'}>{msg.user}:</span><span className="text-gray-300 ml-2">{msg.message}</span></div>))}
          </div>
          <div className="mt-2 p-2 bg-black/30 rounded-lg border border-gray-800">
            <div className="text-xs text-gray-400">Últimos números</div>
            <div className="flex gap-1 mt-1 flex-wrap">{history.slice(0,10).map((n,i)=>(<div key={i} className={`w-6 h-6 rounded-full ${getNumberColor(n)} text-white text-xs flex items-center justify-center`}>{n}</div>))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
