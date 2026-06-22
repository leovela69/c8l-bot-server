'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function BotCasinoPlayer() {
  const [botStats, setBotStats] = useState({
    gamesPlayed: 0, coinsWon: 0, coinsLost: 0, currentBalance: 1000
  });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => { if (isPlaying) playGame(); }, 10000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const playGame = () => {
    const games = ['slots', 'roulette', 'blackjack'];
    const game = games[Math.floor(Math.random() * games.length)];
    const bet = Math.floor(Math.random() * 50) + 10;
    const win = Math.random() > 0.6;
    const amount = win ? bet * (Math.floor(Math.random() * 5) + 1) : 0;
    setBotStats(prev => ({
      ...prev, gamesPlayed: prev.gamesPlayed + 1,
      coinsWon: prev.coinsWon + (win ? amount : 0),
      coinsLost: prev.coinsLost + (!win ? bet : 0),
      currentBalance: prev.currentBalance - bet + (win ? amount : 0)
    }));
    supabase.from('bot_actions').insert({
      action_type: 'game_play', target: game,
      result: win ? 'win' : 'loss', details: { bet, win_amount: amount }
    });
  };


  return (
    <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎰</span>
          <div><h4 className="font-bold text-white">Bot Jugador</h4><div className="text-xs text-gray-400">Jugando automáticamente</div></div>
        </div>
        <button onClick={() => setIsPlaying(!isPlaying)} className={`px-4 py-1 rounded-lg text-sm font-bold transition ${isPlaying ? 'bg-red-600 text-white' : 'bg-c8l-gold text-black'}`}>
          {isPlaying ? '⏹ Detener' : '▶️ Jugar'}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
        <div className="bg-black/30 p-2 rounded"><div className="text-c8l-gold font-bold">{botStats.gamesPlayed}</div><div className="text-gray-500">Partidas</div></div>
        <div className="bg-black/30 p-2 rounded"><div className="text-green-400 font-bold">{botStats.coinsWon}</div><div className="text-gray-500">🪙 Ganados</div></div>
        <div className="bg-black/30 p-2 rounded"><div className="text-red-400 font-bold">{botStats.coinsLost}</div><div className="text-gray-500">🪙 Perdidos</div></div>
        <div className="bg-black/30 p-2 rounded"><div className="text-c8l-gold font-bold">{botStats.currentBalance}</div><div className="text-gray-500">💎 Saldo</div></div>
      </div>
    </div>
  );
}
