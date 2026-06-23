'use client'
import { useState } from 'react'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'

interface Video {
  id: string
  title: string
  description: string
  author: string
  category: string
  duration: string
  views: number
  likes: number
  thumbnail: string
  embedUrl: string
  uploadedAt: string
}

// 8 videos de contenido C8L — URLs de YouTube embed (videos públicos de categorías relevantes)
const VIDEOS: Video[] = [
  {
    id: 'v1',
    title: 'Bolero-House: Fusión Musical del Futuro',
    description: 'La primera producción oficial de C8L Agency mezclando Bolero clásico con House moderno.',
    author: 'LeoVela',
    category: '🎵 Música',
    duration: '4:23',
    views: 3420,
    likes: 567,
    thumbnail: '🎵',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    uploadedAt: '2026-06-20',
  },
  {
    id: 'v2',
    title: 'Tutorial: Cómo usar el Estudio C8L',
    description: 'Aprende a crear tu primera canción con IA en el Estudio Musical de C8L Agency.',
    author: 'C8L_Official',
    category: '📚 Tutorial',
    duration: '8:15',
    views: 5200,
    likes: 890,
    thumbnail: '🎹',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    uploadedAt: '2026-06-19',
  },
  {
    id: 'v3',
    title: 'Torneo Casino Champions — Gran Final',
    description: 'La final épica del primer torneo de Casino Quantum. Jackpots, drama y emoción.',
    author: 'C8L_Official',
    category: '🎰 Gaming',
    duration: '12:47',
    views: 8900,
    likes: 1234,
    thumbnail: '🎰',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    uploadedAt: '2026-06-18',
  },
  {
    id: 'v4',
    title: 'Neon Nights — Beat Prod. C8L Beats',
    description: 'Beat instrumental tipo Bolero-House. Disponible para usar en tus creaciones.',
    author: 'C8L_Beats',
    category: '🎵 Música',
    duration: '3:56',
    views: 2100,
    likes: 412,
    thumbnail: '🌃',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    uploadedAt: '2026-06-17',
  },
  {
    id: 'v5',
    title: 'Cómo Ganar en la Ruleta C8L — Estrategias',
    description: 'Las mejores estrategias para maximizar tus C8L Coins en la Ruleta Quantum.',
    author: 'ProGamer',
    category: '🎮 Estrategia',
    duration: '6:30',
    views: 4500,
    likes: 678,
    thumbnail: '🎡',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    uploadedAt: '2026-06-16',
  },
  {
    id: 'v6',
    title: 'Live Session: DJ Quantum x LeoVela',
    description: 'Sesión en directo mezclando Bolero-House con electrónica experimental.',
    author: 'DJ_Quantum',
    category: '📺 Live',
    duration: '45:12',
    views: 6700,
    likes: 945,
    thumbnail: '🎧',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    uploadedAt: '2026-06-15',
  },
  {
    id: 'v7',
    title: 'Bandos: Guía Completa del Sistema',
    description: 'Todo lo que necesitas saber sobre Bandos — crear tu familia, guerras, y ranking.',
    author: 'C8L_Official',
    category: '📚 Tutorial',
    duration: '10:05',
    views: 3800,
    likes: 521,
    thumbnail: '⚔️',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    uploadedAt: '2026-06-14',
  },
  {
    id: 'v8',
    title: 'Cover Remix: La Bamba × House Edition',
    description: 'La Bamba como nunca la habías escuchado. Fusión latina con drops electrónicos.',
    author: 'LeoVela',
    category: '🎵 Música',
    duration: '3:28',
    views: 7200,
    likes: 1089,
    thumbnail: '🎤',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    uploadedAt: '2026-06-13',
  },
]

const CATEGORIES = ['Todos', '🎵 Música', '📚 Tutorial', '🎰 Gaming', '🎮 Estrategia', '📺 Live']

export default function TVPage() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [filter, setFilter] = useState('Todos')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'likes'>('recent')

  const filteredVideos = VIDEOS
    .filter(v => filter === 'Todos' || v.category === filter)
    .sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views
      if (sortBy === 'likes') return b.likes - a.likes
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    })

  const challenges = [
    { title: 'Mejor cover de la semana', reward: '500 C8L', deadline: '3 días', participants: 12 },
    { title: 'Duelo: Mejor producción', reward: '1000 C8L', deadline: '5 días', participants: 8 },
    { title: 'Torneo Casino Champions', reward: '5000 C8L', deadline: '7 días', participants: 32 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-purple-950/10 to-c8l-black">
      <header className="glass border-b border-c8l-purple/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-xl font-outfit font-semibold text-c8l-purple">📺 C8L TV</h1>
          </div>
          <div className="text-xs text-gray-400">
            {VIDEOS.length} videos • {VIDEOS.reduce((acc, v) => acc + v.views, 0).toLocaleString()} views totales
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Video Player */}
        {selectedVideo && (
          <div className="mb-8">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-c8l-purple/30 mb-4">
              <iframe
                src={selectedVideo.embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedVideo.title}
              />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-outfit font-bold text-white">{selectedVideo.title}</h2>
                <p className="text-gray-400 text-sm mt-1">{selectedVideo.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>@{selectedVideo.author}</span>
                  <span>👁 {selectedVideo.views.toLocaleString()}</span>
                  <span>❤️ {selectedVideo.likes.toLocaleString()}</span>
                  <span>🕐 {selectedVideo.duration}</span>
                  <span className="px-2 py-0.5 rounded bg-c8l-purple/20 text-c8l-purple">{selectedVideo.category}</span>
                </div>
              </div>
              <button onClick={() => setSelectedVideo(null)} className="text-gray-400 hover:text-white transition text-sm">
                ✕ Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        {!selectedVideo && (
          <div className="text-center mb-8">
            <h2 className="text-4xl font-outfit font-bold neon-purple mb-2">📺 C8L TV</h2>
            <p className="text-gray-400">Contenido oficial, tutoriales, música y competiciones.</p>
          </div>
        )}

        {/* Challenges */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-c8l-gold">🏆 Retos Activos</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {challenges.map((c, i) => (
              <div key={i} className="glass rounded-xl p-4 hover:border-c8l-gold/50 transition cursor-pointer group">
                <h4 className="font-semibold mb-2 group-hover:text-c8l-gold transition">{c.title}</h4>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>⏰ {c.deadline}</span>
                  <span>👥 {c.participants}</span>
                </div>
                <div className="text-sm text-c8l-gold font-bold">🎁 {c.reward}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  filter === cat ? 'bg-c8l-purple text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="ml-auto bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300">
            <option value="recent">Más recientes</option>
            <option value="popular">Más vistos</option>
            <option value="likes">Más likes</option>
          </select>
        </div>

        {/* Video Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredVideos.map(video => (
            <div key={video.id} onClick={() => setSelectedVideo(video)}
              className="glass rounded-xl overflow-hidden group cursor-pointer hover:border-c8l-purple/50 transition hover:scale-[1.02]">
              <div className="relative h-36 bg-gradient-to-br from-c8l-purple/20 to-c8l-pink/10 flex items-center justify-center">
                <span className="text-5xl group-hover:scale-125 transition-transform">{video.thumbnail}</span>
                <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-2 py-0.5 rounded">{video.duration}</div>
                <div className="absolute top-2 left-2 bg-black/60 text-[10px] px-2 py-0.5 rounded text-c8l-purple">{video.category}</div>
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-c8l-purple/80 flex items-center justify-center text-2xl">▶</div>
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-c8l-purple transition">{video.title}</h4>
                <p className="text-xs text-gray-500 mb-1">@{video.author}</p>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>👁 {video.views.toLocaleString()}</span>
                  <span>❤️ {video.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-c8l-gold">{VIDEOS.length}</div>
            <div className="text-xs text-gray-500">Videos</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-c8l-purple">{VIDEOS.reduce((a, v) => a + v.views, 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500">Views Totales</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-c8l-pink">{VIDEOS.reduce((a, v) => a + v.likes, 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500">Likes Totales</div>
          </div>
        </div>
      </main>

      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}
