'use client';
import { useState, useEffect } from 'react';
import { Check, X, Mail, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Invitation {
  id: string;
  room_id: string;
  user_id: string;
  invited_by_id: string;
  status: string;
  created_at: string;
  room: {
    name: string;
    max_seats: number;
  };
  invited_by?: {
    name: string;
    avatar: string;
  };
}

interface InvitationsListProps {
  userId: string;
  onJoinRoom: (roomId: string) => void;
}

export function InvitationsList({ userId, onJoinRoom }: InvitationsListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useApp();

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rooms/invitations?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setInvitations(data.invitations || []);
      }
    } catch (e) {
      console.error('Error fetching invitations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchInvitations();
    }
  }, [userId]);

  const handleAction = async (invitationId: string, roomId: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch('/api/rooms/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId, status }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification(
          status === 'accepted' ? 'Invitación aceptada' : 'Invitación rechazada',
          status === 'accepted' ? 'success' : 'info'
        );
        // Refresh local list
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

        if (status === 'accepted') {
          onJoinRoom(roomId);
        }
      } else {
        showNotification(data.error || 'Error al procesar la invitación', 'error');
      }
    } catch (e) {
      console.error('Error updating invitation:', e);
      showNotification('Error de conexión', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-3">
        <h2 className="text-xl font-black text-[#D4AF37] font-mono">INVITACIONES A SALAS</h2>
        <p className="text-xs text-gray-400">Invitaciones recibidas para unirte a salas privadas exclusivas.</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 font-mono">Buscando invitaciones...</div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-16 bg-black/40 border-2 border-dashed border-gray-800 rounded-xl">
          <div className="text-4xl mb-2">✉️</div>
          <h3 className="font-bold text-white mb-1">No tienes invitaciones pendientes</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Cuando un amigo te invite a una sala privada, aparecerá en esta pestaña.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invite) => {
            const inviterName = invite.invited_by?.name || 'Un amigo';
            const inviterAvatar = invite.invited_by?.avatar || '🎤';
            return (
              <div
                key={invite.id}
                className="bg-black/60 border-2 border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-purple-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl p-2 bg-gray-900 border border-gray-800 rounded-lg">{inviterAvatar}</div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      <span className="text-[#D4AF37]">{inviterName}</span> te invitó a cantar en:
                    </h3>
                    <p className="text-base font-black text-[#00F3FF] font-mono uppercase tracking-wider mt-0.5">
                      {invite.room?.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1">
                      <Calendar size={12} />
                      <span>Recibida el {new Date(invite.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleAction(invite.id, invite.room_id, 'accepted')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-black text-xs border border-green-500 rounded flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Check size={14} /> ACEPTAR
                  </button>
                  <button
                    onClick={() => handleAction(invite.id, invite.room_id, 'rejected')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-red-900/40 hover:bg-red-900/80 text-red-200 font-bold text-xs border border-red-700/50 rounded flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <X size={14} /> RECHAZAR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
