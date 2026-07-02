'use client';
import { useState, useEffect } from 'react';
import { Search, RotateCw } from 'lucide-react';
import { RoomCard } from './RoomCard';

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

interface PublicRoomsListProps {
  currentUserId?: string;
  onJoinRoom: (roomId: string) => void;
}

export function PublicRoomsList({ currentUserId, onJoinRoom }: PublicRoomsListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPublicRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rooms/public');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms || []);
        setFilteredRooms(data.rooms || []);
      }
    } catch (e) {
      console.error('Error fetching public rooms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicRooms();
  }, []);

  useEffect(() => {
    const filtered = rooms.filter((room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRooms(filtered);
  }, [searchQuery, rooms]);

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-[#D4AF37] font-mono">EXPLORAR SALAS PÚBLICAS</h2>
          <p className="text-xs text-gray-400">Únete a salas abiertas para cantar, chatear y enviar regalos en tiempo real.</p>
        </div>

        <div className="flex gap-2">
          {/* Search bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Buscar salas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-gray-800 focus:border-[#D4AF37] text-white rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none"
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchPublicRooms}
            className="p-2.5 bg-black border border-gray-800 hover:border-[#D4AF37] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Actualizar lista"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 font-mono">Buscando salas activas...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-16 bg-black/40 border-2 border-dashed border-gray-800 rounded-xl">
          <div className="text-4xl mb-2">🎤</div>
          <h3 className="font-bold text-white mb-1">
            {searchQuery ? 'No se encontraron salas coincidentes' : 'No hay salas públicas abiertas'}
          </h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            {searchQuery 
              ? 'Intenta buscar con otros términos.' 
              : 'Sé el primero en crear una sala pública y comenzar la fiesta!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={onJoinRoom}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
