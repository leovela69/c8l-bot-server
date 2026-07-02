// components/social/AvatarSeat.tsx
import { motion } from 'framer-motion';
import { Mic, Gift, LogOut, Plus } from 'lucide-react';

interface AvatarSeatProps {
  seatNumber: number;
  user?: {
    id: string;
    name: string;
    avatar: string;
    isOnStage: boolean;
    isSpeaking: boolean;
    giftsSent: number;
    starsReceived?: number;
    isSinging?: boolean;
    badges?: string[];
  } | null;
  isCurrentUser: boolean;
  onSit: () => void;
  onLeave: () => void;
  onSendGift: () => void;
}

export function AvatarSeat({ seatNumber, user, isCurrentUser, onSit, onLeave, onSendGift }: AvatarSeatProps) {
  if (!user) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onSit}
        className="relative border-2 border-dashed border-gray-800 bg-black/30 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/50 rounded-lg p-3 transition-all cursor-pointer flex items-center justify-between group h-[64px]"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl text-gray-600 group-hover:text-[#D4AF37] transition-colors">💺</div>
          <div>
            <div className="text-sm font-bold text-gray-500 group-hover:text-gray-300">Vacío</div>
            <div className="text-[10px] text-gray-600">Sillón {seatNumber}</div>
          </div>
        </div>
        <div className="p-1.5 border border-dashed border-gray-700 rounded-full group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37]/10 transition-all">
          <Plus size={14} className="text-gray-500 group-hover:text-[#D4AF37]" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative border-2 rounded-lg p-3 transition-all h-[64px] flex items-center justify-between group ${
        user.isOnStage 
          ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
          : 'border-gray-700 bg-black/60 hover:border-gray-500'
      }`}
    >
      {/* Indicador de que está hablando */}
      {user.isSpeaking && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border border-black rounded-full animate-pulse" />
      )}
      
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <div className="text-3xl">{user.avatar}</div>
        <div className="overflow-hidden flex-1">
          <div className="font-bold text-sm flex items-center gap-1 text-white truncate">
            {user.name}
            {user.isOnStage && <Mic size={12} className="text-[#D4AF37]" />}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span>Sillón {seatNumber}</span>
            {user.starsReceived && user.starsReceived > 0 ? (
              <span className="text-[#D4AF37] font-bold">⭐ {user.starsReceived} Stars</span>
            ) : null}
          </div>
        </div>
      </div>
      
      <div className="flex gap-1 ml-2 shrink-0">
        {!isCurrentUser ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onSendGift(); }} 
            className="p-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded hover:bg-[#D4AF37]/40 text-[#D4AF37] transition-all"
            title="Enviar Regalo"
          >
            <Gift size={14} />
          </button>
        ) : (
          <button 
            onClick={(e) => { e.stopPropagation(); onLeave(); }} 
            className="p-1.5 bg-red-500/20 border border-red-500/30 rounded hover:bg-red-500/40 text-red-400 transition-all"
            title="Dejar Butaca"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}