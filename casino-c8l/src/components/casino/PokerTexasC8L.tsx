'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';

const cardSound = new Howl({ src: ['/sounds/card.mp3'], volume: 0.4 });
const winSound = new Howl({ src: ['/sounds/win.mp3'], volume: 0.6 });

const CARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];

export function PokerTexasC8L({ userCoins, setUserCoins, currency = 'coins' }) {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [phase, setPhase] = useState('waiting');
  const [pot, setPot] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [result, setResult] = useState(null);
  const [aiHand, setAiHand] = useState([]);


  const shuffle = (array) => { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [array[i],array[j]]=[array[j],array[i]]; } return array; };
  const initializeDeck = () => { const d=[]; SUITS.forEach(s=>{CARDS.forEach(c=>{d.push({card:c,suit:s});})}); return shuffle(d); };

  const startGame = () => {
    if (userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    const newDeck = initializeDeck();
    setDeck(newDeck);
    setPlayerHand([newDeck.pop(), newDeck.pop()]);
    setAiHand([newDeck.pop(), newDeck.pop()]);
    setCommunityCards([]); setPot(betAmount); setPhase('pre-flop'); setResult(null);
    cardSound.play();
  };

  const dealFlop = () => { const d=[...deck]; const f=[d.pop(),d.pop(),d.pop()]; setDeck(d); setCommunityCards(f); setPhase('flop'); cardSound.play(); };
  const dealTurn = () => { const d=[...deck]; setCommunityCards([...communityCards,d.pop()]); setDeck(d); setPhase('turn'); cardSound.play(); };
  const dealRiver = () => {
    const d=[...deck]; setCommunityCards([...communityCards,d.pop()]); setDeck(d); setPhase('river'); cardSound.play();
    const pv = Math.floor(Math.random()*100); const av = Math.floor(Math.random()*100);
    if (pv > av) { const w=pot*2; setUserCoins(prev=>prev+w); setResult({type:'win',amount:w}); winSound.play(); }
    else { setResult({type:'lose'}); }
    setPhase('result');
  };

  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-4 text-center">🃏 PÓKER TEXAS C8L</h2>
      <div className="bg-black/50 p-4 rounded-lg border border-gray-800 mb-4">
        <div className="text-center text-c8l-gold font-bold mb-2">Bote: {pot} {currency==='coins'?'🪙':'💎'}</div>
        <div className="flex justify-center gap-2">
          {communityCards.map((c,i)=>(<div key={i} className="w-12 h-16 bg-white rounded-lg border border-gray-300 flex items-center justify-center text-black font-bold">{c.card}{c.suit}</div>))}
          {Array.from({length:5-communityCards.length}).map((_,i)=>(<div key={`e-${i}`} className="w-12 h-16 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center text-gray-600">🂠</div>))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/50 p-3 rounded-lg border border-c8l-gold/30">
          <div className="text-xs text-c8l-gold">🎯 Tú</div>
          <div className="flex gap-2 mt-1">{playerHand.map((c,i)=>(<div key={i} className="w-10 h-14 bg-white rounded-lg border border-gray-300 flex items-center justify-center text-black font-bold text-sm">{c.card}{c.suit}</div>))}</div>
        </div>
        <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
          <div className="text-xs text-gray-400">🤖 Bot</div>
          <div className="flex gap-2 mt-1">{aiHand.map((_,i)=>(<div key={i} className="w-10 h-14 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center text-gray-600 text-sm">🂠</div>))}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {[10,25,50,100,250].map(a=>(<button key={a} onClick={()=>setBetAmount(a)} className={`px-4 py-2 rounded-lg font-bold transition ${betAmount===a?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{a} {currency==='coins'?'🪙':'💎'}</button>))}
      </div>
      <div className="flex gap-2">
        {phase==='waiting' && <button onClick={startGame} className="flex-1 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 transition">🎯 Empezar</button>}
        {phase==='pre-flop' && <button onClick={dealFlop} className="flex-1 py-3 bg-c8l-gold text-black font-bold rounded-lg hover:scale-105 transition">Flop</button>}
        {phase==='flop' && <button onClick={dealTurn} className="flex-1 py-3 bg-c8l-gold text-black font-bold rounded-lg hover:scale-105 transition">Turn</button>}
        {phase==='turn' && <button onClick={dealRiver} className="flex-1 py-3 bg-c8l-gold text-black font-bold rounded-lg hover:scale-105 transition">River</button>}
        {phase==='result' && <button onClick={()=>{setPhase('waiting');setResult(null);setPlayerHand([]);setAiHand([]);setCommunityCards([]);setPot(0);}} className="flex-1 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 transition">🔄 Nueva partida</button>}
      </div>
      <AnimatePresence>
        {result && (<motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-4 p-3 rounded-lg text-center font-bold">
          {result.type==='win' && <div className="bg-green-600/20 text-green-400 border border-green-600 p-2 rounded">🎉 ¡Ganaste {result.amount} {currency==='coins'?'🪙':'💎'}!</div>}
          {result.type==='lose' && <div className="bg-red-600/20 text-red-400 border border-red-600 p-2 rounded">😢 Perdiste. ¡Sigue intentando!</div>}
        </motion.div>)}
      </AnimatePresence>
    </div>
  );
}
