'use client';
import { useState } from 'react';
import { Settings, UserPlus, Lock, Unlock, Users, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Room {
  id: string;
  name: string;
  is_private: boolean;
  owner_id: string;
  max_seats: number;
  current_seats: number;
  is_open: boolean;
}

interface RoomSettingsModalProps {
  room: Room;
  onClose: () => void;
  onRoomUpdated?: () => void;
}

export function RoomSettingsModal({ room, onClose, onRoomUpdated }: RoomSettingsModalProps) {
  const { user, showNotification } = useApp();
  const [isPrivate, setIsPrivate] = useState(room.is_private);
  const [isOpen, setIsOpen] = useState(room.is_open);
  const [maxSeats, setMaxSeats] = useState(room.max_seats);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      // We will perform updates directly to Supabase room
      // Since it's client-side, we update using supabase client or write a direct API, 
      // but let's update using our supabase client for convenience!
      const { supabase } = await import('@/lib/supabase/client');
      
      const { error } = await supabase
        .from('rooms')
        .update({
          is_private: isPrivate,
          is_open: isOpen,
          max_seats: maxSeats,
          updated_at: new Date().toISOString()
        })
        .eq('id', room.id);

      if (error) {
        throw error;
      }

      showNotification('Configuración de sala actualizada', 'success');
      if (onRoomUpdated) onRoomUpdated();
      onClose();
    } catch (e: any) {
      console.error('Error saving settings:', e);
      showNotification('Error al guardar: ' + e.message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      const res = await fetch('/api/rooms/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: room.id,
          invitedByUserId: user?.uid,
          email: inviteEmail.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification(`Invitación enviada a ${inviteEmail}`, 'success');
        setInviteEmail('');
      } else {
        showNotification(data.error || 'Error al enviar invitación', 'error');
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      showNotification('Error de conexión', 'error');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-4 border-[#D4AF37] w-full max-w-md rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-2">
            <Settings className="text-[#D4AF37]" size={20} />
            <h3 className="text-lg font-black text-[#D4AF37] font-mono">AJUSTES DE SALA</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Room Name display */}
          <div>
            <span className="text-[10px] font-mono text-gray-500 block uppercase">Nombre de Sala</span>
            <span className="text-base font-black text-white font-mono">{room.name}</span>
          </div>

          {/* Privacy Toggle */}
          <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-gray-800">
            <div className="flex items-center gap-3">
              {isPrivate ? <Lock className="text-[#FF0055]" size={20} /> : <Unlock className="text-[#00F3FF]" size={20} />}
              <div>
                <span className="text-xs font-black text-white block">SALA PRIVADA</span>
                <span className="text-[10px] text-gray-400 block">Solo invitados podrán unirse.</span>
              </div>
            </div>
            <button 
              onClick={() => setIsPrivate(!isPrivate)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              {isPrivate ? (
                <ToggleRight className="text-[#FF0055]" size={32} />
              ) : (
                <ToggleLeft className="text-gray-600" size={32} />
              )}
            </button>
          </div>

          {/* Open to Public Toggle */}
          <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-gray-800">
            <div className="flex items-center gap-3">
              <Users className="text-[#D4AF37]" size={20} />
              <div>
                <span className="text-xs font-black text-white block">ABIERTA A NUEVOS USUARIOS</span>
                <span className="text-[10px] text-gray-400 block">Toma efecto inmediatamente.</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              {isOpen ? (
                <ToggleRight className="text-green-500" size={32} />
              ) : (
                <ToggleLeft className="text-gray-600" size={32} />
              )}
            </button>
          </div>

          {/* Max Seats Input */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#D4AF37] block font-mono">MÁXIMO DE SILLONES (1-15)</label>
            <input
              type="number"
              min={1}
              max={15}
              value={maxSeats}
              onChange={(e) => setMaxSeats(Math.min(15, Math.max(1, parseInt(e.target.value) || 15)))}
              className="w-full bg-black border border-gray-800 focus:border-[#D4AF37] text-white rounded p-2 text-sm focus:outline-none"
            />
          </div>

          {/* Save settings button */}
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full py-2 bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] font-black border border-black hover:border-[#D4AF37] text-xs transition-colors cursor-pointer"
          >
            {savingSettings ? 'GUARDANDO...' : 'GUARDAR AJUSTES'}
          </button>

          {/* Invite User Section (Only useful if private or open) */}
          <div className="border-t border-gray-800 pt-5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-white font-mono">
              <UserPlus size={16} className="text-[#00F3FF]" />
              <span>INVITAR AMIGO POR EMAIL</span>
            </div>
            
            <form onSubmit={handleSendInvite} className="flex gap-2">
              <input
                type="email"
                placeholder="ejemplo@c8l-agency.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-black border border-gray-800 focus:border-[#00F3FF] text-white rounded p-2 text-xs focus:outline-none"
              />
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs border border-purple-500 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {inviting ? 'INVITANDO...' : 'INVITAR'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
