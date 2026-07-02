'use client';
import { motion } from 'framer-motion';
import { Gift, LogIn, LogOut, Mic } from 'lucide-react';

interface UserSeat {
  id: string;
  name: string;
  avatar: string;
  isOnStage?: boolean;
  isSinging?: boolean;
  isSpeaking?: boolean;
  giftsSent?: number;
  badges?: string[];
  starsReceived?: number;
  seatNumber?: number;
}

interface AvatarSeatProps {
  seatNumber: number;
  user: UserSeat | null;
  isCurrentUser?: boolean;
  onSit?: () => void;
  onLeave?: () => void;
  onSendGift: (userId: string) => void;
}

export function AvatarSeat({ seatNumber, user, isCurrentUser, onSit, onLeave, onSendGift }: AvatarSeatProps) {
  if (!user) {
    // Butaca vacía
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-black/20 border border-dashed border-gray-800 rounded-lg p-3 flex justify-between items-center opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl grayscale">💺</span>
          <div>
            <p className="text-xs text-gray-600 font-bold">Sillón {seatNumber}</p>
            <p className="text-[10px] text-gray-700">Vacío</p>
          </div>
        </div>
        {onSit && (
          <button
            onClick={onSit}
            className="p-1.5 bg-[#D4AF37]/10 rounded-full hover:bg-[#D4AF37]/30 transition cursor-pointer"
            title="Sentarse"
          >
            <LogIn size={14} className="text-[#D4AF37]" />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className={`border rounded-lg p-3 flex justify-between items-center transition-all ${
        isCurrentUser
          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50'
          : 'bg-black/40 border-gray-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="text-2xl">{user.avatar}</span>
          {user.isOnStage && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-black" title="En escenario" />
          )}
          {user.isSinging && (
            <Mic size={8} className="absolute -bottom-1 -right-1 text-[#00F3FF]" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className={`font-bold text-sm ${isCurrentUser ? 'text-[#D4AF37]' : 'text-white'}`}>
              {user.name}
            </p>
            {user.badges?.map((badge, i) => (
              <span key={i} className="text-xs">{badge}</span>
            ))}
          </div>
          <p className="text-[10px] text-gray-500">
            Sillón {seatNumber}
            {user.starsReceived ? ` · ⭐ ${user.starsReceived}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {!isCurrentUser && (
          <button
            onClick={() => onSendGift(user.id)}
            className="p-1.5 bg-[#FF69B4]/20 rounded-full hover:bg-[#FF69B4]/40 transition cursor-pointer"
            title="Enviar regalo"
          >
            <Gift size={14} className="text-[#FF69B4]" />
          </button>
        )}
        {isCurrentUser && onLeave && (
          <button
            onClick={onLeave}
            className="p-1.5 bg-red-900/30 rounded-full hover:bg-red-900/50 transition cursor-pointer"
            title="Dejar butaca"
          >
            <LogOut size={14} className="text-red-400" />
          </button>
        )}
      </div>
    </motion.div>
  );
}