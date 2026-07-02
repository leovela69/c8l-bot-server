'use client';
import { motion } from 'framer-motion';
import { Users, Sword, ArrowRight, Lock } from 'lucide-react';

interface Faction {
  id: string;
  name: string;
  description: string;
  level: number;
  xp: number;
  emblem_url: string;
  member_count: number;
  max_members?: number;
  is_open?: boolean;
  color?: string;
}

interface FactionCardProps {
  faction: Faction;
  onJoin: (factionId: string) => void;
  isJoined?: boolean;
}

const MAX_MEMBERS_BY_LEVEL: Record<number, number> = {
  1: 20, 2: 25, 3: 30, 4: 40, 5: 50, 6: 60, 7: 75, 8: 100,
};

export function FactionCard({ faction, onJoin, isJoined }: FactionCardProps) {
  const emblem = faction.emblem_url || '🛡️';
  const maxMembers = faction.max_members ?? MAX_MEMBERS_BY_LEVEL[faction.level] ?? 20;
  const memberPct = Math.min((faction.member_count / maxMembers) * 100, 100);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative w-full rounded-[24px] bg-[#0A0A0A] p-6 border border-[#D4AF37]/20 overflow-hidden transition-all duration-300 group"
      style={{
        boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
      }}
    >
      {/* Hover glow overlay */}
      <div className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1.5px #FF69B4, 0 0 25px rgba(255,105,180,0.25)' }}
      />

      {/* Ambient light blob */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#8A2BE2] opacity-15 rounded-full blur-3xl group-hover:opacity-35 group-hover:bg-[#FF69B4] transition-all duration-700 pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-[#D4AF37] opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-all duration-700 pointer-events-none" />

      {/* Header: Emblem + Name */}
      <div className="flex items-start gap-4 mb-5 relative z-10">
        {/* Neomorphic 3D Emblem */}
        <div
          className="w-16 h-16 rounded-[18px] flex items-center justify-center text-3xl flex-shrink-0 relative"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #8A2BE2 100%)',
            boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.25), 0 8px 20px rgba(212,175,55,0.3)',
          }}
        >
          {emblem}
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-[18px] bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-black text-white uppercase tracking-wide truncate group-hover:text-[#D4AF37] transition-colors duration-300">
              {faction.name}
            </h3>
            {!faction.is_open && (
              <Lock size={11} className="text-gray-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
              <Sword size={9} /> NV. {faction.level}
            </span>
            {!faction.is_open && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.3)', color: '#a78bfa' }}>
                PRIVADO
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-5 relative z-10">
        {faction.description || 'Un bando legendario que busca guerreros dignos de su emblema.'}
      </p>

      {/* Live Progress Bar */}
      <div className="mb-5 relative z-10">
        <div className="flex justify-between text-[10px] mb-2">
          <span className="text-gray-500 flex items-center gap-1 font-mono">
            <Users size={10} className="text-[#00F3FF]" /> Miembros de la Familia
          </span>
          <span className="font-black" style={{ color: '#FF69B4' }}>
            {faction.member_count}/{maxMembers}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden p-[2px] border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${memberPct}%` }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #8A2BE2, #FF69B4, #D4AF37)',
              boxShadow: '0 0 10px #FF69B4',
            }}
          />
        </div>
      </div>

      {/* XP Badge */}
      <div className="flex items-center gap-2 mb-5 relative z-10">
        <div className="text-[9px] font-mono text-gray-600 flex items-center gap-1">
          <span className="text-[#D4AF37]">✦</span> {faction.xp.toLocaleString()} XP acumulado
        </div>
      </div>

      {/* CTA Button — 3D Capsule with Liquid Glow */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onJoin(faction.id)}
        disabled={!faction.is_open && !isJoined}
        className="relative w-full py-3 rounded-[50px] font-black tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-2 z-10 overflow-hidden"
        style={
          isJoined
            ? {
                background: 'linear-gradient(90deg, #00F3FF22, #0A0A0A)',
                border: '1.5px solid #00F3FF55',
                color: '#00F3FF',
                boxShadow: '0 0 15px rgba(0,243,255,0.2)',
              }
            : !faction.is_open
            ? {
                background: 'rgba(255,255,255,0.03)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                color: '#444',
                cursor: 'not-allowed',
              }
            : {
                background: 'linear-gradient(90deg, #D4AF37, #8A2BE2)',
                color: '#000',
                boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
              }
        }
      >
        {/* Shine sweep on hover */}
        <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {isJoined ? (
          <>INGRESAR A MI BANDO <ArrowRight size={14} /></>
        ) : !faction.is_open ? (
          <><Lock size={14} /> BANDO CERRADO</>
        ) : (
          <>SOLICITAR INGRESO VIP <ArrowRight size={14} /></>
        )}
      </motion.button>
    </motion.div>
  );
}
