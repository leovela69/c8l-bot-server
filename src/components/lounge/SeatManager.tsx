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

  const renderSeat = (index: number) => {
    const seatNumber = index + 1;
    const seatUser = seatsArray[index];
    const isCurrentUser = seatUser?.id === currentUserId;

    if (!seatUser) {
      // Vacant seat
      return (
        <motion.div
          key={`empty-${index}`}
          whileHover={{ scale: 1.02, borderColor: '#D4AF37' }}
          className="bg-black/40 border border-dashed border-gray-800 rounded-lg p-2.5 flex flex-col items-center justify-center min-h-[95px] group transition-all duration-300 relative"
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
        className={`border rounded-lg p-2.5 flex flex-col items-center justify-between min-h-[95px] relative transition-all duration-300 ${
          seatUser.is_singing
            ? 'bg-purple-950/20 border-[#FF0055] shadow-[0_0_12px_rgba(255,0,85,0.4)] animate-pulse'
            : isCurrentUser
            ? 'bg-[#D4AF37]/10 border-[#D4AF37]'
            : 'bg-gray-950/80 border-gray-800'
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
          <span className={`text-[10px] font-black truncate w-16 leading-none ${
            isCurrentUser ? 'text-[#D4AF37]' : 'text-white'
          }`}>
            {seatUser.name}
          </span>
          <span className="text-[8px] text-gray-500 font-mono mt-0.5">
            Sillón {seatNumber}
          </span>
        </div>

        {/* Actions panel */}
        <div className="flex gap-1 mt-1.5 justify-center items-center">
          {/* Send Gift (except to self) */}
          {!isCurrentUser && (
            <button
              onClick={() => onSendGift(seatUser, seatNumber)}
              className="p-1 bg-[#FF0055]/10 hover:bg-[#FF0055]/30 text-[#FF0055] border border-[#FF0055]/20 hover:border-[#FF0055] rounded-full transition-all cursor-pointer"
              title="Enviar Regalo"
            >
              <Gift size={9} />
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
              {seatUser.is_muted ? <MicOff size={9} /> : <Mic size={9} />}
            </button>
          )}

          {/* Leave (Self) */}
          {isCurrentUser && (
            <button
              onClick={() => onLeave(seatNumber)}
              className="p-1 bg-gray-900 hover:bg-red-950/30 text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-800 rounded-full transition-all cursor-pointer"
              title="Dejar butaca"
            >
              <LogOut size={9} />
            </button>
          )}

          {/* Kick from room/seat (Owner only, can't kick self) */}
          {isOwner && !isCurrentUser && (
            <button
              onClick={() => onKick(seatUser.id)}
              className="p-1 bg-red-950/20 hover:bg-red-700 hover:text-white text-red-500 border border-red-900/30 rounded-full transition-all cursor-pointer"
              title="Expulsar de butaca"
            >
              <ShieldAlert size={9} />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-black/85 border-4 border-black rounded-2xl p-5 flex flex-col h-full shadow-[8px_8px_0px_rgba(0,0,0,1)]">
      <h3 className="text-sm font-black text-[#D4AF37] mb-6 flex items-center justify-between font-mono uppercase tracking-wider border-b-2 border-dashed border-gray-800 pb-3">
        <span className="flex items-center gap-2">🛋️ BUTACAS QUANTUM LOUNGE</span>
        <span className="text-[10px] text-gray-500 font-mono bg-black/60 border border-gray-800 px-2 py-0.5 rounded-full">
          Ocupados: {seats.filter(Boolean).length} / 15
        </span>
      </h3>

      <div className="space-y-6 overflow-y-auto pr-1">
        {/* Row 1: BANDO 1 */}
        <div className="bg-purple-950/5 border border-purple-500/20 rounded-xl p-3.5 relative">
          <div className="absolute -top-3 left-4 bg-purple-950/90 border border-purple-500 text-purple-400 text-[8px] font-black font-mono px-2 py-0.5 rounded uppercase tracking-wider">
            🛡️ BANDO 1 (Butacas 1-4)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1.5">
            {[0, 1, 2, 3].map(renderSeat)}
          </div>
        </div>

        {/* Row 2: TAREAS / STAFF */}
        <div className="bg-black/60 border border-gray-800 rounded-xl p-3.5 relative">
          <div className="absolute -top-3 left-4 bg-gray-900 border border-gray-700 text-gray-400 text-[8px] font-black font-mono px-2 py-0.5 rounded uppercase tracking-wider">
            ⚙️ TAREAS & STAFF (Butacas 5-8)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1.5">
            {[4, 5, 6, 7].map(renderSeat)}
          </div>
        </div>

        {/* Row 3: BANDO 2 */}
        <div className="bg-pink-950/5 border border-pink-500/20 rounded-xl p-3.5 relative">
          <div className="absolute -top-3 left-4 bg-pink-950/90 border border-pink-500 text-pink-400 text-[8px] font-black font-mono px-2 py-0.5 rounded uppercase tracking-wider">
            ⚔️ BANDO 2 (Butacas 9-12)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1.5">
            {[8, 9, 10, 11].map(renderSeat)}
          </div>
        </div>

        {/* Row 4: VIP / SOFÁ PRESIDENCIAL */}
        <div className="bg-amber-950/5 border-2 border-[#D4AF37]/35 rounded-xl p-3.5 relative shadow-[0_0_15px_rgba(212,175,55,0.08)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black border border-[#D4AF37] text-[#D4AF37] text-[8px] font-black font-mono px-3 py-0.5 rounded uppercase tracking-widest shadow-md">
            👑 SOFÁ PRESIDENCIAL VIP (Butacas 13-15)
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2.5 max-w-md mx-auto">
            {[12, 13, 14].map(renderSeat)}
          </div>
        </div>
      </div>
    </div>
  );
}
