'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, LayoutGrid, Calendar, Mail, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PublicRoomsList } from '@/components/rooms/PublicRoomsList';
import { MyRoomsList } from '@/components/rooms/MyRoomsList';
import { InvitationsList } from '@/components/rooms/InvitationsList';
import { CreateRoomModal } from '@/components/lounge/CreateRoomModal';
import { RoomSettingsModal } from '@/components/rooms/RoomSettingsModal';

type ActiveTab = 'public' | 'my-rooms' | 'invitations';

interface Room {
  id: string;
  name: string;
  is_private: boolean;
  owner_id: string;
  max_seats: number;
  current_seats: number;
  is_open: boolean;
}

export default function LoungeDashboard() {
  const { user, c8lCoins, showNotification } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>('public');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Settings management
  const [managedRoom, setManagedRoom] = useState<Room | null>(null);

  const handleJoinRoom = async (roomId: string) => {
    if (!user) {
      showNotification('Inicia sesión para ingresar a una sala', 'info');
      return;
    }
    
    // Check permission/join room via API
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, userId: user.uid })
      });

      const data = await res.json();
      if (data.success && data.authorized) {
        router.push(`/lounge/${roomId}`);
      } else {
        showNotification(data.error || 'Acceso denegado', 'error');
      }
    } catch (e) {
      console.error('Error joining room:', e);
      showNotification('Error al unirse a la sala', 'error');
    }
  };

  const handleRoomCreated = (roomId: string) => {
    router.push(`/lounge/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 md:pt-32 pb-24 p-4 font-mono">
      {/* Dashboard Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 border-b-4 border-[#D4AF37] pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#D4AF37] flex items-center gap-2 tracking-wider">
            🎤 QUANTUM LOUNGE
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase">
            Salas de Karaoke Social con Sillones Premium · Inspirado por StarMaker
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-black border-2 border-[#D4AF37] px-4 py-1.5 font-bold text-[#D4AF37] text-xs">
            {c8lCoins} COINS
          </div>
          
          <button
            onClick={() => {
              if (!user) {
                showNotification('Por favor inicia sesión', 'info');
                return;
              }
              setShowCreateModal(true);
            }}
            className="px-5 py-2 bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] border-2 border-black hover:border-[#D4AF37] font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_#FF0055]"
          >
            <Plus size={16} /> CREAR SALA
          </button>
        </div>
      </div>

      {/* Main Grid: Tabs and List */}
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        
        {/* Navigation Sidebar (3 cols) */}
        <div className="col-span-12 md:col-span-3 space-y-2">
          {/* Tab Button: Public */}
          <button
            onClick={() => setActiveTab('public')}
            className={`w-full p-4 border-2 text-left font-black text-xs flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'public'
                ? 'bg-[#00F3FF]/10 text-[#00F3FF] border-[#00F3FF] shadow-[3px_3px_0px_rgba(0,243,255,0.3)]'
                : 'bg-black/60 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid size={16} /> EXPLORAR SALAS
            </span>
            <Sparkles size={12} className={activeTab === 'public' ? 'animate-pulse text-[#00F3FF]' : 'opacity-0'} />
          </button>

          {/* Tab Button: My Rooms */}
          <button
            onClick={() => {
              if (!user) {
                showNotification('Por favor inicia sesión para ver tus salas', 'info');
                return;
              }
              setActiveTab('my-rooms');
            }}
            className={`w-full p-4 border-2 text-left font-black text-xs flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'my-rooms'
                ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37] shadow-[3px_3px_0px_rgba(212,175,55,0.3)]'
                : 'bg-black/60 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users size={16} /> MIS SALAS
            </span>
            <Sparkles size={12} className={activeTab === 'my-rooms' ? 'animate-pulse text-[#D4AF37]' : 'opacity-0'} />
          </button>

          {/* Tab Button: Invitations */}
          <button
            onClick={() => {
              if (!user) {
                showNotification('Por favor inicia sesión para ver invitaciones', 'info');
                return;
              }
              setActiveTab('invitations');
            }}
            className={`w-full p-4 border-2 text-left font-black text-xs flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'invitations'
                ? 'bg-[#FF0055]/10 text-[#FF0055] border-[#FF0055] shadow-[3px_3px_0px_rgba(255,0,85,0.3)]'
                : 'bg-black/60 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Mail size={16} /> INVITACIONES
            </span>
            <Sparkles size={12} className={activeTab === 'invitations' ? 'animate-pulse text-[#FF0055]' : 'opacity-0'} />
          </button>
        </div>

        {/* Content Pane (9 cols) */}
        <div className="col-span-12 md:col-span-9 bg-black/40 border-2 border-gray-800 rounded-xl p-6 min-h-[400px]">
          {activeTab === 'public' && (
            <PublicRoomsList
              currentUserId={user?.uid}
              onJoinRoom={handleJoinRoom}
            />
          )}

          {activeTab === 'my-rooms' && user && (
            <MyRoomsList
              userId={user.uid}
              onJoinRoom={handleJoinRoom}
              onCreateRoomClick={() => setShowCreateModal(true)}
              onManageRoomClick={(room) => setManagedRoom(room)}
            />
          )}

          {activeTab === 'invitations' && user && (
            <InvitationsList
              userId={user.uid}
              onJoinRoom={handleJoinRoom}
            />
          )}
        </div>
      </div>

      {/* Create Room Modal overlay */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={handleRoomCreated}
        />
      )}

      {/* Settings Modal overlay */}
      {managedRoom && (
        <RoomSettingsModal
          room={managedRoom}
          onClose={() => setManagedRoom(null)}
          onRoomUpdated={() => {
            // Trigger refresh in MyRoomsList
            setActiveTab('public');
            setTimeout(() => setActiveTab('my-rooms'), 50);
          }}
        />
      )}
    </div>
  );
}