'use client';
import { motion } from 'framer-motion';
import { Users, Lock, Unlock, LogIn, Mic } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  is_private: boolean;
  owner_id: string;
  max_seats: number;
  current_seats: number;
  is_open: boolean;
  owner?: {
    name: string;
    avatar: string;
  };
}

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
  currentUserId?: string;
}

export function RoomCard({ room, onJoin, currentUserId }: RoomCardProps) {
  const isOwner = currentUserId === room.owner_id;
  const displayOwner = room.owner?.name || 'Creador de C8L';
  const displayAvatar = room.owner?.avatar || '🦁';

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className="bg-black/60 border-2 border-gray-800 hover:border-[#D4AF37] rounded-xl p-5 flex flex-col justify-between transition-all duration-300 shadow-md relative overflow-hidden group"
    >
      {/* Decorative Cyberpunk Border Highlights */}
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#00F3FF] via-purple-600 to-[#FF0055] opacity-50 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Badges */}
        <div className="flex justify-between items-center mb-3">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 font-bold ${
            room.is_private 
              ? 'bg-[#FF0055]/20 text-[#FF0055] border border-[#FF0055]/30' 
              : 'bg-[#00F3FF]/20 text-[#00F3FF] border border-[#00F3FF]/30'
          }`}>
            {room.is_private ? <Lock size={10} /> : <Unlock size={10} />}
            {room.is_private ? 'PRIVADA' : 'PÚBLICA'}
          </span>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
            room.is_open 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {room.is_open ? 'ABIERTA' : 'CERRADA'}
          </span>
        </div>

        {/* Room Title */}
        <h3 className="text-lg font-black text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1 mb-1 font-mono uppercase tracking-wide">
          {room.name}
        </h3>

        {/* Owner Info */}
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
          <span className="text-base">{displayAvatar}</span>
          <span>Host: <span className="text-gray-200 font-semibold">{displayOwner}</span> {isOwner && '(Tú)'}</span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-gray-900 pt-4 mt-2">
        {/* Seat Counter */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users size={14} className="text-[#00F3FF]" />
          <span>{room.current_seats || 0} / {room.max_seats} butacas</span>
        </div>

        {/* Join button */}
        <button
          onClick={() => onJoin(room.id)}
          disabled={!room.is_open && !isOwner}
          className={`px-4 py-2 border font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            !room.is_open && !isOwner
              ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
              : 'bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] border-black hover:border-[#D4AF37] shadow-[2px_2px_0px_rgba(0,243,255,1)] hover:shadow-none'
          }`}
        >
          <LogIn size={12} />
          {isOwner ? 'ENTRAR' : room.is_open ? 'UNIRSE' : 'CERRADO'}
        </button>
      </div>
    </motion.div>
  );
}
