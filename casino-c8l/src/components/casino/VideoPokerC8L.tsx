'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

const cardSound = new Howl({ src: ['/sounds/card.mp3'], volume: 0.4 });
const winSound = new Howl({ src: ['/sounds/win.mp3'], volume: 0.6 });

const CARDS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS = ['♠','♥','♦','♣'];

const HAND_RANKS = {
  'Royal Flush': 250, 'Straight Flush': 50, 'Four of a Kind': 25,
  'Full House': 9, 'Flush': 6, 'Straight': 4,
  'Three of a Kind': 3, 'Two Pair': 2, 'Jacks or Better': 1,
};

export function VideoPokerC8L({ userCoins, setUserCoins, currency = 'coins' }) {
  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([]);
  const [heldCards, setHeldCards] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [betAmount, setBetAmount] = useState(10);
  const [result, setResult] = useState(null);
  const [winAmount, setWinAmount] = useState(0);
  const [handRank, setHandRank] = useState('');


  const shuffle = (a) => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const initDeck = () => { const d=[]; SUITS.forEach(s=>{CARDS.forEach(c=>{d.push({card:c,suit:s});})}); return shuffle(d); };

  const startGame = () => {
    if (userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    const d = initDeck(); setDeck(d);
    const h = Array.from({length:5},()=>d.pop());
    setHand(h); setHeldCards(Array(5).fill(false));
    setPhase('draw'); setResult(null); setHandRank(''); setWinAmount(0);
    cardSound.play();
  };

  const toggleHold = (idx) => { if (phase!=='draw') return; const h=[...heldCards]; h[idx]=!h[idx]; setHeldCards(h); };

  const drawNewCards = () => {
    if (phase !== 'draw') return;
    const newHand = [...hand]; const d = [...deck];
    for (let i=0;i<5;i++) { if (!heldCards[i]) { newHand[i] = d.pop(); } }
    setHand(newHand); setDeck(d); setPhase('result');
    cardSound.play(); evaluateHand(newHand);
  };

  const evaluateHand = (finalHand) => {
    const values = finalHand.map(c=>c.card);
    const suits = finalHand.map(c=>c.suit);
    const valueCount = {};
    values.forEach(v => { valueCount[v] = (valueCount[v]||0)+1; });
    const counts = Object.values(valueCount).sort((a,b)=>b-a);
    const isFlush = suits.every(s=>s===suits[0]);
    const valueOrder = CARDS;
    const sorted = values.map(v=>valueOrder.indexOf(v)).sort((a,b)=>a-b);
    const isStraight = sorted.every((v,i)=>i===0||v===sorted[i-1]+1) || (sorted.join()=='0,1,2,3,12');
    let rank = ''; let mult = 0;
    if (isFlush && isStraight && sorted[4]===12 && sorted[0]===8) { rank='Royal Flush'; mult=250; }
    else if (isFlush && isStraight) { rank='Straight Flush'; mult=50; }
    else if (counts[0]===4) { rank='Four of a Kind'; mult=25; }
    else if (counts[0]===3 && counts[1]===2) { rank='Full House'; mult=9; }
    else if (isFlush) { rank='Flush'; mult=6; }
    else if (isStraight) { rank='Straight'; mult=4; }
    else if (counts[0]===3) { rank='Three of a Kind'; mult=3; }
    else if (counts[0]===2 && counts[1]===2) { rank='Two Pair'; mult=2; }
    else if (counts[0]===2) {
      const pair = Object.keys(valueCount).find(k=>valueCount[k]===2);
      if (['J','Q','K','A'].includes(pair)) { rank='Jacks or Better'; mult=1; }
    }
    if (mult > 0) {
      const win = betAmount * mult;
      setWinAmount(win); setHandRank(rank);
      setUserCoins(prev => prev + win);
      setResult({type:'win',amount:win,rank});
      winSound.play();
      if (mult >= 25) confetti({particleCount:200,spread:100,colors:['#D4AF37','#8A2BE2']});
      else confetti({particleCount:50,spread:40,colors:['#D4AF37']});
    } else {
      setResult({type:'lose'}); setHandRank('Sin mano ganadora');
    }
  };


  return (
    <div className="bg-gradient-to-br from-black via-purple-900/20 to-black p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-black text-c8l-gold">🃏 VÍDEO PÓKER</h2>
        <div className="text-xs text-gray-400">RTP: 99.54%</div>
      </div>
      <div className="bg-black/30 p-2 rounded-lg border border-gray-800 mb-4">
        <div className="grid grid-cols-5 gap-1 text-center text-xs">
          {Object.entries(HAND_RANKS).map(([name,mult])=>(<div key={name} className={`p-1 rounded ${handRank===name?'bg-c8l-gold text-black font-bold':'text-gray-400'}`}>{name} x{mult}</div>))}
        </div>
      </div>
      <div className="flex gap-3 justify-center mb-6">
        {hand.map((card,i)=>(
          <motion.div key={i} whileHover={{y:-10}} onClick={()=>toggleHold(i)}
            className={`relative w-16 h-24 bg-white rounded-lg border-2 flex items-center justify-center text-black font-bold text-lg cursor-pointer transition shadow-lg ${heldCards[i]?'border-c8l-gold ring-2 ring-c8l-gold':'border-gray-300'}`}>
            {card.card}{card.suit}
            {heldCards[i] && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-c8l-gold text-black text-[8px] px-1 rounded font-bold">HOLD</div>}
          </motion.div>
        ))}
        {hand.length===0 && Array.from({length:5}).map((_,i)=>(<div key={i} className="w-16 h-24 bg-gray-800 rounded-lg border-2 border-gray-700 flex items-center justify-center text-gray-600">🂠</div>))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {[1,5,10,25,50,100].map(a=>(<button key={a} onClick={()=>setBetAmount(a)} className={`px-4 py-2 rounded-lg font-bold transition ${betAmount===a?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{a}</button>))}
      </div>
      <div className="flex gap-2">
        {phase==='idle' && <button onClick={startGame} className="flex-1 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 transition">🎯 Repartir</button>}
        {phase==='draw' && <button onClick={drawNewCards} className="flex-1 py-3 bg-c8l-gold text-black font-bold rounded-xl text-lg hover:scale-105 transition">🔄 Cambiar cartas</button>}
        {phase==='result' && <button onClick={()=>{setPhase('idle');setHand([]);setResult(null);setHandRank('');}} className="flex-1 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 transition">🔄 Nueva partida</button>}
      </div>
      <AnimatePresence>{result && (<motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-4 p-3 rounded-lg text-center font-bold">
        {result.type==='win'&&<div className="bg-green-600/20 text-green-400 border border-green-600 p-2 rounded">🎉 {result.rank}! +{result.amount} {currency==='coins'?'🪙':'💎'}</div>}
        {result.type==='lose'&&<div className="bg-red-600/20 text-red-400 border border-red-600 p-2 rounded">😢 {handRank}. ¡Sigue intentando!</div>}
      </motion.div>)}</AnimatePresence>
    </div>
  );
}
