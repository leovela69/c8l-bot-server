// components/social/StageKaraoke.tsx
import { useState } from 'react';
import { Mic, MicOff, Play, Heart, Star, Zap } from 'lucide-react';

interface StageKaraokeProps {
  currentSong: string | null;
  lyrics: string;
  isMicActive: boolean;
  onMicToggle: () => void;
  onSendGift: (gift: string, coins: number) => void;
}

const SONG_SUGGESTIONS = [
  { title: 'Bohemian Rhapsody - Queen', lyrics: 'Is this the real life? Is this just fantasy?' },
  { title: 'Despacito - Luis Fonsi', lyrics: 'Despacito, quiero respirar tu cuello despacito' },
  { title: 'Shape of You - Ed Sheeran', lyrics: "The club isn't the best place to find a lover" },
  { title: 'Hotel California - Eagles', lyrics: 'On a dark desert highway, cool wind in my hair' }
];

export function StageKaraoke({ currentSong, lyrics, isMicActive, onMicToggle, onSendGift }: StageKaraokeProps) {
  const [selectedSong, setSelectedSong] = useState(SONG_SUGGESTIONS[0]);

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Pantalla de letras */}
      <div className="bg-black/80 border-2 border-[#D4AF37] rounded-lg p-6 mb-6 min-h-[200px] text-center">
        {currentSong ? (
          <>
            <h3 className="text-xl font-bold text-[#D4AF37] mb-4">{currentSong}</h3>
            <p className="text-white text-lg leading-relaxed">{lyrics}</p>
          </>
        ) : (
          <div className="text-gray-500">
            🎤 Selecciona una canción para comenzar
          </div>
        )}
      </div>

      {/* Controles del cantante */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onMicToggle}
          className={`flex items-center gap-2 px-6 py-3 border-2 font-black transition-all ${
            isMicActive 
              ? 'bg-red-600 text-white border-black' 
              : 'bg-[#D4AF37] text-black border-black'
          }`}
        >
          {isMicActive ? <MicOff size={20} /> : <Mic size={20} />}
          {isMicActive ? 'DESACTIVAR MIC' : 'ACTIVAR MIC'}
        </button>
        
        <div className="flex gap-2">
          <button className="p-2 bg-black border border-gray-700 rounded-full hover:border-[#FF69B4] hover:text-[#FF69B4] transition-colors cursor-pointer">
            <Heart size={20} />
          </button>
          <button className="p-2 bg-black border border-gray-700 rounded-full hover:border-[#8A2BE2] hover:text-[#8A2BE2] transition-colors cursor-pointer">
            <Star size={20} />
          </button>
          <button className="p-2 bg-black border border-gray-700 rounded-full hover:border-[#FF69B4] hover:text-[#FF69B4] transition-colors cursor-pointer">
            <Zap size={20} />
          </button>
        </div>
      </div>

      {/* Selector de canciones */}
      <div>
        <h4 className="text-sm font-mono text-[#D4AF37] mb-2">🎵 PRÓXIMAS CANCIONES</h4>
        <div className="grid grid-cols-2 gap-2">
          {SONG_SUGGESTIONS.map(song => (
            <button
              key={song.title}
              onClick={() => setSelectedSong(song)}
              className="text-left p-2 bg-black border border-gray-700 rounded hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all text-sm"
            >
              <div className="font-bold truncate">{song.title}</div>
              <div className="text-[10px] text-gray-500 truncate">{song.lyrics.substring(0, 40)}...</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}