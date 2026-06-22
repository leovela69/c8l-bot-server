'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

const cardSound = new Howl({ src: ['/sounds/card.mp3'], volume: 0.4 });
const winSound = new Howl({ src: ['/sounds/win.mp3'], volume: 0.6 });
const loseSound = new Howl({ src: ['/sounds/lose.mp3'], volume: 0.4 });

const CARDS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS = ['♠','♥','♦','♣'];

const getCardValue = (card) => {
  if (card === 'A') return 11;
  if (['J','Q','K'].includes(card)) return 10;
  return parseInt(card);
};

const getHandValue = (hand) => {
  let value = 0; let aces = 0;
  hand.forEach(card => { if (card === 'A') aces++; value += getCardValue(card); });
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return value;
};

export function BlackjackC8Lv2({ userCoins, setUserCoins, currency = 'coins' }) {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('idle');
  const [betAmount, setBetAmount] = useState(10);
  const [result, setResult] = useState(null);
  const [showDealerCard, setShowDealerCard] = useState(false);
  const [doubleDown, setDoubleDown] = useState(false);
  const [splitHand, setSplitHand] = useState(null);


  const shuffle = (a) => { for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const initDeck = () => { const d=[]; SUITS.forEach(s=>{CARDS.forEach(c=>{d.push({card:c,suit:s});})}); return shuffle(d); };

  const startGame = () => {
    if (userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    const d = initDeck(); setDeck(d);
    setPlayerHand([d.pop(), d.pop()]);
    setDealerHand([d.pop(), d.pop()]);
    setGameState('playing'); setShowDealerCard(false); setResult(null); setDoubleDown(false); setSplitHand(null);
    cardSound.play();
    const pv = getHandValue([d[d.length-4].card, d[d.length-3].card]);
    if (pv === 21) handleWin('blackjack');
  };

  const handleHit = () => {
    if (gameState !== 'playing') return;
    const d = [...deck]; const c = d.pop(); setDeck(d);
    const newHand = [...playerHand, c]; setPlayerHand(newHand); cardSound.play();
    if (getHandValue(newHand.map(x=>x.card)) > 21) { setResult({type:'lose',reason:'bust'}); setGameState('result'); loseSound.play(); }
  };

  const handleStand = () => {
    setShowDealerCard(true);
    let dh = [...dealerHand]; let d = [...deck];
    while (getHandValue(dh.map(x=>x.card)) < 17) { dh.push(d.pop()); }
    setDealerHand(dh); setDeck(d);
    const pv = getHandValue(playerHand.map(x=>x.card));
    const dv = getHandValue(dh.map(x=>x.card));
    if (dv > 21 || pv > dv) handleWin('normal');
    else if (pv === dv) { setUserCoins(prev=>prev+betAmount); setResult({type:'push'}); setGameState('result'); }
    else { setResult({type:'lose'}); setGameState('result'); loseSound.play(); }
  };

  const handleDoubleDown = () => {
    if (userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount); setDoubleDown(true);
    const d = [...deck]; const c = d.pop(); setDeck(d);
    setPlayerHand([...playerHand, c]); cardSound.play();
    setTimeout(handleStand, 500);
  };

  const handleSplit = () => {
    if (playerHand.length !== 2 || playerHand[0].card !== playerHand[1].card || userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    const d = [...deck];
    setSplitHand([playerHand[1], d.pop()]);
    setPlayerHand([playerHand[0], d.pop()]);
    setDeck(d); cardSound.play();
  };

  const handleWin = (type) => {
    let mult = type === 'blackjack' ? 2.5 : doubleDown ? 4 : 2;
    const win = Math.round(betAmount * mult);
    setUserCoins(prev => prev + win);
    setResult({type:'win', amount:win}); setGameState('result');
    winSound.play(); confetti({particleCount:100,spread:60,colors:['#D4AF37']});
  };


  const pv = getHandValue(playerHand.map(c=>c.card));

  return (
    <div className="bg-gradient-to-br from-black via-purple-900/20 to-black p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-black text-c8l-gold">♠️ BLACKJACK C8L</h2>
        <div className="text-xs text-gray-400">RTP: 99.5%</div>
      </div>
      <div className="relative bg-gradient-to-b from-green-900/50 to-green-950/50 p-6 rounded-xl border border-c8l-gold/30 mb-4">
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">💻 Casa {showDealerCard && `(${getHandValue(dealerHand.map(c=>c.card))})`}</div>
          <div className="flex gap-2 flex-wrap">
            {dealerHand.map((card, i) => (
              <motion.div key={i} initial={{rotateY:180}} animate={{rotateY:0}} transition={{delay:i*0.1}}
                className={`w-14 h-20 rounded-lg border-2 flex items-center justify-center font-bold shadow-lg ${i===1&&!showDealerCard?'bg-gray-800 text-gray-800 border-gray-700':'bg-white text-black border-gray-300'}`}>
                {i===1&&!showDealerCard?'🂠':`${card.card}${card.suit}`}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="border-t border-c8l-gold/20 my-4" />
        <div>
          <div className="text-sm text-c8l-gold mb-2">🎯 Tú ({pv})</div>
          <div className="flex gap-2 flex-wrap">
            {playerHand.map((card, i) => (
              <motion.div key={i} initial={{rotateY:180,scale:0.8}} animate={{rotateY:0,scale:1}} transition={{delay:i*0.15}}
                className="w-14 h-20 bg-white rounded-lg border-2 border-c8l-gold flex items-center justify-center text-black font-bold shadow-lg">
                {card.card}{card.suit}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute top-2 right-2 bg-black/80 px-3 py-1 rounded-full border border-c8l-gold">
          <span className="text-c8l-gold font-bold text-sm">{betAmount} {currency==='coins'?'🪙':'💎'}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {[10,25,50,100,250,500].map(a=>(<button key={a} onClick={()=>setBetAmount(a)} className={`px-4 py-2 rounded-lg font-bold transition ${betAmount===a?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{a}</button>))}
      </div>
      <div className="flex flex-wrap gap-2">
        {gameState==='idle' && <button onClick={startGame} className="flex-1 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 transition">🎯 Repartir</button>}
        {gameState==='playing' && (<>
          <button onClick={handleHit} className="flex-1 py-3 bg-c8l-gold text-black font-bold rounded-lg hover:scale-105 transition">Pedir</button>
          <button onClick={handleStand} className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-lg hover:scale-105 transition">Plantarse</button>
          {playerHand.length===2&&!doubleDown&&<button onClick={handleDoubleDown} className="px-4 py-3 bg-purple-600 text-white font-bold rounded-lg hover:scale-105 transition">Doblar</button>}
          {playerHand.length===2&&playerHand[0].card===playerHand[1].card&&<button onClick={handleSplit} className="px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:scale-105 transition">Dividir</button>}
        </>)}
        {gameState==='result' && <button onClick={()=>{setGameState('idle');setResult(null);setPlayerHand([]);setDealerHand([]);setShowDealerCard(false);}} className="flex-1 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 transition">🔄 Nueva partida</button>}
      </div>
      <AnimatePresence>{result && (<motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-4 p-3 rounded-lg text-center font-bold">
        {result.type==='win'&&<div className="bg-green-600/20 text-green-400 border border-green-600 p-2 rounded">🎉 ¡Ganaste {result.amount} {currency==='coins'?'🪙':'💎'}!</div>}
        {result.type==='lose'&&<div className="bg-red-600/20 text-red-400 border border-red-600 p-2 rounded">😢 Perdiste. ¡Sigue intentando!</div>}
        {result.type==='push'&&<div className="bg-yellow-600/20 text-yellow-400 border border-yellow-600 p-2 rounded">🤝 Empate.</div>}
      </motion.div>)}</AnimatePresence>
    </div>
  );
}
