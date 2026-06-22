'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

const cardSound = new Howl({ src: ['/sounds/card.mp3'], volume: 0.4 });
const winSound = new Howl({ src: ['/sounds/win.mp3'], volume: 0.6 });
const loseSound = new Howl({ src: ['/sounds/lose.mp3'], volume: 0.4 });

const CARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];

const getCardValue = (card) => {
  if (card === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card)) return 10;
  return parseInt(card);
};

const getHandValue = (hand) => {
  let value = 0;
  let aces = 0;
  hand.forEach(card => {
    if (card === 'A') aces++;
    value += getCardValue(card);
  });
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return value;
};

export function BlackjackC8L({ userCoins, setUserCoins, currency = 'coins' }) {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('idle');
  const [betAmount, setBetAmount] = useState(10);
  const [result, setResult] = useState(null);
  const [showDealerCard, setShowDealerCard] = useState(false);


  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const initializeDeck = () => {
    const newDeck = [];
    SUITS.forEach(suit => { CARDS.forEach(card => { newDeck.push({ card, suit }); }); });
    return shuffle(newDeck);
  };

  const startGame = () => {
    if (userCoins < betAmount) return;
    setUserCoins(prev => prev - betAmount);
    const newDeck = initializeDeck();
    setDeck(newDeck);
    setPlayerHand([newDeck.pop(), newDeck.pop()]);
    setDealerHand([newDeck.pop(), newDeck.pop()]);
    setGameState('playing');
    setShowDealerCard(false);
    setResult(null);
    cardSound.play();
  };

  const handleHit = () => {
    const newDeck = [...deck];
    const newCard = newDeck.pop();
    setDeck(newDeck);
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    cardSound.play();
    if (getHandValue(newHand.map(c => c.card)) > 21) {
      setResult({ type: 'lose', reason: 'bust' });
      setGameState('result');
      loseSound.play();
    }
  };

  const handleStand = () => {
    setShowDealerCard(true);
    let currentDealer = [...dealerHand];
    let currentDeck = [...deck];
    while (getHandValue(currentDealer.map(c => c.card)) < 17) {
      currentDealer.push(currentDeck.pop());
    }
    setDealerHand(currentDealer);
    setDeck(currentDeck);
    const pv = getHandValue(playerHand.map(c => c.card));
    const dv = getHandValue(currentDealer.map(c => c.card));
    if (dv > 21 || pv > dv) {
      const win = betAmount * 2;
      setUserCoins(prev => prev + win);
      setResult({ type: 'win', amount: win });
      winSound.play();
      confetti({ particleCount: 100, spread: 60, colors: ['#D4AF37'] });
    } else if (pv === dv) {
      setUserCoins(prev => prev + betAmount);
      setResult({ type: 'push' });
    } else {
      setResult({ type: 'lose' });
      loseSound.play();
    }
    setGameState('result');
  };


  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-4 text-center">♠️ BLACKJACK C8L</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/50 p-4 rounded-lg border border-gray-800">
          <div className="text-sm text-gray-400">💻 Casa {showDealerCard && `(${getHandValue(dealerHand.map(c=>c.card))})`}</div>
          <div className="flex gap-2 mt-2">
            {dealerHand.map((card, i) => (
              <div key={i} className={`w-12 h-16 rounded-lg border flex items-center justify-center font-bold ${i===1&&!showDealerCard?'bg-gray-800 text-gray-800 border-gray-700':'bg-white text-black border-gray-300'}`}>
                {i===1&&!showDealerCard?'🂠':`${card.card}${card.suit}`}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30">
          <div className="text-sm text-c8l-gold">🎯 Tú ({getHandValue(playerHand.map(c=>c.card))})</div>
          <div className="flex gap-2 mt-2">
            {playerHand.map((card, i) => (
              <div key={i} className="w-12 h-16 bg-white rounded-lg border border-gray-300 flex items-center justify-center text-black font-bold">
                {card.card}{card.suit}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {[10,25,50,100,250].map(a => (
          <button key={a} onClick={()=>setBetAmount(a)} className={`px-4 py-2 rounded-lg font-bold transition ${betAmount===a?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{a} {currency==='coins'?'🪙':'💎'}</button>
        ))}
      </div>
      <div className="flex gap-2">
        {gameState==='idle' && <button onClick={startGame} className="flex-1 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 transition">🎯 Repartir</button>}
        {gameState==='playing' && (<><button onClick={handleHit} className="flex-1 py-3 bg-c8l-gold text-black font-bold rounded-lg hover:scale-105 transition">Pedir</button><button onClick={handleStand} className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-lg hover:scale-105 transition">Plantarse</button></>)}
        {gameState==='result' && <button onClick={()=>{setGameState('idle');setResult(null);setPlayerHand([]);setDealerHand([]);setShowDealerCard(false);}} className="flex-1 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 transition">🔄 Nueva partida</button>}
      </div>
      <AnimatePresence>
        {result && (<motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-4 p-3 rounded-lg text-center font-bold">
          {result.type==='win' && <div className="bg-green-600/20 text-green-400 border border-green-600 p-2 rounded">🎉 ¡Ganaste {result.amount} {currency==='coins'?'🪙':'💎'}!</div>}
          {result.type==='lose' && <div className="bg-red-600/20 text-red-400 border border-red-600 p-2 rounded">😢 Perdiste. ¡Sigue intentando!</div>}
          {result.type==='push' && <div className="bg-yellow-600/20 text-yellow-400 border border-yellow-600 p-2 rounded">🤝 Empate. Recuperas tu apuesta.</div>}
        </motion.div>)}
      </AnimatePresence>
    </div>
  );
}
