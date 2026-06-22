'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export function FactionBattle({ factionId, userId }) {
  const [battles, setBattles] = useState([]);
  const [activeBattle, setActiveBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myContributions, setMyContributions] = useState(0);

  useEffect(() => { loadBattles(); }, [factionId]);

  const loadBattles = async () => {
    const { data } = await supabase.from('faction_battles').select('*')
      .or(`faction1_id.eq.${factionId},faction2_id.eq.${factionId}`)
      .in('status', ['pending', 'active']);
    setBattles(data || []);
    setActiveBattle(data?.find(b => b.status === 'active') || null);
    setLoading(false);
  };

  const contributeToBattle = async (battleId) => {
    const contribution = Math.floor(Math.random() * 50) + 10;
    setMyContributions(prev => prev + contribution);
    await supabase.from('faction_battles')
      .update({ score1: supabase.rpc('increment', { x: contribution }) })
      .eq('id', battleId);
    loadBattles();
  };


  return (
    <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30">
      <h3 className="text-xl font-bold text-c8l-gold mb-4">⚔️ Batallas de Bandos</h3>
      {activeBattle ? (
        <div className="bg-gradient-to-r from-red-900/30 to-purple-900/30 p-4 rounded-lg border border-red-500 animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">Bando 1</div>
              <div className="text-4xl font-black text-c8l-gold">{activeBattle.score1}</div>
            </div>
            <div className="text-2xl font-black text-red-500">VS</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">Bando 2</div>
              <div className="text-4xl font-black text-c8l-gold">{activeBattle.score2}</div>
            </div>
          </div>
          <button onClick={() => contributeToBattle(activeBattle.id)}
            className="w-full py-2 bg-c8l-gold text-black font-bold rounded-lg">
            Contribuir (Regalos y Tareas)
          </button>
          <div className="text-center text-xs text-gray-400 mt-2">
            Tu contribución: {myContributions} pts
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {battles.filter(b => b.status === 'pending').map(battle => (
            <div key={battle.id} className="bg-black/30 p-3 rounded-lg border border-gray-800">
              <div className="flex justify-between items-center">
                <div>Batalla pendiente</div>
                <button className="px-4 py-1 bg-red-600 text-white rounded-lg text-sm font-bold">
                  Iniciar
                </button>
              </div>
            </div>
          ))}
          {!activeBattle && battles.length === 0 && (
            <div className="text-center text-gray-400">No hay batallas activas. ¡Desafía a otro Bando!</div>
          )}
        </div>
      )}
    </div>
  );
}
