// components/halloffame/CoverWall.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Mic, Heart, Share2, Trophy, Star, Calendar, User, Music, Volume2, Award, Flame, Crown, Diamond, Gift } from 'lucide-react';

interface LegendaryCover {
  id: string;
  title: string;
  artist: string;
  coverArtist: string;
  coverArtistAvatar: string;
  coverUrl: string;
  originalTrackId: string;
  score: number;
  votes: number;
  views: number;
  giftsReceived: number;
  legendaryBadges: string[];
  date: Date;
  isLegendary: boolean;
  isHallOfFame: boolean;
  comments: Array<{ user: string; message: string; date: Date }>;
}

const LEGENDARY_COVERS: LegendaryCover[] = [
  {
    id: '1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    coverArtist: 'Leo Vela',
    coverArtistAvatar: '🦁',
    coverUrl: '/demo/cover1.mp3',
    originalTrackId: 'track1',
    score: 99,
    votes: 1247,
    views: 5234,
    giftsReceived: 89,
    legendaryBadges: ['🏆', '👑', '💎', '⭐', '🎤'],
    date: new Date(2024, 5, 15),
    isLegendary: true,
    isHallOfFame: true,
    comments: [
      { user: 'Dj_Rayo', message: '¡Increíble interpretación! 🔥', date: new Date(2024, 5, 16) },
      { user: 'Reina_Melody', message: 'Me puso la piel de gallina', date: new Date(2024, 5, 17) },
    ],
  },
  {
    id: '2',
    title: 'Despacito',
    artist: 'Luis Fonsi',
    coverArtist: 'Reina_Melody',
    coverArtistAvatar: '👑',
    coverUrl: '/demo/cover2.mp3',
    originalTrackId: 'track2',
    score: 97,
    votes: 982,
    views: 4123,
    giftsReceived: 56,
    legendaryBadges: ['👑', '⭐', '🎤'],
    date: new Date(2024, 5, 10),
    isLegendary: true,
    isHallOfFame: true,
    comments: [
      { user: 'Leo Vela', message: '¡Qué voz! 👏', date: new Date(2024, 5, 11) },
    ],
  },
  {
    id: '3',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    coverArtist: 'Dj_Rayo',
    coverArtistAvatar: '⚡',
    coverUrl: '/demo/cover3.mp3',
    originalTrackId: 'track3',
    score: 96,
    votes: 876,
    views: 3876,
    giftsReceived: 45,
    legendaryBadges: ['⚡', '⭐', '🎤'],
    date: new Date(2024, 5, 8),
    isLegendary: true,
    isHallOfFame: true,
    comments: [],
  },
  {
    id: '4',
    title: 'Hotel California',
    artist: 'Eagles',
    coverArtist: 'BeatMaster',
    coverArtistAvatar: '🎧',
    coverUrl: '/demo/cover4.mp3',
    originalTrackId: 'track4',
    score: 94,
    votes: 654,
    views: 2890,
    giftsReceived: 32,
    legendaryBadges: ['⭐', '🎤'],
    date: new Date(2024, 5, 5),
    isLegendary: true,
    isHallOfFame: false,
    comments: [],
  },
  {
    id: '5',
    title: 'Rolling in the Deep',
    artist: 'Adele',
    coverArtist: 'Sonic_Flow',
    coverArtistAvatar: '🎤',
    coverUrl: '/demo/cover5.mp3',
    originalTrackId: 'track5',
    score: 95,
    votes: 721,
    views: 3102,
    giftsReceived: 38,
    legendaryBadges: ['⭐', '🎤'],
    date: new Date(2024, 5, 3),
    isLegendary: true,
    isHallOfFame: false,
    comments: [],
  },
];

export function CoverWall() {
  const [selectedCover, setSelectedCover] = useState<LegendaryCover | null>(null);
  const [filter, setFilter] = useState<'all' | 'hallOfFame' | 'legendary'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'votes' | 'views' | 'date'>('score');
  const [playingCoverId, setPlayingCoverId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const filteredCovers = LEGENDARY_COVERS
    .filter(cover => {
      if (filter === 'hallOfFame') return cover.isHallOfFame;
      if (filter === 'legendary') return cover.isLegendary;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'votes') return b.votes - a.votes;
      if (sortBy === 'views') return b.views - a.views;
      return b.date.getTime() - a.date.getTime();
    });
  
  const playPreview = (cover: LegendaryCover) => {
    if (playingCoverId === cover.id) {
      audioRef.current?.pause();
      setPlayingCoverId(null);
    } else {
      setPlayingCoverId(cover.id);
      if (audioRef.current) {
        audioRef.current.src = cover.coverUrl;
        audioRef.current.play();
      }
    }
  };
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setPlayingCoverId(null);
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-6">
      
      <audio ref={audioRef} className="hidden" />
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center gap-3 mb-3">
          <Music className="text-[#D4AF37]" size={48} />
          <span className="text-4xl font-black text-[#D4AF37]">MURO DE LA FAMA</span>
          <Award className="text-[#D4AF37]" size={48} />
        </div>
        <p className="text-gray-400">Los covers más legendarios de la historia de C8L. ¡Inmortales!</p>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 border-2 font-black transition-all ${
            filter === 'all' 
              ? 'bg-[#D4AF37] text-black border-black' 
              : 'bg-black text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37]/10'
          }`}
        >
          TODOS LOS COVERS
        </button>
        <button
          onClick={() => setFilter('hallOfFame')}
          className={`px-4 py-2 border-2 font-black transition-all flex items-center gap-2 ${
            filter === 'hallOfFame' 
              ? 'bg-[#D4AF37] text-black border-black' 
              : 'bg-black text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37]/10'
          }`}
        >
          <Crown size={16} /> HALL OF FAME
        </button>
        <button
          onClick={() => setFilter('legendary')}
          className={`px-4 py-2 border-2 font-black transition-all flex items-center gap-2 ${
            filter === 'legendary' 
              ? 'bg-[#D4AF37] text-black border-black' 
              : 'bg-black text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37]/10'
          }`}
        >
          <Flame size={16} /> LEGENDARIOS
        </button>
      </div>
      
      {/* Ordenar */}
      <div className="flex justify-end gap-2 mb-6">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-black border-2 border-[#D4AF37] text-[#D4AF37] px-3 py-1 text-sm font-mono"
        >
          <option value="score">Por puntuación</option>
          <option value="votes">Por votos</option>
          <option value="views">Por reproducciones</option>
          <option value="date">Más recientes</option>
        </select>
      </div>
      
      {/* Grid de covers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {filteredCovers.map((cover, idx) => (
          <motion.div
            key={cover.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -4 }}
            onClick={() => setSelectedCover(cover)}
            className={`relative bg-black border-4 p-5 cursor-pointer transition-all ${
              cover.isHallOfFame 
                ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                : cover.isLegendary
                  ? 'border-[#FF0055]'
                  : 'border-gray-700'
            }`}
          >
            {/* Badges */}
            <div className="absolute top-2 right-2 flex gap-1">
              {cover.isHallOfFame && (
                <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                  <Crown size={16} className="text-black" />
                </div>
              )}
              {cover.score >= 98 && (
                <div className="w-8 h-8 bg-[#FF0055] rounded-full flex items-center justify-center">
                  <Diamond size={16} className="text-white" />
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-5xl mb-3">{cover.coverArtistAvatar}</div>
              <h3 className="text-lg font-black text-white">{cover.title}</h3>
              <div className="text-sm text-gray-400">{cover.artist}</div>
              <div className="text-xs text-[#D4AF37] mt-1">por {cover.coverArtist}</div>
              
              <div className="flex justify-center gap-1 my-2">
                {cover.legendaryBadges.slice(0, 5).map((badge, i) => (
                  <span key={i} className="text-sm">{badge}</span>
                ))}
              </div>
              
              <div className="text-3xl font-black text-[#D4AF37] mt-2">{cover.score}</div>
              <div className="text-xs text-gray-500">puntuación</div>
              
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <div>
                  <Heart size={12} className="inline text-red-500" />
                  <span className="ml-1">{cover.votes}</span>
                </div>
                <div>
                  <Play size={12} className="inline text-[#00F3FF]" />
                  <span className="ml-1">{cover.views}</span>
                </div>
                <div>
                  <Award size={12} className="inline text-[#D4AF37]" />
                  <span className="ml-1">{cover.giftsReceived}</span>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playPreview(cover);
                }}
                className={`mt-3 w-full py-2 border-2 font-black text-sm transition-all flex items-center justify-center gap-2 ${
                  playingCoverId === cover.id
                    ? 'bg-red-600 text-white border-black'
                    : 'bg-[#D4AF37] text-black border-black hover:bg-[#FFD700]'
                }`}
              >
                {playingCoverId === cover.id ? <Volume2 size={14} /> : <Play size={14} />}
                {playingCoverId === cover.id ? 'REPRODUCIENDO...' : 'ESCUCHAR PREVIEW'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Modal de detalles del cover */}
      <AnimatePresence>
        {selectedCover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedCover(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gradient-to-b from-gray-900 to-black border-4 border-[#D4AF37] max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[#D4AF37]/20 to-transparent p-6">
                <button
                  onClick={() => setSelectedCover(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
                
                <div className="flex items-center gap-6">
                  <div className="text-8xl">{selectedCover.coverArtistAvatar}</div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedCover.title}</h2>
                    <p className="text-[#D4AF37]">{selectedCover.artist}</p>
                    <p className="text-gray-400 text-sm">Cover por {selectedCover.coverArtist}</p>
                    <div className="flex gap-2 mt-2">
                      {selectedCover.legendaryBadges.map((badge, i) => (
                        <span key={i} className="text-xl">{badge}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Reproductor completo */}
              <div className="p-6 border-b border-gray-800">
                <div className="bg-black p-4 rounded-lg">
                  <audio controls className="w-full" src={selectedCover.coverUrl} />
                </div>
              </div>
              
              {/* Estadísticas */}
              <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-800">
                <div className="text-center">
                  <div className="text-3xl font-black text-[#D4AF37]">{selectedCover.score}</div>
                  <div className="text-xs text-gray-500">Puntuación</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-red-500">{selectedCover.votes}</div>
                  <div className="text-xs text-gray-500">Votos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-[#00F3FF]">{selectedCover.views}</div>
                  <div className="text-xs text-gray-500">Reproducciones</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-[#D4AF37]">{selectedCover.giftsReceived}</div>
                  <div className="text-xs text-gray-500">Regalos</div>
                </div>
              </div>
              
              {/* Badges obtenidos */}
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-[#D4AF37] font-black mb-3 flex items-center gap-2">
                  <Award size={18} /> LOGROS DEL COVER
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCover.score >= 95 && (
                    <div className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-3 py-1 rounded-full text-sm font-black">
                      🏆 5 ESTRELLAS
                    </div>
                  )}
                  {selectedCover.votes > 1000 && (
                    <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-black">
                      ❤️ MÁS VOTADO
                    </div>
                  )}
                  {selectedCover.views > 5000 && (
                    <div className="bg-[#00F3FF] text-black px-3 py-1 rounded-full text-sm font-black">
                      👑 VIRAL
                    </div>
                  )}
                  {selectedCover.giftsReceived > 50 && (
                    <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-black">
                      🎁 REY DE REGALOS
                    </div>
                  )}
                </div>
              </div>
              
              {/* Comentarios */}
              <div className="p-6">
                <h3 className="text-[#D4AF37] font-black mb-3 flex items-center gap-2">
                  <Heart size={18} /> COMENTARIOS ({selectedCover.comments.length})
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedCover.comments.map((comment, i) => (
                    <div key={i} className="bg-black/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[#D4AF37]">{comment.user}</span>
                        <span className="text-xs text-gray-500">{comment.date.toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-300">{comment.message}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Deja un comentario..."
                    className="flex-1 bg-black border-2 border-gray-700 p-2 text-white text-sm"
                  />
                  <button className="px-4 py-2 bg-[#D4AF37] text-black font-black text-sm">
                    ENVIAR
                  </button>
                </div>
              </div>
              
              {/* Acciones */}
              <div className="p-6 pt-0 flex gap-3">
                <button className="flex-1 py-3 bg-[#D4AF37] text-black font-black flex items-center justify-center gap-2">
                  <Heart size={18} /> VOTAR
                </button>
                <button className="flex-1 py-3 bg-purple-600 text-white font-black flex items-center justify-center gap-2">
                  <Gift size={18} /> REGALAR
                </button>
                <button className="flex-1 py-3 bg-gray-800 text-white font-black flex items-center justify-center gap-2">
                  <Share2 size={18} /> COMPARTIR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}