'use client';
import { useState } from 'react';
import { Crown, ShieldCheck, User, ShieldAlert, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface FactionMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: string;
  xp_contributed: number;
}

interface MemberListProps {
  factionId: string;
  members: FactionMember[];
  userRole: string; // 'captain' | 'vice-captain' | 'admin' | 'member'
  onMembersUpdated?: () => void;
}

export function MemberList({ factionId, members, userRole, onMembersUpdated }: MemberListProps) {
  const { user, showNotification } = useApp();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isCaptain = userRole === 'captain';
  const isOfficer = ['captain', 'vice-captain', 'admin'].includes(userRole);

  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingMembers = members.filter((m) => m.status === 'pending');

  const handleAction = async (targetUserId: string, action: 'accept-join' | 'reject-join' | 'kick' | 'role', newRole?: string) => {
    try {
      setUpdatingId(targetUserId);
      const res = await fetch('/api/factions/manage-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factionId,
          operatorId: user?.uid,
          targetUserId,
          action,
          newRole
        })
      });

      const data = await res.json();
      if (data.success) {
        showNotification(
          action === 'accept-join'
            ? 'Solicitud aceptada'
            : action === 'reject-join'
            ? 'Solicitud rechazada'
            : action === 'kick'
            ? 'Miembro expulsado'
            : `Rango cambiado a: ${newRole}`,
          'success'
        );
        if (onMembersUpdated) onMembersUpdated();
      } else {
        showNotification(data.error || 'Error al actualizar miembro', 'error');
      }
    } catch (e) {
      console.error('Error in member action:', e);
      showNotification('Error de conexión', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'captain':
        return { text: '👑 Capitán', color: 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' };
      case 'vice-captain':
        return { text: '⭐ Vice-Capitán', color: 'bg-purple-950/20 border-purple-500 text-purple-400' };
      case 'admin':
        return { text: '🛡️ Admin', color: 'bg-[#00F3FF]/20 border-[#00F3FF] text-[#00F3FF]' };
      default:
        return { text: 'Soldado', color: 'bg-gray-800 border-gray-700 text-gray-400' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending requests (Only visible to Officers) */}
      {isOfficer && pendingMembers.length > 0 && (
        <div className="bg-purple-950/10 border border-purple-500/20 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-black text-purple-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
            <ShieldCheck size={14} /> SOLICITUDES DE UNIÓN PENDIENTES ({pendingMembers.length})
          </h3>

          <div className="space-y-2">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="bg-black/60 border border-gray-800 p-3 rounded-lg flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{member.avatar || '👤'}</span>
                  <span className="font-bold text-white">{member.name}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(member.id, 'accept-join')}
                    disabled={updatingId === member.id}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-bold border border-green-500 rounded cursor-pointer text-[10px] transition-colors"
                  >
                    ACEPTAR
                  </button>
                  <button
                    onClick={() => handleAction(member.id, 'reject-join')}
                    disabled={updatingId === member.id}
                    className="px-3 py-1 bg-red-900/40 hover:bg-red-800 text-red-200 border border-red-700/50 rounded cursor-pointer text-[10px] transition-colors"
                  >
                    RECHAZAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Members List */}
      <div className="bg-black/60 border-2 border-gray-800 rounded-xl p-4">
        <h3 className="text-xs font-black text-[#D4AF37] mb-4 font-mono tracking-wider uppercase">
          ⚔️ GUERREROS ACTIVOS ({activeMembers.length})
        </h3>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {activeMembers.map((member) => {
            const isMe = member.id === user?.uid;
            const badge = getRoleBadge(member.role);
            return (
              <div
                key={member.id}
                className="bg-gray-900/40 hover:bg-gray-900 border border-gray-850 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{member.avatar || '👤'}</span>
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {member.name} {isMe && <span className="text-[9px] text-[#00F3FF] font-mono font-bold">(Tú)</span>}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Contribución: <span className="text-[#D4AF37]">{member.xp_contributed || 0} XP</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <span className={`px-2 py-0.5 border text-[9px] font-black tracking-wider uppercase rounded ${badge.color}`}>
                    {badge.text}
                  </span>

                  {/* Admin Management options */}
                  {isOfficer && !isMe && member.role !== 'captain' && (
                    <div className="flex gap-1.5">
                      {/* Promote / Demote Roles (Captain only) */}
                      {isCaptain && (
                        <>
                          {member.role === 'member' && (
                            <button
                              onClick={() => handleAction(member.id, 'role', 'admin')}
                              className="p-1 text-gray-500 hover:text-[#00F3FF] transition-colors cursor-pointer"
                              title="Promover a Admin"
                            >
                              <ArrowUpCircle size={14} />
                            </button>
                          )}
                          {member.role === 'admin' && (
                            <button
                              onClick={() => handleAction(member.id, 'role', 'member')}
                              className="p-1 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                              title="Degradar a Soldado"
                            >
                              <ArrowDownCircle size={14} />
                            </button>
                          )}
                        </>
                      )}

                      {/* Kick Member */}
                      <button
                        onClick={() => handleAction(member.id, 'kick')}
                        disabled={updatingId === member.id}
                        className="p-1 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                        title="Expulsar del Bando"
                      >
                        <ShieldAlert size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
