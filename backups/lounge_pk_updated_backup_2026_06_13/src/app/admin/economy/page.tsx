// app/admin/economy/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function EconomyConfig() {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const { data } = await supabase.from('system_config').select('*');
    const obj: Record<string, any> = {};
    data?.forEach(item => { obj[item.key] = item.value; });
    setConfig(obj);
    setLoading(false);
  }

  async function updateConfig(key: string, value: any) {
    await supabase.from('system_config').upsert({ key, value });
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  }

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#D4AF37]">Configuración Económica</h1>
      <div className="grid grid-cols-2 gap-4">
        <ConfigCard
          label="Tasa conversión COIN → BID"
          value={config.coin_to_bid || 0.1}
          onChange={(val) => updateConfig('coin_to_bid', val)}
          step={0.01}
        />
        <ConfigCard
          label="Recompensa base misiones diarias"
          value={config.daily_mission_reward || 50}
          onChange={(val) => updateConfig('daily_mission_reward', val)}
        />
        <ConfigCard
          label="Costo semanal de mantenimiento de Bando"
          value={config.faction_maintenance_cost || 100}
          onChange={(val) => updateConfig('faction_maintenance_cost', val)}
        />
      </div>
    </div>
  );
}

function ConfigCard({
  label,
  value,
  onChange,
  step = 1
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  step?: number;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2">
      <label className="text-sm font-bold text-gray-400 block">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-black border border-gray-800 rounded p-2 text-white font-mono"
      />
    </div>
  );
}