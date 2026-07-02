'use client';
import { useState, useEffect } from 'react';
import { Plus, Settings, Users, LogIn } from 'lucide-react';
import { RoomCard } from './RoomCard';

interface Room {
  id: string;
  name: string;
  is_private: boolean;
  owner_id: string;
  max_seats: number;
  current_seats: number;
  is_open: boolean;
}

interface MyRoomsListProps {
  userId: string;
  onJoinRoom: (roomId: string) => void;
  onCreateRoomClick: () => void;
  onManageRoomClick: (room: Room) => void;
}

export function MyRoomsList({ userId, onJoinRoom, onCreateRoomClick, onManageRoomClick }: MyRoomsListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rooms/my-rooms?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (e) {
      console.error('Error fetching user rooms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMyRooms();
    }
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-[#D4AF37] font-mono">MIS SALAS DE CANTO</h2>
          <p className="text-xs text-gray-400">Salas creadas por ti para karaoke público o privado.</p>
        </div>
        <button
          onClick={onCreateRoomClick}
          className="px-4 py-2 bg-[#D4AF37] border-2 border-black font-black text-xs text-black hover:bg-black hover:text-[#D4AF37] hover:border-[#D4AF37] flex items-center gap-1 cursor-pointer transition-all shadow-[3px_3px_0px_#00F3FF]"
        >
          <Plus size={14} /> NUEVA SALA
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 font-mono">Cargando tus salas...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 bg-black/40 border-2 border-dashed border-gray-800 rounded-xl">
          <div className="text-4xl mb-2">💺</div>
          <h3 className="font-bold text-white mb-1">Aún no has creado ninguna sala</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mb-6">Crea tu propia sala para invitar amigos o transmitir karaoke en vivo al público.</p>
          <button
            onClick={onCreateRoomClick}
            className="px-6 py-2 bg-purple-600 text-white font-black text-xs border border-purple-500 hover:bg-purple-700 cursor-pointer"
          >
            CREAR MI PRIMERA SALA
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="relative group">
              <RoomCard room={room} onJoin={onJoinRoom} currentUserId={userId} />
              
              {/* Quick Settings Icon */}
              <button
                onClick={() => onManageRoomClick(room)}
                className="absolute top-4 right-4 p-1.5 bg-black/80 hover:bg-[#D4AF37] border border-gray-800 hover:border-black text-gray-400 hover:text-black rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                title="Configuración de Sala / Invitar"
              >
                <Settings size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
