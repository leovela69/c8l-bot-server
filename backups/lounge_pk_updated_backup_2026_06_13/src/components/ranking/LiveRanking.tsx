// components/ranking/LiveRanking.tsx
'use client';
import { useState, useEffect } from 'react';
import { Crown, TrendingUp, Calendar, MapPin } from 'lucide-react';

interface RankItem {
  rank: number;
  user_id: string;
  total_stars_received: number;
  total_gift_count: number;
  users: { name: string; avatar: string };
}

export function LiveRanking({ region = 'latam', className = '' }) {
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [weekStart, setWeekStart] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRanking = async () => {
    setLoading(true);
    const res = await fetch(`/api/ranking/live?region=${region}`);
    const data = await res.json();
    setRanking(data.ranking);
    setWeekStart(data.weekStart);
    setLoading(false);
  };

  useEffect(() => {
    loadRanking();
  }, [region]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`bg-black border-2 border-[#D4AF37] rounded-xl overflow-hidden ${className}`}>
      <div className="bg-[#D4AF37]/10 p-4 border-b border-[#D4AF37]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-[#D4AF37]" />
            <h3 className="font-black text-white">
              Ranking de Streamers {region === 'latam' ? '🇪🇸🌎 LATAM + España' : '🌍 Global'}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={12} />
            {weekStart && `Semana del ${formatDate(weekStart)}`}
          </div>
        </div>
      </div>

      <div className="p-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando ranking...</div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Sin datos esta semana</div>
        ) : (
          <div className="space-y-1">
            {ranking.map((item) => (
              <div
                key={item.user_id}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  item.rank === 1 ? 'bg-yellow-500/20 border-l-4 border-yellow-500' :
                  item.rank === 2 ? 'bg-gray-400/20 border-l-4 border-gray-400' :
                  item.rank === 3 ? 'bg-amber-700/20 border-l-4 border-amber-700' :
                  'hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center font-black text-lg">
                    {item.rank === 1 && <Crown size={20} className="text-yellow-500" />}
                    {item.rank === 2 && <span className="text-gray-400">2</span>}
                    {item.rank === 3 && <span className="text-amber-600">3</span>}
                    {item.rank > 3 && <span className="text-gray-500">{item.rank}</span>}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                    {item.users.avatar || '🎤'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{item.users.name}</div>
                    <div className="text-xs text-gray-400">{item.total_gift_count} regalos</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#D4AF37] font-bold">{item.total_stars_received.toLocaleString()} ⭐</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 text-center text-xs text-gray-500">
        Actualizado en tiempo real • Los regalos en vivo suman puntos
      </div>
    </div>
  );
}