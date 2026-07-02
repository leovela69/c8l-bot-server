'use client';
import { useState } from 'react';
import { Plus, X, Lock, Unlock, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface CreateRoomModalProps {
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
}

export function CreateRoomModal({ onClose, onRoomCreated }: CreateRoomModalProps) {
  const { user, showNotification } = useApp();
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxSeats, setMaxSeats] = useState(15);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) {
      showNotification('Nombre de sala es requerido', 'error');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          isPrivate,
          ownerId: user.uid,
          maxSeats,
        }),
      });

      const data = await res.json();
      if (data.success && data.room) {
        showNotification('Sala de canto creada correctamente', 'success');
        onRoomCreated(data.room.id);
        onClose();
      } else {
        showNotification(data.error || 'Error al crear la sala', 'error');
      }
    } catch (err) {
      console.error('Error creating room:', err);
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
            <h3 className="text-lg font-black text-[#D4AF37] font-mono">CREAR SALA DE CANTO</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Room Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#D4AF37] font-mono block uppercase">NOMBRE DE LA SALA</label>
            <input
              type="text"
              placeholder="Ej. EL RINCÓN DE LEO 🦁"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
              className="w-full bg-black border border-gray-800 focus:border-[#D4AF37] text-white rounded p-2.5 text-xs focus:outline-none"
            />
          </div>

          {/* Privacy Choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#D4AF37] font-mono block uppercase">TIPO DE ACCESO</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Public option */}
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-3 border rounded-lg flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  !isPrivate
                    ? 'bg-[#00F3FF]/10 border-[#00F3FF] text-[#00F3FF]'
                    : 'bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <Unlock size={20} />
                <span className="text-xs font-black font-mono">PÚBLICA</span>
              </button>

              {/* Private option */}
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-3 border rounded-lg flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isPrivate
                    ? 'bg-[#FF0055]/10 border-[#FF0055] text-[#FF0055]'
                    : 'bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <Lock size={20} />
                <span className="text-xs font-black font-mono">PRIVADA</span>
              </button>
            </div>
            <p className="text-[9px] text-gray-500 mt-1 italic text-center">
              {isPrivate
                ? '🔒 Solo usuarios invitados explícitamente podrán ver y unirse a esta sala.'
                : '🔓 Cualquiera puede unirse a tu sala desde el explorador público.'}
            </p>
          </div>

          {/* Max seats slider */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#D4AF37] font-mono block uppercase">
              CANTIDAD MÁXIMA DE SILLONES: {maxSeats}
            </label>
            <input
              type="range"
              min={1}
              max={15}
              value={maxSeats}
              onChange={(e) => setMaxSeats(parseInt(e.target.value))}
              className="w-full accent-[#D4AF37] bg-gray-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-500 font-mono">
              <span>1 Butaca</span>
              <span>15 Butacas (Estándar)</span>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="w-full py-3 bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] font-black border border-black hover:border-[#D4AF37] text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_10px_rgba(212,175,55,0.2)]"
          >
            {creating ? 'CREANDO SALA...' : 'CREAR SALA'}
          </button>
        </form>
      </div>
    </div>
  );
}
