// components/live/StartBattleButton.tsx
'use client';
import { useState } from 'react';
import { Sword } from 'lucide-react';

interface StartBattleButtonProps {
  liveStreamId: string;
  currentUserId: string;
}

export function StartBattleButton({ liveStreamId, currentUserId }: StartBattleButtonProps) {
  const [opponentId, setOpponentId] = useState('');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);

  const startBattle = async () => {
    setLoading(true);
    const res = await fetch('/api/live/start-battle', {
      method: 'POST',
      body: JSON.stringify({
        liveStreamId,
        participant1Id: currentUserId,
        participant2Id: opponentId,
        durationSeconds: duration,
      }),
    });
    if (res.ok) {
      alert('¡Batalla iniciada!');
    } else {
      alert('Error al iniciar batalla');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border border-gray-800 rounded-lg">
      <h3 className="text-[#D4AF37] font-black mb-2">Iniciar Batalla PK</h3>
      <input
        type="text"
        placeholder="ID del oponente"
        value={opponentId}
        onChange={(e) => setOpponentId(e.target.value)}
        className="w-full bg-black border border-gray-700 p-2 mb-2"
      />
      <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full bg-black border border-gray-700 p-2 mb-2">
        <option value="60">1 minuto</option>
        <option value="120">2 minutos</option>
        <option value="180">3 minutos</option>
      </select>
      <button
        onClick={startBattle}
        disabled={loading || !opponentId}
        className="w-full bg-[#D4AF37] text-black font-black py-2 flex items-center justify-center gap-2"
      >
        <Sword size={16} /> INICIAR BATALLA
      </button>
    </div>
  );
}