// components/halloffame/HallOfFame.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Star, Medal, Calendar, Users, Music, Mic, Award, Flame, Diamond, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

interface HallOfFamer {
  id: string;
  name: string;
  avatar: string;
  title: string;
  badges: string[];
  totalCoins: number;
  totalWins: number;
  totalParties: number;
  bestScore: number;
  legendaryCovers: number;
  joinDate: Date;
  rank: number;
  isLegend: boolean;
}

interface HallCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  criteria: string;
}

const HALL_CATEGORIES: HallCategory[] = [
  { id: 'all', name: 'TODOS LOS TIEMPOS', icon: <Trophy size={20} />, color: '#D4AF37', criteria: 'Puntuación total acumulada' },
  { id: 'legends', name: 'LEYENDAS', icon: <Crown size={20} />, color: '#FF0055', criteria: 'Mínimo 10 victorias semanales' },
  { id: 'voices', name: 'VOCES DE ORO', icon: <Mic size={20} />, color: '#00F3FF', criteria: 'Mejores puntuaciones vocales' },
  { id: 'party', name: 'REYES DE LA FIESTA', icon: <Flame size={20} />, color: '#FF6600', criteria: 'Más fiestas ganadas' },
];

// Miembros del Hall de la Fama (ejemplo - en producción vienen de DB)
const HALL_OF_FAME_MEMBERS: HallOfFamer[] = [
  {
    id: '1',
    name: 'Leo Vela',
    avatar: '🦁',
    title: 'LEYENDA VIVA',
    badges: ['🏆', '👑', '💎', '⭐', '🎤'],
    totalCoins: 125000,
    totalWins: 48,
    totalParties: 156,
    bestScore: 99,
    legendaryCovers: 12,
    joinDate: new Date(2024, 0, 15),
    rank: 1,
    isLegend: true,
  },
  {
    id: '2',
    name: 'Dj_Rayo',
    avatar: '⚡',
    title: 'ELECTRO SHOW',
    badges: ['🏆', '⭐', '🎤'],
    totalCoins: 89200,
    totalWins: 32,
    totalParties: 120,
    bestScore: 96,
    legendaryCovers: 8,
    joinDate: new Date(2024, 1, 20),
    rank: 2,
    isLegend: true,
  },
  {
    id: '3',
    name: 'Reina_Melody',
    avatar: '👑',
    title: 'VOCAL QUEEN',
    badges: ['👑', '💎', '⭐', '🎤'],
    totalCoins: 78400,
    totalWins: 28,
    totalParties: 98,
    bestScore: 98,
    legendaryCovers: 10,
    joinDate: new Date(2024, 2, 10),
    rank: 3,
    isLegend: true,
  },
  {
    id: '4',
    name: 'BeatMaster',
    avatar: '🎧',
    title: 'RITMO PERFECTO',
    badges: ['⭐', '🎤'],
    totalCoins: 45200,
    totalWins: 18,
    totalParties: 87,
    bestScore: 94,
    legendaryCovers: 5,
    joinDate: new Date(2024, 3, 5),
    rank: 4,
    isLegend: false,
  },
  {
    id: '5',
    name: 'Sonic_Flow',
    avatar: '🎤',
    title: 'FLUJO INFINITO',
    badges: ['⭐', '🎤'],
    totalCoins: 38900,
    totalWins: 15,
    totalParties: 72,
    bestScore: 92,
    legendaryCovers: 4,
    joinDate: new Date(2024, 4, 12),
    rank: 5,
    isLegend: false,
  },
];

export function HallOfFame() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<HallOfFamer | null>(null);
  const [filteredMembers, setFilteredMembers] = useState(HALL_OF_FAME_MEMBERS);
  
  useEffect(() => {
    let filtered = [...HALL_OF_FAME_MEMBERS];
    
    switch(selectedCategory) {
      case 'legends':
        filtered = filtered.filter(m => m.isLegend);
        break;
      case 'voices':
        filtered = filtered.sort((a, b) => b.bestScore - a.bestScore);
        break;
      case 'party':
        filtered = filtered.sort((a, b) => b.totalWins - a.totalWins);
        break;
      default:
        filtered = filtered.sort((a, b) => b.totalCoins - a.totalCoins);
    }
    
    setFilteredMembers(filtered);
  }, [selectedCategory]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-6">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center gap-3 mb-3">
          <Trophy className="text-[#D4AF37]" size={48} />
          <span className="text-4xl font-black text-[#D4AF37]">HALL DE LA FAMA</span>
          <Crown className="text-[#D4AF37]" size={48} />
        </div>
        <p className="text-gray-400">Los mejores de la historia de C8L Agency. ¡Leyendas eternas!</p>
      </div>
      
      {/* Categorías */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {HALL_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2 border-2 font-black transition-all flex items-center gap-2 ${
              selectedCategory === cat.id
                ? `bg-[${cat.color}] text-black border-black`
                : 'bg-black text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37]/10'
            }`}
            style={{ borderColor: selectedCategory === cat.id ? '#000' : '#D4AF37' }}
          >
            {cat.icon}
            {cat.name}
          </button>
        ))}
      </div>
      
      {/* Grid de miembros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredMembers.map((member, idx) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedMember(member)}
            className={`relative bg-black border-4 p-6 cursor-pointer transition-all ${
              member.rank === 1 
                ? 'border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.3)]' 
                : member.rank === 2 
                  ? 'border-gray-400' 
                  : member.rank === 3 
                    ? 'border-amber-700' 
                    : 'border-gray-700'
            }`}
          >
            {/* Ribbon de rango */}
            <div className="absolute -top-3 -right-3">
              <div className={`px-3 py-1 text-xs font-black ${
                member.rank === 1 ? 'bg-[#D4AF37] text-black' :
                member.rank === 2 ? 'bg-gray-400 text-black' :
                member.rank === 3 ? 'bg-amber-700 text-white' :
                'bg-gray-800 text-gray-400'
              }`}>
                #{member.rank}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-6xl mb-3">{member.avatar}</div>
              <h3 className="text-xl font-black text-white">{member.name}</h3>
              <div className="text-sm text-[#D4AF37] mb-2">{member.title}</div>
              
              <div className="flex justify-center gap-1 mb-3">
                {member.badges.map((badge, i) => (
                  <span key={i} className="text-lg">{badge}</span>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-900 p-2 rounded">
                  <div className="text-[#D4AF37] font-black">{member.totalCoins.toLocaleString()}</div>
                  <div className="text-gray-500">coins</div>
                </div>
                <div className="bg-gray-900 p-2 rounded">
                  <div className="text-[#D4AF37] font-black">{member.totalWins}</div>
                  <div className="text-gray-500">victorias</div>
                </div>
                <div className="bg-gray-900 p-2 rounded">
                  <div className="text-[#D4AF37] font-black">{member.bestScore}%</div>
                  <div className="text-gray-500">mejor score</div>
                </div>
                <div className="bg-gray-900 p-2 rounded">
                  <div className="text-[#D4AF37] font-black">{member.legendaryCovers}</div>
                  <div className="text-gray-500">covers legendarios</div>
                </div>
              </div>
              
              {member.isLegend && (
                <div className="mt-3 inline-block px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black text-xs font-black rounded-full">
                  🏆 LEYENDA C8L 🏆
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Modal de detalles del miembro */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gradient-to-b from-gray-900 to-black border-4 border-[#D4AF37] max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-7xl">{selectedMember.avatar}</div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedMember.name}</h2>
                    <p className="text-[#D4AF37]">{selectedMember.title}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-white text-2xl">
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black p-3 rounded">
                  <div className="text-gray-500 text-xs">MIEMBRO DESDE</div>
                  <div className="text-white font-mono">{selectedMember.joinDate.toLocaleDateString()}</div>
                </div>
                <div className="bg-black p-3 rounded">
                  <div className="text-gray-500 text-xs">PARTICIPACIONES</div>
                  <div className="text-white font-mono">{selectedMember.totalParties} fiestas</div>
                </div>
              </div>
              
              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-[#D4AF37] font-black mb-3">🏆 LOGROS DESTACADOS</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>🎤 Puntuación más alta</span>
                    <span className="text-[#D4AF37] font-black">{selectedMember.bestScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🎵 Covers legendarios</span>
                    <span className="text-[#D4AF37] font-black">{selectedMember.legendaryCovers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🏆 Victorias en torneos</span>
                    <span className="text-[#D4AF37] font-black">{selectedMember.totalWins}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>💰 Coins acumulados</span>
                    <span className="text-[#D4AF37] font-black">{selectedMember.totalCoins.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button className="flex-1 py-3 bg-[#D4AF37] text-black font-black">ENVIAR REGALO</button>
                <button className="flex-1 py-3 bg-gray-800 text-white font-black">VER PERFIL</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Estadísticas globales */}
      <div className="mt-12 max-w-4xl mx-auto">
        <h3 className="text-center text-[#D4AF37] font-black mb-4">📊 ESTADÍSTICAS GLOBALES</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black border border-gray-800 p-4 text-center">
            <div className="text-3xl text-[#D4AF37] font-black">156</div>
            <div className="text-xs text-gray-500">Fiestas realizadas</div>
          </div>
          <div className="bg-black border border-gray-800 p-4 text-center">
            <div className="text-3xl text-[#D4AF37] font-black">1,234</div>
            <div className="text-xs text-gray-500">Covers subidos</div>
          </div>
          <div className="bg-black border border-gray-800 p-4 text-center">
            <div className="text-3xl text-[#D4AF37] font-black">48</div>
            <div className="text-xs text-gray-500">Leyendas</div>
          </div>
          <div className="bg-black border border-gray-800 p-4 text-center">
            <div className="text-3xl text-[#D4AF37] font-black">2.5M</div>
            <div className="text-xs text-gray-500">Coins repartidos</div>
          </div>
        </div>
      </div>
      
    </div>
  );
}