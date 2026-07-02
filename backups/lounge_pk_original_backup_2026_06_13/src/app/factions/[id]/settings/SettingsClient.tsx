'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { FactionSettings } from '@/components/factions/FactionSettings';

export default function FactionSettingsClient({ factionId }: { factionId: string }) {
  const router = useRouter();
  const [faction, setFaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaction = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data, error } = await supabase
          .from('factions')
          .select('*')
          .eq('id', factionId)
          .single();

        if (!error && data) {
          setFaction(data);
        } else {
          // Fallback mock
          setFaction({
            id: factionId,
            name: 'GUERREROS DEL MULTIVERSO',
            description: 'Luchamos con melodías y freestyle galáctico.',
            level: 4,
            xp: 1500,
            emblem_url: '⚔️',
            banner_url: ''
          });
        }
      } catch (e) {
        console.error('Error fetching faction settings:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFaction();
  }, [factionId]);

  if (loading) {
    return (
      <div className="p-8 text-gray-500 font-mono text-xs text-center">
        Cargando ajustes...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-28 md:pt-32 pb-24 p-4 font-mono">
      <div className="max-w-md mx-auto space-y-4">
        <button
          onClick={() => router.push(`/factions/${factionId}`)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft size={14} /> VOLVER AL BANDO
        </button>
        {faction && <FactionSettings faction={faction} />}
      </div>
    </div>
  );
}
