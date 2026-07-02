import { TrendingUp } from 'lucide-react';

interface PopularitySystemProps {
  userId: string;
  followers: number;
  weeklyTrend: number;
}

export function PopularitySystem({ userId, followers, weeklyTrend }: PopularitySystemProps) {
  return (
    <div className="bg-gradient-to-r from-purple-900 to-black p-4 rounded-lg border border-purple-500">
      <h4 className="text-sm font-black text-purple-400 flex items-center gap-2">
        <TrendingUp size={14} /> POPULARIDAD
      </h4>
      <div className="flex justify-between items-center mt-2">
        <div>
          <div className="text-2xl font-black text-white">{followers}</div>
          <div className="text-xs text-gray-400">seguidores</div>
        </div>
        <div className={`text-right ${weeklyTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          <div className="text-xl font-black">{weeklyTrend > 0 ? `+${weeklyTrend}` : weeklyTrend}%</div>
          <div className="text-xs">esta semana</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="flex-1 py-1 bg-purple-600 text-white text-xs rounded">+ Seguir</button>
        <button className="flex-1 py-1 bg-purple-600/20 text-purple-400 text-xs rounded">Enviar Gift</button>
      </div>
    </div>
  );
}