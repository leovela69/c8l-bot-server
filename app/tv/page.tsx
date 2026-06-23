'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// Tipos
interface TVPost {
  id: string
  title: string
  description: string
  type: 'video' | 'music' | 'live' | 'tutorial' | 'gaming'
  emoji: string
  author: string
  authorBadge?: 'oficial' | 'verificado' | 'usuario'
  videoUrl?: string
  thumbnailUrl?: string
  likes: number
  views: number
  createdAt: any
}

// Contenido inicial del bot (8 videos oficiales)
const BOT_CONTENT: TVPost[] = [
  {
    id: 'bot-1',
    title: 'Bolero-House Session #1 — Noche de Neon',
    description: 'Primera sesion oficial de produccion Bolero-House. Ritmos latinos fusionados con beats electronicos.',
    type: 'music',
    emoji: '🎵',
    author: '@leon_leo_bot',
    authorBadge: 'oficial',
    videoUrl: '',
    thumbnailUrl: '',
    likes: 847,
    views: 12400,
    createdAt: new Date('2026-06-20T20:00:00')
  },
  {
    id: 'bot-2',
    title: 'C8L Agency — Trailer Oficial 2026',
    description: 'Bienvenidos a C8L Agency. Musica, gaming, comunidad. Todo en un solo lugar.',
    type: 'video',
    emoji: '🎬',
    author: '@leon_leo_bot',
    authorBadge: 'oficial',
    videoUrl: '',
    thumbnailUrl: '',
    likes: 1203,
    views: 28500,
    createdAt: new Date('2026-06-19T18:00:00')
  },
  {
    id: 'bot-3',
    title: 'Tutorial: Como crear beats con IA en 5 minutos',
    description: 'Aprende a usar inteligencia artificial para producir musica profesional desde cero.',
    type: 'tutorial',
    emoji: '📚',
    author: '@leon_leo_bot',
    authorBadge: 'oficial',
    videoUrl: '',
    thumbnailUrl: '',
    likes: 634,
    views: 8900,
    createdAt: new Date('2026-06-18T15:30:00')
  },
  {
    id: 'bot-4',
    title: 'LIVE: Torneo Casino Champions — Final',
    description: 'La gran final del torneo. 32 jugadores, 1 campeon. Premio: 5000 C8L coins.',
    type: 'live',
    emoji: '🔴',
    author: '@leon_leo_bot',
    authorBadge: 'oficial',
    videoUrl: '',
    thumbnailUrl: '',
    likes: 2100,
    views: 45000,
    createdAt: new Date('2026-06-17T21:00:00')
  },
  {
    id: 'bot-5',
    title: 'Gameplay: Jackpot x100 en Ruleta C8L',
    description: 'Momentos epicos de la ruleta. Alguien acaba de ganar x100 su apuesta.',
    type: 'gaming',
    emoji: '🎮',
    author: '@leon_leo_bot',
    authorBadge: 'oficial',
    videoUrl: '',
    thumbnailUrl: '',
    likes: 956,
    views: 15600,
    createdAt: new Date('2026-06-16T14:00:00')
  },
  {
    id: 'bot-6',
    title: 'Bolero-House Session #2 — Amanecer Digital',
    description: 'Segunda sesion. Vibes de amanecer con sintetizadores y guitarra latina.',
    type: 'music',
    emoji: '🎵',
    author: '@leon_leo_bot',
    authorBadge: 'oficial',
    videoUrl: '',
    thumbnailUrl: '',
    likes: 723,
    views: 10200,
    createdAt: new Date('2026-06-15T22:00:00')
  },
  {
    id: 'bot-7',
    title: 'Detras de Camaras: El equipo C8L Agency',
    description: 'Conoce al equipo detras de la plataforma. IA, musica y comunidad.',
    type: 'video',
    emoji: '🎬',
    author: '@leon_leo_bot',
    authorBadge: 'oficial',
    videoUrl: '',
    thumbnailUrl: '',
    likes: 445,
    views: 6700,
    createdAt: new Date('2026-06-14T12:00:00')
  },
  {
    id: 'bot-8',
    title: 'Tutorial: Gana C8L Coins — Guia Completa',
    description: 'Todo lo que necesitas saber para ganar monedas en la plataforma C8L.',
    type: 'tutorial',
    emoji: '📚',
    author: '@leon_leo_bot',
    authorBadge: 'oficial',
    videoUrl: '',
    thumbnailUrl: '',
    likes: 1890,
    views: 34000,
    createdAt: new Date('2026-06-13T10:00:00')
  },
]

// Formatear vistas (12400 -> 12.4K)
function formatViews(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

// Tiempo relativo
function timeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} dias`
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`
  return `Hace ${Math.floor(days / 30)} meses`
}

// Badge del autor
function AuthorBadge({ badge }: { badge?: string }) {
  if (badge === 'oficial') {
    return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-c8l-gold/20 text-c8l-gold border border-c8l-gold/40">✓ OFICIAL</span>
  }
  if (badge === 'verificado') {
    return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">✓</span>
  }
  return null
}

// Categorias/filtros
const CATEGORIES = [
  { key: 'all', label: 'Todos', emoji: '📺' },
  { key: 'video', label: 'Videos', emoji: '🎬' },
  { key: 'music', label: 'Musica', emoji: '🎵' },
  { key: 'live', label: 'En Vivo', emoji: '🔴' },
  { key: 'tutorial', label: 'Tutoriales', emoji: '📚' },
  { key: 'gaming', label: 'Gaming', emoji: '🎮' },
]

// Thumbnail colores por tipo
const THUMB_GRADIENTS: Record<string, string> = {
  video: 'from-purple-600/40 to-pink-600/30',
  music: 'from-blue-600/40 to-cyan-500/30',
  live: 'from-red-600/40 to-orange-500/30',
  tutorial: 'from-green-600/40 to-emerald-500/30',
  gaming: 'from-yellow-600/40 to-amber-500/30',
}

export default function TVPage() {
  const [posts, setPosts] = useState<TVPost[]>(BOT_CONTENT)
  const [filter, setFilter] = useState('all')
  const [selectedVideo, setSelectedVideo] = useState<TVPost | null>(null)

  // Filtrar posts
  const filteredPosts = filter === 'all'
    ? posts
    : posts.filter(p => p.type === filter)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
      {/* Header estilo YouTube */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-outfit font-bold text-c8l-gold">C8L</span>
            </Link>
            <span className="text-gray-600">|</span>
            <h1 className="text-lg font-outfit font-semibold text-white flex items-center gap-2">
              <span className="text-red-500">▶</span> TV
            </h1>
          </div>
          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="flex w-full">
              <input
                type="text"
                placeholder="Buscar en C8L TV..."
                className="w-full px-4 py-2 bg-[#121212] border border-white/20 rounded-l-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-c8l-purple"
              />
              <button className="px-5 py-2 bg-[#222] border border-l-0 border-white/20 rounded-r-full hover:bg-[#333] transition">
                🔍
              </button>
            </div>
          </div>
          {/* Bot indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-c8l-gold/10 border border-c8l-gold/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-c8l-gold font-medium">Bot Activo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros/Categorias — estilo YouTube chips */}
      <div className="sticky top-[57px] z-40 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition
                ${filter === cat.key
                  ? 'bg-white text-black'
                  : 'bg-[#222] text-gray-300 hover:bg-[#333]'
                }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal de video */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
          <div className="w-full max-w-4xl bg-[#1a1a1a] rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Player area */}
            <div className={`w-full aspect-video bg-gradient-to-br ${THUMB_GRADIENTS[selectedVideo.type] || THUMB_GRADIENTS.video} flex items-center justify-center`}>
              <div className="text-center">
                <div className="text-6xl mb-4">{selectedVideo.emoji}</div>
                <p className="text-gray-400 text-sm">Video player — proximamente</p>
              </div>
            </div>
            {/* Info */}
            <div className="p-6">
              <h2 className="text-xl font-outfit font-bold mb-2">{selectedVideo.title}</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-c8l-gold/20 flex items-center justify-center text-lg">🤖</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{selectedVideo.author}</span>
                    <AuthorBadge badge={selectedVideo.authorBadge} />
                  </div>
                  <span className="text-xs text-gray-500">C8L Agency — Canal Oficial</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">{selectedVideo.description}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>👁 {formatViews(selectedVideo.views)} vistas</span>
                <span>❤️ {formatViews(selectedVideo.likes)} likes</span>
                <span>📅 {timeAgo(selectedVideo.createdAt)}</span>
              </div>
            </div>
            {/* Cerrar */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/80 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Feed principal — Grid estilo YouTube */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Seccion: Canal Oficial del Bot */}
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-c8l-gold/5 to-transparent border border-c8l-gold/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-c8l-gold/20 border-2 border-c8l-gold/50 flex items-center justify-center text-2xl">
              🤖
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-outfit font-bold text-lg">@leon_leo_bot</h3>
                <AuthorBadge badge="oficial" />
              </div>
              <p className="text-sm text-gray-400">Canal oficial de C8L Agency — Musica, tutoriales, gaming y mas</p>
              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                <span>{posts.filter(p => p.authorBadge === 'oficial').length} videos</span>
                <span>{formatViews(posts.reduce((a, p) => a + p.views, 0))} vistas totales</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-c8l-gold text-black font-bold text-sm rounded-full hover:bg-c8l-gold/80 transition">
              Suscribirse
            </button>
          </div>
        </div>

        {/* Grid de videos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPosts.map(post => (
            <div
              key={post.id}
              className="group cursor-pointer"
              onClick={() => setSelectedVideo(post)}
            >
              {/* Thumbnail */}
              <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br ${THUMB_GRADIENTS[post.type] || THUMB_GRADIENTS.video} mb-3`}>
                <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                  {post.emoji}
                </div>
                {/* Duracion fake */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[11px] font-medium">
                  {post.type === 'live' ? '🔴 EN VIVO' : `${Math.floor(Math.random() * 15 + 3)}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <span className="text-black text-lg ml-0.5">▶</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info del video */}
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-c8l-gold/20 flex items-center justify-center text-sm flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-c8l-gold transition">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-gray-400">{post.author}</span>
                    {post.authorBadge === 'oficial' && (
                      <span className="text-[10px] text-c8l-gold">✓</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 text-xs text-gray-500 mt-0.5">
                    <span>{formatViews(post.views)} vistas</span>
                    <span>•</span>
                    <span>{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state si no hay contenido filtrado */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📺</div>
            <h3 className="text-xl font-outfit font-semibold mb-2">No hay contenido aqui aun</h3>
            <p className="text-gray-500">El bot esta trabajando en subir mas videos de esta categoria.</p>
          </div>
        )}
      </main>

      {/* Footer minimo */}
      <footer className="border-t border-white/5 mt-12 py-6 text-center text-xs text-gray-600">
        <p>C8L TV — Plataforma de contenido de C8L Agency &copy; 2026</p>
        <p className="mt-1">Contenido publicado por @leon_leo_bot (Canal Oficial)</p>
      </footer>
    </div>
  )
}
