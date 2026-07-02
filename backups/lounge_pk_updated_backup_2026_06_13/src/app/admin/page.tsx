// app/admin/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MetricCard } from '@/components/admin/MetricCard';
import { Users, Coins, Eye, TrendingUp, AlertTriangle, Gift } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCoins: 0,
    totalBID: 0,
    dailyActiveUsers: 0,
    pendingReports: 0,
    totalGifts: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadRevenueData();
  }, []);

  async function loadStats() {
    // Usuarios totales y activos
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: activeUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_active', new Date(Date.now() - 7*86400000).toISOString());
    
    // Economía
    const { data: wallets } = await supabase.from('wallets').select('coin_balance, bid_balance');
    const totalCoins = wallets?.reduce((acc, w) => acc + (w.coin_balance || 0), 0) || 0;
    const totalBID = wallets?.reduce((acc, w) => acc + (w.bid_balance || 0), 0) || 0;

    // Reportes pendientes
    const { count: pendingReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    // Regalos totales (últimos 30 días)
    const { count: totalGifts } = await supabase.from('gift_transactions').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30*86400000).toISOString());

    setStats({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalCoins,
      totalBID,
      dailyActiveUsers: Math.floor((activeUsers || 0) / 7), // aprox diario
      pendingReports: pendingReports || 0,
      totalGifts: totalGifts || 0,
    });
    setLoading(false);
  }

  async function loadRevenueData() {
    // Últimos 7 días de ingresos por regalos
    const { data } = await supabase
      .from('gift_transactions')
      .select('created_at, coins_spent')
      .gte('created_at', new Date(Date.now() - 7*86400000).toISOString());
    
    const dailyMap = new Map();
    data?.forEach(tx => {
      const day = tx.created_at.split('T')[0];
      dailyMap.set(day, (dailyMap.get(day) || 0) + tx.coins_spent);
    });
    const chartData = Array.from(dailyMap.entries()).map(([date, coins]) => ({ date, coins }));
    setRevenueData(chartData);
  }

  if (loading) return <div className="text-center py-12">Cargando métricas...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#D4AF37]">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Usuarios totales" value={stats.totalUsers.toLocaleString()} icon={<Users size={20} />} />
        <MetricCard title="Usuarios activos (7d)" value={stats.activeUsers.toLocaleString()} icon={<Users size={20} />} color="#00F3FF" />
        <MetricCard title="Coins en circulación" value={stats.totalCoins.toLocaleString()} icon={<Coins size={20} />} color="#D4AF37" />
        <MetricCard title="BID en circulación" value={stats.totalBID.toLocaleString()} icon={<TrendingUp size={20} />} color="#9B59B6" />
        <MetricCard title="Reportes pendientes" value={stats.pendingReports} icon={<AlertTriangle size={20} />} color="#FF0055" />
        <MetricCard title="Regalos (30d)" value={stats.totalGifts.toLocaleString()} icon={<Gift size={20} />} color="#00F3FF" />
        <MetricCard title="DAU (estimado)" value={stats.dailyActiveUsers} icon={<Eye size={20} />} color="#D4AF37" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-white font-bold mb-4">Ingresos por regalos (últimos 7 días)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <XAxis dataKey="date" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#D4AF37' }} />
            <Line type="monotone" dataKey="coins" stroke="#D4AF37" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}