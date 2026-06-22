'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

export function PokerTournamentC8L({ userCoins, setUserCoins, currency = 'coins' }) {
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [mySeat, setMySeat] = useState(null);
  const [phase, setPhase] = useState('waiting');
  const [pot, setPot] = useState(0);
  const [entryFee, setEntryFee] = useState(100);

  useEffect(() => { loadTournament(); }, []);

  const loadTournament = async () => {
    const { data } = await supabase.from('poker_tournaments').select('*').eq('status', 'open').single();
    if (data) { setTournament(data); setPot(data.prize_pool); loadPlayers(); }
  };

  const loadPlayers = async () => {
    const { data } = await supabase.from('poker_tournament_players').select('*').eq('tournament_id', tournament?.id);
    setPlayers(data || []);
  };

  const joinTournament = async () => {
    if (userCoins < entryFee) { alert('Saldo insuficiente'); return; }
    setUserCoins(prev => prev - entryFee);
    await supabase.from('poker_tournament_players').insert({
      tournament_id: tournament.id, user_id: 'current-user-id', chips: 1000, seat: players.length + 1
    });
    loadPlayers();
  };


  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-4 text-center">🏆 TORNEO DE PÓKER</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30">
          <div className="text-sm text-gray-400">🏅 Premio total</div>
          <div className="text-2xl font-bold text-c8l-gold">{pot} {currency==='coins'?'🪙':'💎'}</div>
        </div>
        <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30">
          <div className="text-sm text-gray-400">👥 Jugadores</div>
          <div className="text-2xl font-bold text-c8l-gold">{players.length}/8</div>
        </div>
      </div>
      <div className="bg-black/50 p-4 rounded-lg border border-gray-800 mb-4">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} className={`p-2 rounded-lg text-center text-xs ${i<players.length?'bg-c8l-gold/20 border border-c8l-gold text-white':'bg-gray-800 border border-gray-700 text-gray-500'}`}>
              {i<players.length?`👤 Jugador ${i+1}`:'🪑 Vacío'}
            </div>
          ))}
        </div>
      </div>
      {players.length < 8 ? (
        <button onClick={joinTournament} className="w-full py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 transition">🎯 Unirse ({entryFee} {currency==='coins'?'🪙':'💎'})</button>
      ) : (
        <div className="text-center text-c8l-gold font-bold">🎉 ¡Torneo lleno! Comenzando pronto...</div>
      )}
    </div>
  );
}
