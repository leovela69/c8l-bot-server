'use client';
import { motion } from 'framer-motion';
import { LogIn, LogOut, Mic, MicOff, Gift, ShieldAlert } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface UserSeat {
  id: string;
  name: string;
  avatar: string;
  seatNumber: number;
  is_singing: boolean;
  is_muted: boolean;
  badges?: string[];
  starsReceived?: number;
}

interface SeatManagerProps {
  roomId: string;
  seats: (UserSeat | null)[];
  isOwner: boolean;
  currentUserId?: string;
  onSit: (seatNumber: number) => void;
  onLeave: (seatNumber: number) => void;
  onToggleMute: (seatNumber: number, currentMutedState: boolean) => void;
  onKick: (targetUserId: string) => void;
  onSendGift: (targetUser: UserSeat, seatNumber: number) => void;
}

export function SeatManager({
  roomId,
  seats,
  isOwner,
  currentUserId,
  onSit,
  onLeave,
  onToggleMute,
  onKick,
  onSendGift
}: SeatManagerProps) {
  const { user } = useApp();

  // Create full array of 15 seats
  const seatsArray = Array(15).fill(null);
  seats.forEach((seat) => {
    if (seat && seat.seatNumber >= 1 && seat.seatNumber <= 15) {
      seatsArray[seat.seatNumber - 1] = seat;
    }
  });

  return (
    <div className="bg-black/60 border-2 border-gray-800 rounded-xl p-4 flex flex-col h-full">
      <h3 className="text-sm font-black text-[#D4AF37] mb-4 flex items-center justify-between font-mono uppercase tracking-wider">
        <span>🛋️ BUTACAS QUANTUM (15)</span>
        <span className="text-[10px] text-gray-500 font-mono">
          Ocupados: {seats.filter(Boolean).length} / 15
        </span>
      </h3>

      {/* 3x5 Grid Layout (arranged like theater rows) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-1">
        {seatsArray.map((seatUser, index) => {
          const seatNumber = index + 1;
          const isCurrentUser = seatUser?.id === currentUserId;
          
          if (!seatUser) {
            // Vacant seat
            return (
              <motion.div
                key={`empty-${index}`}
                whileHover={{ scale: 1.02, borderColor: '#D4AF37' }}
                className="bg-black/40 border border-dashed border-gray-800 rounded-lg p-2 flex flex-col items-center justify-center min-h-[90px] group transition-all duration-300 relative"
              >
                <span className="text-xl text-gray-700 group-hover:scale-110 transition-transform">🛋️</span>
                <span className="text-[9px] text-gray-650 font-mono mt-1">Sillón {seatNumber}</span>
                <button
                  onClick={() => onSit(seatNumber)}
                  className="mt-1.5 p-1 bg-gray-900 border border-gray-800 text-gray-500 hover:text-[#00F3FF] hover:border-[#00F3FF] rounded text-[8px] font-bold flex items-center gap-0.5 cursor-pointer transition-all uppercase"
                >
                  <LogIn size={8} /> Sentarse
                </button>
              </motion.div>
            );
          }

          // Occupied seat
          return (
            <motion.div
              key={`occupied-${seatUser.id}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ y: -2 }}
              className={`border rounded-lg p-2.5 flex flex-col items-center justify-between min-h-[90px] relative transition-all duration-300 ${
                seatUser.is_singing
                  ? 'bg-purple-950/20 border-[#FF0055] shadow-[0_0_12px_rgba(255,0,85,0.4)] animate-pulse'
                  : isCurrentUser
                  ? 'bg-[#D4AF37]/10 border-[#D4AF37]'
                  : 'bg-gray-950/80 border-gray-805'
              }`}
            >
              {/* Singer indicator glow */}
              {seatUser.is_singing && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FF0055] text-white text-[7px] font-black px-1 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
                  <Mic size={6} className="animate-bounce" /> CANTANDO
                </span>
              )}

              {/* Avatar and Info */}
              <div className="flex flex-col items-center text-center mt-1">
                <span className="text-2xl mb-1">{seatUser.avatar}</span>
                <span className={`text-[10px] font-black truncate w-20 leading-none ${
                  isCurrentUser ? 'text-[#D4AF37]' : 'text-white'
                }`}>
                  {seatUser.name}
                </span>
                <span className="text-[8px] text-gray-500 font-mono mt-0.5">
                  Sillón {seatNumber}
                </span>
              </div>

              {/* Actions panel */}
              <div className="flex gap-1.5 mt-2 justify-center items-center">
                {/* Send Gift (except to self) */}
                {!isCurrentUser && (
                  <button
                    onClick={() => onSendGift(seatUser, seatNumber)}
                    className="p-1 bg-[#FF0055]/10 hover:bg-[#FF0055]/30 text-[#FF0055] border border-[#FF0055]/20 hover:border-[#FF0055] rounded-full transition-all cursor-pointer"
                    title="Enviar Regalo"
                  >
                    <Gift size={10} />
                  </button>
                )}

                {/* Mute/Unmute Mic (Self or Owner) */}
                {(isCurrentUser || isOwner) && (
                  <button
                    onClick={() => onToggleMute(seatNumber, seatUser.is_muted)}
                    className={`p-1 rounded-full border transition-all cursor-pointer ${
                      seatUser.is_muted
                        ? 'bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40'
                        : 'bg-green-900/20 border-green-700 text-green-400 hover:bg-green-900/40'
                    }`}
                    title={seatUser.is_muted ? 'Activar micrófono' : 'Silenciar micrófono'}
                  >
                    {seatUser.is_muted ? <MicOff size={10} /> : <Mic size={10} />}
                  </button>
                )}

                {/* Leave (Self) */}
                {isCurrentUser && (
                  <button
                    onClick={() => onLeave(seatNumber)}
                    className="p-1 bg-gray-900 hover:bg-red-950/30 text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-800 rounded-full transition-all cursor-pointer"
                    title="Dejar butaca"
                  >
                    <LogOut size={10} />
                  </button>
                )}

                {/* Kick from room/seat (Owner only, can't kick self) */}
                {isOwner && !isCurrentUser && (
                  <button
                    onClick={() => onKick(seatUser.id)}
                    className="p-1 bg-red-950/20 hover:bg-red-700 hover:text-white text-red-500 border border-red-900/30 rounded-full transition-all cursor-pointer"
                    title="Expulsar de butaca"
                  >
                    <ShieldAlert size={10} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
