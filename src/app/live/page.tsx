// app/live/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useApp } from '@/context/AppContext';

export default function LivePage() {
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const { language } = useApp();

  useEffect(() => {
    const fetchLive = async () => {
      const { data } = await supabase
        .from('live_streams')
        .select('*, user:user_id(name, avatar)')
        .eq('status', 'live')
        .order('started_at', { ascending: false });
      setLiveStreams(data || []);
    };
    fetchLive();
    // Suscripción en tiempo real para actualizar lista de lives
    const subscription = supabase
      .channel('live-streams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, fetchLive)
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  return (
    <div className="max-w-7xl mx-auto pt-28 md:pt-32 pb-24 p-4 font-mono">
      <h1 className="text-3xl font-black text-[#D4AF37] mb-6">
        {language === 'es' ? '📡 En Vivo Ahora' : '📡 Live Now'}
      </h1>
      {liveStreams.length === 0 ? (
        <p className="text-gray-400">
          {language === 'es' 
            ? 'No hay transmisiones activas. ¡Vuelve más tarde!' 
            : 'No active streams. Come back later!'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveStreams.map(stream => (
            <Link href={`/live/${stream.id}`} key={stream.id}>
              <div className="bg-gray-900 rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer border border-zinc-800">
                <div className="relative aspect-video bg-black">
                  <img src={stream.thumbnail_url || '/default-live.jpg'} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse font-bold">
                    🔴 {language === 'es' ? 'EN VIVO' : 'LIVE'}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-xs px-2 py-1 rounded">
                    👁️ {stream.viewer_count}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-white line-clamp-1">{stream.title}</h3>
                  <p className="text-sm text-gray-400">{stream.user.name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}