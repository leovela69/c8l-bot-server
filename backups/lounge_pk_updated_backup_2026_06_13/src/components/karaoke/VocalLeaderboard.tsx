// components/karaoke/VocalLeaderboard.tsx
import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Mic } from 'lucide-react';

interface TopCover {
  id: string;
  user_name: string;
  track_title: string;
  vocal_score: number;
  badge: string;
  created_at: string;
}

export function VocalLeaderboard() {
  const [topCovers, setTopCovers] = useState<TopCover[]>([]);
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'all'>('week');
  
  useEffect(() => {
    fetchTopCovers();
  }, [timeFrame]);
  
  const fetchTopCovers = async () => {
    const response = await fetch(`/api/karaoke/top-covers?timeFrame=${timeFrame}`);
    const data = await response.json();
    setTopCovers(data);
  };
  
  const getBadgeIcon = (badge: string) => {
    if (badge.includes('ORO')) return '🏆';
    if (badge.includes('ESTRELLA')) return '⭐';
    if (badge.includes('APRENDIZ')) return '🎤';
    return '🌱';
  };
  
  return (
    <div className="border-4 border-[#D4AF37] bg-black p-6">
      <h2 className="text-2xl font-black text-[#D4AF37] mb-4 flex items-center gap-2">
        <Trophy /> RANKING DE VOCES C8L
      </h2>
      
      {/* Selector de período */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'week', label: '🏆 ESTA SEMANA' },
          { id: 'month', label: '⭐ ESTE MES' },
          { id: 'all', label: '👑 HISTÓRICO' }
        ].map(tf => (
          <button
            key={tf.id}
            onClick={() => setTimeFrame(tf.id as any)}
            className={`px-4 py-2 text-sm font-mono border-2 transition-all ${
              timeFrame === tf.id
                ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'
                : 'border-gray-700 text-gray-500 hover:border-gray-500'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>
      
      {/* Tabla de clasificación */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {topCovers.map((cover, idx) => (
          <div
            key={cover.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              idx === 0 ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent border-l-4 border-[#D4AF37]' :
              idx === 1 ? 'bg-gradient-to-r from-gray-600/20 to-transparent border-l-4 border-gray-500' :
              idx === 2 ? 'bg-gradient-to-r from-amber-800/20 to-transparent border-l-4 border-amber-700' :
              'bg-black/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 text-center font-black text-xl">
                {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}°`}
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  {cover.user_name}
                  <span className="text-sm">{getBadgeIcon(cover.badge)}</span>
                </div>
                <div className="text-xs text-gray-500">{cover.track_title}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[#D4AF37]">{cover.vocal_score}</div>
              <div className="text-[10px] text-gray-500">puntos</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Leyenda de badges */}
      <div className="mt-6 pt-4 border-t border-gray-800 flex justify-center gap-6 text-xs">
        <div><span className="text-[#D4AF37]">🏆 90+</span> Voz de Oro</div>
        <div><span className="text-[#D4AF37]">⭐ 70-89</span> Estrella C8L</div>
        <div><span className="text-[#D4AF37]">🎤 50-69</span> Aprendiz</div>
        <div><span className="text-[#D4AF37]">🌱 0-49</span> Principiante</div>
      </div>
    </div>
  );
}