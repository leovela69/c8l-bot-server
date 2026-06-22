'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export function FactionList({ userId, onSelectFaction }) {
  const [factions, setFactions] = useState([]);
  const [myFaction, setMyFaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFactions();
    loadMyFaction();
  }, []);

  const loadFactions = async () => {
    const { data } = await supabase
      .from('factions').select('*').order('level', { ascending: false });
    setFactions(data || []);
    setLoading(false);
  };

  const loadMyFaction = async () => {
    const { data } = await supabase
      .from('faction_members').select('faction_id').eq('user_id', userId).single();
    if (data) {
      const { data: faction } = await supabase
        .from('factions').select('*').eq('id', data.faction_id).single();
      setMyFaction(faction);
    }
  };

  const joinFaction = async (factionId) => {
    await supabase.from('faction_members').insert({ faction_id: factionId, user_id: userId });
    loadMyFaction();
  };

  const createFaction = async (name, description, emblem) => {
    const { data } = await supabase.from('factions').insert({
      name, description, emblem, created_by: userId
    }).select().single();
    if (data) {
      await supabase.from('faction_members').insert({
        faction_id: data.id, user_id: userId, role: 'leader'
      });
      loadMyFaction();
    }
  };


  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-3xl font-black text-c8l-gold mb-4 text-center">🏰 BANDOS C8L</h2>
      {myFaction ? (
        <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30 mb-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{myFaction.emblem}</div>
            <div>
              <div className="text-xl font-bold text-white">{myFaction.name}</div>
              <div className="text-sm text-gray-400">Nivel {myFaction.level} • {myFaction.total_members} miembros</div>
            </div>
            <button onClick={() => onSelectFaction(myFaction.id)}
              className="ml-auto px-4 py-2 bg-c8l-gold text-black font-bold rounded-lg">
              Gestionar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30 mb-4">
          <p className="text-gray-400 text-center">No perteneces a ningún Bando. ¡Únete o crea uno!</p>
          <button className="w-full mt-2 px-4 py-2 bg-c8l-gold text-black font-bold rounded-lg"
            onClick={() => createFaction('Nuevo Bando', 'Descripción', '⚔️')}>
            Crear Bando (1000 Coins)
          </button>
        </div>
      )}
      <div className="relative mb-4">
        <input type="text" placeholder="Buscar Bandos..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/50 border border-c8l-gold/30 rounded-lg px-4 py-2 text-white" />
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {factions.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(faction => (
          <motion.div key={faction.id} whileHover={{ scale: 1.02 }}
            className="bg-black/30 p-3 rounded-lg border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{faction.emblem}</div>
              <div>
                <div className="font-bold text-white">{faction.name}</div>
                <div className="text-xs text-gray-400">Nv.{faction.level} • {faction.total_members} miembros</div>
              </div>
            </div>
            <button onClick={() => joinFaction(faction.id)}
              className="px-4 py-1 bg-c8l-gold/20 text-c8l-gold border border-c8l-gold rounded-lg text-sm font-bold">
              Unirse
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
