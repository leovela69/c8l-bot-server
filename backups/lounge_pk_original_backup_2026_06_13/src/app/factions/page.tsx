'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Lock, Users, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { FactionGrid } from '@/components/factions/FactionGrid';
import { CreateFactionModal } from '@/components/factions/CreateFactionModal';

interface JoinedFactionInfo {
  factionId: string;
  name: string;
  role: string;
  emblem: string;
}

export default function FactionsLandingPage() {
  const { user, c8lCoins, showNotification } = useApp();
  const router = useRouter();

  const [joinedFaction, setJoinedFaction] = useState<JoinedFactionInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkUserMembership = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabase/client');
      
      const { data, error } = await supabase
        .from('faction_members')
        .select('*, faction:factions(name, emblem_url)')
        .eq('user_id', user.uid)
        .eq('status', 'active')
        .maybeSingle();

      if (data && !error) {
        setJoinedFaction({
          factionId: data.faction_id,
          // @ts-ignore
          name: data.faction?.name || 'Mi Bando',
          // @ts-ignore
          emblem: data.faction?.emblem_url || '🛡️',
          role: data.role
        });
      } else {
        setJoinedFaction(null);
      }
    } catch (e) {
      console.error('Error checking faction membership:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      checkUserMembership();
    } else {
      setLoading(false);
    }
  }, [user?.uid]);

  const handleJoinFaction = async (factionId: string) => {
    if (!user) {
      showNotification('Inicia sesión para unirte a un Bando', 'info');
      return;
    }

    try {
      const res = await fetch('/api/factions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factionId, userId: user.uid })
      });

      const data = await res.json();
      if (data.success) {
        showNotification('Solicitud de unión enviada. Espera aprobación del Capitán', 'success');
        checkUserMembership();
      } else {
        showNotification(data.error || 'Error al solicitar unión', 'error');
      }
    } catch (e) {
      console.error('Error joining faction:', e);
      showNotification('Error de conexión', 'error');
    }
  };

  const handleFactionCreated = (factionId: string) => {
    router.push(`/factions/${factionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-gray-500">
        Cargando Bandos...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-28 md:pt-32 pb-24 p-4 font-mono">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 border-b-4 border-[#D4AF37] pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#D4AF37] flex items-center gap-2 tracking-wider">
            🛡️ BANDOS C8L
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase">
            Únete a comunidades de batalla vocal · Gana Coins y XP Cooperativo
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-black border-2 border-[#D4AF37] px-4 py-1.5 font-bold text-[#D4AF37] text-xs">
            {c8lCoins} COINS
          </div>
          
          {!joinedFaction && (
            <button
              onClick={() => {
                if (!user) {
                  showNotification('Inicia sesión para fundar un Bando', 'info');
                  return;
                }
                if (c8lCoins < 10000) {
                  showNotification('Se requieren 10,000 Coins para fundar un Bando', 'error');
                  return;
                }
                setShowCreateModal(true);
              }}
              className="px-5 py-2 bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] border-2 border-black hover:border-[#D4AF37] font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_#8A2BE2]"
            >
              <Plus size={16} /> FUNDAR BANDO
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: My Faction Panel / Catalog */}
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        
        {/* If user has an active Bando, show quick link */}
        {joinedFaction && (
          <div className="col-span-12 bg-gradient-to-r from-purple-950/20 to-black border-2 border-purple-500/30 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-5xl">{joinedFaction.emblem}</span>
              <div>
                <h3 className="text-lg font-black text-white">MIEMBRO ACTIVO DE BANDO</h3>
                <p className="text-xl font-black text-[#D4AF37] font-mono mt-0.5 uppercase tracking-wide">
                  {joinedFaction.name}
                </p>
                <span className="text-[10px] text-purple-400 font-mono font-bold uppercase mt-1 block">
                  RANGO: {joinedFaction.role === 'captain' ? '👑 Capitán' : joinedFaction.role === 'vice-captain' ? '⭐ Vice-Capitán' : joinedFaction.role === 'admin' ? '🛡️ Admin' : 'Soldado'}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/factions/${joinedFaction.factionId}`)}
              className="w-full sm:w-auto px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs border border-purple-500 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)]"
            >
              INGRESAR A MI BANDO <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Factions Explorer Grid */}
        <div className="col-span-12 bg-black/40 border-2 border-gray-800 rounded-xl p-6 min-h-[400px]">
          <FactionGrid
            onJoinFaction={handleJoinFaction}
            joinedFactionId={joinedFaction?.factionId}
          />
        </div>
      </div>

      {/* Create Modal overlay */}
      {showCreateModal && (
        <CreateFactionModal
          onClose={() => setShowCreateModal(false)}
          onFactionCreated={handleFactionCreated}
        />
      )}
    </div>
  );
}
