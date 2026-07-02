// components/games/ClanSystem.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase/client';

export interface Clan {
  id: string;
  name: string;
  emblem: string;
  leader_id: string;
  member_count: number;
  total_damage: number;
  wins: number;
}

export interface ClanMember {
  id: string;
  clan_id: string;
  user_id: string;
  user_name: string;
  role: string;
  total_damage: number;
}

interface ClanSystemProps {
  userId: string;
  userName: string;
  userCoins: number;
  setUserCoins: React.Dispatch<React.SetStateAction<number>>;
  onClanBattleStart?: (clanId: string) => void;
}

const CLAN_EMBLEMS = [
  { id: 'lightning', emoji: '⚡', name: 'Rayo' },
  { id: 'flame', emoji: '🔥', name: 'Fuego' },
  { id: 'water', emoji: '💧', name: 'Agua' },
  { id: 'earth', emoji: '🌍', name: 'Tierra' },
  { id: 'crown', emoji: '👑', name: 'Corona' },
  { id: 'music', emoji: '🎵', name: 'Música' },
  { id: 'diamond', emoji: '💎', name: 'Diamante' },
  { id: 'skull', emoji: '💀', name: 'Calavera' }
];

export function ClanSystem({ userId, userName, userCoins, setUserCoins, onClanBattleStart }: ClanSystemProps) {
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [clans, setClans] = useState<Clan[]>([]);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClanName, setNewClanName] = useState('');
  const [selectedEmblem, setSelectedEmblem] = useState(CLAN_EMBLEMS[0]);
  const [clanBattleActive, setClanBattleActive] = useState(false);
  const [battleOpponent, setBattleOpponent] = useState<Clan | null>(null);
  const [battleProgress, setBattleProgress] = useState({ ourDamage: 0, theirDamage: 0 });
  
  // Cargar clanes
  useEffect(() => {
    loadClans();
    loadMyClan();
  }, [userId]);
  
  const loadClans = async () => {
    const { data } = await supabase
      .from('clans')
      .select('*')
      .order('total_damage', { ascending: false });
    setClans(data || []);
  };
  
  const loadMyClan = async () => {
    const { data: member } = await supabase
      .from('clan_members')
      .select('clan_id, role')
      .eq('user_id', userId)
      .single();
    
    if (member) {
      setMyRole(member.role);
      const { data: clan } = await supabase
        .from('clans')
        .select('*')
        .eq('id', member.clan_id)
        .single();
      setMyClan(clan);
      
      const { data: members } = await supabase
        .from('clan_members')
        .select('*')
        .eq('clan_id', member.clan_id);
      setClanMembers(members || []);
    }
  };
  
  const createClan = async () => {
    if (!newClanName.trim()) return;
    if (userCoins < 1000) {
      alert('❌ Crear un clan cuesta 1000 coins');
      return;
    }
    
    setUserCoins(userCoins - 1000);
    
    const { data: clan } = await supabase
      .from('clans')
      .insert({
        name: newClanName,
        emblem: selectedEmblem.emoji,
        leader_id: userId,
        member_count: 1,
        total_damage: 0,
        wins: 0
      })
      .select()
      .single();
    
    await supabase
      .from('clan_members')
      .insert({
        clan_id: clan.id,
        user_id: userId,
        user_name: userName,
        role: 'leader',
        total_damage: 0
      });
    
    setShowCreateModal(false);
    setNewClanName('');
    loadClans();
    loadMyClan();
  };
  
  const joinClan = async (clanId: string) => {
    await supabase
      .from('clan_members')
      .insert({
        clan_id: clanId,
        user_id: userId,
        user_name: userName,
        role: 'member',
        total_damage: 0
      });
    
    await supabase
      .from('clans')
      .update({ member_count: supabase.rpc('increment') })
      .eq('id', clanId);
    
    loadClans();
    loadMyClan();
  };
  
  const startClanBattle = async (opponentClan: Clan) => {
    if (clanBattleActive) return;
    
    setBattleOpponent(opponentClan);
    setClanBattleActive(true);
    setBattleProgress({ ourDamage: 0, theirDamage: 0 });
    onClanBattleStart?.(opponentClan.id);
    
    // Simular batalla de 30 segundos
    setTimeout(() => endClanBattle(opponentClan), 30000);
  };
  
  const contributeDamage = (damage: number) => {
    if (!clanBattleActive || !myClan || !battleOpponent) return;
    
    setBattleProgress(prev => ({
      ourDamage: prev.ourDamage + damage,
      theirDamage: prev.theirDamage
    }));
  };
  
  const endClanBattle = async (opponent: Clan) => {
    setClanBattleActive(false);
    
    const ourTotal = battleProgress.ourDamage;
    const theirTotal = battleProgress.theirDamage;
    const weWon = ourTotal > theirTotal;
    
    if (weWon && myClan) {
      // Ganamos
      const reward = 2000;
      setUserCoins((prev: number) => prev + reward);
      
      await supabase
        .from('clans')
        .update({ 
          total_damage: supabase.rpc('increment', { x: ourTotal }),
          wins: supabase.rpc('increment')
        })
        .eq('id', myClan.id);
      
      alert(`🎉 ¡VENCIMOS A ${opponent.name}! +${reward} coins para el clan 🎉`);
    } else {
      // Perdimos
      alert(`😢 Perdimos contra ${opponent.name}. ¡La próxima será!`);
    }
    
    setBattleOpponent(null);
  };
  
  return (
    <div className="border-4 border-black bg-[#0d0d0e] p-6 shadow-[8px_8px_0px_#D4AF37]">
      <h2 className="text-2xl font-black text-[#D4AF37] mb-4 flex items-center gap-2">
        <span>🏰</span> CLANES C8L <span className="text-sm text-gray-500">(¡Uníos o morid solos!)</span>
      </h2>
      
      {!myClan ? (
        // No estás en ningún clan
        <div>
          <div className="text-center mb-6">
            <p className="text-gray-400 mb-4">No perteneces a ningún clan. ¡Únete o crea el tuyo!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#D4AF37] text-black font-black mr-4"
            >
              ✨ CREAR CLAN (1000 coins)
            </button>
          </div>
          
          {/* Lista de clanes existentes */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-2">🏆 CLANES ACTIVOS</h3>
            {clans.map(clan => (
              <div key={clan.id} className="bg-black p-3 border border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{clan.emblem}</span>
                  <div>
                    <div className="font-bold">{clan.name}</div>
                    <div className="text-xs text-gray-500">{clan.member_count} miembros • {clan.wins} victorias</div>
                  </div>
                </div>
                <button
                  onClick={() => joinClan(clan.id)}
                  className="px-4 py-2 bg-[#00F3FF] text-black text-sm font-bold"
                >
                  UNIRSE
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Estás en un clan
        <div>
          {/* Header del clan */}
          <div className="bg-black p-4 border-2 border-[#D4AF37] mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{myClan.emblem}</span>
                <div>
                  <div className="text-2xl font-black text-[#D4AF37]">{myClan.name}</div>
                  <div className="text-xs text-gray-400">
                    Líder: {myClan.leader_id === userId ? 'TÚ' : myClan.leader_id.slice(0, 8)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">{myClan.wins} 🏆</div>
                <div className="text-xs text-gray-500">{myClan.member_count} miembros</div>
              </div>
            </div>
          </div>
          
          {/* Batalla activa */}
          {clanBattleActive && battleOpponent && (
            <div className="bg-gradient-to-r from-red-950 to-black p-4 mb-6 border-2 border-red-500">
              <div className="text-center mb-3">
                <span className="text-[#FF0055] animate-pulse">⚔️ BATALLA DE CLANES ACTIVA ⚔️</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-2xl">{myClan.emblem}</div>
                  <div className="font-bold">{myClan.name}</div>
                  <div className="text-xl font-mono text-[#00F3FF]">{battleProgress.ourDamage}</div>
                </div>
                <div className="text-3xl font-black text-red-500">VS</div>
                <div className="text-center">
                  <div className="text-2xl">{battleOpponent.emblem}</div>
                  <div className="font-bold">{battleOpponent.name}</div>
                  <div className="text-xl font-mono text-[#FF0055]">{battleProgress.theirDamage}</div>
                </div>
              </div>
              <div className="mt-3 text-center text-xs text-gray-400">
                ¡Ataca en la RAID para contribuir al daño de tu clan!
              </div>
            </div>
          )}
          
          {/* Miembros del clan */}
          <div className="mb-6">
            <h3 className="text-sm font-mono text-[#D4AF37] mb-2">👥 MIEMBROS ({clanMembers.length})</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {clanMembers.map(member => (
                <div key={member.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-800">
                  <span className="flex items-center gap-2">
                    {member.role === 'leader' && '👑'}
                    {member.role === 'co_leader' && '⭐'}
                    {member.role === 'member' && '👤'}
                    {member.user_name}
                  </span>
                  <span className="text-[#D4AF37] text-xs">{member.total_damage.toLocaleString()} daño</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Ranking de clanes */}
          <div>
            <h3 className="text-sm font-mono text-[#D4AF37] mb-2">🏆 RANKING GLOBAL</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {clans.slice(0, 10).map((clan, idx) => (
                <div key={clan.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-800">
                  <span className="flex items-center gap-2">
                    <span className="w-6">{idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}.`}</span>
                    <span>{clan.emblem}</span>
                    <span>{clan.name}</span>
                  </span>
                  <div className="flex gap-4">
                    <span className="text-[#00F3FF] text-xs">{clan.wins} 🏆</span>
                    {!myClan || myClan.id !== clan.id ? (
                      <button
                        onClick={() => startClanBattle(clan)}
                        disabled={clanBattleActive}
                        className="text-[10px] px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        DESAFIAR
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">(tu clan)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para crear clan */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <div className="bg-[#0d0d0e] border-4 border-[#D4AF37] p-6 max-w-md w-full">
              <h3 className="text-xl font-black text-[#D4AF37] mb-4">✨ CREAR NUEVO CLAN</h3>
              
              <input
                type="text"
                placeholder="Nombre del clan"
                value={newClanName}
                onChange={(e) => setNewClanName(e.target.value)}
                className="w-full bg-black border-2 border-gray-700 p-2 text-white mb-4"
                maxLength={20}
              />
              
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Emblema:</div>
                <div className="grid grid-cols-4 gap-2">
                  {CLAN_EMBLEMS.map(emblem => (
                    <button
                      key={emblem.id}
                      onClick={() => setSelectedEmblem(emblem)}
                      className={`p-3 text-3xl border-2 transition-all ${
                        selectedEmblem.id === emblem.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/20'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {emblem.emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={createClan}
                  className="flex-1 py-3 bg-[#D4AF37] text-black font-black"
                >
                  CREAR (1000 coins)
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-800 text-white font-black"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}