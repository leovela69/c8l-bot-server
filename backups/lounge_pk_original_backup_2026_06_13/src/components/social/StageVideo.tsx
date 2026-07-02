// components/social/StageVideo.tsx
import { useState } from 'react';
import { Play, Users, Gamepad2, Star } from 'lucide-react';

interface StageVideoProps {
  currentVideo: string | null;
  onPlayVideo: (url: string) => void;
}

export function StageVideo({ currentVideo, onPlayVideo }: StageVideoProps) {
  const [activeGamePanel, setActiveGamePanel] = useState<'games' | 'casino' | 'rank'>('games');

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Pantalla de video / juegos integrados */}
      <div className="bg-black border-2 border-[#D4AF37] rounded-lg p-4 mb-4 min-h-[250px] relative overflow-hidden">
        {currentVideo ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              ▶️ Reproduciendo: {currentVideo}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Acceso directo a juegos desde el escenario */}
            <button className="bg-gradient-to-br from-purple-900 to-black p-4 rounded-lg border border-purple-500 hover:scale-105 transition-all">
              <Gamepad2 size={32} className="mx-auto mb-2 text-purple-400" />
              <div className="font-bold text-white text-sm">RAID BOSS</div>
              <div className="text-[10px] text-gray-400">Activo</div>
            </button>
            <button className="bg-gradient-to-br from-amber-900 to-black p-4 rounded-lg border border-amber-500 hover:scale-105 transition-all">
              <Star size={32} className="mx-auto mb-2 text-amber-400" />
              <div className="font-bold text-white text-sm">SLOTS</div>
              <div className="text-[10px] text-gray-400">Jackpot 69k</div>
            </button>
            <button className="bg-gradient-to-br from-cyan-900 to-black p-4 rounded-lg border border-cyan-500 hover:scale-105 transition-all">
              <Users size={32} className="mx-auto mb-2 text-cyan-400" />
              <div className="font-bold text-white text-sm">CLANES</div>
              <div className="text-[10px] text-gray-400">Guerra activa</div>
            </button>
          </div>
        )}
      </div>

      {/* Panel de control de la sala */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveGamePanel('games')}
            className={`px-4 py-2 text-sm border-2 font-mono ${
              activeGamePanel === 'games' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-gray-500'
            }`}
          >
            🎮 JUEGOS
          </button>
          <button
            onClick={() => setActiveGamePanel('casino')}
            className={`px-4 py-2 text-sm border-2 font-mono ${
              activeGamePanel === 'casino' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-gray-500'
            }`}
          >
            🎰 CASINO
          </button>
          <button
            onClick={() => setActiveGamePanel('rank')}
            className={`px-4 py-2 text-sm border-2 font-mono ${
              activeGamePanel === 'rank' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-gray-500'
            }`}
          >
            🏆 RANKING
          </button>
        </div>
        
        <button
          onClick={() => onPlayVideo('https://youtu.be/dQw4w9WgXcQ')}
          className="flex items-center gap-2 bg-[#D4AF37] text-black px-4 py-2 font-black text-sm border-2 border-black"
        >
          <Play size={14} /> VER PELÍCULA
        </button>
      </div>

      {/* Panel dinámico (ranking rápido) */}
      {activeGamePanel === 'rank' && (
        <div className="mt-4 bg-black/50 p-3 rounded border border-gray-800">
          <div className="text-xs text-[#D4AF37] mb-2">🏆 TOP 5 DE LA SALA</div>
          <div className="space-y-1">
            {['Leo Vela', 'Dj_Rayo', 'Reina_Melody', 'BeatMaster', 'Sonic_Flow'].map((name, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span>{i+1}. {name}</span>
                <span className="text-[#D4AF37]">{1000 - i * 100} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}