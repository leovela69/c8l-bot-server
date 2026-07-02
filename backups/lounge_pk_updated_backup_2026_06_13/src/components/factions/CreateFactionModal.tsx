'use client';
import { useState } from 'react';
import { Plus, X, Sword, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface CreateFactionModalProps {
  onClose: () => void;
  onFactionCreated: (factionId: string) => void;
}

const EMBLEM_EMOJIS = ['🛸', '🎸', '⚡', '🦁', '🔥', '👾', '👑', '⚔️', '🛡️', '🎹', '🎙️', '💿', '💎', '🦄'];
const NEON_COLORS = [
  { name: 'Rosa Neón', hex: '#FF0055' },
  { name: 'Cyan Neón', hex: '#00F3FF' },
  { name: 'Morado Neón', hex: '#8A2BE2' },
  { name: 'Oro Chrome', hex: '#D4AF37' },
  { name: 'Verde Hacker', hex: '#39FF14' }
];

export function CreateFactionModal({ onClose, onFactionCreated }: CreateFactionModalProps) {
  const { user, c8lCoins, showNotification } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emblem, setEmblem] = useState('⚔️');
  const [color, setColor] = useState('#D4AF37');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim() || !description.trim()) {
      showNotification('Todos los campos son requeridos', 'error');
      return;
    }

    if (c8lCoins < 10000) {
      showNotification('Saldo de Coins insuficiente para fundar un Bando (Costo: 10,000 Coins)', 'error');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/factions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim().toUpperCase(),
          description: description.trim(),
          emblem,
          userId: user.uid
        }),
      });

      const data = await res.json();
      if (data.success && data.faction) {
        showNotification(`¡Has fundado el bando ${name.trim().toUpperCase()}!`, 'success');
        onFactionCreated(data.faction.id);
        onClose();
      } else {
        showNotification(data.error || 'Error al fundar el Bando', 'error');
      }
    } catch (err) {
      console.error('Error creating faction:', err);
      showNotification('Error de conexión', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-4 border-[#D4AF37] w-full max-w-md rounded-lg overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-2">
            <Plus className="text-[#D4AF37]" size={20} />
            <h3 className="text-lg font-black text-[#D4AF37] font-mono">FUNDAR NUEVO BANDO</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Warning badge */}
          <div className="bg-[#FF0055]/10 border border-[#FF0055]/30 p-3 rounded text-[10px] text-[#FF0055] font-mono flex items-center gap-1.5 uppercase font-bold">
            <Sword size={14} className="animate-pulse" />
            <span>Fundar un bando cuesta 10,000 Coins de tu balance global</span>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#D4AF37] font-mono block uppercase">NOMBRE DEL BANDO</label>
            <input
              type="text"
              placeholder="Ej. GUERREROS DEL MULTIVERSO ⚔️"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={30}
              className="w-full bg-black border border-gray-800 focus:border-[#D4AF37] text-white rounded p-2.5 text-xs focus:outline-none focus:ring-0"
            />
          </div>

          {/* Selector Grid: Emblem & Color */}
          <div className="grid grid-cols-2 gap-4">
            {/* Emblem Emoji selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#D4AF37] font-mono block uppercase">EMBLEMA</label>
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

            {/* Neon Color selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#D4AF37] font-mono block uppercase">COLOR DE NEÓN</label>
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#D4AF37] font-mono block uppercase">FILOSOFÍA DEL BANDO</label>
            <textarea
              rows={3}
              placeholder="Describe el propósito de tu bando, los géneros musicales favoritos y las reglas del grupo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={200}
              className="w-full bg-black border border-gray-800 focus:border-[#D4AF37] text-white rounded p-2.5 text-xs focus:outline-none resize-none"
            />
          </div>

          {/* Founding Cost action button */}
          <button
            type="submit"
            disabled={creating || !name.trim() || c8lCoins < 10000}
            className="w-full py-3 bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] font-black border border-black hover:border-[#D4AF37] text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(212,175,55,0.2)] flex items-center justify-center gap-1"
          >
            <Sparkles size={14} />
            {creating ? 'FUNDANDO...' : `FUNDAR POR 10,000 COINS`}
          </button>
        </form>
      </div>
    </div>
  );
}
