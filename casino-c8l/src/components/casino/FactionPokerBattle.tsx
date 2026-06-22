'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

export function FactionPokerBattle({ factionId, userId, userCoins, setUserCoins }) {
  const [battle, setBattle] = useState(null);
  const [players, setPlayers] = useState([]);
  const [cards, setCards] = useState([]);
  const [pot, setPot] = useState(0);
  const [phase, setPhase] = useState('waiting');
  const [myBet, setMyBet] = useState(0);

  useEffect(() => { loadBattle(); loadPlayers(); }, [factionId]);

  const loadBattle = async () => {
    const { data } = await supabase.from('faction_battles').select('*')
      .eq('status', 'active').or(`faction1_id.eq.${factionId},faction2_id.eq.${factionId}`).single();
    if (data) { setBattle(data); setPot(data.prize_pool); setPhase('pre-flop'); }
  };

  const loadPlayers = async () => {
    const { data } = await supabase.from('faction_members').select('user:user_id(name, avatar)').eq('faction_id', factionId);
    setPlayers(data?.map(p => p.user) || []);
  };

  const placeBet = (amount) => {
    if (amount > 0 && userCoins >= amount) {
      setPot(prev => prev + amount); setMyBet(amount);
      setUserCoins(prev => prev - amount);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-2 text-center">🃏 Batalla de Póker</h2>
      <div className="text-center text-sm text-gray-400 mb-4">Bote: <span className="text-c8l-gold font-bold">{pot.toLocaleString()} C8L</span></div>
      <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30 mb-4">
        <div className="flex justify-center gap-2 py-4">
          {players.slice(0, 5).map((player, i) => (
            <div key={i} className="text-center"><div className="text-2xl">{player?.avatar || '👤'}</div><div className="text-xs text-gray-400">{player?.name}</div></div>
          ))}
        </div>
        <div className="flex justify-center gap-2">
          {[1,2,3,4,5].map(i => (<div key={i} className="w-12 h-16 bg-c8l-gold/20 rounded border border-c8l-gold flex items-center justify-center">{cards[i-1] || '🂠'}</div>))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {[10,25,50,100,250,500].map(amount => (
          <button key={amount} onClick={() => placeBet(amount)} className={`px-4 py-2 rounded-lg font-bold transition ${myBet === amount ? 'bg-c8l-gold text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{amount} C8L</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">Call</button>
        <button className="flex-1 py-2 bg-c8l-gold text-black font-bold rounded-lg hover:bg-c8l-gold/80 transition">Raise</button>
        <button className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">Fold</button>
      </div>
    </div>
  );
}
