'use client';
import { useState, useEffect } from 'react';
import { Search, RotateCw } from 'lucide-react';
import { FactionCard } from './FactionCard';

interface Faction {
  id: string;
  name: string;
  description: string;
  level: number;
  xp: number;
  emblem_url: string;
  member_count: number;
  max_members?: number;
  is_open?: boolean;
}

interface FactionGridProps {
  onJoinFaction: (factionId: string) => void;
  joinedFactionId?: string | null;
}

export function FactionGrid({ onJoinFaction, joinedFactionId }: FactionGridProps) {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [filteredFactions, setFilteredFactions] = useState<Faction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFactions = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabase/client');
      const { data, error } = await supabase
        .from('factions')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: false })
        .order('member_count', { ascending: false });

      if (error) throw error;
      setFactions(data || []);
      setFilteredFactions(data || []);
    } catch (e: any) {
      console.error('Error fetching factions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactions();
  }, []);

  useEffect(() => {
    const filtered = factions.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFactions(filtered);
  }, [searchQuery, factions]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-[#D4AF37] font-mono tracking-wider">BANDOS DEL MULTIVERSO</h2>
          <p className="text-xs text-gray-400">Encuentra y únete a una familia de batalla vocal.</p>
        </div>

        <div className="flex gap-2">
          {/* Search bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-gray-800 focus:border-[#D4AF37] text-white rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none"
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchFactions}
            className="p-2.5 bg-black border border-gray-800 hover:border-[#D4AF37] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Actualizar lista"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 font-mono">Cargando catálogo de Bandos...</div>
      ) : filteredFactions.length === 0 ? (
        <div className="text-center py-16 bg-black/40 border-2 border-dashed border-gray-800 rounded-xl">
          <div className="text-4xl mb-2">⚔️</div>
          <h3 className="font-bold text-white mb-1">No se encontraron Bandos</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            {searchQuery ? 'Intenta buscar con otros términos.' : 'Sé el primero en fundar un Bando en la plataforma!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFactions.map((faction) => (
            <FactionCard
              key={faction.id}
              faction={faction}
              onJoin={onJoinFaction}
              isJoined={joinedFactionId === faction.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
