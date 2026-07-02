'use client';
import { useState } from 'react';
import { Settings, Save, ShieldAlert, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Faction {
  id: string;
  name: string;
  description: string;
  level: number;
  xp: number;
  emblem_url: string;
  banner_url: string;
  color?: string;
}

interface FactionSettingsProps {
  faction: Faction;
  onSettingsSaved?: () => void;
}

const EMBLEM_EMOJIS = ['🛸', '🎸', '⚡', '🦁', '🔥', '👾', '👑', '⚔️', '🛡️', '🎹', '🎙️', '💿', '💎', '🦄'];
const NEON_COLORS = [
  { name: 'Rosa Neón', hex: '#FF0055' },
  { name: 'Cyan Neón', hex: '#00F3FF' },
  { name: 'Morado Neón', hex: '#8A2BE2' },
  { name: 'Oro Chrome', hex: '#D4AF37' },
  { name: 'Verde Hacker', hex: '#39FF14' }
];

export function FactionSettings({ faction, onSettingsSaved }: FactionSettingsProps) {
  const { showNotification } = useApp();
  const [description, setDescription] = useState(faction.description);
  const [emblem, setEmblem] = useState(faction.emblem_url || '⚔️');
  const [color, setColor] = useState(faction.color || '#D4AF37');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      showNotification('La descripción es requerida', 'error');
      return;
    }

    try {
      setSaving(true);
      const { supabase } = await import('@/lib/supabase/client');
      
      const { error } = await supabase
        .from('factions')
        .update({
          description: description.trim(),
          emblem_url: emblem,
          banner_url: color, // We can reuse banner_url or use standard columns
          updated_at: new Date().toISOString()
        })
        .eq('id', faction.id);

      if (error) throw error;
      showNotification('Configuración de bando actualizada', 'success');
      if (onSettingsSaved) onSettingsSaved();
    } catch (e: any) {
      console.error('Error updating faction settings:', e);
      showNotification('Error al guardar: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-black/60 border-2 border-gray-800 rounded-xl p-5 space-y-6">
      <div className="border-b border-gray-900 pb-3 flex items-center gap-2">
        <Settings className="text-[#D4AF37]" size={20} />
        <h3 className="text-sm font-black text-[#D4AF37] font-mono tracking-wider uppercase">AJUSTES ADMINISTRATIVOS</h3>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Name (View only for safety) */}
        <div>
          <span className="text-[10px] font-mono text-gray-500 block uppercase">Nombre de Bando</span>
          <span className="text-lg font-black text-white font-mono">{faction.name}</span>
        </div>

        {/* Emblem & Color Neon */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 font-mono block uppercase">CAMBIAR EMBLEMA</label>
            <select
              value={emblem}
              onChange={(e) => setEmblem(e.target.value)}
              className="w-full bg-black border border-gray-800 text-white rounded p-2 text-xs focus:outline-none"
            >
              {EMBLEM_EMOJIS.map((emoji) => (
                <option key={emoji} value={emoji}>
                  {emoji}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 font-mono block uppercase">NEÓN CORPORATIVO</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full bg-black border border-gray-800 text-white rounded p-2 text-xs focus:outline-none"
            >
              {NEON_COLORS.map((c) => (
                <option key={c.hex} value={c.hex}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description philosophy */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 font-mono block uppercase">DESCRIPCIÓN / FILOSOFÍA</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={200}
            className="w-full bg-black border border-gray-800 focus:border-[#D4AF37] text-white rounded p-2.5 text-xs focus:outline-none resize-none"
          />
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] font-black border border-black hover:border-[#D4AF37] text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-[0_3px_10px_rgba(212,175,55,0.1)]"
        >
          <Save size={14} />
          {saving ? 'GUARDANDO...' : 'GUARDAR AJUSTES'}
        </button>
      </form>
    </div>
  );
}
