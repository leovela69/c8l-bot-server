// components/factions/FactionView.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, TrendingUp, Gift, Share2, 
  MessageCircle, Crown, Star, Zap, Sword, Award
} from 'lucide-react';

interface FactionMember {
  id: string;
  name: string;
  role: 'warlord' | 'captain' | 'member';
  avatar: string;
  level: number;
}

interface FactionActivity {
  id: string;
  user: string;
  action: string;
  time: string;
}

interface Faction {
  id: string;
  name: string;
  emblem: string;
  level: number;
  xp: number;
  xpToNext: number;
  members: FactionMember[];
  activities: FactionActivity[];
  description: string;
  color: string;
}

export function FactionView({ userId, factionId, onJoin }: { userId: string; factionId: string; onJoin: () => void }) {
  const [faction, setFaction] = useState<Faction | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    // Datos de ejemplo para los bandos
    const mockFactions: Record<string, Faction> = {
      '1': {
        id: '1',
        name: 'GUERREROS DEL RITMO',
        emblem: '⚔️',
        level: 12,
        xp: 3400,
        xpToNext: 5000,
        description: 'La vanguardia de la música y el freestyle. Ritmos duros y líricas afiladas.',
        color: '#FF0055',
        members: [
          { id: '1', name: 'Leo Vela', role: 'warlord', avatar: '🦁', level: 42 },
          { id: '2', name: 'Dj Rayo', role: 'captain', avatar: '⚡', level: 35 },
          { id: '3', name: 'Reina Melody', role: 'member', avatar: '👑', level: 28 },
          { id: '4', name: 'Beat Master', role: 'member', avatar: '🎧', level: 20 }
        ],
        activities: [
          { id: 'act_1', user: 'Leo Vela', action: 'subió un nuevo cover de batalla', time: 'hace 5 min' },
          { id: 'act_2', user: 'Dj Rayo', action: 'ganó un duelo de canto', time: 'hace 1 hora' },
          { id: 'act_3', user: 'Reina Melody', action: 'donó 500 coins a la facción', time: 'hace 3 horas' }
        ]
      },
      '2': {
        id: '2',
        name: 'DEFENSORES DE LA ARMONÍA',
        emblem: '🛡️',
        level: 10,
        xp: 1200,
        xpToNext: 4000,
        description: 'Buscamos la perfección vocal y las melodías más puras del multiverso.',
        color: '#00F3FF',
        members: [
          { id: '5', name: 'Vocal Queen', role: 'warlord', avatar: '🦄', level: 40 },
          { id: '6', name: 'Aria Silver', role: 'captain', avatar: '✨', level: 31 },
          { id: '7', name: 'Soprano King', role: 'member', avatar: '🎤', level: 25 }
        ],
        activities: [
          { id: 'act_4', user: 'Vocal Queen', action: 'desbloqueó insignia de oro', time: 'hace 10 min' },
          { id: 'act_5', user: 'Aria Silver', action: 'compartió el cover semanal', time: 'hace 2 horas' }
        ]
      },
      '3': {
        id: '3',
        name: 'EL CLAN DEL ECO',
        emblem: '🏰',
        level: 8,
        xp: 1500,
        xpToNext: 3000,
        description: 'Dominamos los efectos acústicos y reverberaciones digitales. El futuro está en los bytes.',
        color: '#9B59B6',
        members: [
          { id: '8', name: 'Echo Lord', role: 'warlord', avatar: '👽', level: 38 },
          { id: '9', name: 'Delay Queen', role: 'captain', avatar: '🌀', level: 30 }
        ],
        activities: [
          { id: 'act_6', user: 'Echo Lord', action: 'inició un ensayo grupal', time: 'hace 30 min' }
        ]
      }
    };

    setFaction(mockFactions[factionId] || mockFactions['1']);
  }, [factionId]);

  if (!faction) return null;

  const handleJoin = () => {
    setJoined(true);
    onJoin();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'warlord': return { text: 'Señor de la Guerra', color: 'bg-red-600/30 text-red-500 border-red-500' };
      case 'captain': return { text: 'Capitán', color: 'bg-[#00F3FF]/30 text-[#00F3FF] border-[#00F3FF]' };
      default: return { text: 'Soldado', color: 'bg-gray-800 text-gray-400 border-gray-700' };
    }
  };

  return (
    <div className="bg-[#0c0c16] border-4 border-black p-6 shadow-[8px_8px_0px_#000] relative overflow-hidden" style={{ borderColor: faction.color }}>
      {/* Background radial glow */}
      <div 
        className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-20"
        style={{ backgroundColor: faction.color }}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-dashed border-gray-800 pb-6">
          <div className="text-7xl mb-3 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{faction.emblem}</div>
          <h2 className="text-3xl font-heading font-black text-white tracking-wide" style={{ textShadow: `0 0 10px ${faction.color}40` }}>
            BANDO: {faction.name}
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mt-2 italic">
            "{faction.description}"
          </p>
          
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <span className="font-bold flex items-center gap-1" style={{ color: faction.color }}>
              <Sword size={16} /> Nivel {faction.level}
            </span>
            <span className="text-gray-300 font-bold flex items-center gap-1">
              <Users size={16} /> {faction.members.length} Guerreros
            </span>
          </div>
        </div>

        {/* Progreso del Bando */}
        <div className="bg-black/40 p-4 border-2 border-gray-900 rounded-lg mb-6">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-gray-400">EXP DE BANDO</span>
            <span style={{ color: faction.color }}>{faction.xp} / {faction.xpToNext} XP</span>
          </div>
          <div className="h-4 bg-gray-950 border border-gray-800 rounded-full p-0.5 overflow-hidden">
            <motion.div 
              className="h-full rounded-full" 
              style={{ backgroundColor: faction.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(faction.xp / faction.xpToNext) * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Contenido en dos columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Miembros */}
          <div>
            <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
              <Crown size={18} style={{ color: faction.color }} /> MIEMBROS DE HONOR
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {faction.members.map(member => {
                const badge = getRoleBadge(member.role);
                return (
                  <div key={member.id} className="bg-black/50 p-3 border border-gray-900 flex justify-between items-center hover:border-gray-800 transition-all rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{member.avatar}</span>
                      <div>
                        <div className="font-bold text-white text-sm">{member.name}</div>
                        <div className="text-xs text-gray-500">Nivel {member.level}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 border rounded ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actividad Reciente */}
          <div>
            <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
              <TrendingUp size={18} style={{ color: faction.color }} /> BITÁCORA DE GUERRA
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {faction.activities.map(activity => (
                <div key={activity.id} className="bg-black/20 p-3 border border-gray-950 flex flex-col gap-1 rounded">
                  <div className="text-xs text-gray-400">
                    <span className="font-bold text-white">{activity.user}</span> {activity.action}
                  </div>
                  <div className="text-[10px] text-gray-600 font-mono text-right">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <div className="text-center pt-2">
          {joined ? (
            <div className="py-3 bg-green-950/40 border-2 border-green-500 text-green-400 font-black text-lg animate-pulse rounded">
              🟢 ¡TE HAS UNIDO A ESTE BANDO CON ÉXITO!
            </div>
          ) : (
            <button
              onClick={handleJoin}
              className="w-full py-4 bg-gradient-to-r text-black font-heading font-black text-xl border-4 border-black hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[4px_4px_0px_#000]"
              style={{ 
                backgroundImage: `linear-gradient(to right, ${faction.color}, ${faction.color}dd)`,
              }}
            >
              🛡️ UNIRSE AL BANDO DE LOS {faction.name} 🛡️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}