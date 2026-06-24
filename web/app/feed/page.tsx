'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// Tipos
interface FeedItem {
  id: string
  type: 'image' | 'video' | 'music' | 'code' | 'article'
  title: string
  description: string
  author: string
  authorAvatar: string
  agent: string
  agentEmoji: string
  style?: string
  imageUrl?: string
  likes: number
  views: number
  comments: number
  timeAgo: string
  tags: string[]
  gradient: string
}

// Datos del feed (simulados - cuando conectes Supabase seran reales)
const FEED_DATA: FeedItem[] = [
  {
    id: '1', type: 'image', title: 'Leon Dorado en Times Square',
    description: 'Generado con Vulcano en estilo cyberpunk. 1024x1024px, motor Pollinations/Flux.',
    author: 'Leo Vela', authorAvatar: '👑', agent: 'Vulcano', agentEmoji: '🎨',
    style: 'cyberpunk', likes: 47, views: 231, comments: 12, timeAgo: '2h',
    tags: ['cyberpunk', 'leon', 'neon', 'c8l'],
    gradient: 'from-purple-900/40 to-blue-900/40',
    imageUrl: 'https://image.pollinations.ai/prompt/golden%20lion%20in%20times%20square%20neon%20cyberpunk%20night%20cinematic?width=512&height=512&nologo=true'
  },
  {
    id: '2', type: 'music', title: 'Bolero-House: Amor Digital',
    description: 'Cancion generada por Apolo. Bolero clasico fusionado con house a 115 BPM. Letra + estructura + prompt para Suno.',
    author: 'C8L Studio', authorAvatar: '🎵', agent: 'Apolo', agentEmoji: '🎵',
    likes: 89, views: 445, comments: 23, timeAgo: '4h',
    tags: ['bolero-house', '115bpm', 'amor', 'produccion'],
    gradient: 'from-amber-900/40 to-red-900/40',
    imageUrl: 'https://image.pollinations.ai/prompt/vinyl%20record%20glowing%20neon%20purple%20gold%20music%20studio%20dark%20background?width=512&height=512&nologo=true'
  },
  {
    id: '3', type: 'video', title: 'Videoclip: Olas Neon al Atardecer',
    description: 'Video real generado con IA. Motor: Seedance Pro. 8 segundos, 720p. Tema: olas del mar con colores neon.',
    author: 'Ares Engine', authorAvatar: '🎬', agent: 'Ares', agentEmoji: '🎬',
    likes: 156, views: 892, comments: 34, timeAgo: '6h',
    tags: ['video-ia', 'seedance', 'neon', 'cinematico'],
    gradient: 'from-cyan-900/40 to-purple-900/40',
    imageUrl: 'https://image.pollinations.ai/prompt/neon%20ocean%20waves%20at%20sunset%20cinematic%20purple%20cyan%20glow%20dramatic?width=512&height=512&nologo=true'
  },
  {
    id: '4', type: 'code', title: 'Landing Page: Neon Futurista',
    description: 'Hefesto genero una landing page completa con HTML+CSS+JS. Estilo dark neon, responsive, animaciones.',
    author: 'Hefesto Dev', authorAvatar: '🖥️', agent: 'Hefesto', agentEmoji: '🖥️',
    likes: 34, views: 178, comments: 8, timeAgo: '8h',
    tags: ['landing', 'html', 'neon', 'responsive'],
    gradient: 'from-green-900/40 to-emerald-900/40',
    imageUrl: 'https://image.pollinations.ai/prompt/dark%20neon%20website%20screenshot%20futuristic%20UI%20purple%20gold%20glass%20morphism?width=512&height=512&nologo=true'
  },
  {
    id: '5', type: 'image', title: 'Logo C8L Agency v3',
    description: 'Logo Engine v2 con 30 fuentes. Fondo degradado dinamico, tipografia Orbitron, sombras neon.',
    author: 'Leo Vela', authorAvatar: '👑', agent: 'Vulcano', agentEmoji: '🎨',
    style: 'logo', likes: 203, views: 1024, comments: 45, timeAgo: '12h',
    tags: ['logo', 'branding', 'c8l', 'dorado'],
    gradient: 'from-yellow-900/40 to-amber-900/40',
    imageUrl: 'https://image.pollinations.ai/prompt/C8L%20text%20logo%20golden%20lion%20emblem%20dark%20background%20neon%20purple%20glow%20premium%20branding?width=512&height=512&nologo=true'
  },
  {
    id: '6', type: 'image', title: 'Mockup: Moneda C8L Coin',
    description: 'Mockup Mode: moneda fisica dorada con el logo C8L grabado. Estilo fotorealista.',
    author: 'Vulcano Studio', authorAvatar: '🎨', agent: 'Vulcano', agentEmoji: '🎨',
    style: 'fotorealista', likes: 78, views: 412, comments: 19, timeAgo: '1d',
    tags: ['mockup', 'moneda', 'coin', '3d'],
    gradient: 'from-yellow-900/40 to-orange-900/40',
    imageUrl: 'https://image.pollinations.ai/prompt/golden%20coin%20with%20lion%20emblem%20C8L%20engraved%20photorealistic%203d%20render%20dark%20background%20dramatic%20lighting?width=512&height=512&nologo=true'
  },
  {
    id: '7', type: 'article', title: 'Estrategia: Bolero-House 2026',
    description: 'Atenea genero un plan de marketing completo para el genero Bolero-House. PDF descargable.',
    author: 'Atenea Strategy', authorAvatar: '📊', agent: 'Atenea', agentEmoji: '📊',
    likes: 56, views: 289, comments: 14, timeAgo: '1d',
    tags: ['estrategia', 'marketing', 'bolero-house', 'pdf'],
    gradient: 'from-indigo-900/40 to-violet-900/40',
    imageUrl: 'https://image.pollinations.ai/prompt/marketing%20strategy%20document%20holographic%20display%20dark%20office%20neon%20lights%20futuristic?width=512&height=512&nologo=true'
  },
  {
    id: '8', type: 'video', title: 'DJ Set: C8L Neon Night',
    description: 'Video generado: DJ mezclando en club con luces neon. Motor Wan Pro 1080p, 15 segundos.',
    author: 'Ares Cinema', authorAvatar: '🎬', agent: 'Ares', agentEmoji: '🎬',
    likes: 134, views: 678, comments: 28, timeAgo: '2d',
    tags: ['dj', 'club', 'neon', 'video-ia'],
    gradient: 'from-pink-900/40 to-purple-900/40',
    imageUrl: 'https://image.pollinations.ai/prompt/DJ%20mixing%20in%20neon%20club%20purple%20lights%20turntable%20close%20up%20cinematic%20dark?width=512&height=512&nologo=true'
  },
  {
    id: '9', type: 'image', title: 'Anime: Guerrero C8L',
    description: 'Estilo anime japones. Guerrero con armadura dorada y emblema del leon. Generado con Flux.',
    author: 'Community', authorAvatar: '⚔️', agent: 'Vulcano', agentEmoji: '🎨',
    style: 'anime', likes: 267, views: 1340, comments: 56, timeAgo: '2d',
    tags: ['anime', 'guerrero', 'dorado', 'leon'],
    gradient: 'from-red-900/40 to-orange-900/40',
    imageUrl: 'https://image.pollinations.ai/prompt/anime%20warrior%20golden%20armor%20lion%20emblem%20dark%20background%20epic%20pose%20japanese%20style?width=512&height=512&nologo=true'
  },
  {
    id: '10', type: 'music', title: 'Remix: Sufre Bonito (Electronica)',
    description: 'Apolo genero un remix electronico del concepto "Sufre Bonito". 128 BPM, estilo deep house.',
    author: 'Apolo Music', authorAvatar: '🎵', agent: 'Apolo', agentEmoji: '🎵',
    likes: 91, views: 502, comments: 17, timeAgo: '3d',
    tags: ['remix', 'deep-house', '128bpm', 'electronica'],
    gradient: 'from-teal-900/40 to-cyan-900/40',
    imageUrl: 'https://image.pollinations.ai/prompt/electronic%20music%20waveform%20visualization%20neon%20cyan%20purple%20dark%20background%20abstract?width=512&height=512&nologo=true'
  },
]

const TYPE_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  image: { icon: '🖼️', label: 'Imagen', color: 'text-purple-400' },
  video: { icon: '🎬', label: 'Video IA', color: 'text-cyan-400' },
  music: { icon: '🎵', label: 'Musica', color: 'text-amber-400' },
  code: { icon: '💻', label: 'Codigo', color: 'text-green-400' },
  article: { icon: '📝', label: 'Articulo', color: 'text-indigo-400' },
}

export default function FeedPage() {
  const [filter, setFilter] = useState<string>('all')
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const [visibleItems, setVisibleItems] = useState(5)

  const filteredFeed = filter === 'all'
    ? FEED_DATA
    : FEED_DATA.filter(item => item.type === filter)

  const displayedFeed = filteredFeed.slice(0, visibleItems)

  const loadMore = () => setVisibleItems(prev => prev + 5)

  const toggleLike = (id: string) => {
    setLikedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <main className="min-h-screen bg-c8l-black">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-c8l-gold/20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-outfit font-black neon-gold">C8L</span>
            <span className="text-xs text-gray-500 hidden sm:inline">Agency</span>
          </Link>
          <h1 className="text-lg font-outfit font-semibold text-white">Feed</h1>
          <Link href="https://t.me/leon_leo_bot" target="_blank"
            className="text-sm bg-c8l-purple/20 border border-c8l-purple/40 px-3 py-1.5 rounded-full hover:bg-c8l-purple/30 transition-colors">
            🤖 Bot
          </Link>
        </div>
      </header>

      {/* Filtros */}
      <div className="sticky top-[57px] z-40 bg-c8l-black/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="Todo" emoji="🔥" />
          <FilterChip active={filter === 'image'} onClick={() => setFilter('image')} label="Imagenes" emoji="🖼️" />
          <FilterChip active={filter === 'video'} onClick={() => setFilter('video')} label="Videos" emoji="🎬" />
          <FilterChip active={filter === 'music'} onClick={() => setFilter('music')} label="Musica" emoji="🎵" />
          <FilterChip active={filter === 'code'} onClick={() => setFilter('code')} label="Codigo" emoji="💻" />
          <FilterChip active={filter === 'article'} onClick={() => setFilter('article')} label="Docs" emoji="📝" />
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Banner superior */}
        <div className="glass rounded-2xl p-5 border border-c8l-gold/30 text-center">
          <p className="text-sm text-gray-400 mb-1">Todo lo que ves aqui fue generado con IA por</p>
          <p className="text-lg font-outfit font-bold text-c8l-gold">@leon_leo_bot</p>
          <p className="text-xs text-gray-500 mt-1">11 agentes especializados — 100% gratuito</p>
          <Link href="https://t.me/leon_leo_bot" target="_blank"
            className="inline-block mt-3 px-5 py-2 bg-gradient-to-r from-c8l-purple to-c8l-gold rounded-full text-sm font-semibold hover:scale-105 transition-transform">
            Probar el Bot
          </Link>
        </div>

        {/* Items del feed */}
        {displayedFeed.map((item, index) => (
          <FeedCard
            key={item.id}
            item={item}
            liked={likedItems.has(item.id)}
            onLike={() => toggleLike(item.id)}
            index={index}
          />
        ))}

        {/* Load more */}
        {visibleItems < filteredFeed.length && (
          <button onClick={loadMore}
            className="w-full py-4 glass rounded-xl text-c8l-gold font-semibold hover:bg-c8l-gold/10 transition-colors">
            Cargar mas contenido ({filteredFeed.length - visibleItems} restantes)
          </button>
        )}

        {/* Fin del feed */}
        {visibleItems >= filteredFeed.length && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Esto es todo por ahora</p>
            <p className="text-xs text-gray-600 mt-1">Nuevo contenido se genera cada hora con el bot</p>
          </div>
        )}
      </div>

      {/* Bottom bar mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-white/10 md:hidden">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-c8l-gold transition-colors">
            <span className="text-xl">🏠</span>
            <span className="text-[10px]">Home</span>
          </Link>
          <Link href="/feed" className="flex flex-col items-center gap-0.5 text-c8l-gold">
            <span className="text-xl">🔥</span>
            <span className="text-[10px]">Feed</span>
          </Link>
          <Link href="/casino" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-c8l-gold transition-colors">
            <span className="text-xl">🎰</span>
            <span className="text-[10px]">Casino</span>
          </Link>
          <Link href="/studio" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-c8l-gold transition-colors">
            <span className="text-xl">🎵</span>
            <span className="text-[10px]">Studio</span>
          </Link>
          <Link href="https://t.me/leon_leo_bot" target="_blank" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-c8l-gold transition-colors">
            <span className="text-xl">🤖</span>
            <span className="text-[10px]">Bot</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-16 md:hidden" />
    </main>
  )
}

function FilterChip({ active, onClick, label, emoji }: { active: boolean; onClick: () => void; label: string; emoji: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
        active
          ? 'bg-c8l-gold/20 text-c8l-gold border border-c8l-gold/40'
          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
      }`}>
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  )
}

function FeedCard({ item, liked, onLike, index }: { item: FeedItem; liked: boolean; onLike: () => void; index: number }) {
  const typeInfo = TYPE_ICONS[item.type]

  return (
    <article className={`glass rounded-2xl overflow-hidden border border-white/5 hover:border-c8l-purple/30 transition-all`}
      style={{ animationDelay: `${index * 0.1}s` }}>
      {/* Imagen / Preview */}
      {item.imageUrl && (
        <div className={`relative aspect-square bg-gradient-to-br ${item.gradient}`}>
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Badge de tipo */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="text-sm">{typeInfo.icon}</span>
            <span className={`text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
          </div>
          {/* Badge de agente */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="text-sm">{item.agentEmoji}</span>
            <span className="text-xs text-gray-300">{item.agent}</span>
          </div>
          {/* Video play button overlay */}
          {item.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                <span className="text-3xl ml-1">▶</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenido */}
      <div className="p-4">
        {/* Autor + tiempo */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{item.authorAvatar}</span>
            <span className="text-sm font-medium text-gray-300">{item.author}</span>
          </div>
          <span className="text-xs text-gray-500">{item.timeAgo}</span>
        </div>

        {/* Titulo */}
        <h3 className="text-lg font-outfit font-semibold text-white mb-1">{item.title}</h3>

        {/* Descripcion */}
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.tags.map(tag => (
            <span key={tag} className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <button onClick={onLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              liked ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/5 text-gray-400'
            }`}>
            <span>{liked ? '❤️' : '🤍'}</span>
            <span className="text-sm">{item.likes + (liked ? 1 : 0)}</span>
          </button>
          <div className="flex items-center gap-1.5 text-gray-500">
            <span>👁️</span>
            <span className="text-sm">{item.views}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <span>💬</span>
            <span className="text-sm">{item.comments}</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/5 text-gray-400 transition-colors">
            <span>↗️</span>
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </article>
  )
}
