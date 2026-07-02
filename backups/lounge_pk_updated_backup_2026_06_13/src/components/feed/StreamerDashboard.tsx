'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { TrendingUp, Users, DollarSign, Eye } from 'lucide-react';

export function StreamerDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState({
    weekEarnings: 0,
    monthEarnings: 0,
    newFollowers: 0,
    totalViews: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Simulación de datos (luego conectar con tabla real)
      setStats({
        weekEarnings: 1250,
        monthEarnings: 4870,
        newFollowers: 234,
        totalViews: 15420,
      });
    };
    fetchStats();
  }, [userId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="card flex items-center gap-3">
        <DollarSign className="text-c8l-gold" size={28} />
        <div>
          <p className="text-gray-400 text-sm">Ganancias (semana)</p>
          <p className="text-2xl font-bold">${stats.weekEarnings}</p>
        </div>
      </div>
      <div className="card flex items-center gap-3">
        <TrendingUp className="text-c8l-purple" size={28} />
        <div>
          <p className="text-gray-400 text-sm">Ganancias (mes)</p>
          <p className="text-2xl font-bold">${stats.monthEarnings}</p>
        </div>
      </div>
      <div className="card flex items-center gap-3">
        <Users className="text-c8l-pink" size={28} />
        <div>
          <p className="text-gray-400 text-sm">Nuevos seguidores</p>
          <p className="text-2xl font-bold">{stats.newFollowers}</p>
        </div>
      </div>
      <div className="card flex items-center gap-3">
        <Eye className="text-c8l-gold" size={28} />
        <div>
          <p className="text-gray-400 text-sm">Vistas (30d)</p>
          <p className="text-2xl font-bold">{stats.totalViews}</p>
        </div>
      </div>
    </div>
  );
}
