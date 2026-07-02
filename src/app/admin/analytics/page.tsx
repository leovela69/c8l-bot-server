// app/admin/analytics/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function Analytics() {
  const [userSignups, setUserSignups] = useState<any[]>([]);
  const [giftDistribution, setGiftDistribution] = useState<any[]>([]);
  const [retention, setRetention] = useState<any[]>([]);

  useEffect(() => {
    loadSignups();
    loadGiftStats();
    loadRetention();
  }, []);

  async function loadSignups() {
    const { data } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30*86400000).toISOString());
    
    const daily: Record<string, number> = {};
    data?.forEach(u => {
      const day = u.created_at.split('T')[0];
      daily[day] = (daily[day] || 0) + 1;
    });
    setUserSignups(Object.entries(daily).map(([date, count]) => ({ date, count })));
  }

  async function loadGiftStats() {
    const { data } = await supabase
      .from('gift_transactions')
      .select('gift_id, coins_spent')
      .gte('created_at', new Date(Date.now() - 30*86400000).toISOString());
    
    const giftMap = new Map();
    data?.forEach(g => {
      giftMap.set(g.gift_id, (giftMap.get(g.gift_id) || 0) + g.coins_spent);
    });
    setGiftDistribution(Array.from(giftMap.entries()).map(([name, value]) => ({ name, value })));
  }

  async function loadRetention() {
    // Simulación: días después del registro que el usuario sigue activo
    setRetention([
      { day: 1, retention: 100 },
      { day: 7, retention: 65 },
      { day: 30, retention: 42 },
      { day: 60, retention: 28 },
    ]);
  }

  const COLORS = ['#D4AF37', '#00F3FF', '#FF0055', '#9B59B6', '#FF6600'];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-[#D4AF37]">Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-white font-bold mb-4">Nuevos usuarios (últimos 30 días)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userSignups}>
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Bar dataKey="count" fill="#D4AF37" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-white font-bold mb-4">Distribución de regalos (por valor)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={giftDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {giftDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-white font-bold mb-4">Retención de usuarios</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={retention}>
              <XAxis dataKey="day" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Line type="monotone" dataKey="retention" stroke="#00F3FF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}