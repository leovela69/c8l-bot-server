'use client';
import { motion } from 'framer-motion';
import { Users, Sword, ArrowRight } from 'lucide-react';

interface Faction {
  id: string;
  name: string;
  description: string;
  level: number;
  xp: number;
  emblem_url: string;
  member_count: number;
  color?: string;
}

interface FactionCardProps {
  faction: Faction;
  onJoin: (factionId: string) => void;
  isJoined?: boolean;
}

export function FactionCard({ faction, onJoin, isJoined }: FactionCardProps) {
  const emblem = faction.emblem_url || '🛡️';
  const color = faction.color || '#D4AF37';

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className="bg-black/60 border-2 border-gray-800 hover:border-[#D4AF37] rounded-xl p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group shadow-lg"
      style={{ borderLeftColor: color, borderLeftWidth: '5px' }}
    >
      <div>
        {/* Emblem and Level */}
        <div className="flex justify-between items-start mb-3">
          <span className="text-4xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{emblem}</span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-black/60 border border-gray-800 text-gray-400 rounded-full flex items-center gap-0.5">
            <Sword size={10} className="text-[#D4AF37]" /> NV. {faction.level}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-lg font-black text-white group-hover:text-[#D4AF37] transition-colors leading-snug line-clamp-1 font-mono uppercase tracking-wide">
          {faction.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">
          {faction.description || 'Sin descripción disponible para este bando.'}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-gray-900 flex justify-between items-center">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
          <Users size={12} className="text-[#00F3FF]" />
          <span>{faction.member_count || 1} GUERREROS</span>
        </div>

        <button
          onClick={() => onJoin(faction.id)}
          className={`px-4 py-1.5 border text-[10px] font-black tracking-wider rounded transition-all flex items-center gap-1 cursor-pointer uppercase ${
            isJoined
              ? 'bg-[#00F3FF]/10 text-[#00F3FF] border-[#00F3FF]/30 hover:bg-[#00F3FF]/20'
              : 'bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] border-black hover:border-[#D4AF37]'
          }`}
        >
          {isJoined ? 'INGRESAR' : 'UNIRSE'} <ArrowRight size={10} />
        </button>
      </div>
    </motion.div>
  );
}
