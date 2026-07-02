// components/karaoke/KaraokeCatalog.tsx
import { useState, useEffect } from 'react';
import { Play, Mic, Heart, Crown, TrendingUp } from 'lucide-react';
import { CoverRecorder } from './CoverRecorder';

interface Track {
  id: string;
  title: string;
  genre: string;
  mood: string;
  instrumental_url: string;
  cover_count: number;
  total_votes: number;
  created_by: string;
}

export function KaraokeCatalog() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'recorder' | 'covers'>('catalog');
  const [covers, setCovers] = useState<any[]>([]);
  
  useEffect(() => {
    fetchTracks();
  }, []);
  
  const fetchTracks = async () => {
    const response = await fetch('/api/karaoke/tracks');
    const data = await response.json();
    setTracks(data);
  };
  
  const fetchCovers = async (trackId: string) => {
    const response = await fetch(`/api/karaoke/covers?trackId=${trackId}`);
    const data = await response.json();
    setCovers(data);
  };
  
  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
    fetchCovers(track.id);
    setActiveTab('covers');
  };
  
  return (
    <div className="border-4 border-[#D4AF37] bg-black p-6">
      <h2 className="text-2xl font-black text-[#D4AF37] mb-4 flex items-center gap-2">
        <Mic /> KARAOKE C8L - CANCIONES ORIGINALES
      </h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 font-mono ${activeTab === 'catalog' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-500'}`}
        >
          📋 CATÁLOGO
        </button>
        <button
          onClick={() => setActiveTab('recorder')}
          className={`px-4 py-2 font-mono ${activeTab === 'recorder' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-500'}`}
        >
          🎤 GRABAR COVER
        </button>
        {selectedTrack && (
          <button
            onClick={() => setActiveTab('covers')}
            className={`px-4 py-2 font-mono ${activeTab === 'covers' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-500'}`}
          >
            🎧 COVERS ({covers.length})
          </button>
        )}
      </div>
      
      {/* Catálogo de canciones */}
      {activeTab === 'catalog' && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {tracks.map(track => (
            <div
              key={track.id}
              className="bg-gray-900 p-4 rounded-lg flex justify-between items-center hover:bg-gray-800 transition-all cursor-pointer"
              onClick={() => handleSelectTrack(track)}
            >
              <div>
                <div className="font-bold text-white">{track.title}</div>
                <div className="text-xs text-gray-400 flex gap-3 mt-1">
                  <span>🎵 {track.genre}</span>
                  <span>🎭 {track.mood}</span>
                  <span>🎤 {track.cover_count} covers</span>
                  <span>❤️ {track.total_votes} votos</span>
                </div>
              </div>
              <button className="px-4 py-2 bg-[#D4AF37] text-black font-black text-sm rounded hover:bg-[#FFD700]">
                CANTAR →
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Grabador de cover */}
      {activeTab === 'recorder' && selectedTrack && (
        <CoverRecorder
          trackId={selectedTrack.id}
          instrumentalUrl={selectedTrack.instrumental_url}
          onCoverUploaded={() => {
            fetchCovers(selectedTrack.id);
            setActiveTab('covers');
          }}
        />
      )}
      
      {/* Lista de covers existentes */}
      {activeTab === 'covers' && selectedTrack && (
        <div className="space-y-4">
          <div className="bg-[#D4AF37]/10 p-3 border-l-4 border-[#D4AF37] mb-4">
            <div className="font-bold text-[#D4AF37]">{selectedTrack.title}</div>
            <div className="text-sm text-gray-400">Base original - ¡Canta tu versión!</div>
          </div>
          
          {covers.map(cover => (
            <div key={cover.id} className="bg-gray-900 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    🎤 {cover.user_name || 'Anónimo'}
                    {cover.is_original && <span className="text-xs bg-[#D4AF37] text-black px-2 rounded">CREADOR</span>}
                  </div>
                  <div className="text-xs text-gray-500">{new Date(cover.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-3 py-1 bg-black border border-gray-700 rounded hover:border-[#D4AF37]">
                    <Heart size={14} /> {cover.votes}
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 bg-black border border-gray-700 rounded hover:border-[#D4AF37]">
                    <Crown size={14} /> REGALAR
                  </button>
                </div>
              </div>
              <audio src={cover.cover_url} controls className="w-full" />
            </div>
          ))}
        </div>
      )}
      
      {/* Botón para crear nueva canción base */}
      <div className="mt-6 pt-4 border-t border-gray-800 text-center">
        <button
          onClick={() => window.location.href = '/studio?mode=karaoke'}
          className="px-6 py-3 bg-[#00F3FF] text-black font-black text-sm border-2 border-black hover:bg-[#00F3FF]/80"
        >
          ✨ CREAR NUEVA CANCIÓN BASE (100 COINS) ✨
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Genera música original con IA y compártela para que otros canten tus canciones.
          ¡Ganas coins cada vez que alguien hace un cover!
        </p>
      </div>
    </div>
  );
}