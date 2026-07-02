// components/games/GlobalLeaderboard.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';

export function GlobalLeaderboard() {
  const [topUsers, setTopUsers] = useState<{ name: string; damage: number; clan: string }[]>([]);
  const [topClans, setTopClans] = useState<{ name: string; emblem: string; total_damage: number; wins: number }[]>([]);
  
  useEffect(() => {
    loadLeaderboards();
  }, []);
  
  const loadLeaderboards = async () => {
    // Top usuarios
    const { data: users } = await supabase
      .from('raid_attacks')
      .select('user_name, damage')
      .order('damage', { ascending: false })
      .limit(10);
    
    // Agrupar por usuario
    const userMap = new Map();
    users?.forEach(u => {
      userMap.set(u.user_name, (userMap.get(u.user_name) || 0) + u.damage);
    });
    const topUsersList = Array.from(userMap.entries())
      .map(([name, damage]) => ({ name, damage, clan: '' }))
      .slice(0, 10);
    
    setTopUsers(topUsersList);
    
    // Top clanes
    const { data: clans } = await supabase
      .from('clans')
      .select('name, emblem, total_damage, wins')
      .order('total_damage', { ascending: false })
      .limit(10);
    
    setTopClans(clans as any || []);
  };
  
  return (
    <div className="border-4 border-black bg-[#0d0d0e] p-6 shadow-[8px_8px_0px_#D4AF37]">
      <h2 className="text-2xl font-black text-[#D4AF37] mb-6 text-center">🏆 HALL DE LA FAMA C8L 🏆</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Usuarios */}
        <div>
          <h3 className="text-lg font-bold text-[#00F3FF] mb-3 text-center">👑 TOP GUERREROS</h3>
          <div className="space-y-2">
            {topUsers.map((user, idx) => (
              <div key={idx} className="bg-black p-3 flex justify-between items-center border border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}°`}</span>
                  <span className="font-bold">{user.name}</span>
                </div>
                <div className="text-[#D4AF37] font-mono">{user.damage.toLocaleString()} daño</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top Clanes */}
        <div>
          <h3 className="text-lg font-bold text-[#FF0055] mb-3 text-center">🏰 TOP CLANES</h3>
          <div className="space-y-2">
            {topClans.map((clan, idx) => (
              <div key={idx} className="bg-black p-3 flex justify-between items-center border border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}°`}</span>
                  <span className="text-2xl">{clan.emblem}</span>
                  <span className="font-bold">{clan.name}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#00F3FF] text-xs">{clan.wins} 🏆</span>
                  <span className="text-[#D4AF37] text-xs">{clan.total_damage.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}